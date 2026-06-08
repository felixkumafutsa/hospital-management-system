import { Request, Response, NextFunction } from 'express';
import {
  createNewLabTest,
  getLabTest,
  listAllLabTests,
  createNewLabRequest,
  getLabRequest,
  getPatientLabRequests,
  listAllLabRequests,
  updateLabRequestStatusService,
  addLabResultService,
} from './lab.service';
import {
  CreateLabTestInput,
  CreateLabRequestInput,
  UpdateLabRequestStatusInput,
  AddLabResultInput,
} from './lab.validator';

export const createLabTestController = async (
  req: Request<{}, {}, CreateLabTestInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await createNewLabTest(req.body);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

export const getLabTestController = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await getLabTest(req.params.id);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const getAllLabTestsController = async (
  req: Request<{}, {}, {}, { limit?: string; offset?: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : undefined;
    const offset = req.query.offset ? parseInt(req.query.offset, 10) : undefined;
    const result = await listAllLabTests(limit, offset);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const createLabRequestController = async (
  req: Request<{}, {}, CreateLabRequestInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await createNewLabRequest(req.body);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

export const getLabRequestController = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await getLabRequest(req.params.id);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const getPatientLabRequestsController = async (
  req: Request<{ patientId: string }, {}, {}, { limit?: string; offset?: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : undefined;
    const offset = req.query.offset ? parseInt(req.query.offset, 10) : undefined;
    const result = await getPatientLabRequests(req.params.patientId, limit, offset);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const getAllLabRequestsController = async (
  req: Request<{}, {}, {}, { status?: string; limit?: string; offset?: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : undefined;
    const offset = req.query.offset ? parseInt(req.query.offset, 10) : undefined;
    const result = await listAllLabRequests(req.query.status, limit, offset);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const updateLabRequestStatusController = async (
  req: Request<{ id: string }, {}, UpdateLabRequestStatusInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await updateLabRequestStatusService(req.params.id, req.body);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const addLabResultController = async (
  req: Request<{ requestId: string }, {}, AddLabResultInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await addLabResultService(req.params.requestId, req.body);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};
