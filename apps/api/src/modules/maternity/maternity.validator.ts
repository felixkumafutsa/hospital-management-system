import { z } from 'zod';
import { 
  CreateAncSchema, 
  CreateDeliverySchema, 
  CreatePostnatalSchema
} from '@packages/types';

// Re-export the schemas from shared types
export { CreateAncSchema, CreateDeliverySchema, CreatePostnatalSchema };

// Schema for updating ANC records
export const UpdateAncSchema = CreateAncSchema.partial();

// Schema for updating delivery records
export const UpdateDeliverySchema = CreateDeliverySchema.partial();

// Schema for updating postnatal records
export const UpdatePostnatalSchema = CreatePostnatalSchema.partial();

// Query parameter schema for listing records
export const ListMaternityRecordsSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  patientId: z.string().uuid().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export type ListMaternityRecordsInput = z.infer<typeof ListMaternityRecordsSchema>;
