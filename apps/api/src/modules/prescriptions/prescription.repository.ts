import { InvoiceItemCategory, InvoiceStatus, Prisma, VisitStatus } from '@prisma/client';
import { randomUUID } from 'crypto';
import logger from '../../config/logger';
import { prisma } from '../../config/database';
import { ApiError } from '../../middlewares/errorHandler';
import { CreatePrescriptionInput } from './prescription.validator';

export const createPrescription = async (data: CreatePrescriptionInput) => {
  try {
    const prescription = await prisma.$transaction(async (tx) => {
      const visit = await tx.visit.findUnique({
        where: { id: data.visitId },
        include: { invoice: true },
      });
      if (!visit) throw new ApiError(404, 'VISIT_NOT_FOUND', 'Visit not found');

      let invoice = visit.invoice;
      if (!invoice) {
        invoice = await tx.invoice.create({
          data: {
            invoiceNo: `INV-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${randomUUID()}`,
            patientId: visit.patientId,
            visitId: visit.id,
            subtotal: 0,
            discount: 0,
            total: 0,
            balance: 0,
            paidAmount: 0,
          },
        });
      }

      const created = await tx.prescription.create({
        data: {
          visitId: data.visitId,
          prescribedBy: data.prescribedBy,
          status: 'PENDING',
          notes: data.notes,
          items: {
            create: data.items.map((item) => ({
              medicineId: item.medicineId,
              dosage: item.dosage,
              frequency: item.frequency,
              duration: item.duration,
              quantity: item.quantity,
              notes: item.notes,
            })),
          },
        },
        include: { items: { include: { medicine: true } } },
      });

      const now = new Date();
      let medicationSubtotal = new Prisma.Decimal(0);
      for (const item of created.items) {
        const batches = await tx.medicineBatch.findMany({
          where: {
            medicineId: item.medicineId,
            quantityLeft: { gt: 0 },
            expiresAt: { gt: now },
            medicine: { isActive: true },
          },
          orderBy: [{ expiresAt: 'asc' }, { receivedAt: 'asc' }],
        });
        const available = batches.reduce((total, batch) => total + batch.quantityLeft, 0);
        if (available < item.quantity) {
          throw new ApiError(
            409,
            'INSUFFICIENT_STOCK',
            `Insufficient unexpired stock for ${item.medicine.name}. Available: ${available}, requested: ${item.quantity}.`
          );
        }

        let quantityToPrice = item.quantity;
        let lineTotal = new Prisma.Decimal(0);
        for (const batch of batches) {
          if (quantityToPrice === 0) break;
          const quantity = Math.min(quantityToPrice, batch.quantityLeft);
          lineTotal = lineTotal.add(batch.sellingPrice.mul(quantity));
          quantityToPrice -= quantity;
        }

        await tx.invoiceItem.create({
          data: {
            invoiceId: invoice.id,
            description: `${item.medicine.name} (${item.dosage}, ${item.frequency}, ${item.duration})`,
            category: InvoiceItemCategory.MEDICATION,
            quantity: item.quantity,
            unitPrice: lineTotal.div(item.quantity),
            subtotal: lineTotal,
            reference: item.id,
          },
        });
        medicationSubtotal = medicationSubtotal.add(lineTotal);
      }

      const subtotal = invoice.subtotal.add(medicationSubtotal);
      const total = Prisma.Decimal.max(subtotal.minus(invoice.discount), 0);
      const balance = Prisma.Decimal.max(total.minus(invoice.paidAmount), 0);
      const status: InvoiceStatus = balance.equals(0)
        ? 'PAID'
        : invoice.paidAmount.greaterThan(0)
          ? 'PARTIAL'
          : 'UNPAID';
      await tx.invoice.update({
        where: { id: invoice.id },
        data: { subtotal, total, balance, status },
      });
      await tx.visit.update({
        where: { id: visit.id },
        data: { status: VisitStatus.AWAITING_PAYMENT },
      });
      return created;
    });

    logger.info(`Prescription created: ${prescription.id}`);
    return prescription;
  } catch (error: unknown) {
    logger.error(`Error creating prescription: ${(error as Error).message}`);
    throw error;
  }
};

