import { prisma } from '../../config/database';
import { Prisma } from '@prisma/client';
import { type CreateConsultationInput } from './consultation.validator';

export const upsertConsultation = async (
  doctorId: string,
  data: CreateConsultationInput,
  consultationFee?: number
) => {
  const { diagnoses = [], ...consultationData } = data;

  const existing = await prisma.consultation.findUnique({
    where: { visitId: data.visitId },
  });

  if (existing) {
    // Delete existing diagnoses if updating with new ones
    if (diagnoses.length > 0) {
      await prisma.diagnosis.deleteMany({
        where: { consultationId: existing.id },
      });
    }

    return prisma.consultation.update({
      where: { id: existing.id },
      data: {
        ...consultationData,
        doctorId,
        consultationFee: existing.consultationFee ?? (consultationFee == null ? undefined : new Prisma.Decimal(consultationFee)),
        diagnoses: diagnoses.length > 0 ? {
          create: diagnoses.map((d) => ({
            icd10Code: d.icd10Code || 'N/A',
            icd10Desc: d.icd10Desc,
            diagnosisType: d.diagnosisType,
            notes: d.notes,
          })),
        } : undefined,
      },
      include: {
        diagnoses: true,
        doctor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        visit: {
          include: {
            patient: true,
          },
        },
      },
    });
  }

  return prisma.consultation.create({
    data: {
      ...consultationData,
      doctorId,
      ...(consultationFee == null ? {} : { consultationFee: new Prisma.Decimal(consultationFee) }),
      diagnoses: {
        create: diagnoses.map((d) => ({
          icd10Code: d.icd10Code || 'N/A',
          icd10Desc: d.icd10Desc,
          diagnosisType: d.diagnosisType,
          notes: d.notes,
        })),
      },
    },
    include: {
      diagnoses: true,
      doctor: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      visit: {
        include: {
          patient: true,
        },
      },
    },
  });
};

export const findConsultationById = async (id: string) => {
  return prisma.consultation.findUnique({
    where: { id },
    include: {
      diagnoses: true,
      doctor: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      visit: {
        include: {
          patient: true,
          vitals: {
            orderBy: { recordedAt: 'desc' },
            take: 1,
          },
          labRequests: {
            include: {
              items: { include: { test: true } },
              results: true,
            },
          },
          prescriptions: {
            include: {
              items: { include: { medicine: true } },
            },
          },
        },
      },
    },
  });
};

export const findConsultationByVisitId = async (visitId: string) => {
  return prisma.consultation.findUnique({
    where: { visitId },
    include: {
      diagnoses: true,
      doctor: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      visit: {
        include: {
          patient: true,
          vitals: {
            orderBy: { recordedAt: 'desc' },
            take: 1,
          },
          labRequests: {
            include: {
              items: { include: { test: true } },
              results: true,
            },
          },
          prescriptions: {
            include: {
              items: { include: { medicine: true } },
            },
          },
        },
      },
    },
  });
};

export const getAllConsultations = async (limit: number = 50, offset: number = 0) => {
  const [consultations, total] = await Promise.all([
    prisma.consultation.findMany({
      skip: offset,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        diagnoses: true,
        doctor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        visit: {
          include: {
            patient: true,
          },
        },
      },
    }),
    prisma.consultation.count(),
  ]);

  return { consultations, total };
};