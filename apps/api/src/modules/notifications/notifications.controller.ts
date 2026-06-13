import { Request, Response, NextFunction } from 'express';
import {
  getNotificationById,
  getUserNotificationsService,
  getUnreadCountService,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotificationService
} from './notifications.service';

// Get notification by ID
export const getNotificationByIdController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const result = await getNotificationById(id as string);
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
};

// Get current user's notifications
export const getUserNotificationsController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { limit, offset } = req.query as { limit?: string | string[]; offset?: string | string[] };
    const result = await getUserNotificationsService(
      userId,
      limit ? parseInt(Array.isArray(limit) ? limit[0] : limit) : undefined,
      offset ? parseInt(Array.isArray(offset) ? offset[0] : offset) : undefined
    );
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
};

// Get unread notification count
export const getUnreadCountController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const result = await getUnreadCountService(userId);
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
};

// Mark notification as read
export const markAsReadController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const result = await markNotificationAsRead(id as string);
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
};

// Mark all notifications as read
export const markAllAsReadController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const result = await markAllNotificationsAsRead(userId);
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
};

// Delete notification
export const deleteNotificationController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const result = await deleteNotificationService(id as string);
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
};