import { z } from 'zod';

export const createMedicineSchema = z.object({
  name: z.string().min(1, 'Medicine name is required'),
  genericName: z.string().optional(),
  category: z.string().min(1, 'Category is required'),
  form: z.enum(['TABLET', 'CAPSULE', 'SYRUP', 'INJECTION', 'CREAM', 'OINTMENT', 'DROPS', 'INHALER', 'SUPPOSITORY', 'OTHER']),
  strength: z.string().optional(),
  unit: z.string().min(1, 'Unit is required'),
  reorderLevel: z.number().int().positive().default(50),
});

export const createMedicineBatchSchema = z.object({
  medicineId: z.string().uuid('Invalid medicine ID format'),
  supplierId: z.string().uuid('Invalid supplier ID format'),
  batchNumber: z.string().min(1, 'Batch number is required'),
  quantity: z.number().int().positive('Quantity must be positive'),
  costPrice: z.number().positive('Cost price must be positive'),
  sellingPrice: z.number().positive('Selling price must be positive'),
  manufacturedAt: z.string().datetime().optional(),
  expiresAt: z.string().datetime('Expiry date must be a valid date'),
});

export const updateInventorySchema = z.object({
  quantity: z.number().int(),
  reason: z.string().optional(),
});

export const searchInventorySchema = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
  limit: z.number().int().positive().optional(),
  offset: z.number().int().nonnegative().optional(),
});

export type CreateMedicineInput = z.infer<typeof createMedicineSchema>;
export type CreateMedicineBatchInput = z.infer<typeof createMedicineBatchSchema>;
export type UpdateInventoryInput = z.infer<typeof updateInventorySchema>;
export type SearchInventoryInput = z.infer<typeof searchInventorySchema>;
