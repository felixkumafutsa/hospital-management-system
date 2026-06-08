import {
  createPatient,
  findPatientById,
  findPatientByNumber,
  findPatientByNationalId,
  searchPatients,
  getAllPatients,
  updatePatient,
  deactivatePatient
} from './patient.repository';
import { ApiError } from '../../middlewares/errorHandler';
import { CreatePatientInput, UpdatePatientInput } from './patient.validator';

// Create new patient service
export const createNewPatient = async (data: CreatePatientInput) => {
  try {
    console.log('🏥 Processing patient creation in service:', JSON.stringify(data, null, 2));
    
    // Check if national ID already exists if provided
    if (data.nationalId && data.nationalId.trim() !== '') {
      const existingPatient = await findPatientByNationalId(data.nationalId);
      if (existingPatient) {
        throw new ApiError(409, 'PATIENT_EXISTS', 'Patient with this national ID already exists');
      }
    }

    // Convert undefined or empty string optional fields to null for Prisma compatibility
    const patientData = {
      ...data,
      isActive: true,
      nationalId: data.nationalId && data.nationalId.trim() !== '' ? data.nationalId : null,
      email: data.email && data.email.trim() !== '' ? data.email : null,
      address: data.address && data.address.trim() !== '' ? data.address : null,
      nextOfKinName: data.nextOfKinName && data.nextOfKinName.trim() !== '' ? data.nextOfKinName : null,
      nextOfKinPhone: data.nextOfKinPhone && data.nextOfKinPhone.trim() !== '' ? data.nextOfKinPhone : null,
      nextOfKinRelation: data.nextOfKinRelation && data.nextOfKinRelation.trim() !== '' ? data.nextOfKinRelation : null,
      bloodGroup: data.bloodGroup && data.bloodGroup.trim() !== '' ? data.bloodGroup : null,
      insuranceProvider: data.insuranceProvider && data.insuranceProvider.trim() !== '' ? data.insuranceProvider : null,
      insuranceNumber: data.insuranceNumber && data.insuranceNumber.trim() !== '' ? data.insuranceNumber : null,
      photoUrl: data.photoUrl && data.photoUrl.trim() !== '' ? data.photoUrl : null
    };
    
    console.log('📦 Cleaned patient data for Prisma:', JSON.stringify(patientData, null, 2));
    
    const patient = await createPatient(patientData);
    console.log('✅ Patient created successfully:', patient.id);
    return { success: true, patient };
  } catch (error) {
    console.error('❌ Error in createNewPatient service:', error);
    throw error;
  }
};

// Get patient by ID service
export const getPatientById = async (id: string) => {
  const patient = await findPatientById(id);
  if (!patient) {
    throw new ApiError(404, 'PATIENT_NOT_FOUND', 'Patient not found');
  }
  return { success: true, patient };
};

// Get patient by number service
export const getPatientByNumber = async (patientNumber: string) => {
  const patient = await findPatientByNumber(patientNumber);
  if (!patient) {
    throw new ApiError(404, 'PATIENT_NOT_FOUND', 'Patient not found');
  }
  return { success: true, patient };
};

// Search patients service
export const searchForPatients = async (query: string, limit?: number, offset?: number) => {
  const result = await searchPatients(query, limit, offset);
  return { success: true, ...result };
};

// Get all patients service
export const fetchAllPatients = async (limit?: number, offset?: number) => {
  const result = await getAllPatients(limit, offset);
  return { success: true, ...result };
};

// Update patient service
export const updateExistingPatient = async (id: string, data: UpdatePatientInput) => {
  // Check if patient exists
  const existingPatient = await findPatientById(id);
  if (!existingPatient) {
    throw new ApiError(404, 'PATIENT_NOT_FOUND', 'Patient not found');
  }

  // Check if national ID is being updated and if it's already in use
  if (data.nationalId && data.nationalId !== existingPatient.nationalId) {
    const patientWithNationalId = await findPatientByNationalId(data.nationalId);
    if (patientWithNationalId && patientWithNationalId.id !== id) {
      throw new ApiError(409, 'PATIENT_EXISTS', 'Another patient with this national ID already exists');
    }
  }

  const updatedPatient = await updatePatient(id, data);
  return { success: true, patient: updatedPatient };
};

// Deactivate patient service
export const deactivateExistingPatient = async (id: string) => {
  const patient = await findPatientById(id);
  if (!patient) {
    throw new ApiError(404, 'PATIENT_NOT_FOUND', 'Patient not found');
  }

  await deactivatePatient(id);
  return { success: true, message: 'Patient deactivated successfully' };
};