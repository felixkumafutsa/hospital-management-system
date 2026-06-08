import { z } from 'zod';
import { 
  CreateScheduleSchema, 
  CreateTimeOffSchema
} from '@packages/types';

// Re-export the schemas from shared types
export { CreateScheduleSchema, CreateTimeOffSchema };

// Schema for updating schedules
export const UpdateScheduleSchema = CreateScheduleSchema.partial();

// Schema for time off approval/rejection
export const ProcessTimeOffSchema = z.object({
  action: z.enum(['APPROVE', 'REJECTED']),
});

// Query parameter schema for listing schedules
export const ListSchedulesSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  department: z.string().optional(),
  userId: z.string().uuid().optional(),
});

export type ListSchedulesInput = z.infer<typeof ListSchedulesSchema>;
