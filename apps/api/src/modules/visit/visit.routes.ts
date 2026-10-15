import { Router } from 'express';
import { RequestHandler } from 'express';
import { validate } from '../../middlewares/validate';
import { authenticate, authorize, authorizeExactRole } from '../../middlewares/auth';
import { prisma } from '../../config/database';
import { ApiError } from '../../middlewares/errorHandler';
import {
  createVisitSchema,
  updateVisitStatusSchema,
  getVisitsSchema,
  admitPatientSchema
} from './visit.validator';
import {
  createVisitController,
  getVisitByIdController,
  getPatientVisitsController,
  getAllVisitsController,
  updateVisitStatusController,
  getVisitQueueController,
  getAvailableAdmissionWardsController,
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
import {
  addBedsController,
  createWardController,
  listManagedWardsController,
} from './ward-management.controller';
import {
  addWardBedsSchema,
  createWardSchema,
  getManagedWardsSchema,
} from './ward-management.validator';

const router = Router();

const restrictReceptionVisits: RequestHandler = async (req, _res, next) => {
  try {
    if (!req.user) {
      return next(new ApiError(401, 'UNAUTHORIZED', 'User not authenticated'));
    }
    const role = await prisma.role.findUnique({
      where: { id: req.user.roleId },
      select: { name: true },
    });
    if (role && ['RECEPTIONIST', 'RECEPTION_CASHIER', 'CASHIER'].includes(role.name) && req.query.status !== 'ADMITTED') {
      return next(new ApiError(403, 'FORBIDDEN', 'Reception can only view admitted patient records'));
    }
    return next();
  } catch (error) {
    return next(error);
  }
};

// All routes require authentication
router.use(authenticate);

// Create visit
router.post(
  '/',
  authorize(['ADMINISTRATOR', 'NURSE', 'DOCTOR']),
  validate(createVisitSchema),
  createVisitController
);

// Get visit queue (for reception dashboard)
router.get(
  '/queue',
  authorize(['ADMINISTRATOR', 'NURSE', 'DOCTOR']),
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
  restrictReceptionVisits,
  validate(getVisitsSchema),
  getAllVisitsController
);

router.get(
  '/wards/manage',
  authorizeExactRole('ADMINISTRATOR'),
  validate(getManagedWardsSchema),
  listManagedWardsController
);

router.post(
  '/wards/manage',
  authorizeExactRole('ADMINISTRATOR'),
  validate(createWardSchema),
  createWardController
);

router.post(
  '/wards/:wardId/beds',
  authorizeExactRole('ADMINISTRATOR'),
  validate(addWardBedsSchema),
  addBedsController
);

router.get(
  '/wards/available',
  getAvailableAdmissionWardsController
);

// Get patient's visit history
router.get(
  '/patient/:patientId',
  authorize(['ADMINISTRATOR', 'DOCTOR', 'NURSE']),
  getPatientVisitsController
);

// Get visit by ID, update status
router.get(
  '/:id',
  authorize(['ADMINISTRATOR', 'DOCTOR', 'NURSE']),
  getVisitByIdController
);

router.put(
  '/:id/status',
  authorize(['NURSE', 'DOCTOR', 'ADMINISTRATOR']),
  validate(updateVisitStatusSchema),
  updateVisitStatusController
);

// Admit patient
router.put(
  '/:id/admit',
  authorize(['DOCTOR', 'ADMINISTRATOR']),
  validate(admitPatientSchema),
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
  authorize(['NURSE', 'DOCTOR', 'ADMINISTRATOR']),
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
  authorize(['PHARMACIST', 'ADMINISTRATOR', 'RECEPTION_CASHIER', 'CASHIER']),
  completeVisitController
);

export default router;