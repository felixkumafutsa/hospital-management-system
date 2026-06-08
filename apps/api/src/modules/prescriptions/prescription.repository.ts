import { PrismaClient } from '@prisma/client';
import logger from '../../config/logger';

const prisma = new PrismaClient();

export const createPrescription = async (data: any) => {
  try {
    const prescription = await prisma.prescription.create({
      data: {
        visitId: data.visitId,
        prescribedBy: data.prescribedBy,
        status: 'PENDING',
        notes: data.notes,
        items: {
          create: data.items.map((item: any) => ({
            medicineId: item.medicineId,
            dosage: item.dosage,
            frequency: item.frequency,
            duration: item.duration,
            quantity: item.quantity,
            notes: item.notes,
          })),
        },
      },
      include: {
        items: {
          include: {
            medicine: true,
          },
        },
      },
    });

    logger.info(`Prescription created: ${prescription.id}`);
    return prescription;
  } catch (error: any) {
    logger.error(`Error creating prescription: ${error.message}`);
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

export const getPrescriptionsByVisit = async (visitId: string) => {
  try {
    const prescriptions = await prisma.prescription.findMany({
      where: { visitId },
      include: {
        items: {
          include: {
            medicine: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return prescriptions;
  } catch (error: any) {
    logger.error(`Error fetching prescriptions for visit: ${error.message}`);
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

    return {
      data: prescriptions,
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
