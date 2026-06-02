import {
  createVisit,
  findVisitById,
  getPatientVisits,
  getAllVisits,
  updateVisitStatus,
  getActiveVisitsQueue
} from './visit.repository';
import { findPatientById } from '../patients/patient.repository';
import { ApiError } from '../../middlewares/errorHandler';
import { CreateVisitInput, UpdateVisitStatusInput } from './visit.validator';

// Create new visit service
export const createNewVisit = async (data: CreateVisitInput, userId: string) => {
  // Check if patient exists
  const patient = await findPatientById(data.patientId);
  if (!patient) {
    throw new ApiError(404, 'PATIENT_NOT_FOUND', 'Patient not found');
  }

  const visit = await createVisit(
    data.patientId,
    userId,
    data.visitType,
    data.referralNote
  );

  return { success: true, visit };
};

// Get visit by ID service
export const getVisitById = async (id: string) => {
  const visit = await findVisitById(id);
  if (!visit) {
    throw new ApiError(404, 'VISIT_NOT_FOUND', 'Visit not found');
  }
  return { success: true, visit };
};

// Get patient visits service
export const getPatientVisitHistory = async (
  patientId: string,
  limit?: number,
  offset?: number
) => {
  // Check if patient exists
  const patient = await findPatientById(patientId);
  if (!patient) {
    throw new ApiError(404, 'PATIENT_NOT_FOUND', 'Patient not found');
  }

  const result = await getPatientVisits(patientId, limit, offset);
  return { success: true, ...result };
};

// Get all visits with filters service
export const fetchAllVisits = async (
  status?: any,
  visitType?: any,
  fromDate?: Date,
  toDate?: Date,
  limit?: number,
  offset?: number
) => {
  const result = await getAllVisits(status, visitType, fromDate, toDate, limit, offset);
  return { success: true, ...result };
};

// Update visit status service
export const updateVisitStatusService = async (
  id: string,
  data: UpdateVisitStatusInput
) => {
  const visit = await findVisitById(id);
  if (!visit) {
    throw new ApiError(404, 'VISIT_NOT_FOUND', 'Visit not found');
  }

  const updatedVisit = await updateVisitStatus(id, data.status as any);
  return { success: true, visit: updatedVisit };
};

// Get active visits queue service
export const getVisitQueue = async () => {
  const visits = await getActiveVisitsQueue();
  return { success: true, queue: visits };
};