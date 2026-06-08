import { z } from 'zod';

export const createStaffSchema = z.object({
  email: z.string().email('Invalid email format'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z.string().optional(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  roleId: z.string().uuid('Invalid role ID format'),
});

export const updateStaffSchema = z.object({
  email: z.string().email('Invalid email format').optional(),
  firstName: z.string().min(1, 'First name is required').optional(),
  lastName: z.string().min(1, 'Last name is required').optional(),
  phone: z.string().optional(),
  roleId: z.string().uuid('Invalid role ID format').optional(),
  isActive: z.boolean().optional(),
});

export const searchStaffSchema = z.object({
  q: z.string().optional(),
  role: z.string().optional(),
  limit: z.number().int().positive().optional(),
  offset: z.number().int().nonnegative().optional(),
});

export type CreateStaffInput = z.infer<typeof createStaffSchema>;
export type UpdateStaffInput = z.infer<typeof updateStaffSchema>;
export type SearchStaffInput = z.infer<typeof searchStaffSchema>;
