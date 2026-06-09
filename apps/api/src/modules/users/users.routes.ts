import express from 'express';
import { authenticate, authorize } from '../../middlewares/auth';
import { validate } from '../../middlewares/validate';
import {
  createUserSchema,
  updateUserSchema,
} from './users.validator';
import {
  createUserController,
  getUserController,
  getAllUsersController,
  searchUsersController,
  updateUserController,
  deactivateUserController,
  getUserByRoleController,
} from './users.controller';

const router = express.Router();

// Test route in users module
router.get('/test', (_req, res) => {
  res.status(200).json({ success: true, message: 'Users module test route works!' });
});

// All routes require authentication
router.use(authenticate);

// Create user
router.post(
  '/',
  authorize(['ADMINISTRATOR']),
  validate(createUserSchema),
  createUserController
);

// Get all users
router.get(
  '/',
  getAllUsersController
);

// Search users
router.get(
  '/search',
  searchUsersController
);

// Get user by ID
router.get(
  '/:id',
  getUserController
);

// Get user by role
router.get(
  '/role/:roleId',
  getUserByRoleController
);

// Update user
router.put(
  '/:id',
  authorize(['ADMINISTRATOR']),
  validate(updateUserSchema),
  updateUserController
);

// Deactivate user
router.delete(
  '/:id',
  authorize(['ADMINISTRATOR']),
  deactivateUserController
);

export default router;