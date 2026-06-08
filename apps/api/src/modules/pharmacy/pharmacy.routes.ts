import express from 'express';
import { authenticate, authorize } from '../../middlewares/auth';
import { validate } from '../../middlewares/validate';
import {
  createMedicineSchema,
  createMedicineBatchSchema,
} from './pharmacy.validator';
import {
  createMedicineController,
  getMedicineController,
  getAllMedicinesController,
  searchMedicinesController,
  createMedicineBatchController,
  getMedicineBatchController,
  getLowStockController,
  getTransactionsController,
  recordTransactionController,
} from './pharmacy.controller';

const router = express.Router();

// Medicines endpoints
router.post(
  '/medicines',
  authenticate,
  authorize(['PHARMACIST', 'ADMINISTRATOR']),
  validate(createMedicineSchema),
  createMedicineController
);

router.get(
  '/medicines/:id',
  authenticate,
  getMedicineController
);

router.get(
  '/medicines',
  authenticate,
  getAllMedicinesController
);

router.get(
  '/medicines/search',
  authenticate,
  searchMedicinesController
);

// Medicine Batches endpoints
router.post(
  '/batches',
  authenticate,
  authorize(['PHARMACIST', 'ADMINISTRATOR']),
  validate(createMedicineBatchSchema),
  createMedicineBatchController
);

router.get(
  '/batches/:id',
  authenticate,
  getMedicineBatchController
);

// Inventory endpoints
router.get(
  '/low-stock',
  authenticate,
  authorize(['PHARMACIST', 'ADMINISTRATOR']),
  getLowStockController
);

router.get(
  '/transactions',
  authenticate,
  getTransactionsController
);

router.post(
  '/transactions',
  authenticate,
  authorize(['PHARMACIST', 'ADMINISTRATOR']),
  recordTransactionController
);

export default router;
