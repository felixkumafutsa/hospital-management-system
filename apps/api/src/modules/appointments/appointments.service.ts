import {
  createAppointment,
  findAppointmentById,
  getAllAppointments,
  getPatientAppointments,
  updateAppointmentStatus,
  deleteAppointment
} from './appointments.repository';
import { ApiError } from '../../middlewares/errorHandler';
import { CreateAppointmentInput, UpdateAppointmentInput } from './appointments.validator';

// Create new appointment service
export const createNewAppointment = async (data: CreateAppointmentInput) => {
  try {
    console.log('📅 Creating appointment with data:', JSON.stringify(data, null, 2));
    
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
  const appointment = await findAppointmentById(id);
  if (!appointment) {
    throw new ApiError(404, 'APPOINTMENT_NOT_FOUND', 'Appointment not found');
  }
  return { success: true, appointment };
};

// Get all appointments service
export const fetchAllAppointments = async (
  limit?: number,
  offset?: number,
  filters?: any
) => {
  const result = await getAllAppointments(limit, offset, filters);
  return { success: true, ...result };
};

// Get patient's appointments service
export const getPatientAppointmentHistory = async (patientId: string) => {
  const appointments = await getPatientAppointments(patientId);
  return { success: true, appointments };
};

// Update appointment status service
export const updateAppointmentStatusService = async (
  id: string,
  data: UpdateAppointmentInput
) => {
  // Check if appointment exists
  const existingAppointment = await findAppointmentById(id);
  if (!existingAppointment) {
    throw new ApiError(404, 'APPOINTMENT_NOT_FOUND', 'Appointment not found');
  }

  const updatedAppointment = await updateAppointmentStatus(id, data.status);
  return { success: true, appointment: updatedAppointment };
};

// Delete appointment service
export const deleteAppointmentService = async (id: string) => {
  // Check if appointment exists
  const existingAppointment = await findAppointmentById(id);
  if (!existingAppointment) {
    throw new ApiError(404, 'APPOINTMENT_NOT_FOUND', 'Appointment not found');
  }

  await deleteAppointment(id);
  return { success: true, message: 'Appointment deleted successfully' };
};