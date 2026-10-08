import express from 'express';
import { authenticate, authorize } from '../../middlewares/auth';
import { validate } from '../../middlewares/validate';
import {
  createLabTestSchema,
  createLabRequestSchema,
  updateLabRequestStatusSchema,
  addLabResultSchema,
  updateLabTestPriceSchema,
} from './lab.validator';
import {
  createLabTestController,
  getLabTestController,
  getAllLabTestsController,
  createLabRequestController,
  getLabRequestController,
  getPatientLabRequestsController,
  getVisitLabRequestsController,
  getAllLabRequestsController,
  updateLabRequestStatusController,
  addLabResultController,
  updateLabTestPriceController,
  getLabDashboardStatsController,
} from './lab.controller';

const router = express.Router();

router.put(
  '/tests/:id/price',
  authenticate,
  authorize(['ADMINISTRATOR']),
  validate(updateLabTestPriceSchema),
  updateLabTestPriceController
);

// Lab Tests
router.post(
  '/tests',
  authenticate,
  authorize(['DOCTOR', 'LAB_TECH', 'ADMINISTRATOR']),
  validate(createLabTestSchema),
  createLabTestController
);

router.get(
  '/tests/:id',
  authenticate,
  authorize(['DOCTOR', 'NURSE', 'LAB_TECH', 'ADMINISTRATOR']),
  getLabTestController
);

router.get(
  '/tests',
  authenticate,
  authorize(['DOCTOR', 'NURSE', 'LAB_TECH', 'ADMINISTRATOR']),
  getAllLabTestsController
);

// Lab Requests
router.post(
  '/requests',
  authenticate,
  authorize(['DOCTOR', 'LAB_TECH', 'ADMINISTRATOR']),
  validate(createLabRequestSchema),
  createLabRequestController
);

router.get(
  '/requests/visit/:visitId',
  authenticate,
  authorize(['DOCTOR', 'NURSE', 'LAB_TECH', 'ADMINISTRATOR']),
  getVisitLabRequestsController
);

router.get(
  '/requests/stats',
  authenticate,
  authorize(['LAB_TECH', 'ADMINISTRATOR']),
  getLabDashboardStatsController
);

router.get(
  '/requests/:id',
  authenticate,
  authorize(['DOCTOR', 'NURSE', 'LAB_TECH', 'ADMINISTRATOR']),
  getLabRequestController
);

router.get(
  '/requests',
  authenticate,
  authorize(['LAB_TECH', 'ADMINISTRATOR']),
  getAllLabRequestsController
);

router.get(
  '/patient/:patientId/requests',
  authenticate,
  authorize(['DOCTOR', 'NURSE', 'LAB_TECH', 'ADMINISTRATOR']),
  getPatientLabRequestsController
);

router.put(
  '/requests/:id/status',
  authenticate,
  authorize(['LAB_TECH', 'ADMINISTRATOR']),
  validate(updateLabRequestStatusSchema),
  updateLabRequestStatusController
);

// Lab Results
router.post(
  '/requests/:requestId/results',
  authenticate,
  authorize(['LAB_TECH']),
  validate(addLabResultSchema),
  addLabResultController
);

export default router;