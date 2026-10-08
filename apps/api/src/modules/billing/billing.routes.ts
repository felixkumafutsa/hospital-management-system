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
  getVisitInvoiceController,
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
  authorize(['RECEPTION_CASHIER', 'CASHIER', 'RECEPTIONIST', 'ADMINISTRATOR']),
  validate(createInvoiceSchema),
  createInvoiceController
);

router.get(
  '/invoices/visit/:visitId',
  authenticate,
  getVisitInvoiceController
);

router.get(
  '/invoices/recent',
  authenticate,
  getRecentInvoicesController
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
  authorize(['RECEPTION_CASHIER', 'CASHIER', 'RECEPTIONIST', 'ADMINISTRATOR']),
  (req, _res, next) => {
    if (!req.body.invoiceId && req.params.invoiceId) {
      req.body.invoiceId = req.params.invoiceId;
    }
    if (!req.body.receivedBy && req.user?.userId) {
      req.body.receivedBy = req.user.userId;
    }
    next();
  },
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

export default router;