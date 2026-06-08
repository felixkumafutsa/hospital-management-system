import { PrismaClient, Prisma } from '@prisma/client';
import logger from '../../config/logger';

const prisma = new PrismaClient();

export const createMedicine = async (data: any) => {
  try {
    const medicine = await prisma.medicine.create({
      data: {
        name: data.name,
        genericName: data.genericName,
        category: data.category,
        form: data.form,
        strength: data.strength,
        unit: data.unit,
        reorderLevel: data.reorderLevel || 50,
      },
    });

    logger.info(`Medicine created: ${medicine.id}`);
    return medicine;
  } catch (error: any) {
    logger.error(`Error creating medicine: ${error.message}`);
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
      (error as any).statusCode = 404;
      throw error;
    }

    return medicine;
  } catch (error: any) {
    logger.error(`Error fetching medicine: ${error.message}`);
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
  } catch (error: any) {
    logger.error(`Error fetching all medicines: ${error.message}`);
    throw error;
  }
};

export const searchMedicines = async (query: string, category?: string, limit?: number, offset?: number) => {
  try {
    const skip = offset || 0;
    const take = limit || 10;

    const where: any = {
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
  } catch (error: any) {
    logger.error(`Error searching medicines: ${error.message}`);
    throw error;
  }
};

export const createMedicineBatch = async (data: any) => {
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
  } catch (error: any) {
    logger.error(`Error creating medicine batch: ${error.message}`);
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
      (error as any).statusCode = 404;
      throw error;
    }

    return batch;
  } catch (error: any) {
    logger.error(`Error fetching medicine batch: ${error.message}`);
    throw error;
  }
};

export const getLowStockItems = async () => {
  try {
    const lowStockItems = await prisma.medicine.findMany({
      where: {
        isActive: true,
        batches: {
          some: {
            quantityLeft: {
              lte: (prisma.medicine as any).$fields.reorderLevel,
            },
          },
        },
      },
      include: {
        batches: true,
      },
    });

    return lowStockItems;
  } catch (error: any) {
    logger.error(`Error fetching low stock items: ${error.message}`);
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
  } catch (error: any) {
    logger.error(`Error fetching inventory transactions: ${error.message}`);
    throw error;
  }
};

export const recordInventoryTransaction = async (data: any) => {
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
  } catch (error: any) {
    logger.error(`Error recording inventory transaction: ${error.message}`);
    throw error;
  }
};
