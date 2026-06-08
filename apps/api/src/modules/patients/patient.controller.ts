import { Request, Response, NextFunction } from 'express';
import {
  createNewPatient,
  getPatientById,
  getPatientByNumber,
  searchForPatients,
  fetchAllPatients,
  updateExistingPatient,
  deactivateExistingPatient
} from './patient.service';
import { CreatePatientInput, UpdatePatientInput } from './patient.validator';

// Create new patient
export const createPatientController = async (
  req: Request<{}, {}, CreatePatientInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log('📝 Creating patient with data:', JSON.stringify(req.body, null, 2));
    const result = await createNewPatient(req.body);
    res.status(201).json(result);
  } catch (error) {
    console.error('❌ Error creating patient:', error);
    next(error);
  }
};

// Get patient by ID
export const getPatientByIdController = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await getPatientById(req.params.id);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

// Get patient by number
export const getPatientByNumberController = async (
  req: Request<{ patientNumber: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await getPatientByNumber(req.params.patientNumber);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

// Search patients
export const searchPatientsController = async (
  req: Request<{}, {}, {}, { q: string; limit?: string; offset?: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : undefined;
    const offset = req.query.offset ? parseInt(req.query.offset, 10) : undefined;
    const result = await searchForPatients(req.query.q, limit, offset);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

// Get all patients
export const getAllPatientsController = async (
  req: Request<{}, {}, {}, { limit?: string; offset?: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : undefined;
    const offset = req.query.offset ? parseInt(req.query.offset, 10) : undefined;
    const result = await fetchAllPatients(limit, offset);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

// Update patient
export const updatePatientController = async (
  req: Request<{ id: string }, {}, UpdatePatientInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await updateExistingPatient(req.params.id, req.body);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

// Deactivate patient
export const deactivatePatientController = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await deactivateExistingPatient(req.params.id);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};