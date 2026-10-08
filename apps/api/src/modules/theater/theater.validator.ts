
import { z } from 'zod';

export const createSurgicalProcedure = z.object({
  visitId: z.string(),
  catalogId: z.string().uuid(),
  procedureDate: z.string().datetime(),
  maternityProfileId: z.string().uuid().optional(),
  notes: z.string().optional(),
});

export const createMaternitySurgicalRequest = z.object({
  maternityProfileId: z.string().uuid(),
  catalogId: z.string().uuid(),
  procedureDate: z.string().datetime(),
  notes: z.string().optional(),
});

export const createProcedureCatalog = z.object({
  code: z.string().trim().min(2).max(30),
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(500).optional(),
  price: z.number().positive(),
  durationMinutes: z.number().int().min(15).max(1440).default(60),
  isMaternityDelivery: z.boolean().default(false),
});

export const updateProcedureCatalog = createProcedureCatalog.partial();

export const createTheater = z.object({
  name: z.string().trim().min(2).max(80),
});

export const updateTheater = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  isAvailable: z.boolean().optional(),
});

export const updateSurgicalProcedure = z.object({
  catalogId: z.string().uuid().optional(),
  procedureDate: z.string().datetime().optional(),
  theaterId: z.string().uuid().optional(),
  surgeonId: z.string().uuid().optional(),
  anesthetistId: z.string().uuid().optional(),
  notes: z.string().optional(),
  status: z.enum(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
});