import { createAppointment, findAppointmentById, getAllAppointments, getPatientAppointments, updateAppointmentStatus, deleteAppointment } from './appointments.repository';
import * as dutyRosterRepository from '../duty-roster/duty-roster.repository';
import { findActiveVisitByPatientId, findVisitById, updateVisitStatus, createVisit } from '../visit/visit.repository';
import { VisitStatus, VisitType } from '@prisma/client';
import { ApiError } from '../../middlewares/errorHandler';
import { CreateAppointmentInput, UpdateAppointmentInput } from './appointments.validator';
import logger from '../../config/logger';

// Create new appointment service
export const createNewAppointment = async (data: CreateAppointmentInput) => {
  try {
    console.log('📅 Creating appointment with data:', JSON.stringify(data, null, 2));

    if (data.doctorId) {
      console.log(`👨‍⚕️ Doctor ${data.doctorId} was specified, skipping automatic assignment.`);
    } else {
      const appointmentTime = new Date(data.appointmentDate);
      const onDutyDoctors = await dutyRosterRepository.findOnDutyDoctors(appointmentTime);
      const doctorIds = [...new Set(onDutyDoctors.map(({ staffId }) => staffId))];

      if (doctorIds.length > 0) {
        const dayStart = new Date(appointmentTime);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(dayStart);
        dayEnd.setDate(dayEnd.getDate() + 1);
        const queueLoads = await dutyRosterRepository.getDoctorQueueLoads(
          doctorIds,
          dayStart,
          dayEnd
        );
        data.doctorId = doctorIds.reduce((leastLoaded, candidate) =>
          (queueLoads.get(candidate) ?? 0) < (queueLoads.get(leastLoaded) ?? 0)
            ? candidate
            : leastLoaded
        );
      } else {
        console.warn('No doctor is on duty for the appointment time; creating it without an assignment.');
      }
    }

    const appointment = await createAppointment(data);
    console.log('✅ Appointment created successfully:', appointment.id);
    return { success: true, appointment };
  } catch (error) {
    console.error('❌ Error creating appointment:', error);
    throw error;
  }
};

// Get appointment by ID service
export const getAppointmentById = async (id: string) => {
  try {
    const appointment = await findAppointmentById(id);
    if (!appointment) {
      throw new ApiError(404, 'APPOINTMENT_NOT_FOUND', 'Appointment not found');
    }
    return { success: true, appointment };
  } catch (error: unknown) {
    const err = error as Error;
    logger.error(`Service error fetching appointment by ID: ${err.message}`);
    if (error instanceof ApiError) {
      throw error;
    }
    throw {
      statusCode: 500,
      message: err.message || 'Failed to fetch appointment by ID',
    };
  }
};

// Filter interface for appointments query
interface AppointmentFilters {
  status?: string;
  patientId?: string;
  doctorId?: string;
  fromDate?: string;
  toDate?: string;
  [key: string]: string | undefined;
}

// Get all appointments service
export const fetchAllAppointments = async (
  limit?: number,
  offset?: number,
  filters?: AppointmentFilters
) => {
  try {
    const result = await getAllAppointments(limit, offset, filters);
    return { success: true, ...result };
  } catch (error: unknown) {
    const err = error as Error;
    logger.error(`Service error fetching all appointments: ${err.message}`);
    throw {
      statusCode: 500,
      message: err.message || 'Failed to fetch all appointments',
    };
  }
};

// Get patient's appointments service
export const getPatientAppointmentHistory = async (patientId: string) => {
  try {
    const appointments = await getPatientAppointments(patientId);
    return { success: true, appointments };
  } catch (error: unknown) {
    const err = error as Error;
    logger.error(`Service error fetching patient appointment history: ${err.message}`);
    throw {
      statusCode: 500,
      message: err.message || 'Failed to fetch patient appointment history',
    };
  }
};

// Update appointment status service
export const updateAppointmentStatusService = async (
  id: string,
  data: UpdateAppointmentInput
) => {
  try {
    // Check if appointment exists
    const existingAppointment = await findAppointmentById(id);
    if (!existingAppointment) {
      throw new ApiError(404, 'APPOINTMENT_NOT_FOUND', 'Appointment not found');
    }

    let linkedVisit = existingAppointment.visitId
      ? await findVisitById(existingAppointment.visitId)
      : null;

    if (data.status === 'CHECKED_IN' || data.status === 'IN_PROGRESS') {
      linkedVisit = linkedVisit || await findActiveVisitByPatientId(existingAppointment.patientId);
      if (!linkedVisit) {
        linkedVisit = await createVisit(
          existingAppointment.patientId,
          existingAppointment.doctorId || 'system',
          VisitType.OUTPATIENT,
          undefined,
          existingAppointment.notes || 'Scheduled Appointment'
        );
      }

      if (data.status === 'CHECKED_IN' && linkedVisit.status === VisitStatus.REGISTERED) {
        await updateVisitStatus(linkedVisit.id, VisitStatus.WAITING_FOR_CONSULTATION);
      } else if (
        data.status === 'IN_PROGRESS' &&
        ['WAITING_FOR_CONSULTATION', 'TRIAGED', 'REGISTERED'].includes(linkedVisit.status)
      ) {
        await updateVisitStatus(linkedVisit.id, VisitStatus.CONSULTING);
      }
    }

    const updatedAppointment = await updateAppointmentStatus(id, data.status, linkedVisit?.id);
    return { success: true, appointment: updatedAppointment };
  } catch (error: unknown) {
    const err = error as Error;
    logger.error(`Service error updating appointment status: ${err.message}`);
    if (error instanceof ApiError) {
      throw error;
    }
    throw {
      statusCode: 500,
      message: err.message || 'Failed to update appointment status',
    };
  }
};

// Delete appointment service
export const deleteAppointmentService = async (id: string) => {
  try {
    // Check if appointment exists
    const existingAppointment = await findAppointmentById(id);
    if (!existingAppointment) {
      throw new ApiError(404, 'APPOINTMENT_NOT_FOUND', 'Appointment not found');
    }

    await deleteAppointment(id);
    return { success: true, message: 'Appointment deleted successfully' };
  } catch (error: unknown) {
    const err = error as Error;
    logger.error(`Service error deleting appointment: ${err.message}`);
    if (error instanceof ApiError) {
      throw error;
    }
    throw {
      statusCode: 500,
      message: err.message || 'Failed to delete appointment',
    };
  }
};