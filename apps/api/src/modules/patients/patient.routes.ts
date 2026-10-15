import { Router } from 'express';
import { validate } from '../../middlewares/validate';
import { authenticate, authorize } from '../../middlewares/auth';
import {
  createPatientSchema,
  updatePatientSchema,
  searchPatientsSchema,
  getPatientsSchema
} from './patient.validator';
import {
  createPatientController,
  getPatientByIdController,
  getPatientByNumberController,
  searchPatientsController,
  getAllPatientsController,
  updatePatientController,
  deactivatePatientController
} from './patient.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Create patient - only reception, admin, doctor can create
router.post(
  '/',
  authorize(['ADMINISTRATOR', 'DOCTOR']),
  validate(createPatientSchema),
  createPatientController
);

// Get all patients
router.get(
  '/',
  authorize(['ADMINISTRATOR', 'DOCTOR', 'NURSE', 'PHARMACIST', 'MD']),
  validate(getPatientsSchema),
  getAllPatientsController
);

// Search patients
router.get(
  '/search',
  authorize(['ADMINISTRATOR', 'DOCTOR', 'NURSE', 'PHARMACIST', 'MD']),
  validate(searchPatientsSchema),
  searchPatientsController
);

// Get patient by number
router.get(
  '/number/:patientNumber',
  authorize(['ADMINISTRATOR', 'DOCTOR', 'NURSE', 'PHARMACIST', 'MD']),
  getPatientByNumberController
);

// Get patient by ID, update, deactivate
router.get(
  '/:id',
  authorize(['ADMINISTRATOR', 'DOCTOR', 'NURSE', 'PHARMACIST', 'MD']),
  getPatientByIdController
);

router.put(
  '/:id',
  authorize(['ADMINISTRATOR', 'DOCTOR']),
  validate(updatePatientSchema),
  updatePatientController
);

router.delete(
  '/:id',
  authorize(['admin']),
  deactivatePatientController
);

export default router;