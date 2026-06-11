import {
  createVisit,
  findVisitById,
  getPatientVisits,
  getAllVisits,
  updateVisitStatus,
  getActiveVisitsQueue,
  admitPatient,
  dischargePatient,
  setEmergencyStatus,
  setMaternityStatus,
  getWardOccupancy,
  getWaitingConsultationQueue,
  getPendingLabTests,
  getPendingPrescriptions,
  getCurrentAdmissions
} from './visit.repository';
import { findPatientById } from '../patients/patient.repository';
import { ApiError } from '../../middlewares/errorHandler';
import { CreateVisitInput, UpdateVisitStatusInput } from './visit.validator';

// Create new visit service - sets status to WAITING_FOR_CONSULTATION after registration
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

  // After registration, patient is waiting for consultation
  const updatedVisit = await updateVisitStatus(visit.id, 'WAITING_FOR_CONSULTATION');

  return { success: true, visit: updatedVisit };
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

// Flag patient as emergency
export const setPatientEmergency = async (
  id: string, 
  triageLevel: string,
  emergencyNotes?: string
) => {
  const visit = await findVisitById(id);
  if (!visit) {
    throw new ApiError(404, 'VISIT_NOT_FOUND', 'Visit not found');
  }

  const updatedVisit = await setEmergencyStatus(id, triageLevel, emergencyNotes);
  return {
    success: true,
    message: 'Patient marked as emergency case',
    visit: updatedVisit
  };
};

// Route patient to maternity
export const routeToMaternity = async (id: string) => {
  const visit = await findVisitById(id);
  if (!visit) {
    throw new ApiError(404, 'VISIT_NOT_FOUND', 'Visit not found');
  }

  const updatedVisit = await setMaternityStatus(id);
  return {
    success: true,
    message: 'Patient routed to maternity unit',
    visit: updatedVisit
  };
};

// Send patient to lab - updates status to AWAITING_LABORATORY
export const sendToLaboratory = async (id: string) => {
  const visit = await findVisitById(id);
  if (!visit) {
    throw new ApiError(404, 'VISIT_NOT_FOUND', 'Visit not found');
  }

  const updatedVisit = await updateVisitStatus(id, 'AWAITING_LABORATORY');
  return {
    success: true,
    message: 'Patient sent to laboratory',
    visit: updatedVisit
  };
};

// Mark lab results as available - notifies doctor
export const labResultsAvailable = async (id: string) => {
  const visit = await findVisitById(id);
  if (!visit) {
    throw new ApiError(404, 'VISIT_NOT_FOUND', 'Visit not found');
  }

  const updatedVisit = await updateVisitStatus(id, 'RESULTS_AVAILABLE');
  return {
    success: true,
    message: 'Lab results marked as available, doctor notified',
    visit: updatedVisit
  };
};

// Send patient to pharmacy
export const sendToPharmacy = async (id: string) => {
  const visit = await findVisitById(id);
  if (!visit) {
    throw new ApiError(404, 'VISIT_NOT_FOUND', 'Visit not found');
  }

  const updatedVisit = await updateVisitStatus(id, 'AWAITING_PHARMACY');
  return {
    success: true,
    message: 'Patient sent to pharmacy',
    visit: updatedVisit
  };
};

// Complete visit after pharmacy dispensing
export const completeVisit = async (id: string) => {
  const visit = await findVisitById(id);
  if (!visit) {
    throw new ApiError(404, 'VISIT_NOT_FOUND', 'Visit not found');
  }

  const updatedVisit = await updateVisitStatus(id, 'COMPLETED');
  return {
    success: true,
    message: 'Visit completed successfully',
    visit: updatedVisit
  };
};

// Dashboard statistics services
export const getDashboardStats = async () => {
  const [waitingPatients, pendingLabs, pendingPrescriptions, currentAdmissions, wardOccupancy] = await Promise.all([
    getWaitingConsultationQueue(),
    getPendingLabTests(),
    getPendingPrescriptions(),
    getCurrentAdmissions(),
    getWardOccupancy()
  ]);

  return {
    success: true,
    stats: {
      waitingForConsultation: waitingPatients.length,
      pendingLabTests: pendingLabs.length,
      pendingPrescriptions: pendingPrescriptions.length,
      currentAdmissions: currentAdmissions.length,
      wardOccupancy
    }
  };
};

// Admit patient (inpatient stay) service
export const admitExistingPatient = async (
  id: string, 
  ward: string, 
  bedNumber: string, 
  attendingDoctorId: string,
  expectedDischargeDate: Date,
  dailyRate: number
) => {
  const visit = await findVisitById(id);
  if (!visit) {
    throw new ApiError(404, 'VISIT_NOT_FOUND', 'Visit not found');
  }

  const updatedVisit = await admitPatient(
    id, 
    ward, 
    bedNumber, 
    attendingDoctorId, 
    expectedDischargeDate, 
    dailyRate
  );
  return { 
    success: true, 
    message: 'Patient admitted successfully', 
    visit: updatedVisit 
  };
};

// Discharge patient service
export const dischargeExistingPatient = async (id: string) => {
  const visit = await findVisitById(id);
  if (!visit) {
    throw new ApiError(404, 'VISIT_NOT_FOUND', 'Visit not found');
  }

  if (!visit.admissionDate) {
    throw new ApiError(400, 'PATIENT_NOT_ADMITTED', 'Cannot discharge patient who was not admitted');
  }

  const updatedVisit = await dischargePatient(id);
  return { 
    success: true, 
    message: `Patient discharged successfully after ${updatedVisit.stayDuration} days`, 
    visit: updatedVisit 
  };
};