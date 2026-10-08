import { PrismaClient, Prisma, TransactionType, DrugForm } from '@prisma/client';
import logger from '../../config/logger';

const prisma = new PrismaClient();

interface MedicineData {
  name: string;
  genericName: string;
  form: DrugForm;
  strength: string;
  unit: string;
  reorderLevel?: number;
}

interface MedicineBatchData {
  medicineId: string;
  supplierId: string;
  batchNumber: string;
  quantity: number;
  costPrice: number;
  sellingPrice: number;
  manufacturedAt?: string;
  expiresAt: string;
}

interface InventoryTransactionData {
  batchId: string;
  type: TransactionType;
  quantity: number;
  reason?: string;
  reference?: string;
  performedBy: string;
}

interface MedicineWhereInput {
  isActive: boolean;
  OR: Array<{ [key: string]: { contains: string; mode: 'insensitive' } }>;
  category?: string;
}

export const createMedicine = async (data: MedicineData) => {
  try {
    const medicine = await prisma.medicine.create({
      data: {
        name: data.name,
        genericName: data.genericName,
        form: data.form,
        strength: data.strength,
        unit: data.unit,
        reorderLevel: data.reorderLevel || 50,
      },
    });

    logger.info(`Medicine created: ${medicine.id}`);
    return medicine;
  } catch (error: unknown) {
    if (error instanceof Error) {
      logger.error(`Error creating medicine: ${error.message}`);
    }
    throw error;
  }
};

export const getMedicineById = async (id: string) => {
  try {
    const medicine = await prisma.medicine.findUnique({
      where: { id },
      include: {
        batches: {
          where: { quantityLeft: { gt: 0 } },
        },
      },
    });

    if (!medicine) {
      const error = new Error('Medicine not found');
      (error as Error & { statusCode: number }).statusCode = 404;
      throw error;
    }

    return medicine;
  } catch (error: unknown) {
    if (error instanceof Error) {
      logger.error(`Error fetching medicine: ${error.message}`);
    }
    throw error;
  }
};

export const getAllMedicines = async (limit?: number, offset?: number) => {
  try {
    const skip = offset || 0;
    const take = limit || 10;

    const [medicines, total] = await Promise.all([
      prisma.medicine.findMany({
        where: { isActive: true },
        include: {
          batches: {
            where: { quantityLeft: { gt: 0 } },
            include: { supplier: true },
            orderBy: { expiresAt: 'asc' },
          },
        },
        skip,
        take,
        orderBy: { name: 'asc' },
      }),
      prisma.medicine.count({ where: { isActive: true } }),
    ]);

    return {
      data: medicines,
      total,
      limit: take,
      offset: skip,
    };
  } catch (error: unknown) {
    if (error instanceof Error) {
      logger.error(`Error fetching all medicines: ${error.message}`);
    }
    throw error;
  }
};

export const searchMedicines = async (query: string, category?: string, limit?: number, offset?: number) => {
  try {
    const skip = offset || 0;
    const take = limit || 10;

    const where: MedicineWhereInput = {
      isActive: true,
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { genericName: { contains: query, mode: 'insensitive' } },
      ],
    };

    if (category) {
      where.category = category;
    }

    const [medicines, total] = await Promise.all([
      prisma.medicine.findMany({
        where,
        include: {
          batches: {
            where: { quantityLeft: { gt: 0 } },
          },
        },
        skip,
        take,
      }),
      prisma.medicine.count({ where }),
    ]);

    return {
      data: medicines,
      total,
      limit: take,
      offset: skip,
    };
  } catch (error: unknown) {
    if (error instanceof Error) {
      logger.error(`Error searching medicines: ${error.message}`);
    }
    throw error;
  }
};

