import { prisma } from '../../config/database';
import { Patient } from '@prisma/client';

// Generate patient number (BL-YYYY-000001)
const generatePatientNumber = async (): Promise<string> => {
  const currentYear = new Date().getFullYear();
  
  // Find the last patient with this year's prefix
  const lastPatient = await prisma.patient.findFirst({
    where: {
      patientNumber: {
        startsWith: `BL-${currentYear}-`
      }
    },
    orderBy: {
      patientNumber: 'desc'
    }
  });

  let sequenceNumber = 1;
  if (lastPatient) {
    const lastSequence = parseInt(lastPatient.patientNumber.split('-')[2], 10);
    sequenceNumber = lastSequence + 1;
  }

  return `BL-${currentYear}-${sequenceNumber.toString().padStart(6, '0')}`;
};

// Create new patient
export const createPatient = async (
  patientData: Omit<Patient, 'id' | 'patientNumber' | 'createdAt' | 'updatedAt'>
): Promise<Patient> => {
  const patientNumber = await generatePatientNumber();
  
  // Convert empty strings to null for optional fields to comply with Prisma schema
  const cleanedData = {
    ...patientData,
    nationalId: patientData.nationalId && patientData.nationalId.trim() !== '' ? patientData.nationalId : null,
    email: patientData.email && patientData.email.trim() !== '' ? patientData.email : null,
    address: patientData.address && patientData.address.trim() !== '' ? patientData.address : null,
    nextOfKinName: patientData.nextOfKinName && patientData.nextOfKinName.trim() !== '' ? patientData.nextOfKinName : null,
    nextOfKinPhone: patientData.nextOfKinPhone && patientData.nextOfKinPhone.trim() !== '' ? patientData.nextOfKinPhone : null,
    nextOfKinRelation: patientData.nextOfKinRelation && patientData.nextOfKinRelation.trim() !== '' ? patientData.nextOfKinRelation : null,
    bloodGroup: patientData.bloodGroup && patientData.bloodGroup.trim() !== '' ? patientData.bloodGroup : null,
    insuranceProvider: patientData.insuranceProvider && patientData.insuranceProvider.trim() !== '' ? patientData.insuranceProvider : null,
    insuranceNumber: patientData.insuranceNumber && patientData.insuranceNumber.trim() !== '' ? patientData.insuranceNumber : null,
    photoUrl: patientData.photoUrl && patientData.photoUrl.trim() !== '' ? patientData.photoUrl : null,
  };
  
  return prisma.patient.create({
    data: {
      ...cleanedData,
      patientNumber
    }
  });
};

// Find patient by ID
export const findPatientById = async (id: string): Promise<Patient | null> => {
  return prisma.patient.findUnique({
    where: { id }
  });
};

// Find patient by patient number
export const findPatientByNumber = async (patientNumber: string): Promise<Patient | null> => {
  return prisma.patient.findUnique({
    where: { patientNumber }
  });
};

// Find patient by national ID
export const findPatientByNationalId = async (nationalId: string): Promise<Patient | null> => {
  return prisma.patient.findUnique({
    where: { nationalId }
  });
};

// Search patients by name or patient number
export const searchPatients = async (
  query: string,
  limit: number = 50,
  offset: number = 0
): Promise<{ patients: Patient[]; total: number }> => {
  const where = {
    OR: [
      {
        firstName: {
          contains: query,
          mode: 'insensitive' as const
        }
      },
      {
        lastName: {
          contains: query,
          mode: 'insensitive' as const
        }
      },
      {
        patientNumber: {
          contains: query,
          mode: 'insensitive' as const
        }
      }
    ]
  };

  const [patients, total] = await Promise.all([
    prisma.patient.findMany({
      where,
      skip: offset,
      take: limit,
      orderBy: {
        createdAt: 'desc'
      }
    }),
    prisma.patient.count({ where })
  ]);

  return { patients, total };
};

// Get all patients with pagination
export const getAllPatients = async (
  limit: number = 50,
  offset: number = 0
): Promise<{ patients: Patient[]; total: number }> => {
  const [patients, total] = await Promise.all([
    prisma.patient.findMany({
      skip: offset,
      take: limit,
      orderBy: {
        createdAt: 'desc'
      }
    }),
    prisma.patient.count()
  ]);

  return { patients, total };
};

// Update patient
export const updatePatient = async (
  id: string,
  patientData: Partial<Omit<Patient, 'id' | 'patientNumber' | 'createdAt' | 'updatedAt'>>
): Promise<Patient> => {
  // Convert empty strings to null for optional fields
  const cleanedData = {
    ...patientData,
    nationalId: patientData.nationalId && patientData.nationalId.trim() !== '' ? patientData.nationalId : null,
    email: patientData.email && patientData.email.trim() !== '' ? patientData.email : null,
    address: patientData.address && patientData.address.trim() !== '' ? patientData.address : null,
    nextOfKinName: patientData.nextOfKinName && patientData.nextOfKinName.trim() !== '' ? patientData.nextOfKinName : null,
    nextOfKinPhone: patientData.nextOfKinPhone && patientData.nextOfKinPhone.trim() !== '' ? patientData.nextOfKinPhone : null,
    nextOfKinRelation: patientData.nextOfKinRelation && patientData.nextOfKinRelation.trim() !== '' ? patientData.nextOfKinRelation : null,
    bloodGroup: patientData.bloodGroup && patientData.bloodGroup.trim() !== '' ? patientData.bloodGroup : null,
    insuranceProvider: patientData.insuranceProvider && patientData.insuranceProvider.trim() !== '' ? patientData.insuranceProvider : null,
    insuranceNumber: patientData.insuranceNumber && patientData.insuranceNumber.trim() !== '' ? patientData.insuranceNumber : null,
    photoUrl: patientData.photoUrl && patientData.photoUrl.trim() !== '' ? patientData.photoUrl : null,
  };
  
  return prisma.patient.update({
    where: { id },
    data: cleanedData
  });
};

// Soft delete patient (mark as inactive)
export const deactivatePatient = async (id: string): Promise<Patient> => {
  return prisma.patient.update({
    where: { id },
    data: { isActive: false }
  });
};