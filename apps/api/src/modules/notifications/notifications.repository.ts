import { prisma } from '../../config/database';
import { NotificationType, NotificationPriority } from '@prisma/client';
import { CreateNotificationInput } from './notifications.validator';

// Create new notification
export const createNotification = async (data: CreateNotificationInput) => {
  return prisma.notification.create({
    data: {
      ...data
    },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true
        }
      }
    }
  });
};

// Find notification by ID
export const findNotificationById = async (id: string) => {
  return prisma.notification.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true
        }
      }
    }
  });
};

// Get all notifications for a user
export const getUserNotifications = async (userId: string, limit?: number, offset?: number) => {
  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip: offset || 0,
      take: limit || 50,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    }),
    prisma.notification.count({ where: { userId } })
  ]);
  
  return { notifications, total };
};

// Get unread notifications count for a user
export const getUnreadNotificationCount = async (userId: string) => {
  return prisma.notification.count({
    where: {
      userId,
      isRead: false
    }
  });
};

// Mark notification as read
export const markAsRead = async (id: string) => {
  return prisma.notification.update({
    where: { id },
    data: {
      isRead: true,
      readAt: new Date()
    }
  });
};

// Mark all notifications as read for a user
export const markAllAsRead = async (userId: string) => {
  return prisma.notification.updateMany({
    where: {
      userId,
      isRead: false
    },
    data: {
      isRead: true,
      readAt: new Date()
    }
  });
};

// Delete notification
export const deleteNotification = async (id: string) => {
  return prisma.notification.delete({
    where: { id }
  });
};

// Create bulk notifications for specific roles
export const createRoleNotification = async (
  roleName: string,
  title: string,
  message: string,
  type: NotificationType,
  priority: NotificationPriority = NotificationPriority.NORMAL,
  relatedId?: string,
  relatedType?: string,
  actionUrl?: string
) => {
  // Get all users with the specified role
  const users = await prisma.user.findMany({
    where: {
      role: {
        name: roleName
      },
      isActive: true
    },
    select: { id: true }
  });

  if (users.length === 0) return [];

  // Create notifications for all users in the role
  const notifications = await Promise.all(
    users.map((user: { id: string }) => 
      prisma.notification.create({
        data: {
          userId: user.id,
          title,
          message,
          type,
          priority,
          relatedId,
          relatedType,
          actionUrl
        }
      })
    )
  );

  return notifications;
};