export const getPrescriptionById = async (id: string) => {
  try {
    const prescription = await prisma.prescription.findUnique({
      where: { id },
      include: {
        visit: {
          include: {
            patient: true,
          },
        },
        items: {
          include: {
            medicine: true,
            batch: true,
          },
        },
      },
    });

    if (!prescription) {
      const error = new Error('Prescription not found');
      (error as any).statusCode = 404;
      throw error;
    }

    return prescription;
  } catch (error: any) {
    logger.error(`Error fetching prescription: ${error.message}`);
    throw error;
  }
};

export const getPrescriptionsByPatient = async (patientId: string, limit?: number, offset?: number) => {
  try {
    const skip = offset || 0;
    const take = limit || 10;

    const [prescriptions, total] = await Promise.all([
      prisma.prescription.findMany({
        where: {
          visit: {
            patient: {
              id: patientId,
            },
          },
        },
        include: {
          visit: {
            include: {
              patient: true,
            },
          },
          items: {
            include: {
              medicine: true,
            },
          },
        },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.prescription.count({
        where: {
          visit: {
            patient: {
              id: patientId,
            },
          },
        },
      }),
    ]);

    return {
      data: prescriptions,
      total,
      limit: take,
      offset: skip,
    };
  } catch (error: any) {
    logger.error(`Error fetching patient prescriptions: ${error.message}`);
    throw error;
  }
};

export const getPrescriptionsByVisit = async (visitId: string, limit?: number, offset?: number) => {
  try {
    const skip = offset || 0;
    const take = limit || 10;

    const [prescriptions, total] = await Promise.all([
      prisma.prescription.findMany({
        where: { visitId },
        include: {
          visit: {
            include: {
              patient: true,
            },
          },
          items: {
            include: {
              medicine: true,
            },
          },
        },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.prescription.count({ where: { visitId } }),
    ]);

    return {
      data: prescriptions,
      total,
      limit: take,
      offset: skip,
    };
  } catch (error: any) {
    logger.error(`Error fetching prescriptions for visit: ${error.message}`);
    throw error;
  }
};

export const getAllPrescriptions = async (status?: string, limit?: number, offset?: number) => {
  try {
    const skip = offset || 0;
    const take = limit || 10;

    const where: any = {};
    if (status) {
      where.status = status;
    }

    const [prescriptions, total] = await Promise.all([
      prisma.prescription.findMany({
        where,
        include: {
          visit: {
            include: {
              patient: true,
              invoice: { include: { items: true } },
            },
          },
          items: {
            include: {
              medicine: true,
            },
          },
        },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.prescription.count({ where }),
    ]);

    const doctorIds = Array.from(new Set(prescriptions.map((prescription) => prescription.prescribedBy)));
    const doctors = await prisma.user.findMany({
      where: { id: { in: doctorIds } },
      select: { id: true, firstName: true, lastName: true },
    });
    const doctorsById = new Map(doctors.map((doctor) => [doctor.id, doctor]));

    const data = prescriptions.map((prescription) => {
      const medicationItemIds = new Set(prescription.items.map((item) => item.id));
      const medicationAmount = prescription.visit?.invoice?.items
        .filter((item) =>
          item.category === InvoiceItemCategory.MEDICATION &&
          item.reference !== null &&
          medicationItemIds.has(item.reference),
        )
        .reduce((total, item) => total.add(item.subtotal), new Prisma.Decimal(0))
        .toNumber() ?? 0;

      return {
        ...prescription,
        doctor: doctorsById.get(prescription.prescribedBy) ?? null,
        amount: medicationAmount,
      };
    });

    return {
      data,
      total,
      limit: take,
      offset: skip,
    };
  } catch (error: any) {
    logger.error(`Error fetching all prescriptions: ${error.message}`);
    throw error;
  }
};

export const updatePrescriptionStatus = async (id: string, status: string, dispensedBy?: string, notes?: string) => {
  try {
    const prescription = await prisma.prescription.update({
      where: { id },
      data: {
        status: status as any,
        dispensedBy: dispensedBy || undefined,
        dispensedAt: status === 'DISPENSED' ? new Date() : undefined,
        notes: notes || undefined,
      },
      include: {
        items: {
          include: {
            medicine: true,
          },
        },
      },
    });

    logger.info(`Prescription ${id} status updated to ${status}`);
    return prescription;
  } catch (error: any) {
    logger.error(`Error updating prescription status: ${error.message}`);
    throw error;
  }
};

export const deletePrescription = async (id: string) => {
  try {
    await prisma.prescription.delete({
      where: { id },
    });

    logger.info(`Prescription ${id} deleted`);
    return { success: true, message: 'Prescription deleted' };
  } catch (error: any) {
    logger.error(`Error deleting prescription: ${error.message}`);
    throw error;
  }
};

export const getPendingPrescriptionsQueue = async () => {
  const prescriptions = await prisma.prescription.findMany({
    where: { status: 'PENDING' },
    orderBy: { createdAt: 'asc' },
    include: {
      visit: {
        include: {
          patient: true,
          invoice: { include: { items: true } },
        },
      },
      items: {
        include: {
          medicine: true,
        },
      },
    },
  });

  // Get doctor names for prescribedBy
  const doctorIds = Array.from(new Set(prescriptions.map((p) => p.prescribedBy)));
  const doctors = await prisma.user.findMany({
    where: { id: { in: doctorIds } },
    select: { id: true, firstName: true, lastName: true },
  });
  const doctorMap = new Map(doctors.map((d) => [d.id, d]));

  return prescriptions.map((p) => {
    const doc = doctorMap.get(p.prescribedBy);
    return {
      id: p.id,
      patient: {
        firstName: p.visit?.patient?.firstName || 'Unknown',
        lastName: p.visit?.patient?.lastName || 'Patient',
        patientNumber: p.visit?.patient?.patientNumber || 'N/A',
      },
      doctor: {
        firstName: doc?.firstName || 'Doctor',
        lastName: doc?.lastName || '',
      },
      medications: p.items.length,
      items: p.items,
      status: p.status,
      medicationDue: (() => {
        const invoice = p.visit?.invoice;
        if (!invoice) return null;
        const serviceSubtotal = invoice.items
          .filter((item) => item.category !== InvoiceItemCategory.MEDICATION)
          .reduce((sum, item) => sum.add(item.subtotal), new Prisma.Decimal(0));
        const medicationSubtotal = invoice.items
          .filter((item) => item.category === InvoiceItemCategory.MEDICATION)
          .reduce((sum, item) => sum.add(item.subtotal), new Prisma.Decimal(0));
        const serviceNet = serviceSubtotal.minus(Prisma.Decimal.min(invoice.discount, serviceSubtotal));
        const medicationNet = medicationSubtotal.minus(
          Prisma.Decimal.min(Prisma.Decimal.max(invoice.discount.minus(serviceSubtotal), 0), medicationSubtotal)
        );
        const paidTowardMedication = Prisma.Decimal.max(invoice.paidAmount.minus(serviceNet), 0);
        return Prisma.Decimal.max(medicationNet.minus(paidTowardMedication), 0).toNumber();
      })(),
      createdAt: p.createdAt.toISOString(),
      visitId: p.visitId,
    };
  });
};

export const dispensePrescriptionAndDeductStock = async (
  prescriptionId: string,
  dispensedBy: string
) => {
  return prisma.$transaction(async (tx) => {
    const prescription = await tx.prescription.findUnique({
      where: { id: prescriptionId },
      include: {
        items: true,
        visit: true,
      },
    });

    if (!prescription) {
      throw new ApiError(404, 'PRESCRIPTION_NOT_FOUND', 'Prescription not found');
    }

    if (prescription.status === 'DISPENSED') {
      throw new ApiError(409, 'PRESCRIPTION_ALREADY_DISPENSED', 'Prescription has already been dispensed');
    }
    if (prescription.status === 'CANCELLED') {
      throw new ApiError(409, 'PRESCRIPTION_CANCELLED', 'A cancelled prescription cannot be dispensed.');
    }

    const invoice = await tx.invoice.findUnique({
      where: { visitId: prescription.visitId },
      include: { items: true },
    });
    if (!invoice) {
      throw new ApiError(409, 'MEDICATION_NOT_INVOICED', 'This prescription has no linked invoice.');
    }

    const medicationItems = invoice.items.filter((item) => item.category === InvoiceItemCategory.MEDICATION);
    if (prescription.items.some((item) =>
      !medicationItems.some((invoiceItem) => invoiceItem.reference === item.id)
    )) {
      throw new ApiError(409, 'MEDICATION_NOT_INVOICED', 'Prescription medication charges must be added to the invoice before dispensing.');
    }

    const serviceGross = invoice.items
      .filter((item) => item.category !== InvoiceItemCategory.MEDICATION)
      .reduce((sum, item) => sum.add(item.subtotal), new Prisma.Decimal(0));
    const medicationGross = medicationItems.reduce(
      (sum, item) => sum.add(item.subtotal),
      new Prisma.Decimal(0)
    );
    const discountOnServices = Prisma.Decimal.min(invoice.discount, serviceGross);
    const netServices = serviceGross.minus(discountOnServices);
    const discountOnMedication = Prisma.Decimal.max(invoice.discount.minus(serviceGross), 0);
    const netMedication = medicationGross.minus(
      Prisma.Decimal.min(discountOnMedication, medicationGross)
    );
    const paidTowardMedication = Prisma.Decimal.max(invoice.paidAmount.minus(netServices), 0);
    if (paidTowardMedication.lessThan(netMedication)) {
      throw new ApiError(
        409,
        'MEDICATION_PAYMENT_REQUIRED',
        `Pay the medication balance of ${netMedication.minus(paidTowardMedication).toFixed(2)} before dispensing.`
      );
    }

    const now = new Date();
    for (const item of prescription.items) {
      const batches = await tx.medicineBatch.findMany({
        where: {
          medicineId: item.medicineId,
          quantityLeft: { gt: 0 },
          expiresAt: { gt: now },
        },
        orderBy: [{ expiresAt: 'asc' }, { receivedAt: 'asc' }],
      });
      const available = batches.reduce((total, batch) => total + batch.quantityLeft, 0);
      if (available < item.quantity) {
        throw new ApiError(
          409,
          'INSUFFICIENT_STOCK',
          `Insufficient unexpired stock to dispense this prescription item. Available: ${available}, requested: ${item.quantity}.`
        );
      }

      let quantityRemaining = item.quantity;
      let firstBatchId: string | null = null;
      for (const batch of batches) {
        if (quantityRemaining === 0) break;
        const quantity = Math.min(quantityRemaining, batch.quantityLeft);
        const updated = await tx.medicineBatch.updateMany({
          where: { id: batch.id, quantityLeft: { gte: quantity }, expiresAt: { gt: now } },
          data: { quantityLeft: { decrement: quantity } },
        });
        if (updated.count !== 1) {
          throw new ApiError(409, 'STOCK_CHANGED', 'Stock changed while the prescription was being dispensed. Please retry.');
        }
        firstBatchId ??= batch.id;
        await tx.inventoryTransaction.create({
          data: {
            batchId: batch.id,
            type: 'DISPENSED',
            quantity,
            reason: `Prescription ${prescriptionId} dispensed`,
            reference: prescriptionId,
            performedBy: dispensedBy,
          },
        });
        quantityRemaining -= quantity;
      }

      await tx.prescriptionItem.update({
        where: { id: item.id },
        data: { batchId: firstBatchId, quantityDispensed: item.quantity },
      });
    }

    const updatedPrescription = await tx.prescription.update({
      where: { id: prescriptionId },
      data: {
        status: 'DISPENSED',
        dispensedBy,
        dispensedAt: new Date(),
      },
      include: {
        items: { include: { medicine: true } },
      },
    });

    const [openPrescriptions, openLabRequests] = await Promise.all([
      tx.prescription.count({
        where: {
          visitId: prescription.visitId,
          id: { not: prescriptionId },
          status: { in: ['PENDING', 'PARTIAL'] },
        },
      }),
      tx.labRequest.count({
        where: {
          visitId: prescription.visitId,
          status: { in: ['PENDING', 'PROCESSING'] },
        },
      }),
    ]);
    if (openPrescriptions === 0 && openLabRequests === 0) {
      await tx.visit.update({
        where: { id: prescription.visitId },
        data: { status: VisitStatus.COMPLETED },
      });
    }

    return updatedPrescription;
  });
};
