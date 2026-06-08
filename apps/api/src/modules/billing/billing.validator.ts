import { z } from 'zod';

export const createInvoiceSchema = z.object({
  patientId: z.string().uuid('Invalid patient ID format'),
  visitId: z.string().uuid('Invalid visit ID format'),
  notes: z.string().optional(),
  items: z.array(
    z.object({
      description: z.string().min(1, 'Description is required'),
      category: z.enum(['CONSULTATION', 'PROCEDURE', 'LAB_TEST', 'MEDICATION', 'OTHER']),
      quantity: z.number().int().positive('Quantity must be positive').default(1),
      unitPrice: z.number().positive('Unit price must be positive'),
      reference: z.string().optional(),
    })
  ).min(1, 'At least one item is required'),
  discount: z.number().nonnegative().default(0),
});

export const createPaymentSchema = z.object({
  invoiceId: z.string().uuid('Invalid invoice ID format'),
  amount: z.number().positive('Amount must be positive'),
  method: z.enum(['CASH', 'AIRTEL_MONEY', 'TNM_MPAMBA', 'BANK_TRANSFER', 'INSURANCE', 'WAIVER']),
  reference: z.string().optional(),
  receivedBy: z.string().uuid('Invalid user ID format'),
  notes: z.string().optional(),
});

export const updateInvoiceStatusSchema = z.object({
  status: z.enum(['DRAFT', 'SENT', 'UNPAID', 'PAID', 'PARTIAL', 'OVERDUE', 'CANCELLED', 'WAIVED']),
});

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;
export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
export type UpdateInvoiceStatusInput = z.infer<typeof updateInvoiceStatusSchema>;
