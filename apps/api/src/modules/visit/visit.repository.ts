import { prisma } from '../../config/database';
import { Visit, VisitType, VisitStatus, TriageLevel, Ward, Bed } from '@prisma/client';
import { randomUUID } from 'crypto';




// Prisma query filter for visits
interface VisitWhereInput {
  patientId?: string;
  status?: VisitStatus;
  visitType?: VisitType;
  visitDate?: {
    gte?: Date;
    lte?: Date;
  };
}

// Create new visit
export const createVisit = async (
  patientId: string,
  createdBy: string,
  visitType?: VisitType,
  referralNote?: string,
  reasonForVisit?: string,
  triageLevel?: TriageLevel,
  emergencyNotes?: string
): Promise<Visit> => {
  return prisma.visit.create({
    data: {
      patientId,
      createdBy,
      visitType: visitType || VisitType.OUTPATIENT,
      status: VisitStatus.REGISTERED,
      referralNote,
      reasonForVisit,
      triageLevel,
      emergencyNotes,
      invoice: {
        create: {
          invoiceNo: `INV-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${randomUUID()}`,
          patient: { connect: { id: patientId } },
          subtotal: 0,
          discount: 0,
          total: 0,
          balance: 0,
          paidAmount: 0,
        },
      },
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
        },
        consultation: {
          include: {
            doctor: { select: { firstName: true, lastName: true } },
          },
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
  offset: number = 0,
  patientId?: string
): Promise<{ visits: Visit[]; total: number }> => {
  const where: VisitWhereInput = {};
  
  if (patientId) where.patientId = patientId;
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
        },
        consultation: {
          include: {
            doctor: { select: { firstName: true, lastName: true } },
          },
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
  const wardRecord = await prisma.ward.findFirst({
    where: { OR: [{ id: ward }, { name: ward }] },
  });
  if (wardRecord) {
    await prisma.bed.updateMany({
      where: { wardId: wardRecord.id, bedNumber: bedNumber },
      data: { isOccupied: true, status: 'OCCUPIED' }
    });
  }

  return prisma.visit.update({
    where: { id },
    data: {
      admissionDate: new Date(),
      ward: wardRecord?.name || ward,
      bedNumber,
      attendingDoctorId,
      expectedDischargeDate,
      dailyRate,
      status: VisitStatus.ADMITTED,
      visitType: VisitType.INPATIENT,
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
    const wardRecord = await prisma.ward.findFirst({
      where: { OR: [{ id: visit.ward }, { name: visit.ward }] },
    });
    if (wardRecord) {
      await prisma.bed.updateMany({
        where: { wardId: wardRecord.id, bedNumber: visit.bedNumber },
        data: { isOccupied: false, status: 'AVAILABLE' }
      });
    }
  }

  // Calculate stay duration in days (minimum 1 day)
  const admission = new Date(visit.admissionDate);
  const discharge = new Date();
  const stayDuration = Math.max(1, Math.ceil((discharge.getTime() - admission.getTime()) / (1000 * 60 * 60 * 24)));

  return prisma.visit.update({
    where: { id },
    data: {
      dischargeDate: discharge,
      stayDuration: stayDuration,
      status: VisitStatus.COMPLETED
    }
  });
};

// Find active (non-completed) visit for a patient
export const findActiveVisitByPatientId = async (patientId: string): Promise<Visit | null> => {
  return prisma.visit.findFirst({
    where: {
      patientId,
      status: {
        notIn: [VisitStatus.COMPLETED, VisitStatus.CANCELLED]
      }
    },
    orderBy: { visitDate: 'desc' },
    include: {
      patient: true
    }
  });
};

// Get active visits queue
export const getActiveVisitsQueue = async (doctorId?: string): Promise<Visit[]> => {
  const visits = await prisma.visit.findMany({
    where: {
      status: {
        notIn: [VisitStatus.COMPLETED, VisitStatus.CANCELLED]
      },
      ...(doctorId && {
        OR: [
          { appointments: { some: { doctorId } } },
          { status: VisitStatus.EMERGENCY },
        ],
      }),
    },
    orderBy: { visitDate: 'asc' },
    include: {
      patient: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          patientNumber: true
        }
      },
      appointments: {
        include: {
          doctor: { select: { id: true, firstName: true, lastName: true } },
        },
      },
    }
  });
  const triageOrder: Record<string, number> = {
    CRITICAL: 0,
    HIGH: 1,
    MEDIUM: 2,
    LOW: 3,
  };
  return visits.sort((left, right) => {
    if (left.status === VisitStatus.EMERGENCY && right.status !== VisitStatus.EMERGENCY) return -1;
    if (right.status === VisitStatus.EMERGENCY && left.status !== VisitStatus.EMERGENCY) return 1;
    const priorityDifference =
      (left.triageLevel ? triageOrder[left.triageLevel] : 4) -
      (right.triageLevel ? triageOrder[right.triageLevel] : 4);
    return priorityDifference || left.visitDate.getTime() - right.visitDate.getTime();
  });
};

// Update visit with emergency triage
export const setEmergencyStatus = async (
  id: string,
  triageLevel: TriageLevel,
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

  return wards.map((ward: Ward & { beds: Bed[] }) => ({
    ...ward,
    occupiedBeds: ward.beds.filter((bed: Bed) => bed.isOccupied).length,
    availableBeds: ward.beds.filter((bed: Bed) => bed.status === 'AVAILABLE').length,
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

export const getCurrentAdmissions = async () => {
  const admissions = await prisma.visit.findMany({
    where: {
      status: VisitStatus.ADMITTED
    },
    orderBy: { admissionDate: 'desc' },
    include: {
      patient: true,
      vitals: {
        orderBy: { recordedAt: 'desc' },
        take: 1
      }
    }
  });

  const [wards] = await Promise.all([
    prisma.ward.findMany({ include: { beds: true } }),
  ]);

  const wardMap = new Map(wards.map(w => [w.id, w]));

  const doctorIds = Array.from(new Set(admissions.map(a => a.attendingDoctorId).filter(Boolean))) as string[];
  const doctors = doctorIds.length > 0
    ? await prisma.user.findMany({
        where: { id: { in: doctorIds } },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          role: { select: { displayName: true } }
        }
      })
    : [];
  const doctorMap = new Map(doctors.map(d => [d.id, { ...d, specialty: d.role.displayName }]));

  const now = new Date();

  return admissions.map(a => {
    const admissionDate = a.admissionDate ? new Date(a.admissionDate) : now;
    const daysAdmitted = Math.max(1, Math.ceil((now.getTime() - admissionDate.getTime()) / (1000 * 60 * 60 * 24)));
    const doc = a.attendingDoctorId ? doctorMap.get(a.attendingDoctorId) : null;

    const wardDetails = a.ward ? wardMap.get(a.ward) || null : null;
    const bedDetails = a.bedNumber && wardDetails
      ? wardDetails.beds.find(b => b.bedNumber === a.bedNumber) || null
      : null;

    return {
      ...a,
      daysAdmitted,
      attendingDoctor: doc ? `Dr. ${doc.firstName} ${doc.lastName}` : 'Unassigned',
      attendingDoctorObj: doc,
      wardDetails,
      bedDetails,
    };
  });
};