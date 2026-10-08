import { z } from 'zod';

export const recordVitalsSchema = z.object({
  body: z.object({
    visitId: z.string().uuid('Invalid visit ID format'),
    weightKg: z.number().positive().optional(),
    heightCm: z.number().positive().optional(),
    bpSystolic: z.number().int().positive().optional(),
    bpDiastolic: z.number().int().positive().optional(),
    pulseRate: z.number().int().positive().optional(),
    respiratoryRate: z.number().int().positive().optional(),
    temperatureC: z.number().positive().optional(),
    oxygenSaturation: z.number().int().min(0).max(100).optional(),
    bloodSugarMmol: z.number().positive().optional(),
    notes: z.string().optional(),
  }),
});

export type RecordVitalsInput = z.infer<typeof recordVitalsSchema>['body'];
