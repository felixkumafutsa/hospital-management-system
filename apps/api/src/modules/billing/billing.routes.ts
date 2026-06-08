import express from 'express';
import { authenticate, authorize } from '../../middlewares/auth';
import { validate } from '../../middlewares/validate';
import {
  createInvoiceSchema,
  createPaymentSchema,
} from './billing.validator';
import {
  createInvoiceController,
  getInvoiceController,
  getPatientInvoicesController,
  getAllInvoicesController,
  recordPaymentController,
  getFinanceStatsController,
  getRevenueController,
  getRecentInvoicesController,
} from './billing.controller';

const router = express.Router();

// Invoice endpoints
router.post(
  '/invoices',
  authenticate,
  authorize(['CASHIER', 'RECEPTIONIST', 'ADMINISTRATOR']),
  validate(createInvoiceSchema),
  createInvoiceController
);

router.get(
  '/invoices/:id',
  authenticate,
  getInvoiceController
);

router.get(
  '/invoices',
  authenticate,
  getAllInvoicesController
);

router.get(
  '/patient/:patientId/invoices',
  authenticate,
  getPatientInvoicesController
);

// Payment endpoints
router.post(
  '/invoices/:invoiceId/payments',
  authenticate,
  authorize(['CASHIER', 'RECEPTIONIST', 'ADMINISTRATOR']),
  validate(createPaymentSchema),
  recordPaymentController
);

// Finance Dashboard endpoints
router.get(
  '/stats',
  authenticate,
  getFinanceStatsController
);

router.get(
  '/revenue',
  authenticate,
  getRevenueController
);

router.get(
  '/invoices/recent',
  authenticate,
  getRecentInvoicesController
);

export default router;
