import { z } from 'zod';
import { VisitType } from '@prisma/client';

// Create visit schema
export const createVisitSchema = z.object({
  body: z.object({
    patientId: z.string().uuid(),
    visitType: z.enum([
      VisitType.OUTPATIENT,
      VisitType.INPATIENT,
      VisitType.ANC,
      VisitType.POSTNATAL,
      VisitType.EMERGENCY
    ]).optional().default(VisitType.OUTPATIENT),
    referralNote: z.string().optional()
  })
});

// Update visit status schema
export const updateVisitStatusSchema = z.object({
  body: z.object({
    status: z.string()
  }),
  params: z.object({
    id: z.string().uuid()
  })
});

// Get visits filter schema
export const getVisitsSchema = z.object({
  query: z.object({
    status: z.string().optional(),
    visitType: z.string().optional(),
    fromDate: z.coerce.date().optional(),
    toDate: z.coerce.date().optional(),
    limit: z.coerce.number().int().positive().max(100).default(50),
    offset: z.coerce.number().int().min(0).default(0)
  })
});

// Admit patient schema
export const admitPatientSchema = z.object({
  body: z.object({
    roomNumber: z.string().min(1, 'Room number is required'),
    dailyRate: z.number().positive('Daily rate must be a positive number')
  }),
  params: z.object({
    id: z.string().uuid('Invalid visit ID format')
  })
});

// Discharge patient schema
export const dischargePatientSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid visit ID format')
  })
});

export type CreateVisitInput = z.infer<typeof createVisitSchema>['body'];
export type UpdateVisitStatusInput = z.infer<typeof updateVisitStatusSchema>['body'];
export type AdmitPatientInput = z.infer<typeof admitPatientSchema>['body'];
export type DischargePatientInput = z.infer<typeof dischargePatientSchema>['params'];