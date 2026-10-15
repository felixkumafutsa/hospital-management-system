import logger from '../../config/logger';
import * as pharmacyRepository from './pharmacy.repository';
import { TransactionType } from '@prisma/client';
import {
  CreateMedicineInput,
  CreateMedicineBatchInput,
  ReceiveStockInput,
  OtcSaleInput,
} from './pharmacy.validator';

export const createNewMedicine = async (data: CreateMedicineInput) => {
  try {
    const medicineData = {
      ...data,
      genericName: data.genericName || '',
      strength: data.strength || '',
    };
    const medicine = await pharmacyRepository.createMedicine(medicineData);

    return {
      success: true,
      data: medicine,
    };
  } catch (error: unknown) {
    const err = error as Error;
    logger.error(`Service error creating medicine: ${err.message}`);
    throw {
      statusCode: 500,
      message: err.message || 'Failed to create medicine',
    };
  }
};

export const getMedicine = async (id: string) => {
  try {
    const medicine = await pharmacyRepository.getMedicineById(id);

    return {
      success: true,
      data: medicine,
    };
  } catch (error: unknown) {
    const err = error as Error;
    logger.error(`Service error fetching medicine: ${err.message}`);
    throw {
      statusCode: 500,
      message: err.message || 'Failed to fetch medicine',
    };
  }
};

export const listAllMedicines = async (limit?: number, offset?: number) => {
  try {
    const result = await pharmacyRepository.getAllMedicines(limit, offset);

    return {
      success: true,
      data: result.data,
      pagination: {
        limit: result.limit,
        offset: result.offset,
        total: result.total,
      },
    };
  } catch (error: unknown) {
    const err = error as Error;
    logger.error(`Service error listing medicines: ${err.message}`);
    throw {
      statusCode: 500,
      message: err.message || 'Failed to list medicines',
    };
  }
};

export const searchMedicineService = async (
  query: string,
  category?: string,
  limit?: number,
  offset?: number
) => {
  try {
    const result = await pharmacyRepository.searchMedicines(query, category, limit, offset);

    return {
      success: true,
      data: result.data,
      pagination: {
        limit: result.limit,
        offset: result.offset,
        total: result.total,
      },
    };
  } catch (error: unknown) {
    const err = error as Error;
    logger.error(`Service error searching medicines: ${err.message}`);
    throw {
      statusCode: 500,
      message: err.message || 'Failed to search medicines',
    };
  }
};

export const createNewMedicineBatch = async (data: CreateMedicineBatchInput) => {
  try {
    const batch = await pharmacyRepository.createMedicineBatch(data);

    return {
      success: true,
      data: batch,
    };
  } catch (error: unknown) {
    const err = error as Error;
    logger.error(`Service error creating medicine batch: ${err.message}`);
    throw {
      statusCode: 500,
      message: err.message || 'Failed to create medicine batch',
    };
  }
};

export const getMedicineBatch = async (id: string) => {
  try {
    const batch = await pharmacyRepository.getMedicineBatchById(id);

    return {
      success: true,
      data: batch,
    };
  } catch (error: unknown) {
    const err = error as Error;
    logger.error(`Service error fetching medicine batch: ${err.message}`);
    throw {
      statusCode: 500,
      message: err.message || 'Failed to fetch medicine batch',
    };
  }
};

export const getLowStock = async () => {
  try {
    const items = await pharmacyRepository.getLowStockItems();

    return {
      success: true,
      data: items,
    };
  } catch (error: unknown) {
    const err = error as Error;
    logger.error(`Service error fetching low stock items: ${err.message}`);
    throw {
      statusCode: 500,
      message: err.message || 'Failed to fetch low stock items',
    };
  }
};

