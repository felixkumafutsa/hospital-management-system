import { 
  createAncRecord,
  findAncRecordById,
  findAncRecordsByPatient,
  getAllAncRecords,
  updateAncRecord,
  createDeliveryRecord,
  findDeliveryRecordById,
  findDeliveryRecordsByPatient,
  getAllDeliveryRecords,
  createPostnatalRecord,
  findPostnatalRecordById,
  findPostnatalRecordsByPatient,
  getAllPostnatalRecords,
  getMaternityStats
} from './maternity.repository';
import { ApiError } from '../../middlewares/errorHandler';
import type { 
  CreateAncInput, 
  CreateDeliveryInput, 
  CreatePostnatalInput
} from '@packages/types';
// Keep the ListMaternityRecordsInput import from local validator
import { ListMaternityRecordsInput } from './maternity.validator';
// ANC Service functions
export const addAncRecord = async (data: CreateAncInput, userId: string) => {
  const record = await createAncRecord({
    ...data,
    recordedBy: userId
  });
  
  return record;
};

export const getAncRecord = async (id: string) => {
  const record = await findAncRecordById(id);
  if (!record) {
    throw new ApiError(404,'ANC record not found', 'NOT_FOUND');
  }
  return record;
};

export const getAncRecordsForPatient = async (patientId: string) => {
  return findAncRecordsByPatient(patientId);
};

export const listAncRecords = async (input: ListMaternityRecordsInput) => {
  const page = input.page || 1;
  const limit = input.limit || 20;
  const skip = (page - 1) * limit;
  
  const { records, total } = await getAllAncRecords(skip, limit);
  
  return {
    records,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1
    }
  };
};

export const updateAnc = async (id: string, data: Partial<CreateAncInput>) => {
  const existing = await findAncRecordById(id);
  if (!existing) {
    throw new ApiError(404,'ANC record not found', 'NOT_FOUND');
  }
  
  return updateAncRecord(id, data);
};

// Delivery Service functions
export const addDeliveryRecord = async (data: CreateDeliveryInput, userId: string) => {
  const record = await createDeliveryRecord({
    ...data,
    attendedBy: userId
  });
  
  return record;
};

export const getDeliveryRecord = async (id: string) => {
  const record = await findDeliveryRecordById(id);
  if (!record) {
    throw new ApiError(404,'Delivery record not found', 'NOT_FOUND');
  }
  return record;
};

export const getDeliveryRecordsForPatient = async (patientId: string) => {
  return findDeliveryRecordsByPatient(patientId);
};

export const listDeliveryRecords = async (input: ListMaternityRecordsInput) => {
  const page = input.page || 1;
  const limit = input.limit || 20;
  const skip = (page - 1) * limit;
  
  const { records, total } = await getAllDeliveryRecords(skip, limit);
  
  return {
    records,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1
    }
  };
};

// Postnatal Service functions
export const addPostnatalRecord = async (data: CreatePostnatalInput, userId: string) => {
  const record = await createPostnatalRecord({
    ...data,
    recordedBy: userId
  });
  
  return record;
};

export const getPostnatalRecord = async (id: string) => {
  const record = await findPostnatalRecordById(id);
  if (!record) {
    throw new ApiError(404,'Postnatal record not found', 'NOT_FOUND');
  }
  return record;
};

export const getPostnatalRecordsForPatient = async (patientId: string) => {
  return findPostnatalRecordsByPatient(patientId);
};

export const listPostnatalRecords = async (input: ListMaternityRecordsInput) => {
  const page = input.page || 1;
  const limit = input.limit || 20;
  const skip = (page - 1) * limit;
  
  const { records, total } = await getAllPostnatalRecords(skip, limit);
  
  return {
    records,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1
    }
  };
};

// Dashboard statistics
export const getMaternityDashboardStats = async () => {
  return getMaternityStats();
};
