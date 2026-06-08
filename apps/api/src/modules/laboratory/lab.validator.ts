import { z } from 'zod';

export const createLabRequestSchema = z.object({
  visitId: z.string().uuid('Invalid visit ID format'),
  requestedBy: z.string().uuid('Invalid doctor ID format'),
  priority: z.enum(['ROUTINE', 'URGENT', 'STAT']).default('ROUTINE'),
  notes: z.string().optional(),
  testIds: z.array(z.string().uuid('Invalid test ID format')).min(1, 'At least one test is required'),
});

export const createLabTestSchema = z.object({
  name: z.string().min(1, 'Test name is required'),
  code: z.string().min(1, 'Test code is required'),
  category: z.enum([
    'HEMATOLOGY',
    'BIOCHEMISTRY',
    'MICROBIOLOGY',
    'SEROLOGY',
    'URINALYSIS',
    'PREGNANCY_TEST',
    'HIV_TEST',
    'STI_TEST',
    'IMAGING',
    'OTHER',
  ]),
  unit: z.string().optional(),
  normalRange: z.string().optional(),
  price: z.number().positive('Price must be positive'),
});

export const updateLabRequestStatusSchema = z.object({
  status: z.enum(['PENDING', 'PROCESSING', 'COMPLETED', 'REVIEWED', 'CANCELLED']),
  notes: z.string().optional(),
});

export const addLabResultSchema = z.object({
  testId: z.string().uuid('Invalid test ID format'),
  value: z.string().min(1, 'Result value is required'),
  unit: z.string().optional(),
  interpretation: z.string().optional(),
  isCritical: z.boolean().default(false),
  processedBy: z.string().uuid('Invalid technician ID format'),
});

export type CreateLabRequestInput = z.infer<typeof createLabRequestSchema>;
export type CreateLabTestInput = z.infer<typeof createLabTestSchema>;
export type UpdateLabRequestStatusInput = z.infer<typeof updateLabRequestStatusSchema>;
export type AddLabResultInput = z.infer<typeof addLabResultSchema>;
