import express from 'express';
import { authenticate, authorize } from '../../middlewares/auth';
import { validate } from '../../middlewares/validate';
import {
  createStaffSchema,
  updateStaffSchema,
} from './staff.validator';
import {
  createStaffController,
  getStaffController,
  getAllStaffController,
  searchStaffController,
  updateStaffController,
  deactivateStaffController,
  getStaffByRoleController,
} from './staff.controller';

const router = express.Router();

// Create staff
router.post(
  '/',
  authenticate,
  authorize(['ADMINISTRATOR']),
  validate(createStaffSchema),
  createStaffController
);

// Get all staff
router.get(
  '/',
  authenticate,
  getAllStaffController
);

// Search staff
router.get(
  '/search',
  authenticate,
  searchStaffController
);

// Get staff by ID
router.get(
  '/:id',
  authenticate,
  getStaffController
);

// Get staff by role
router.get(
  '/role/:roleId',
  authenticate,
  getStaffByRoleController
);

// Update staff
router.put(
  '/:id',
  authenticate,
  authorize(['ADMINISTRATOR']),
  validate(updateStaffSchema),
  updateStaffController
);

// Deactivate staff
router.delete(
  '/:id',
  authenticate,
  authorize(['ADMINISTRATOR']),
  deactivateStaffController
);

export default router;