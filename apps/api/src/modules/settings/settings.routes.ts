import { Router } from 'express';
import { z } from 'zod';
import { authenticate, authorize } from '../../middlewares/auth';
import { validate } from '../../middlewares/validate';
import {
  getPricingSettingsController,
  updateConsultationFeeController,
} from './settings.controller';

const router = Router();
const consultationFeeSchema = z.object({
  consultationFee: z.number().positive('Consultation fee must be positive'),
});

router.get('/pricing', authenticate, getPricingSettingsController);
router.put(
  '/pricing/consultation',
  authenticate,
  authorize(['ADMINISTRATOR']),
  validate(consultationFeeSchema),
  updateConsultationFeeController
);

export default router;