export const getTransactions = async (limit?: number, offset?: number) => {
  try {
    const result = await pharmacyRepository.getInventoryTransactions(limit, offset);

    return {
      success: true,
      data: result.data,
      pagination: {
        limit: result.limit,
        offset: result.offset,
        total: result.total,
      },
    };
  } catch (error: unknown) {
    const err = error as Error;
    logger.error(`Service error fetching transactions: ${err.message}`);
    throw {
      statusCode: 500,
      message: err.message || 'Failed to fetch transactions',
    };
  }
};

interface TransactionData {
  medicineId: string;
  batchId: string;
  transactionType: 'IN' | 'OUT';
  quantity: number;
  unitPrice: number;
  notes?: string;
  type: TransactionType;
  performedBy: string;
  reason?: string;
  reference?: string;
}

export const recordTransaction = async (data: TransactionData) => {
  try {
    const transaction = await pharmacyRepository.recordInventoryTransaction(data);

    return {
      success: true,
      data: transaction,
    };
  } catch (error: unknown) {
    const err = error as Error;
    logger.error(`Service error recording transaction: ${err.message}`);
    throw {
      statusCode: 500,
      message: err.message || 'Failed to record transaction',
    };
  }
};

export const receiveNewMedicineStock = async (data: ReceiveStockInput) => {
  try {
    const medicine = await pharmacyRepository.receiveMedicineStock(data);
    return { success: true, data: medicine };
  } catch (error: unknown) {
    const err = error as Error;
    logger.error(`Service error receiving medicine stock: ${err.message}`);
    throw {
      statusCode: 500,
      message: err.message || 'Failed to receive medicine stock',
    };
  }
};

export const createOtcPharmacySale = async (data: OtcSaleInput, userId: string) => {
  try {
    const sale = await pharmacyRepository.createOtcSale({ ...data, userId });
    return { success: true, data: sale };
  } catch (error: unknown) {
    const err = error as Error;
    logger.error(`Service error creating OTC sale: ${err.message}`);
    throw {
      statusCode: 500,
      message: err.message || 'Failed to create OTC sale',
    };
  }
};

export const getPharmacyDashboard = async () => {
  try {
    const stats = await pharmacyRepository.getPharmacyDashboardStats();
    return { success: true, data: stats };
  } catch (error: unknown) {
    const err = error as Error;
    logger.error(`Service error getting pharmacy dashboard stats: ${err.message}`);
    throw {
      statusCode: 500,
      message: err.message || 'Failed to get pharmacy dashboard stats',
    };
  }
};

export const getInventory = async () => {
  try {
    const inventory = await pharmacyRepository.getInventory();
    return { success: true, data: inventory };
  } catch (error: unknown) {
    const err = error as Error;
    logger.error(`Service error getting inventory: ${err.message}`);
    throw {
      statusCode: 500,
      message: err.message || 'Failed to get inventory',
    };
  }
};

export const getArchivedMedicines = async () => {
  try {
    const medicines = await pharmacyRepository.getArchivedMedicines();
    return { success: true, data: medicines };
  } catch (error: unknown) {
    const err = error as Error & { statusCode?: number };
    logger.error(`Service error fetching archived medicines: ${err.message}`);
    throw {
      statusCode: err.statusCode || 500,
      message: err.message || 'Failed to fetch archived medicines',
    };
  }
};

export const archiveMedicine = async (id: string) => {
  try {
    const medicine = await pharmacyRepository.archiveMedicine(id);
    return { success: true, data: medicine };
  } catch (error: unknown) {
    const err = error as Error & { statusCode?: number };
    logger.error(`Service error archiving medicine: ${err.message}`);
    throw {
      statusCode: err.statusCode || 500,
      message: err.message || 'Failed to archive medicine',
    };
  }
};

export const updateInventoryItem = async (id: string, data: { quantity: number; reason?: string }) => {
  try {
    const updatedItem = await pharmacyRepository.updateInventoryItem(id, data);
    return { success: true, data: updatedItem };
  } catch (error: unknown) {
    const err = error as Error;
    logger.error(`Service error updating inventory item: ${err.message}`);
    throw {
      statusCode: 500,
      message: err.message || 'Failed to update inventory item',
    };
  }
};