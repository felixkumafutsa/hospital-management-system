import { Router } from 'express';
import { validate } from '../../middlewares/validate';
import { authenticate, authorize } from '../../middlewares/auth';
import {
  createVisitSchema,
  updateVisitStatusSchema,
  getVisitsSchema
} from './visit.validator';
import {
  createVisitController,
  getVisitByIdController,
  getPatientVisitsController,
  getAllVisitsController,
  updateVisitStatusController,
  getVisitQueueController,
  admitPatientController,
  dischargePatientController,
  setPatientEmergencyController,
  routeToMaternityController,
  sendToLaboratoryController,
  labResultsAvailableController,
  sendToPharmacyController,
  completeVisitController,
  getDashboardStatsController
} from './visit.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Create visit
router.post(
  '/',
  authorize(['RECEPTIONIST', 'ADMINISTRATOR', 'NURSE', 'DOCTOR']),
  validate(createVisitSchema),
  createVisitController
);

// Get visit queue (for reception dashboard)
router.get(
  '/queue',
  getVisitQueueController
);

// Get dashboard statistics — must be before /:id to avoid route shadowing
router.get(
  '/dashboard/stats',
  getDashboardStatsController
);

// Get all visits
router.get(
  '/',
  validate(getVisitsSchema),
  getAllVisitsController
);

// Get patient's visit history
router.get(
  '/patient/:patientId',
  getPatientVisitsController
);

// Get visit by ID, update status
router.get(
  '/:id',
  getVisitByIdController
);

router.put(
  '/:id/status',
  authorize(['NURSE', 'DOCTOR', 'ADMINISTRATOR', 'RECEPTIONIST']),
  validate(updateVisitStatusSchema),
  updateVisitStatusController
);

// Admit patient
router.put(
  '/:id/admit',
  authorize(['DOCTOR', 'ADMINISTRATOR']),
  admitPatientController
);

// Discharge patient
router.put(
  '/:id/discharge',
  authorize(['DOCTOR', 'ADMINISTRATOR']),
  dischargePatientController
);

// Mark as emergency
router.put(
  '/:id/emergency',
  authorize(['NURSE', 'DOCTOR', 'ADMINISTRATOR', 'RECEPTIONIST']),
  setPatientEmergencyController
);

// Route to maternity
router.put(
  '/:id/maternity',
  authorize(['DOCTOR', 'ADMINISTRATOR', 'NURSE']),
  routeToMaternityController
);

// Send to laboratory
router.put(
  '/:id/send-to-lab',
  authorize(['DOCTOR', 'ADMINISTRATOR']),
  sendToLaboratoryController
);

// Lab results available
router.put(
  '/:id/lab-results-available',
  authorize(['LAB_TECH', 'ADMINISTRATOR']),
  labResultsAvailableController
);

// Send to pharmacy
router.put(
  '/:id/send-to-pharmacy',
  authorize(['DOCTOR', 'ADMINISTRATOR']),
  sendToPharmacyController
);

// Complete visit
router.put(
  '/:id/complete',
  authorize(['PHARMACIST', 'ADMINISTRATOR', 'CASHIER']),
  completeVisitController
);

export default router;