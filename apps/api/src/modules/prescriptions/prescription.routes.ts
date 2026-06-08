import express from 'express';
import { authenticate, authorize } from '../../middlewares/auth';
import { validate } from '../../middlewares/validate';
import {
  createPrescriptionSchema,
  updatePrescriptionStatusSchema,
} from './prescription.validator';
import {
  createPrescriptionController,
  getPrescriptionController,
  getPatientPrescriptionsController,
  getAllPrescriptionsController,
  updatePrescriptionStatusController,
  deletePrescriptionController,
} from './prescription.controller';

const router = express.Router();

// Create prescription
router.post(
  '/',
  authenticate,
  authorize(['DOCTOR', 'ADMINISTRATOR']),
  validate(createPrescriptionSchema),
  createPrescriptionController
);

// Get all prescriptions with filters
router.get(
  '/',
  authenticate,
  getAllPrescriptionsController
);

// Get prescription by ID
router.get(
  '/:id',
  authenticate,
  getPrescriptionController
);

// Get prescriptions for a patient
router.get(
  '/patient/:patientId',
  authenticate,
  getPatientPrescriptionsController
);

// Update prescription status
router.put(
  '/:id/status',
  authenticate,
  authorize(['PHARMACIST', 'ADMINISTRATOR']),
  validate(updatePrescriptionStatusSchema),
  updatePrescriptionStatusController
);

// Delete prescription
router.delete(
  '/:id',
  authenticate,
  authorize(['ADMINISTRATOR']),
  deletePrescriptionController
);

export default router;
