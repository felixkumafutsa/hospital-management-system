import { z } from 'zod';

const wardId = z.string().uuid('Invalid ward ID');

export const getManagedWardsSchema = z.object({
  query: z.object({}),
});

export const createWardSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1, 'Ward name is required').max(100),
    department: z.string().trim().min(1, 'Department is required').max(100),
    description: z.string().trim().max(500).optional().transform((value) => value || undefined),
    bedCount: z.number().int().positive().max(200),
  }),
});

export const addWardBedsSchema = z.object({
  params: z.object({ wardId }),
  body: z.object({
    bedCount: z.number().int().positive().max(200),
  }),
});

export type CreateWardInput = z.infer<typeof createWardSchema>['body'];
export type AddWardBedsInput = z.infer<typeof addWardBedsSchema>['body'];
