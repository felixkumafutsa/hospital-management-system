import { z } from 'zod';

export const createMedicineSchema = z.object({
  name: z.string().min(1, 'Medicine name is required'),
  genericName: z.string().optional(),
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

export const receiveStockSchema = z.object({
  name: z.string().min(1),
  genericName: z.string().optional(),
  strength: z.string().optional(),
  isOtc: z.boolean().default(false),
  form: z.enum(['TABLET', 'CAPSULE', 'SYRUP', 'INJECTION', 'CREAM', 'OINTMENT', 'DROPS', 'INHALER', 'SUPPOSITORY', 'OTHER']),
  unit: z.string().min(1),
  reorderLevel: z.number().int().positive().default(50),
  batchNumber: z.string().min(1),
  quantity: z.number().int().positive(),
  costPrice: z.number().positive(),
  sellingPrice: z.number().positive(),
  supplierName: z.string().min(1),
  expiresAt: z.string().datetime(),
});

export const otcSaleSchema = z.object({
  patientId: z.string().uuid(),
  paymentMethod: z.enum(['CASH', 'AIRTEL_MONEY', 'TNM_MPAMBA', 'BANK_TRANSFER', 'INSURANCE', 'WAIVER']),
  items: z.array(z.object({
    medicineId: z.string().uuid(),
    quantity: z.number().int().positive(),
  })).min(1),
});

export const updateInventorySchema = z.object({
  quantity: z.number().int(),
  reason: z.string().optional(),
});

export const searchInventorySchema = z.object({
  q: z.string().optional(),
  limit: z.number().int().positive().optional(),
  offset: z.number().int().nonnegative().optional(),
});

export const recordTransactionSchema = z.object({
  batchId: z.string().uuid(),
  type: z.enum(['STOCK_IN', 'DISPENSED', 'ADJUSTMENT', 'EXPIRED', 'RETURNED']),
  quantity: z.number().int(),
  reason: z.string().optional(),
  reference: z.string().optional(),
  performedBy: z.string(),
});

export const directSaleSchema = z.object({
  items: z.array(
    z.object({
      medicineId: z.string().uuid('Invalid medicine ID format'),
      quantity: z.number().int().positive('Quantity must be positive'),
    })
  ),
});

export type CreateMedicineInput = z.infer<typeof createMedicineSchema>;
export type CreateMedicineBatchInput = z.infer<
  typeof createMedicineBatchSchema
>;
export type ReceiveStockInput = z.infer<typeof receiveStockSchema>;
export type OtcSaleInput = z.infer<typeof otcSaleSchema>;
export type UpdateInventoryInput = z.infer<typeof updateInventorySchema>;
export type SearchInventoryInput = z.infer<typeof searchInventorySchema>;
export type RecordTransactionInput = z.infer<typeof recordTransactionSchema>;
export type DirectSaleInput = z.infer<typeof directSaleSchema>;