export const createMedicineBatch = async (data: MedicineBatchData) => {
  try {
    const batch = await prisma.medicineBatch.create({
      data: {
        medicineId: data.medicineId,
        supplierId: data.supplierId,
        batchNumber: data.batchNumber,
        quantity: data.quantity,
        quantityLeft: data.quantity,
        costPrice: new Prisma.Decimal(data.costPrice),
        sellingPrice: new Prisma.Decimal(data.sellingPrice),
        manufacturedAt: data.manufacturedAt ? new Date(data.manufacturedAt) : undefined,
        expiresAt: new Date(data.expiresAt),
      },
      include: {
        medicine: true,
        supplier: true,
      },
    });

    logger.info(`Medicine batch created: ${batch.id}`);
    return batch;
  } catch (error: unknown) {
    if (error instanceof Error) {
      logger.error(`Error creating medicine batch: ${error.message}`);
    }
    throw error;
  }
};

export const getMedicineBatchById = async (id: string) => {
  try {
    const batch = await prisma.medicineBatch.findUnique({
      where: { id },
      include: {
        medicine: true,
        supplier: true,
      },
    });

    if (!batch) {
      const error = new Error('Medicine batch not found');
      (error as Error & { statusCode: number }).statusCode = 404;
      throw error;
    }

    return batch;
  } catch (error: unknown) {
    if (error instanceof Error) {
      logger.error(`Error fetching medicine batch: ${error.message}`);
    }
    throw error;
  }
};

export const getLowStockItems = async () => {
  try {
    const medicines = await prisma.medicine.findMany({
      where: {
        isActive: true,
      },
      include: {
        batches: true,
      },
    });

    const lowStockItems = medicines.filter(medicine => {
      const totalStock = medicine.batches.reduce((acc, batch) => acc + batch.quantityLeft, 0);
      return totalStock <= medicine.reorderLevel;
    });

    return lowStockItems;
  } catch (error: unknown) {
    if (error instanceof Error) {
      logger.error(`Error fetching low stock items: ${error.message}`);
    }
    throw error;
  }
};

export const getInventoryTransactions = async (limit?: number, offset?: number) => {
  try {
    const skip = offset || 0;
    const take = limit || 10;

    const [transactions, total] = await Promise.all([
      prisma.inventoryTransaction.findMany({
        include: {
          batch: {
            include: {
              medicine: true,
            },
          },
        },
        skip,
        take,
        orderBy: { performedAt: 'desc' },
      }),
      prisma.inventoryTransaction.count(),
    ]);

    return {
      data: transactions,
      total,
      limit: take,
      offset: skip,
    };
  } catch (error: unknown) {
    if (error instanceof Error) {
      logger.error(`Error fetching inventory transactions: ${error.message}`);
    }
    throw error;
  }
};

export const recordInventoryTransaction = async (data: InventoryTransactionData) => {
  try {
    const transaction = await prisma.inventoryTransaction.create({
      data: {
        batchId: data.batchId,
        type: data.type,
        quantity: data.quantity,
        reason: data.reason,
        reference: data.reference,
        performedBy: data.performedBy,
      },
      include: {
        batch: {
          include: {
            medicine: true,
          },
        },
      },
    });

    // Update batch quantity
    const currentBatch = await prisma.medicineBatch.findUnique({
      where: { id: data.batchId },
    });

    if (currentBatch) {
      const newQuantity = currentBatch.quantityLeft + (data.type === 'STOCK_IN' ? data.quantity : -data.quantity);
      await prisma.medicineBatch.update({
        where: { id: data.batchId },
        data: {
          quantityLeft: Math.max(0, newQuantity),
        },
      });
    }

    logger.info(`Inventory transaction recorded: ${transaction.id}`);
    return transaction;
  } catch (error: unknown) {
    if (error instanceof Error) {
      logger.error(`Error recording inventory transaction: ${error.message}`);
    }
    throw error;
  }
};

