import { Request, Response, NextFunction } from 'express';
import {
  createNewLabTest,
  updateLabTestPrice,
  getLabTest,
  listAllLabTests,
  createNewLabRequest,
  getLabRequest,
  getPatientLabRequests,
  getVisitLabRequests,
  listAllLabRequests,
  updateLabRequestStatusService,
  addLabResultService,
  getLabDashboardStats,
} from './lab.service';
import {
  CreateLabTestInput,
  CreateLabRequestInput,
  UpdateLabRequestStatusInput,
  AddLabResultInput,
} from './lab.validator';

export const createLabTestController = async (
  req: Request<object, object, CreateLabTestInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await createNewLabTest(req.body);
    return res.status(201).json(result);
  } catch (error) {
    return next(error);
  }
};

export const getLabTestController = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await getLabTest(req.params.id);
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
};

export const getAllLabTestsController = async (
  req: Request<object, object, object, { limit?: string; offset?: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : undefined;
    const offset = req.query.offset ? parseInt(req.query.offset, 10) : undefined;
    const result = await listAllLabTests(limit, offset);
    return res.status(200).json({ tests: result.data, total: result.total });
  } catch (error) {
    return next(error);
  }
};

export const createLabRequestController = async (
  req: Request<object, object, CreateLabRequestInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = {
      ...req.body,
      requestedBy: req.user!.userId,
    };
    const result = await createNewLabRequest(data);
    return res.status(201).json(result);
  } catch (error) {
    return next(error);
  }
};

export const getLabRequestController = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await getLabRequest(req.params.id);
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
};

export const getPatientLabRequestsController = async (
  req: Request<{ patientId: string }, object, object, { limit?: string; offset?: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : undefined;
    const offset = req.query.offset ? parseInt(req.query.offset, 10) : undefined;
    const result = await getPatientLabRequests(req.params.patientId, limit, offset);
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
};

export const getVisitLabRequestsController = async (
  req: Request<{ visitId: string }, object, object, { limit?: string; offset?: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : undefined;
    const offset = req.query.offset ? parseInt(req.query.offset, 10) : undefined;
    const result = await getVisitLabRequests(req.params.visitId, limit, offset);
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
};

export const getAllLabRequestsController = async (
  req: Request<object, object, object, { status?: string; limit?: string; offset?: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : undefined;
    const offset = req.query.offset ? parseInt(req.query.offset, 10) : undefined;
    const result = await listAllLabRequests(req.query.status, limit, offset);
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
};

export const getLabDashboardStatsController = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    return res.status(200).json(await getLabDashboardStats());
  } catch (error) {
    return next(error);
  }
};

export const updateLabRequestStatusController = async (
  req: Request<{ id: string }, object, UpdateLabRequestStatusInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await updateLabRequestStatusService(req.params.id, req.body);
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
};

export const addLabResultController = async (
  req: Request<{ requestId: string }, object, AddLabResultInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { testId, ...results } = req.body;
    const result = await addLabResultService(req.params.requestId, testId, results);
    return res.status(201).json(result);
  } catch (error) {
    return next(error);
  }
};

export const updateLabTestPriceController = async (
  req: Request<{ id: string }, object, { price: number }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await updateLabTestPrice(req.params.id, req.body.price);
    return res.status(200).json({ success: true, test: result });
  } catch (error) {
    return next(error);
  }
};