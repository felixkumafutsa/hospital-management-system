import { z } from 'zod';

export const createDutyRosterSchema = z.object({
  body: z.object({
    staffId: z.string().uuid(),
    startTime: z.coerce.date(), // Coerce to Date object to accept ISO strings
    endTime: z.coerce.date(),
  }),
});

export const getDutyRosterSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

export const updateDutyRosterSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    staffId: z.string().uuid().optional(),
    startTime: z.coerce.date().optional(),
    endTime: z.coerce.date().optional(),
  }),
});