export const receiveMedicineStock = async (data: {
  name: string;
  genericName?: string;
  strength?: string;
  isOtc: boolean;
  form: DrugForm;
  unit: string;
  reorderLevel: number;
  batchNumber: string;
  quantity: number;
  costPrice: number;
  sellingPrice: number;
  supplierName: string;
  expiresAt: string;
}) => {
  return prisma.$transaction(async (transaction) => {
    const existingSupplier = await transaction.supplier.findFirst({
      where: { name: { equals: data.supplierName, mode: 'insensitive' } },
    });

    const supplier = existingSupplier || await transaction.supplier.create({
      data: { name: data.supplierName },
    });
    const existingMedicine = await transaction.medicine.findFirst({
      where: {
        name: { equals: data.name, mode: 'insensitive' },
        genericName: data.genericName || '',
        form: data.form,
        unit: data.unit,
        strength: data.strength || '',
      },
    });
    const medicine = existingMedicine
      ? await transaction.medicine.update({
          where: { id: existingMedicine.id },
          data: {
            isOtc: existingMedicine.isOtc || data.isOtc,
            reorderLevel: data.reorderLevel,
          },
        })
      : await transaction.medicine.create({
      data: {
        name: data.name,
        genericName: data.genericName || '',
        strength: data.strength || '',
        isOtc: data.isOtc,
        form: data.form,
        unit: data.unit,
        reorderLevel: data.reorderLevel,
      },
    });
    const batch = await transaction.medicineBatch.create({
      data: {
        medicineId: medicine.id,
        supplierId: supplier.id,
        batchNumber: data.batchNumber,
        quantity: data.quantity,
        quantityLeft: data.quantity,
        costPrice: new Prisma.Decimal(data.costPrice),
        sellingPrice: new Prisma.Decimal(data.sellingPrice),
        expiresAt: new Date(data.expiresAt),
      },
      include: { supplier: true },
    });

    return { ...medicine, batches: [batch] };
  });
};

