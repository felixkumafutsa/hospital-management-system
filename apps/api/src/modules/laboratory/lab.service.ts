import {
  createLabTest as createLabTestRepo,
  updateLabTestPrice as updateLabTestPriceRepo,
  getLabTestById as getLabTestByIdRepo,
  getAllLabTests as getAllLabTestsRepo,
  createLabRequest as createLabRequestRepo,
  getLabRequestById as getLabRequestByIdRepo,
  getLabRequestsByPatient as getLabRequestsByPatientRepo,
  getLabRequestsByVisit as getLabRequestsByVisitRepo,
  getAllLabRequests as listAllLabRequestsRepo,
  updateLabRequestStatus as updateLabRequestStatusRepo,
  addLabResult as addLabResultRepo,
  getLabDashboardStats as getLabDashboardStatsRepo,
} from './lab.repository';
import type {
  AddLabResultInput,
  CreateLabRequestInput,
  CreateLabTestInput,
  UpdateLabRequestStatusInput,
} from './lab.validator';

export const createNewLabTest = async (data: CreateLabTestInput) => {
  return createLabTestRepo(data);
};

export const updateLabTestPrice = async (id: string, price: number) => {
  return updateLabTestPriceRepo(id, price);
};

export const getLabTest = async (id: string) => {
  return getLabTestByIdRepo(id);
};

export const listAllLabTests = async (limit?: number, offset?: number) => {
  return getAllLabTestsRepo(limit, offset);
};

export const createNewLabRequest = async (
  data: CreateLabRequestInput & { requestedBy: string }
) => {
  return createLabRequestRepo(data);
};

export const getLabRequest = async (id: string) => {
  return getLabRequestByIdRepo(id);
};

export const getPatientLabRequests = async (patientId: string, limit?: number, offset?: number) => {
  return getLabRequestsByPatientRepo(patientId, limit, offset);
};

export const getVisitLabRequests = async (visitId: string, limit?: number, offset?: number) => {
  return getLabRequestsByVisitRepo(visitId, limit, offset);
};

export const listAllLabRequests = async (status?: string, limit?: number, offset?: number) => {
  return listAllLabRequestsRepo(status, limit, offset);
};

export const getLabDashboardStats = async () => getLabDashboardStatsRepo();

export const updateLabRequestStatusService = async (
  id: string,
  { status, notes }: UpdateLabRequestStatusInput
) => {
  return updateLabRequestStatusRepo(id, status, notes);
};

export const addLabResultService = async (
  requestId: string,
  testId: string,
  results: Omit<AddLabResultInput, 'testId'>
) => {
  return addLabResultRepo(requestId, testId, results);
};
