import { Router } from 'express';
import { authenticate, authorize } from '../../middlewares/auth';
import { validate } from '../../middlewares/validate';
import { recordVitalsSchema } from './triage.validator';
import {
  recordVitalsController,
  getVitalsByVisitController,
  getTriageQueueController,
  getTriageCountController,
} from './triage.controller';

const router = Router();

router.use(authenticate);

router.get('/queue', authorize(['NURSE', 'DOCTOR', 'ADMINISTRATOR']), getTriageQueueController);
router.get('/', authorize(['NURSE', 'DOCTOR', 'ADMINISTRATOR']), getTriageCountController);
router.get('/visit/:visitId', getVitalsByVisitController);

router.post(
  '/vitals',
  authorize(['NURSE', 'DOCTOR', 'ADMINISTRATOR']),
  validate(recordVitalsSchema),
  recordVitalsController
);

export default router;