export const createOtcSale = async (data: {
  patientId: string;
  userId: string;
  paymentMethod: 'CASH' | 'AIRTEL_MONEY' | 'TNM_MPAMBA' | 'BANK_TRANSFER' | 'INSURANCE' | 'WAIVER';
  items: Array<{ medicineId: string; quantity: number }>;
}) => {
  return prisma.$transaction(async (transaction) => {
    const requested = new Map<string, number>();
    for (const item of data.items) {
      requested.set(item.medicineId, (requested.get(item.medicineId) || 0) + item.quantity);
    }

    const visit = await transaction.visit.create({
      data: {
        patientId: data.patientId,
        createdBy: data.userId,
        visitType: 'OUTPATIENT',
        status: 'COMPLETED',
        reasonForVisit: 'Over-the-counter pharmacy purchase',
      },
    });
    const invoiceItems: Array<{
      description: string;
      category: 'MEDICATION';
      quantity: number;
      unitPrice: Prisma.Decimal;
      subtotal: Prisma.Decimal;
      reference: string;
    }> = [];
    const allocated: Array<{ batchId: string; quantity: number }> = [];
    const now = new Date();

    for (const [medicineId, requestedQuantity] of requested) {
      const medicine = await transaction.medicine.findUnique({
        where: { id: medicineId, isActive: true, isOtc: true },
        include: {
          batches: {
            where: { quantityLeft: { gt: 0 }, expiresAt: { gt: now } },
            orderBy: { expiresAt: 'asc' },
          },
        },
      });
      if (!medicine) throw new Error(`Medicine ${medicineId} is not available for over-the-counter sale`);

      let remaining = requestedQuantity;
      for (const batch of medicine.batches) {
        if (remaining === 0) break;
        const quantity = Math.min(remaining, batch.quantityLeft);
        const subtotal = batch.sellingPrice.mul(quantity);
        invoiceItems.push({
          description: medicine.name,
          category: 'MEDICATION',
          quantity,
          unitPrice: batch.sellingPrice,
          subtotal,
          reference: batch.id,
        });
        allocated.push({ batchId: batch.id, quantity });
        remaining -= quantity;
      }
      if (remaining > 0) throw new Error(`Insufficient stock for ${medicine.name}`);
    }

    const total = invoiceItems.reduce((sum, item) => sum.add(item.subtotal), new Prisma.Decimal(0));
    for (const allocation of allocated) {
      const stockUpdate = await transaction.medicineBatch.updateMany({
        where: { id: allocation.batchId, quantityLeft: { gte: allocation.quantity } },
        data: { quantityLeft: { decrement: allocation.quantity } },
      });
      if (stockUpdate.count !== 1) throw new Error('Stock changed during checkout; refresh and retry');
      await transaction.inventoryTransaction.create({
        data: {
          batchId: allocation.batchId,
          type: 'DISPENSED',
          quantity: allocation.quantity,
          reason: 'Over-the-counter sale',
          reference: visit.id,
          performedBy: data.userId,
        },
      });
    }

    const invoice = await transaction.invoice.create({
      data: {
        invoiceNo: `OTC-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
        patientId: data.patientId,
        visitId: visit.id,
        status: 'PAID',
        subtotal: total,
        discount: new Prisma.Decimal(0),
        total,
        balance: new Prisma.Decimal(0),
        paidAmount: total,
        notes: 'Over-the-counter pharmacy purchase',
        items: { create: invoiceItems },
        payments: {
          create: {
            amount: total,
            method: data.paymentMethod,
            receivedBy: data.userId,
            notes: 'Over-the-counter pharmacy checkout',
          },
        },
      },
      include: { items: true, payments: true, patient: true },
    });

    return { visit, invoice };
  });
};

export const getPharmacyDashboardStats = async () => {
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const expiryHorizon = new Date(now);
  expiryHorizon.setDate(expiryHorizon.getDate() + 30);

  const [todayTransactions, monthTransactions, stockBatches, expiringStockBatches, expiringBatches, expiredBatches, pendingPrescriptions] =
    await Promise.all([
      prisma.inventoryTransaction.findMany({
        where: { type: 'DISPENSED', performedAt: { gte: todayStart } },
        include: { batch: { select: { sellingPrice: true } } },
      }),
      prisma.inventoryTransaction.findMany({
        where: { type: 'DISPENSED', performedAt: { gte: monthStart } },
        include: { batch: { select: { sellingPrice: true } } },
      }),
      prisma.medicineBatch.findMany({
        where: {
          quantityLeft: { gt: 0 },
          expiresAt: { gt: now },
          medicine: { isActive: true },
        },
        select: { quantityLeft: true },
      }),
      prisma.medicineBatch.findMany({
        where: {
          quantityLeft: { gt: 0 },
          expiresAt: { gt: now, lte: expiryHorizon },
          medicine: { isActive: true },
        },
        select: { quantityLeft: true },
      }),
      prisma.medicineBatch.findMany({
        where: {
          quantityLeft: { gt: 0 },
          expiresAt: { gt: now, lte: expiryHorizon },
          medicine: { isActive: true },
        },
        include: {
          medicine: { select: { name: true } },
        },
        orderBy: { expiresAt: 'asc' },
        take: 10,
      }),
      prisma.medicineBatch.findMany({
        where: {
          quantityLeft: { gt: 0 },
          expiresAt: { lte: now },
          medicine: { isActive: true },
        },
        select: { quantityLeft: true },
      }),
      prisma.prescription.count({ where: { status: 'PENDING' } }),
    ]);

  const salesSummary = (transactions: typeof todayTransactions) => ({
    units: transactions.reduce((sum, transaction) => sum + transaction.quantity, 0),
    revenue: transactions.reduce(
      (sum, transaction) => sum + transaction.batch.sellingPrice.toNumber() * transaction.quantity,
      0
    ),
  });

  return {
    todaySales: salesSummary(todayTransactions),
    monthSales: salesSummary(monthTransactions),
    availableUnits: stockBatches.reduce((sum, batch) => sum + batch.quantityLeft, 0),
    expiringUnits: expiringStockBatches.reduce((sum, batch) => sum + batch.quantityLeft, 0),
    expiredUnits: expiredBatches.reduce((sum, batch) => sum + batch.quantityLeft, 0),
    pendingPrescriptions,
    expiringBatches: expiringBatches.map((batch) => ({
      id: batch.id,
      medicineName: batch.medicine.name,
      batchNumber: batch.batchNumber,
      quantityLeft: batch.quantityLeft,
      expiresAt: batch.expiresAt,
    })),
  };
};