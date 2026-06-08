import logger from '../../config/logger';
import * as pharmacyRepository from './pharmacy.repository';
import {
  CreateMedicineInput,
  CreateMedicineBatchInput,
} from './pharmacy.validator';

export const createNewMedicine = async (data: CreateMedicineInput) => {
  try {
    const medicine = await pharmacyRepository.createMedicine(data);

    return {
      success: true,
      data: medicine,
    };
  } catch (error: any) {
    logger.error(`Service error creating medicine: ${error.message}`);
    throw {
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to create medicine',
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
  } catch (error: any) {
    logger.error(`Service error fetching medicine: ${error.message}`);
    throw {
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to fetch medicine',
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
  } catch (error: any) {
    logger.error(`Service error listing medicines: ${error.message}`);
    throw {
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to list medicines',
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
  } catch (error: any) {
    logger.error(`Service error searching medicines: ${error.message}`);
    throw {
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to search medicines',
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
  } catch (error: any) {
    logger.error(`Service error creating medicine batch: ${error.message}`);
    throw {
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to create medicine batch',
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
  } catch (error: any) {
    logger.error(`Service error fetching medicine batch: ${error.message}`);
    throw {
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to fetch medicine batch',
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
  } catch (error: any) {
    logger.error(`Service error fetching low stock items: ${error.message}`);
    throw {
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to fetch low stock items',
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
  } catch (error: any) {
    logger.error(`Service error fetching transactions: ${error.message}`);
    throw {
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to fetch transactions',
    };
  }
};

export const recordTransaction = async (data: any) => {
  try {
    const transaction = await pharmacyRepository.recordInventoryTransaction(data);

    return {
      success: true,
      data: transaction,
    };
  } catch (error: any) {
    logger.error(`Service error recording transaction: ${error.message}`);
    throw {
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to record transaction',
    };
  }
};
