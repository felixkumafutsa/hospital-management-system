import { Router } from 'express';
import { authenticate } from '../../middlewares/auth';
import {
  getNotificationByIdController,
  getUserNotificationsController,
  getUnreadCountController,
  markAsReadController,
  markAllAsReadController,
  deleteNotificationController
} from './notifications.controller';

const router = Router();

// All notification routes require authentication
router.use(authenticate);

// Get current user's notifications
router.get('/', getUserNotificationsController);

// Get unread count
router.get('/unread/count', getUnreadCountController);

// Mark all as read
router.post('/mark-all-read', markAllAsReadController);

// Get notification by ID
router.get('/:id', getNotificationByIdController);

// Mark notification as read
router.put('/:id/read', markAsReadController);

// Delete notification
router.delete('/:id', deleteNotificationController);

export default router;