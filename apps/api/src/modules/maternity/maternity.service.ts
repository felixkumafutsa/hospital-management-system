import {
  createAncRecord,
  findAncRecordById,
  findAncRecordsByMaternityProfile,
  getAllAncRecords,
  updateAncRecord,
  createDeliveryRecord,
  findDeliveryRecordById,
  findDeliveryRecordsByMaternityProfile,
  getAllDeliveryRecords,
  createPostnatalRecord,
  findPostnatalRecordById,
  findPostnatalRecordsByMaternityProfile,
  getAllPostnatalRecords,
  getMaternityStats,
  findMaternityProfileByPatientId,
  findMaternityRecordsByPatientId,
  createMaternityProfile,
  updateMaternityProfile,
  createMaternityVisit,
  completeMaternityVisit,
  findCompletedTheaterVisitForProfile,
} from './maternity.repository';
import { ApiError } from '../../middlewares/errorHandler';
import { VisitType } from '@prisma/client';
import { appendVisitInvoiceItem } from '../billing/billing.service';
import { getConsultationFee } from '../settings/settings.repository';
import type {
  CreateAncInput,
  CreateDeliveryInput,
  CreatePostnatalInput
} from '@packages/types';
// Keep the ListMaternityRecordsInput import from local validator
import { ListMaternityRecordsInput } from './maternity.validator';

const getOrCreateMaternityProfile = async (patientId: string) => {
  const profile = await findMaternityProfileByPatientId(patientId);
  return profile ?? createMaternityProfile({ patientId });
};

// ANC Service functions
export const addAncRecord = async (data: CreateAncInput, userId: string) => {
  if (!data.patientId) {
    throw new ApiError(400, 'Patient ID is required', 'BAD_REQUEST');
  }

  const maternityProfile = await getOrCreateMaternityProfile(data.patientId);
  const visit = await createMaternityVisit(
    data.patientId,
    userId,
    VisitType.ANC,
    'Antenatal care visit'
  );

  if (data.lastMenstrualPeriod) {
    const lastMenstrualPeriod = new Date(data.lastMenstrualPeriod);
    const estimatedDueDate = new Date(lastMenstrualPeriod);
    estimatedDueDate.setDate(estimatedDueDate.getDate() + 280);
    await updateMaternityProfile(maternityProfile.id, {
      lastMenstrualPeriod,
      estimatedDueDate,
      gravida: data.gravida,
      parity: data.parity,
    });
  }

  const { patientId, lastMenstrualPeriod: _lmp, gravida: _gravida, parity: _parity, ...ancData } = data;

  const record = await createAncRecord({
    ...ancData,
    recordedBy: userId,
    maternityProfileId: maternityProfile.id,
    visitId: visit.id,
  });

  const consultationFee = await getConsultationFee();
  if (consultationFee != null && consultationFee > 0) {
    await appendVisitInvoiceItem(visit.id, {
      description: 'Antenatal care consultation',
      category: 'CONSULTATION',
      quantity: 1,
      unitPrice: consultationFee,
      reference: record.id,
    });
  }
  await completeMaternityVisit(visit.id);
  return record;
};

export const getAncRecord = async (id: string) => {
  const record = await findAncRecordById(id);
  if (!record) {
    throw new ApiError(404,'ANC record not found', 'NOT_FOUND');
  }
  return record;
};

export const getAncRecordsForMaternityProfile = async (patientId: string) => {
  const maternityProfile = await findMaternityProfileByPatientId(patientId);
  if (!maternityProfile) {
    throw new ApiError(404, 'Maternity profile not found', 'NOT_FOUND');
  }
  return findAncRecordsByMaternityProfile(maternityProfile.id);
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
  const maternityProfile = await findMaternityProfileByPatientId(data.patientId);
  if (!maternityProfile) {
    throw new ApiError(404, 'Active maternity profile not found', 'NOT_FOUND');
  }

  const { patientId, ...deliveryData } = data;
  const completedTheaterCase = data.deliveryMethod === 'CAESAREAN'
    ? await findCompletedTheaterVisitForProfile(maternityProfile.id)
    : null;
  if (data.deliveryMethod === 'CAESAREAN' && !completedTheaterCase) {
    throw new ApiError(409, 'Complete the caesarean theater case before recording delivery', 'THEATER_CASE_NOT_COMPLETED');
  }
  const visitId = completedTheaterCase?.visitId ?? (await createMaternityVisit(
    patientId,
    userId,
    VisitType.DELIVERY,
    'Maternity delivery'
  )).id;

  const record = await createDeliveryRecord({
    ...deliveryData,
    attendedBy: userId,
    maternityProfileId: maternityProfile.id,
    visitId,
  });
  await updateMaternityProfile(maternityProfile.id, { status: 'DELIVERED' });
  await completeMaternityVisit(visitId);
  return record;
};

