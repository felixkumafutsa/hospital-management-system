import { Router } from 'express';
import { authenticate, authorize } from '../../middlewares/auth';
import { validate } from '../../middlewares/validate';
import { createConsultationSchema } from './consultation.validator';
import {
  recordConsultationController,
  getConsultationByIdController,
  getConsultationByVisitController,
  listConsultationsController,
} from './consultation.controller';
import { getVisitQueueController } from '../visit/visit.controller';

const router = Router();

router.use(authenticate);

// Legacy queue support
router.get('/queue', getVisitQueueController);

// Consultation endpoints
router.post(
  '/',
  authorize(['DOCTOR', 'ADMINISTRATOR']),
  validate(createConsultationSchema),
  recordConsultationController
);

router.get(
  '/',
  authorize(['DOCTOR', 'NURSE', 'ADMINISTRATOR']),
  listConsultationsController
);

router.get(
  '/visit/:visitId',
  authorize(['DOCTOR', 'NURSE', 'ADMINISTRATOR', 'LAB_TECH', 'PHARMACIST']),
  getConsultationByVisitController
);

router.get(
  '/:id',
  authorize(['DOCTOR', 'NURSE', 'ADMINISTRATOR']),
  getConsultationByIdController
);

export default router;
