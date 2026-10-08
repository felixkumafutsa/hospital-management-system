import { z } from 'zod';
import { DiagnosisType, FollowUpStatus } from '@prisma/client';

export const createDiagnosisSchema = z.object({
  icd10Code: z.string().optional().default('N/A'),
  icd10Desc: z.string().min(1, 'Diagnosis description is required'),
  diagnosisType: z.nativeEnum(DiagnosisType).default(DiagnosisType.PRIMARY),
  notes: z.string().optional(),
});

export const createConsultationSchema = z.object({
  body: z.object({
    visitId: z.string().uuid('Invalid visit ID format'),
    chiefComplaint: z.string().min(1, 'Chief complaint is required'),
    historyOfPC: z.string().optional(),
    examination: z.string().optional(),
    clinicalNotes: z.string().optional(),
    plan: z.string().optional(),
    followUpDate: z.coerce.date().optional(),
    followUpNotes: z.string().optional(),
    followUpStatus: z.nativeEnum(FollowUpStatus).optional(),
    assignedDoctorId: z.string().uuid().optional(),
    diagnoses: z.array(createDiagnosisSchema).optional().default([]),
  }),
});

export const updateConsultationSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid consultation ID format'),
  }),
  body: z.object({
    chiefComplaint: z.string().optional(),
    historyOfPC: z.string().optional(),
    examination: z.string().optional(),
    clinicalNotes: z.string().optional(),
    plan: z.string().optional(),
    followUpDate: z.coerce.date().optional(),
    followUpNotes: z.string().optional(),
    followUpStatus: z.nativeEnum(FollowUpStatus).optional(),
    assignedDoctorId: z.string().uuid().optional(),
    diagnoses: z.array(createDiagnosisSchema).optional(),
  }),
});

export type CreateConsultationInput = z.infer<typeof createConsultationSchema>['body'];
export type UpdateConsultationInput = z.infer<typeof updateConsultationSchema>['body'];
export type DiagnosisInput = z.infer<typeof createDiagnosisSchema>;
