import { Request, Response, NextFunction } from 'express';
import {
  createNewPrescription,
  getPrescription,
  getPatientPrescriptions,
  listAllPrescriptions,
  updatePrescriptionStatusService,
  deletePrescriptionService,
} from './prescription.service';
import { CreatePrescriptionInput, UpdatePrescriptionStatusInput } from './prescription.validator';

export const createPrescriptionController = async (
  req: Request<{}, {}, CreatePrescriptionInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await createNewPrescription(req.body);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

export const getPrescriptionController = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await getPrescription(req.params.id);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const getPatientPrescriptionsController = async (
  req: Request<{ patientId: string }, {}, {}, { limit?: string; offset?: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : undefined;
    const offset = req.query.offset ? parseInt(req.query.offset, 10) : undefined;
    const result = await getPatientPrescriptions(req.params.patientId, limit, offset);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const getAllPrescriptionsController = async (
  req: Request<{}, {}, {}, { status?: string; limit?: string; offset?: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : undefined;
    const offset = req.query.offset ? parseInt(req.query.offset, 10) : undefined;
    const result = await listAllPrescriptions(req.query.status, limit, offset);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const updatePrescriptionStatusController = async (
  req: Request<{ id: string }, {}, UpdatePrescriptionStatusInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await updatePrescriptionStatusService(req.params.id, req.body);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const deletePrescriptionController = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await deletePrescriptionService(req.params.id);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
