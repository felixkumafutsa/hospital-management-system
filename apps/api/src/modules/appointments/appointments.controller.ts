import { Request, Response, NextFunction } from 'express';
import {
  createNewAppointment,
  getAppointmentById,
  getPatientAppointmentHistory,
  fetchAllAppointments,
  updateAppointmentStatusService,
  deleteAppointmentService
} from './appointments.service';
import { CreateAppointmentInput, UpdateAppointmentInput } from './appointments.validator';

// Create new appointment
export const createAppointmentController = async (
  req: Request<{}, {}, CreateAppointmentInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log('📝 Creating appointment with data:', JSON.stringify(req.body, null, 2));
    const result = await createNewAppointment(req.body);
    res.status(201).json(result);
  } catch (error) {
    console.error('❌ Error creating appointment:', error);
    next(error);
  }
};

// Get appointment by ID
export const getAppointmentByIdController = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await getAppointmentById(req.params.id);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

// Get patient's appointments
export const getPatientAppointmentsController = async (
  req: Request<{ patientId: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await getPatientAppointmentHistory(req.params.patientId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

// Get all appointments
export const getAllAppointmentsController = async (
  req: Request<{}, {}, {}, { 
    limit?: string; 
    offset?: string;
    status?: string;
    patientId?: string;
    doctorId?: string;
    fromDate?: string;
    toDate?: string;
  }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : undefined;
    const offset = req.query.offset ? parseInt(req.query.offset, 10) : undefined;
    const filters = {
      status: req.query.status,
      patientId: req.query.patientId,
      doctorId: req.query.doctorId,
      fromDate: req.query.fromDate,
      toDate: req.query.toDate
    };
    
    const result = await fetchAllAppointments(limit, offset, filters);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

// Update appointment status
export const updateAppointmentStatusController = async (
  req: Request<{ id: string }, {}, UpdateAppointmentInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await updateAppointmentStatusService(req.params.id, req.body);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

// Delete appointment
export const deleteAppointmentController = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await deleteAppointmentService(req.params.id);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};