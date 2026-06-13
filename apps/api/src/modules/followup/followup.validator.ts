import { z } from 'zod';

export const CreateFollowUpInput = z.object({
  patientId: z.string().uuid(),
  visitId: z.string().uuid().optional(),
  assignedDoctorId: z.string().uuid().optional(),
  followUpDate: z.string().datetime(),
  followUpReason: z.string().min(1, 'Follow-up reason is required'),
  followUpNotes: z.string().optional(),
});

export const UpdateFollowUpInput = z.object({
  assignedDoctorId: z.string().uuid().optional(),
  followUpDate: z.string().datetime().optional(),
  followUpReason: z.string().optional(),
  followUpNotes: z.string().optional(),
  status: z.enum(['SCHEDULED', 'COMPLETED', 'MISSED']).optional(),
});

export type CreateFollowUpInput = z.infer<typeof CreateFollowUpInput>;
export type UpdateFollowUpInput = z.infer<typeof UpdateFollowUpInput>;
