import express from 'express';
import { authenticate, authorize } from '../../middlewares/auth';
import { validate } from '../../middlewares/validate';
import {
  createLabTestSchema,
  createLabRequestSchema,
  updateLabRequestStatusSchema,
  addLabResultSchema,
} from './lab.validator';
import {
  createLabTestController,
  getLabTestController,
  getAllLabTestsController,
  createLabRequestController,
  getLabRequestController,
  getPatientLabRequestsController,
  getAllLabRequestsController,
  updateLabRequestStatusController,
  addLabResultController,
} from './lab.controller';

const router = express.Router();

// Lab Tests
router.post(
  '/tests',
  authenticate,
  authorize(['LAB_TECH', 'ADMINISTRATOR']),
  validate(createLabTestSchema),
  createLabTestController
);

router.get(
  '/tests/:id',
  authenticate,
  getLabTestController
);

router.get(
  '/tests',
  authenticate,
  getAllLabTestsController
);

// Lab Requests
router.post(
  '/requests',
  authenticate,
  authorize(['DOCTOR', 'NURSE', 'ADMINISTRATOR']),
  validate(createLabRequestSchema),
  createLabRequestController
);

router.get(
  '/requests/:id',
  authenticate,
  getLabRequestController
);

router.get(
  '/requests',
  authenticate,
  getAllLabRequestsController
);

router.get(
  '/patient/:patientId/requests',
  authenticate,
  getPatientLabRequestsController
);

router.put(
  '/requests/:id/status',
  authenticate,
  authorize(['LAB_TECH', 'DOCTOR', 'ADMINISTRATOR']),
  validate(updateLabRequestStatusSchema),
  updateLabRequestStatusController
);

// Lab Results
router.post(
  '/requests/:requestId/results',
  authenticate,
  authorize(['LAB_TECH', 'ADMINISTRATOR']),
  validate(addLabResultSchema),
  addLabResultController
);

export default router;
