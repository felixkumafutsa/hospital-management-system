import { Request, Response, NextFunction } from 'express';
import {
  createNewVisit,
  getVisitById,
  getPatientVisitHistory,
  fetchAllVisits,
  updateVisitStatusService,
  getVisitQueue,
  admitExistingPatient,
  dischargeExistingPatient,
  setPatientEmergency,
  routeToMaternity,
  sendToLaboratory,
  labResultsAvailable,
  sendToPharmacy,
  completeVisit,
  getDashboardStats
} from './visit.service';
import { CreateVisitInput, UpdateVisitStatusInput, AdmitPatientInput } from './visit.validator';
import { TriageLevel } from '@prisma/client';

// Create new visit
export const createVisitController = async (
  req: Request<{}, {}, CreateVisitInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await createNewVisit(req.body, req.user!.userId);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

// Get visit by ID
export const getVisitByIdController = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await getVisitById(req.params.id);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

// Get patient's visit history
export const getPatientVisitsController = async (
  req: Request<{ patientId: string }, {}, {}, { limit?: string; offset?: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : undefined;
    const offset = req.query.offset ? parseInt(req.query.offset, 10) : undefined;
    const result = await getPatientVisitHistory(req.params.patientId, limit, offset);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

// Get all visits with filters
export const getAllVisitsController = async (
  req: Request<{}, {}, {}, { status?: string; visitType?: string; fromDate?: string; toDate?: string; limit?: string; offset?: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : undefined;
    const offset = req.query.offset ? parseInt(req.query.offset, 10) : undefined;
    const fromDate = req.query.fromDate ? new Date(req.query.fromDate) : undefined;
    const toDate = req.query.toDate ? new Date(req.query.toDate) : undefined;
    
    const result = await fetchAllVisits(
      req.query.status as any,
      req.query.visitType as any,
      fromDate,
      toDate,
      limit,
      offset
    );
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

// Update visit status
export const updateVisitStatusController = async (
  req: Request<{ id: string }, {}, UpdateVisitStatusInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await updateVisitStatusService(req.params.id, req.body);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

// Get active visit queue
export const getVisitQueueController = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await getVisitQueue();
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

// Admit patient to ward
export const admitPatientController = async (
  req: Request<{ id: string }, {}, AdmitPatientInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const expectedDischargeDate = req.body.expectedDischargeDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // Default to 7 days from now
    const result = await admitExistingPatient(
      req.params.id,
      req.body.ward,
      req.body.bedNumber,
      req.body.attendingDoctorId,
      expectedDischargeDate,
      req.body.dailyRate,
      req
    );
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

// Discharge patient
export const dischargePatientController = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await dischargeExistingPatient(req.params.id, req);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

// Mark patient as emergency
export const setPatientEmergencyController = async (
  req: Request<{ id: string }, {}, { triageLevel: TriageLevel; emergencyNotes?: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await setPatientEmergency(
      req.params.id,
      req.body.triageLevel,
      req.body.emergencyNotes,
      req
    );
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

// Route patient to maternity
export const routeToMaternityController = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await routeToMaternity(req.params.id);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

// Send patient to laboratory
export const sendToLaboratoryController = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await sendToLaboratory(req.params.id, req);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

// Mark lab results as available
export const labResultsAvailableController = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await labResultsAvailable(req.params.id, req);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

// Send patient to pharmacy
export const sendToPharmacyController = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await sendToPharmacy(req.params.id, req);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

// Complete visit
export const completeVisitController = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await completeVisit(req.params.id, req);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

// Get dashboard statistics
export const getDashboardStatsController = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await getDashboardStats();
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};