
import express from 'express';
import { authenticate, authorize } from '../../middlewares/auth';
import {
  getInventoryController,
  updateInventoryItemController,
} from './pharmacy.controller';

const router = express.Router();

router.get(
  '/',
  authenticate,
  authorize(['PHARMACIST', 'ADMINISTRATOR']),
  getInventoryController
);

router.put(
  '/:id',
  authenticate,
  authorize(['PHARMACIST', 'ADMINISTRATOR']),
  updateInventoryItemController
);

export default router;