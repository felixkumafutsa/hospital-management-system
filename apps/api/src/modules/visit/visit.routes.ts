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
  getVisitQueueController
} from './visit.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Create visit
router.post(
  '/',
  authorize(['reception', 'admin', 'nurse', 'doctor']),
  validate(createVisitSchema),
  createVisitController
);

// Get visit queue (for reception dashboard)
router.get(
  '/queue',
  getVisitQueueController
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
  authorize(['nurse', 'doctor', 'admin', 'reception']),
  validate(updateVisitStatusSchema),
  updateVisitStatusController
);

export default router;