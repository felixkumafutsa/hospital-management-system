import { Router } from 'express';
import * as authController from './auth.controller';
import { 
  loginValidator, 
  refreshTokenValidator, 
  changePasswordValidator,
  logoutValidator,
  validate 
} from './auth.validator';
import { authenticate } from '../../middlewares/auth';

const router = Router();

// Public routes
router.post('/login', loginValidator, validate, authController.login);
router.post('/refresh', refreshTokenValidator, validate, authController.refresh);

// Protected routes (require authentication)
router.post('/logout', logoutValidator, validate, authenticate, authController.logout);
router.post('/change-password', changePasswordValidator, validate, authenticate, authController.changePassword);
router.get('/me', authenticate, authController.getCurrentUser);

export default router;