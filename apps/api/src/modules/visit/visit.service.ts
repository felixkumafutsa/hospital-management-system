import { Request } from 'express';
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
import { TriageLevel } from '@prisma/client';
import { CreateVisitInput, UpdateVisitStatusInput } from './visit.validator';
import { 
  notifyDoctorsOfLabResults, 
  notifyLabTechniciansOfNewPatient,
  notifyPharmacistsOfNewPrescription,
  notifyEmergencyCase,
  notifyAdmission,
  notifyDischarge
} from '../notifications/notifications.service';

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
  triageLevel: TriageLevel,
  emergencyNotes?: string,
  req?: Request
) => {
  const visit = await findVisitById(id);
  if (!visit) {
    throw new ApiError(404, 'VISIT_NOT_FOUND', 'Visit not found');
  }

  // Get patient details for notification
  const patient = await findPatientById(visit.patientId);
  if (!patient) {
    throw new ApiError(404, 'PATIENT_NOT_FOUND', 'Patient not found');
  }

  // Create audit log before update
  if (req) {
    await req.createAuditLog({
      action: 'MARK_EMERGENCY',
      resource: 'VISIT',
      resourceId: visit.id,
      before: { status: visit.status },
      after: { status: 'EMERGENCY', triageLevel }
    });
  }

  const updatedVisit = await setEmergencyStatus(id, triageLevel, emergencyNotes);
  
  // Notify doctors of emergency case
  const patientName = `${patient.firstName} ${patient.lastName}`;
  await notifyEmergencyCase(visit.id, patientName, triageLevel);

  return {
    success: true,
    message: 'Patient marked as emergency case, emergency team notified',
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
export const sendToLaboratory = async (id: string, req: Request) => {
  const visit = await findVisitById(id);
  if (!visit) {
    throw new ApiError(404, 'VISIT_NOT_FOUND', 'Visit not found');
  }

  // Get patient details for notification
  const patient = await findPatientById(visit.patientId);
  if (!patient) {
    throw new ApiError(404, 'PATIENT_NOT_FOUND', 'Patient not found');
  }

  // Create audit log before update
  await req.createAuditLog({
    action: 'UPDATE_VISIT_STATUS',
    resource: 'VISIT',
    resourceId: visit.id,
    before: { status: visit.status },
    after: { status: 'AWAITING_LABORATORY' }
  });

  const updatedVisit = await updateVisitStatus(id, 'AWAITING_LABORATORY');
  
  // Notify lab technicians
  const patientName = `${patient.firstName} ${patient.lastName}`;
  await notifyLabTechniciansOfNewPatient(visit.id, patientName);

  return {
    success: true,
    message: 'Patient sent to laboratory, lab team notified',
    visit: updatedVisit
  };
};

// Mark lab results as available - notifies doctor
export const labResultsAvailable = async (id: string, req: Request) => {
  const visit = await findVisitById(id);
  if (!visit) {
    throw new ApiError(404, 'VISIT_NOT_FOUND', 'Visit not found');
  }

  // Get patient details for notification
  const patient = await findPatientById(visit.patientId);
  if (!patient) {
    throw new ApiError(404, 'PATIENT_NOT_FOUND', 'Patient not found');
  }

  // Create audit log before update
  await req.createAuditLog({
    action: 'UPDATE_VISIT_STATUS',
    resource: 'VISIT',
    resourceId: visit.id,
    before: { status: visit.status },
    after: { status: 'RESULTS_AVAILABLE' }
  });

  const updatedVisit = await updateVisitStatus(id, 'RESULTS_AVAILABLE');
  
  // Notify doctors of available lab results
  const patientName = `${patient.firstName} ${patient.lastName}`;
  await notifyDoctorsOfLabResults(visit.id, patientName);

  return {
    success: true,
    message: 'Lab results marked as available, doctors notified',
    visit: updatedVisit
  };
};

// Send patient to pharmacy
export const sendToPharmacy = async (id: string, req: Request) => {
  const visit = await findVisitById(id);
  if (!visit) {
    throw new ApiError(404, 'VISIT_NOT_FOUND', 'Visit not found');
  }

  // Get patient details for notification
  const patient = await findPatientById(visit.patientId);
  if (!patient) {
    throw new ApiError(404, 'PATIENT_NOT_FOUND', 'Patient not found');
  }

  // Create audit log before update
  await req.createAuditLog({
    action: 'UPDATE_VISIT_STATUS',
    resource: 'VISIT',
    resourceId: visit.id,
    before: { status: visit.status },
    after: { status: 'AWAITING_PHARMACY' }
  });

  const updatedVisit = await updateVisitStatus(id, 'AWAITING_PHARMACY');
  
  // Notify pharmacists
  const patientName = `${patient.firstName} ${patient.lastName}`;
  await notifyPharmacistsOfNewPrescription(visit.id, patientName);

  return {
    success: true,
    message: 'Patient sent to pharmacy, pharmacy team notified',
    visit: updatedVisit
  };
};

// Complete visit after pharmacy dispensing
export const completeVisit = async (id: string, req: Request) => {
  const visit = await findVisitById(id);
  if (!visit) {
    throw new ApiError(404, 'VISIT_NOT_FOUND', 'Visit not found');
  }

  // Create audit log before update
  await req.createAuditLog({
    action: 'UPDATE_VISIT_STATUS',
    resource: 'VISIT',
    resourceId: visit.id,
    before: { status: visit.status },
    after: { status: 'COMPLETED' }
  });

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
  dailyRate: number,
  req?: Request
) => {
  const visit = await findVisitById(id);
  if (!visit) {
    throw new ApiError(404, 'VISIT_NOT_FOUND', 'Visit not found');
  }

  // Get patient details for notification
  const patient = await findPatientById(visit.patientId);
  if (!patient) {
    throw new ApiError(404, 'PATIENT_NOT_FOUND', 'Patient not found');
  }

  // Create audit log before update if request object is available
  if (req) {
    await req.createAuditLog({
      action: 'ADMIT_PATIENT',
      resource: 'VISIT',
      resourceId: visit.id,
      before: { status: visit.status },
      after: { status: 'ADMITTED', ward, bedNumber, expectedDischargeDate }
    });
  }

  const updatedVisit = await admitPatient(
    id, 
    ward, 
    bedNumber, 
    attendingDoctorId, 
    expectedDischargeDate, 
    dailyRate
  );
  
  // Notify ward nurses and attending doctor
  const patientName = `${patient.firstName} ${patient.lastName}`;
  await notifyAdmission(patientName, ward, bedNumber, visit.id);

  return { success: true, message: 'Patient admitted successfully, care team notified', visit: updatedVisit };
};

// Discharge patient service
export const dischargeExistingPatient = async (id: string, req?: Request) => {
  const visit = await findVisitById(id);
  if (!visit) {
    throw new ApiError(404, 'VISIT_NOT_FOUND', 'Visit not found');
  }

  if (!visit.admissionDate) {
    throw new ApiError(400, 'PATIENT_NOT_ADMITTED', 'Cannot discharge patient who was not admitted');
  }

  // Get patient details for notification
  const patient = await findPatientById(visit.patientId);
  if (!patient) {
    throw new ApiError(404, 'PATIENT_NOT_FOUND', 'Patient not found');
  }

  // Create audit log before update if request object is available
  if (req) {
    await req.createAuditLog({
      action: 'DISCHARGE_PATIENT',
      resource: 'VISIT',
      resourceId: visit.id,
      before: { status: visit.status, admissionDate: visit.admissionDate },
      after: { status: 'DISCHARGED', dischargeDate: new Date() }
    });
  }

  const updatedVisit = await dischargePatient(id);
  
  // Notify billing department and ward staff
  const patientName = `${patient.firstName} ${patient.lastName}`;
  await notifyDischarge(patientName, visit.ward, visit.bedNumber, visit.id);

  return { 
    success: true, 
    message: `Patient discharged successfully after ${updatedVisit.stayDuration} days, care team and billing notified`, 
    visit: updatedVisit 
  };
};