import {
  createPrescription as createPrescriptionRepo,
  getPrescriptionById as getPrescriptionByIdRepo,
  getPrescriptionsByPatient as getPrescriptionsByPatientRepo,
  getPrescriptionsByVisit as getPrescriptionsByVisitRepo,
  getAllPrescriptions as listAllPrescriptionsRepo,
  updatePrescriptionStatus as updatePrescriptionStatusRepo,
  deletePrescription as deletePrescriptionRepo,
  getPendingPrescriptionsQueue as fetchPendingPrescriptionsQueueRepo,
  dispensePrescriptionAndDeductStock as dispensePrescriptionRepo,
} from './prescription.repository';
import type {
  CreatePrescriptionInput,
  UpdatePrescriptionStatusInput,
} from './prescription.validator';

export const createNewPrescription = async (data: CreatePrescriptionInput) => {
  return createPrescriptionRepo(data);
};

export const getPrescription = async (id: string) => {
  return getPrescriptionByIdRepo(id);
};

export const getPatientPrescriptions = async (patientId: string, limit?: number, offset?: number) => {
  return getPrescriptionsByPatientRepo(patientId, limit, offset);
};

export const getVisitPrescriptions = async (visitId: string, limit?: number, offset?: number) => {
  return getPrescriptionsByVisitRepo(visitId, limit, offset);
};

export const listAllPrescriptions = async (status?: string, limit?: number, offset?: number) => {
  return listAllPrescriptionsRepo(status, limit, offset);
};

export const updatePrescriptionStatusService = async (
  id: string,
  { status, dispensedBy, notes }: UpdatePrescriptionStatusInput
) => {
  return updatePrescriptionStatusRepo(id, status, dispensedBy, notes);
};

export const deletePrescriptionService = async (id: string) => {
  return deletePrescriptionRepo(id);
};

export const fetchPendingPrescriptionsQueue = async () => {
  return fetchPendingPrescriptionsQueueRepo();
};

export const dispensePrescription = async (id: string, dispensedBy: string) => {
  return dispensePrescriptionRepo(id, dispensedBy);
};
