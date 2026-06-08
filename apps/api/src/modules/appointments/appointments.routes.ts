import { Router } from 'express';
import { validate } from '../../middlewares/validate';
import { authenticate, authorize } from '../../middlewares/auth';
import {
  createAppointmentSchema,
  updateAppointmentSchema,
  getAppointmentsSchema
} from './appointments.validator';
import {
  createAppointmentController,
  getAppointmentByIdController,
  getPatientAppointmentsController,
  getAllAppointmentsController,
  updateAppointmentStatusController,
  deleteAppointmentController
} from './appointments.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Create appointment
router.post(
  '/',
  authorize(['RECEPTIONIST', 'ADMINISTRATOR', 'NURSE', 'DOCTOR']),
  validate(createAppointmentSchema),
  createAppointmentController
);

// Get all appointments
router.get(
  '/',
  validate(getAppointmentsSchema),
  getAllAppointmentsController
);

// Get patient's appointment history
router.get(
  '/patient/:patientId',
  getPatientAppointmentsController
);

// Get appointment by ID, update status, delete
router.get(
  '/:id',
  getAppointmentByIdController
);

router.put(
  '/:id/status',
  authorize(['NURSE', 'DOCTOR', 'ADMINISTRATOR', 'RECEPTIONIST']),
  validate(updateAppointmentSchema),
  updateAppointmentStatusController
);

router.delete(
  '/:id',
  authorize(['ADMINISTRATOR', 'RECEPTIONIST']),
  deleteAppointmentController
);

export default router;