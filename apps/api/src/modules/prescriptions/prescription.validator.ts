import { z } from 'zod';

export const createPrescriptionSchema = z.object({
  visitId: z.string().uuid('Invalid visit ID format'),
  prescribedBy: z.string().uuid('Invalid doctor ID format'),
  notes: z.string().optional(),
  items: z.array(
    z.object({
      medicineId: z.string().uuid('Invalid medicine ID format'),
      dosage: z.string().min(1, 'Dosage is required'),
      frequency: z.string().min(1, 'Frequency is required'),
      duration: z.string().min(1, 'Duration is required'),
      quantity: z.number().int().positive('Quantity must be positive'),
      notes: z.string().optional(),
    })
  ).min(1, 'At least one medication is required'),
});

export const updatePrescriptionStatusSchema = z.object({
  status: z.enum(['PENDING', 'PARTIAL', 'DISPENSED', 'CANCELLED']),
  dispensedBy: z.string().uuid('Invalid pharmacist ID').optional(),
  notes: z.string().optional(),
});

export const searchPrescriptionSchema = z.object({
  q: z.string().optional(),
  status: z.enum(['PENDING', 'PARTIAL', 'DISPENSED', 'CANCELLED']).optional(),
  patientId: z.string().uuid().optional(),
  limit: z.number().int().positive().optional(),
  offset: z.number().int().nonnegative().optional(),
});

export type CreatePrescriptionInput = z.infer<typeof createPrescriptionSchema>;
export type UpdatePrescriptionStatusInput = z.infer<typeof updatePrescriptionStatusSchema>;
export type SearchPrescriptionInput = z.infer<typeof searchPrescriptionSchema>;
