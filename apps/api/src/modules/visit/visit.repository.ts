import { prisma } from '../../config/database';
import { Visit, VisitType, VisitStatus } from '@prisma/client';

// Create new visit
export const createVisit = async (
  patientId: string,
  createdBy: string,
  visitType?: VisitType,
  referralNote?: string
): Promise<Visit> => {
  return prisma.visit.create({
    data: {
      patientId,
      createdBy,
      visitType: visitType || VisitType.OUTPATIENT,
      status: VisitStatus.REGISTERED,
      referralNote
    },
    include: {
      patient: {
        select: {
          firstName: true,
          lastName: true,
          patientNumber: true
        }
      }
    }
  });
};

// Find visit by ID
export const findVisitById = async (id: string): Promise<Visit | null> => {
  return prisma.visit.findUnique({
    where: { id },
    include: {
      patient: true,
      vitals: true,
      consultation: true,
      labRequests: true,
      prescriptions: true,
      invoice: true
    }
  });
};

// Get all visits for a patient
export const getPatientVisits = async (
  patientId: string,
  limit: number = 50,
  offset: number = 0
): Promise<{ visits: Visit[]; total: number }> => {
  const [visits, total] = await Promise.all([
    prisma.visit.findMany({
      where: { patientId },
      skip: offset,
      take: limit,
      orderBy: { visitDate: 'desc' },
      include: {
        patient: {
          select: {
            firstName: true,
            lastName: true,
            patientNumber: true
          }
        }
      }
    }),
    prisma.visit.count({ where: { patientId } })
  ]);

  return { visits, total };
};

// Get all visits with filters
export const getAllVisits = async (
  status?: VisitStatus,
  visitType?: VisitType,
  fromDate?: Date,
  toDate?: Date,
  limit: number = 50,
  offset: number = 0
): Promise<{ visits: Visit[]; total: number }> => {
  const where: any = {};
  
  if (status) where.status = status;
  if (visitType) where.visitType = visitType;
  if (fromDate || toDate) {
    where.visitDate = {};
    if (fromDate) where.visitDate.gte = fromDate;
    if (toDate) where.visitDate.lte = toDate;
  }

  const [visits, total] = await Promise.all([
    prisma.visit.findMany({
      where,
      skip: offset,
      take: limit,
      orderBy: { visitDate: 'desc' },
      include: {
        patient: {
          select: {
            firstName: true,
            lastName: true,
            patientNumber: true
          }
        }
      }
    }),
    prisma.visit.count({ where })
  ]);

  return { visits, total };
};

// Update visit status
export const updateVisitStatus = async (
  id: string,
  status: VisitStatus
): Promise<Visit> => {
  return prisma.visit.update({
    where: { id },
    data: { status }
  });
};

// Admit patient (for inpatient stays)
export const admitPatient = async (
  id: string,
  ward: string,
  bedNumber: string,
  attendingDoctorId: string,
  expectedDischargeDate: Date,
  dailyRate: number
): Promise<Visit> => {
  // Mark bed as occupied
  await prisma.bed.updateMany({
    where: { wardId: ward, bedNumber: bedNumber, isOccupied: false },
    data: { isOccupied: true, status: 'OCCUPIED' }
  });

  return prisma.visit.update({
    where: { id },
    data: {
      admissionDate: new Date(),
      ward,
      bedNumber,
      attendingDoctorId,
      expectedDischargeDate,
      dailyRate,
      status: VisitStatus.ADMITTED
    }
  });
};

// Discharge patient (calculate stay duration and finalize)
export const dischargePatient = async (id: string): Promise<Visit> => {
  const visit = await prisma.visit.findUnique({ where: { id } });
  
  if (!visit || !visit.admissionDate) {
    throw new Error('Cannot discharge patient who was not admitted');
  }

  // Free up the bed
  if (visit.ward && visit.bedNumber) {
    await prisma.bed.updateMany({
      where: { wardId: visit.ward, bedNumber: visit.bedNumber },
      data: { isOccupied: false, status: 'AVAILABLE' }
    });
  }

  // Calculate stay duration in days
  const admission = new Date(visit.admissionDate);
  const discharge = new Date();
  const stayDuration = Math.ceil((discharge.getTime() - admission.getTime()) / (1000 * 60 * 60 * 24));

  return prisma.visit.update({
    where: { id },
    data: {
      dischargeDate: discharge,
      stayDuration: stayDuration,
      status: VisitStatus.COMPLETED
    }
  });
};

// Get active visits queue
export const getActiveVisitsQueue = async (): Promise<Visit[]> => {
  return prisma.visit.findMany({
    where: {
      status: {
        notIn: [VisitStatus.COMPLETED, VisitStatus.CANCELLED]
      }
    },
    orderBy: [
      // Emergency cases first
      { status: { desc: 'ASC' } },
      { visitDate: 'asc' }
    ],
    include: {
      patient: {
        select: {
          firstName: true,
          lastName: true,
          patientNumber: true
        }
      }
    }
  });
};

// Update visit with emergency triage
export const setEmergencyStatus = async (
  id: string,
  triageLevel: string,
  emergencyNotes?: string
): Promise<Visit> => {
  return prisma.visit.update({
    where: { id },
    data: {
      status: VisitStatus.EMERGENCY,
      triageLevel,
      emergencyNotes,
      visitType: VisitType.EMERGENCY
    }
  });
};

// Update visit with maternity routing
export const setMaternityStatus = async (id: string): Promise<Visit> => {
  return prisma.visit.update({
    where: { id },
    data: {
      status: VisitStatus.MATERNITY,
      visitType: VisitType.ANC
    }
  });
};

// Get ward occupancy statistics
export const getWardOccupancy = async () => {
  const wards = await prisma.ward.findMany({
    include: {
      beds: true
    }
  });

  return wards.map((ward: any) => ({
    ...ward,
    occupiedBeds: ward.beds.filter((bed: any) => bed.isOccupied).length,
    availableBeds: ward.beds.filter((bed: any) => bed.status === 'AVAILABLE').length,
    totalBeds: ward.totalBeds
  }));
};

// Get patients waiting for consultation
export const getWaitingConsultationQueue = async (): Promise<Visit[]> => {
  return prisma.visit.findMany({
    where: {
      status: VisitStatus.WAITING_FOR_CONSULTATION
    },
    orderBy: { visitDate: 'asc' },
    include: {
      patient: {
        select: {
          firstName: true,
          lastName: true,
          patientNumber: true
        }
      }
    }
  });
};

// Get pending lab tests
export const getPendingLabTests = async (): Promise<Visit[]> => {
  return prisma.visit.findMany({
    where: {
      status: VisitStatus.AWAITING_LABORATORY
    },
    include: {
      patient: true,
      labRequests: {
        include: { items: { include: { test: true } } }
      }
    }
  });
};

// Get pending prescriptions
export const getPendingPrescriptions = async (): Promise<Visit[]> => {
  return prisma.visit.findMany({
    where: {
      status: VisitStatus.AWAITING_PHARMACY
    },
    include: {
      patient: true,
      prescriptions: {
        where: { status: 'PENDING' },
        include: { items: { include: { medicine: true } } }
      }
    }
  });
};

// Get current admissions
export const getCurrentAdmissions = async (): Promise<Visit[]> => {
  return prisma.visit.findMany({
    where: {
      status: VisitStatus.ADMITTED
    },
    include: {
      patient: true
    }
  });
};