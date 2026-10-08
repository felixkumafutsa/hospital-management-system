import { Request, Response, NextFunction } from 'express';
import {
  createNewInvoice,
  getInvoice,
  getPatientInvoices,
  getVisitInvoice,
  listAllInvoices,
  recordNewPayment,
  getFinanceStats,
  getMonthlyRevenue,
  getLatestInvoices,
} from './billing.service';
import { CreateInvoiceInput, CreatePaymentInput } from './billing.validator';

export const createInvoiceController = async (
  req: Request<Record<string, never>, unknown, CreateInvoiceInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await createNewInvoice(req.body);
    res.status(201).json(result);
  } catch (error: unknown) {
    // Handle unique constraint violation (P2002) - visit already has an invoice
    const prismaError = error as { code?: string; meta?: { target?: string[] } };
    if (prismaError.code === 'P2002' && prismaError.meta?.target?.includes('visitId')) {
      return res.status(409).json({
        success: false,
        error: 'An invoice already exists for this visit. Each visit can only have one invoice.'
      });
    }
    return next(error);
  }
};

export const getInvoiceController = async (
  req: Request<{ id: string }, unknown, unknown>,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await getInvoice(req.params.id);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const getPatientInvoicesController = async (
  req: Request<{ patientId: string }, unknown, unknown, { limit?: string; offset?: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : undefined;
    const offset = req.query.offset ? parseInt(req.query.offset, 10) : undefined;
    const result = await getPatientInvoices(req.params.patientId, limit, offset);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const getVisitInvoiceController = async (
  req: Request<{ visitId: string }, unknown, unknown>,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await getVisitInvoice(req.params.visitId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const getAllInvoicesController = async (
  req: Request<Record<string, never>, unknown, unknown, { status?: string; limit?: string; offset?: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : undefined;
    const offset = req.query.offset ? parseInt(req.query.offset, 10) : undefined;
    const result = await listAllInvoices(req.query.status, limit, offset);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const recordPaymentController = async (
  req: Request<{ invoiceId: string }, unknown, CreatePaymentInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await recordNewPayment(req.params.invoiceId, req.body);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

export const getFinanceStatsController = async (
  _req: Request<Record<string, never>, unknown, unknown>,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await getFinanceStats();
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const getRevenueController = async (
  _req: Request<Record<string, never>, unknown, unknown>,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await getMonthlyRevenue();
    res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
};

export const getRecentInvoicesController = async (
  _req: Request<Record<string, never>, unknown, unknown>,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await getLatestInvoices();
    res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
};