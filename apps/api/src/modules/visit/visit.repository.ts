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

// Get active visits queue
export const getActiveVisitsQueue = async (): Promise<Visit[]> => {
  return prisma.visit.findMany({
    where: {
      status: {
        notIn: [VisitStatus.COMPLETED, VisitStatus.CANCELLED]
      }
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