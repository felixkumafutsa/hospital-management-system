import { z } from 'zod';
import { AppointmentStatus } from '@prisma/client';

// Create appointment schema
export const createAppointmentSchema = z.object({
  body: z.object({
    patientId: z.string().uuid('Invalid patient ID'),
    doctorId: z.string().uuid('Invalid doctor ID').optional(),
    appointmentDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: "Invalid date format for appointmentDate"
    }).transform((val) => new Date(val)),
    startTime: z.string().min(1, 'Start time is required'),
    endTime: z.string().min(1, 'End time is required'),
    type: z.string().min(1, 'Appointment type is required'),
    notes: z.string().optional(),
    status: z.enum([
      AppointmentStatus.SCHEDULED,
      AppointmentStatus.CONFIRMED,
      AppointmentStatus.CHECKED_IN,
      AppointmentStatus.IN_PROGRESS,
      AppointmentStatus.COMPLETED,
      AppointmentStatus.CANCELLED,
      AppointmentStatus.NO_SHOW,
      AppointmentStatus.RESCHEDULED
    ]).default(AppointmentStatus.SCHEDULED)
  })
});

// Update appointment schema
export const updateAppointmentSchema = z.object({
  body: z.object({
    status: z.enum([
      AppointmentStatus.SCHEDULED,
      AppointmentStatus.CONFIRMED,
      AppointmentStatus.CHECKED_IN,
      AppointmentStatus.IN_PROGRESS,
      AppointmentStatus.COMPLETED,
      AppointmentStatus.CANCELLED,
      AppointmentStatus.NO_SHOW,
      AppointmentStatus.RESCHEDULED
    ])
  }),
  params: z.object({
    id: z.string().uuid('Invalid appointment ID')
  })
});

// Get appointments schema
export const getAppointmentsSchema = z.object({
  query: z.object({
    limit: z.coerce.number().int().positive().max(100).default(50),
    offset: z.coerce.number().int().min(0).default(0),
    status: z.string().optional(),
    patientId: z.string().optional(),
    doctorId: z.string().optional(),
    fromDate: z.string().optional(),
    toDate: z.string().optional()
  })
});

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>['body'];
export type UpdateAppointmentInput = z.infer<typeof updateAppointmentSchema>['body'];