export const getDeliveryRecord = async (id: string) => {
  const record = await findDeliveryRecordById(id);
  if (!record) {
    throw new ApiError(404,'Delivery record not found', 'NOT_FOUND');
  }
  return record;
};

export const getDeliveryRecordsForMaternityProfile = async (patientId: string) => {
  const maternityProfile = await findMaternityProfileByPatientId(patientId);
  if (!maternityProfile) {
    throw new ApiError(404, 'Maternity profile not found', 'NOT_FOUND');
  }
  return findDeliveryRecordsByMaternityProfile(maternityProfile.id);
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
  const deliveryRecord = await findDeliveryRecordById(data.deliveryId);
  if (!deliveryRecord || deliveryRecord.maternityProfile.patientId !== data.patientId) {
    throw new ApiError(404, 'Delivery record not found for this patient', 'NOT_FOUND');
  }

  const { patientId, ...postnatalData } = data;
  const visit = await createMaternityVisit(
    patientId,
    userId,
    VisitType.POSTNATAL,
    'Postnatal care visit'
  );

  const record = await createPostnatalRecord({
    ...postnatalData,
    recordedBy: userId,
    maternityProfileId: deliveryRecord.maternityProfileId,
    visitId: visit.id,
  });
  await completeMaternityVisit(visit.id);
  return record;
};

export const getPostnatalRecord = async (id: string) => {
  const record = await findPostnatalRecordById(id);
  if (!record) {
    throw new ApiError(404,'Postnatal record not found', 'NOT_FOUND');
  }
  return record;
};

export const getPostnatalRecordsForMaternityProfile = async (patientId: string) => {
  const maternityProfile = await findMaternityProfileByPatientId(patientId);
  if (!maternityProfile) {
    throw new ApiError(404, 'Maternity profile not found', 'NOT_FOUND');
  }
  return findPostnatalRecordsByMaternityProfile(maternityProfile.id);
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

// Add a new function to mark an ANC record as delivered and create a delivery record
export const markAncAsDelivered = async (ancId: string, userId: string, deliveryData: Partial<CreateDeliveryInput>) => {
  // First find the ANC record to get the patient and maternity profile
  const ancRecord = await findAncRecordById(ancId);
  if (!ancRecord) {
    throw new ApiError(404, 'ANC record not found', 'NOT_FOUND');
  }

  // Validate required delivery data - these are guaranteed to exist after this check
  if (!deliveryData.deliveryDate || !deliveryData.deliveryMethod) {
    throw new ApiError(400, 'Delivery date and method are required', 'BAD_REQUEST');
  }

  // Create the delivery record linked to this maternity profile
  // Explicitly pass only the fields that createDeliveryRecord accepts
  const deliveryRecord = await addDeliveryRecord({
    patientId: ancRecord.maternityProfile.patientId,
    deliveryDate: deliveryData.deliveryDate,
    deliveryMethod: deliveryData.deliveryMethod,
    gestationWeeks: deliveryData.gestationWeeks,
    babyWeightKg: deliveryData.babyWeightKg,
    babyGender: deliveryData.babyGender,
    apgarScore1Min: deliveryData.apgarScore1Min,
    apgarScore5Min: deliveryData.apgarScore5Min,
    complications: deliveryData.complications,
    notes: deliveryData.notes,
  }, userId);

  return {
    ancRecord,
    deliveryRecord,
    message: 'Pregnancy marked as delivered successfully'
  };
};

// Missing functions that controller imports
export const getMaternityDashboardStats = async () => {
  return getMaternityStats();
};

export const getPatientMaternityRecords = async (patientId: string) => {
  const records = await findMaternityRecordsByPatientId(patientId);
  if (!records) {
    throw new ApiError(404, 'Maternity records not found for this patient', 'NOT_FOUND');
  }
  return records;
};