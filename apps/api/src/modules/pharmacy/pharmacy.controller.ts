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
} from './pharmacy.service';
import { CreateMedicineInput, CreateMedicineBatchInput, ReceiveStockInput, OtcSaleInput } from './pharmacy.validator';

export const createMedicineController = async (
  req: Request<{}, {}, CreateMedicineInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await createNewMedicine(req.body);
    res.status(201).json(result);
  } catch (error) {
    next(error);
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
    next(error);
  }
};

export const getAllMedicinesController = async (
  req: Request<{}, {}, {}, { limit?: string; offset?: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : undefined;
    const offset = req.query.offset ? parseInt(req.query.offset, 10) : undefined;
    const result = await listAllMedicines(limit, offset);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const searchMedicinesController = async (
  req: Request<{}, {}, {}, { q: string; category?: string; limit?: string; offset?: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : undefined;
    const offset = req.query.offset ? parseInt(req.query.offset, 10) : undefined;
    const result = await searchMedicineService(req.query.q, req.query.category, limit, offset);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const createMedicineBatchController = async (
  req: Request<{}, {}, CreateMedicineBatchInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await createNewMedicineBatch(req.body);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

export const receiveStockController = async (
  req: Request<{}, {}, ReceiveStockInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await receiveNewMedicineStock(req.body);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

export const createOtcSaleController = async (
  req: Request<{}, {}, OtcSaleInput>,
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
    return res.status(201).json(result);
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
    next(error);
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
    next(error);
  }
};

export const getTransactionsController = async (
  req: Request<{}, {}, {}, { limit?: string; offset?: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : undefined;
    const offset = req.query.offset ? parseInt(req.query.offset, 10) : undefined;
    const result = await getTransactions(limit, offset);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const recordTransactionController = async (
  req: Request<{}, {}, any>,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await recordTransaction(req.body);
    res.status(201).json(result);
  } catch (error) {
    next(error);
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
