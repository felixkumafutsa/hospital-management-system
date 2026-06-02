import { z } from 'zod';
import { Gender } from '@prisma/client';

// Patient creation schema
export const createPatientSchema = z.object({
  body: z.object({
    nationalId: z.string().optional(),
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    dateOfBirth: z.coerce.date(),
    gender: z.enum([Gender.FEMALE, Gender.MALE, Gender.OTHER]),
    phone: z.string().min(10, 'Phone number must be at least 10 characters'),
    email: z.string().email('Invalid email format').optional(),
    address: z.string().optional(),
    nextOfKinName: z.string().optional(),
    nextOfKinPhone: z.string().optional(),
    nextOfKinRelation: z.string().optional(),
    bloodGroup: z.string().optional(),
    allergies: z.array(z.string()).default([]),
    insuranceProvider: z.string().optional(),
    insuranceNumber: z.string().optional(),
    photoUrl: z.string().optional()
  })
});

// Patient update schema
export const updatePatientSchema = z.object({
  body: z.object({
    nationalId: z.string().optional(),
    firstName: z.string().min(1, 'First name is required').optional(),
    lastName: z.string().min(1, 'Last name is required').optional(),
    dateOfBirth: z.coerce.date().optional(),
    gender: z.enum([Gender.FEMALE, Gender.MALE, Gender.OTHER]).optional(),
    phone: z.string().min(10, 'Phone number must be at least 10 characters').optional(),
    email: z.string().email('Invalid email format').optional(),
    address: z.string().optional(),
    nextOfKinName: z.string().optional(),
    nextOfKinPhone: z.string().optional(),
    nextOfKinRelation: z.string().optional(),
    bloodGroup: z.string().optional(),
    allergies: z.array(z.string()).optional(),
    insuranceProvider: z.string().optional(),
    insuranceNumber: z.string().optional(),
    photoUrl: z.string().optional(),
    isActive: z.boolean().optional()
  }),
  params: z.object({
    id: z.string().uuid('Invalid patient ID format')
  })
});

// Search patients schema
export const searchPatientsSchema = z.object({
  query: z.object({
    q: z.string().min(1, 'Search query is required'),
    limit: z.coerce.number().int().positive().max(100).default(50),
    offset: z.coerce.number().int().min(0).default(0)
  })
});

// Get patients schema
export const getPatientsSchema = z.object({
  query: z.object({
    limit: z.coerce.number().int().positive().max(100).default(50),
    offset: z.coerce.number().int().min(0).default(0)
  })
});

export type CreatePatientInput = z.infer<typeof createPatientSchema>['body'];
export type UpdatePatientInput = z.infer<typeof updatePatientSchema>['body'];