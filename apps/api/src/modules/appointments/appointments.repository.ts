import { prisma } from '../../config/database';
import { Appointment } from '@prisma/client';
import { CreateAppointmentInput } from './appointments.validator';

// Create new appointment
export const createAppointment = async (
  data: CreateAppointmentInput
): Promise<Appointment> => {
  return prisma.appointment.create({
    data,
    include: {
      patient: {
        select: {
          id: true,
          patientNumber: true,
          firstName: true,
          lastName: true,
          phone: true
        }
      },
      doctor: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true
        }
      }
    }
  });
};

// Find appointment by ID
export const findAppointmentById = async (id: string): Promise<Appointment | null> => {
  return prisma.appointment.findUnique({
    where: { id },
    include: {
      patient: {
        select: {
          id: true,
          patientNumber: true,
          firstName: true,
          lastName: true,
          phone: true
        }
      },
      doctor: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true
        }
      }
    }
  });
};

// Get all appointments with filters
export const getAllAppointments = async (
  limit: number = 50,
  offset: number = 0,
  filters?: {
    status?: string;
    patientId?: string;
    doctorId?: string;
    fromDate?: string;
    toDate?: string;
  }
): Promise<{ appointments: Appointment[]; total: number }> => {
  const where: any = {};
  
  if (filters?.status) {
    where.status = filters.status;
  }
  if (filters?.patientId) {
    where.patientId = filters.patientId;
  }
  if (filters?.doctorId) {
    where.doctorId = filters.doctorId;
  }
  if (filters?.fromDate && filters?.toDate) {
    where.appointmentDate = {
      gte: new Date(filters.fromDate),
      lte: new Date(filters.toDate)
    };
  }

  const [appointments, total] = await Promise.all([
    prisma.appointment.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: {
        appointmentDate: 'desc'
      },
      include: {
        patient: {
          select: {
            id: true,
            patientNumber: true,
            firstName: true,
            lastName: true,
            phone: true
          }
        },
        doctor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true
          }
        }
      }
    }),
    prisma.appointment.count({ where })
  ]);

  return { appointments, total };
};

// Get patient's appointments
export const getPatientAppointments = async (patientId: string): Promise<Appointment[]> => {
  return prisma.appointment.findMany({
    where: { patientId },
    orderBy: {
      appointmentDate: 'desc'
    },
    include: {
      patient: {
        select: {
          id: true,
          patientNumber: true,
          firstName: true,
          lastName: true,
          phone: true
        }
      },
      doctor: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true
        }
      }
    }
  });
};

// Update appointment status
export const updateAppointmentStatus = async (
  id: string,
  status: string
): Promise<Appointment> => {
  return prisma.appointment.update({
    where: { id },
    data: { status },
    include: {
      patient: {
        select: {
          id: true,
          patientNumber: true,
          firstName: true,
          lastName: true,
          phone: true
        }
      },
      doctor: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true
        }
      }
    }
  });
};

// Delete appointment
export const deleteAppointment = async (id: string): Promise<void> => {
  await prisma.appointment.delete({
    where: { id }
  });
};