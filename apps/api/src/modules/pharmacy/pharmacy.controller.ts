import { Request, Response, NextFunction } from 'express';
import {
  createNewMedicine,
  getMedicine,
  listAllMedicines,
  searchMedicineService,
  createNewMedicineBatch,
  receiveNewMedicineStock,
  createOtcPharmacySale,
  getMedicineBatch,
  getLowStock,
  getTransactions,
  recordTransaction,
  getPharmacyDashboard,
  getInventory,
  getArchivedMedicines,
  archiveMedicine,
  updateInventoryItem,
} from './pharmacy.service';
import {
  CreateMedicineInput,
  CreateMedicineBatchInput,
  ReceiveStockInput,
  OtcSaleInput,
  RecordTransactionInput,
} from './pharmacy.validator';
import { getMedicineBatchById } from './pharmacy.repository';

export const getInventoryController = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const inventory = await getInventory();
    res.status(200).json(inventory);
  } catch (error) {
    return next(error);
  }
};

export const getArchivedMedicinesController = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const medicines = await getArchivedMedicines();
    res.status(200).json(medicines);
  } catch (error) {
    return next(error);
  }
};

export const archiveMedicineController = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const medicine = await archiveMedicine(req.params.id);
    res.status(200).json(medicine);
  } catch (error) {
    return next(error);
  }
};

export const updateInventoryItemController = async (
  req: Request<{ id: string }, unknown, { quantity: number; reason: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const updatedItem = await updateInventoryItem(id, req.body);
    res.status(200).json(updatedItem);
  } catch (error) {
    return next(error);
  }
};

export const createMedicineController = async (
  req: Request<Record<string, never>, Record<string, never>, CreateMedicineInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await createNewMedicine(req.body);
    res.status(201).json(result);
  } catch (error) {
    return next(error);
  }
};

export const getMedicineController = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await getMedicine(req.params.id);
    res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
};

export const getAllMedicinesController = async (
  req: Request<
    Record<string, never>,
    Record<string, never>,
    Record<string, never>,
    { limit?: string; offset?: string }
  >,
  res: Response,
  next: NextFunction
) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : undefined;
    const offset = req.query.offset ? parseInt(req.query.offset, 10) : undefined;
    const result = await listAllMedicines(limit, offset);
    res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
};

export const searchMedicinesController = async (
  req: Request<
    Record<string, never>,
    Record<string, never>,
    Record<string, never>,
    { q: string; category?: string; limit?: string; offset?: string }
  >,
  res: Response,
  next: NextFunction
) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : undefined;
    const offset = req.query.offset ? parseInt(req.query.offset, 10) : undefined;
    const result = await searchMedicineService(
      req.query.q,
      req.query.category,
      limit,
      offset
    );
    res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
};

export const createMedicineBatchController = async (
  req: Request<
    Record<string, never>,
    Record<string, never>,
    CreateMedicineBatchInput
  >,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await createNewMedicineBatch(req.body);
    res.status(201).json(result);
  } catch (error) {
    return next(error);
  }
};

export const receiveStockController = async (
  req: Request<Record<string, never>, Record<string, never>, ReceiveStockInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await receiveNewMedicineStock(req.body);
    res.status(201).json(result);
  } catch (error) {
    return next(error);
  }
};

export const createOtcSaleController = async (
  req: Request<Record<string, never>, Record<string, never>, OtcSaleInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }
    const result = await createOtcPharmacySale(req.body, userId);
    res.status(201).json(result);
  } catch (error) {
    return next(error);
  }
};

export const getMedicineBatchController = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await getMedicineBatch(req.params.id);
    res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
};

export const getLowStockController = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await getLowStock();
    res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
};

export const getTransactionsController = async (
  req: Request<
    Record<string, never>,
    Record<string, never>,
    Record<string, never>,
    { limit?: string; offset?: string }
  >,
  res: Response,
  next: NextFunction
) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : undefined;
    const offset = req.query.offset ? parseInt(req.query.offset, 10) : undefined;
    const result = await getTransactions(limit, offset);
    res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
};

export const recordTransactionController = async (
  req: Request<
    Record<string, never>,
    Record<string, never>,
    RecordTransactionInput
  >,
  res: Response,
  next: NextFunction
) => {
  try {
    const { batchId, type, quantity, reason, reference, performedBy } = req.body;

    const batch = await getMedicineBatchById(batchId);
    if (!batch) {
      return res
        .status(404)
        .json({ success: false, message: 'Batch not found' });
    }

    const transactionType = ['STOCK_IN', 'RETURNED'].includes(type)
      ? 'IN'
      : 'OUT';

    const result = await recordTransaction({
      medicineId: batch.medicineId,
      batchId,
      transactionType,
      quantity,
      unitPrice: batch.sellingPrice.toNumber(),
      type,
      reason,
      reference,
      performedBy,
    });
    res.status(201).json(result);
  } catch (error) {
    return next(error);
  }
};

export const getPharmacyDashboardController = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await getPharmacyDashboard();
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
};