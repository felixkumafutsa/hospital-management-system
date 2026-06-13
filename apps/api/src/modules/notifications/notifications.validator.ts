import { z } from 'zod';
import { NotificationType, NotificationPriority } from '@prisma/client';

// Create notification schema
export const createNotificationSchema = z.object({
  body: z.object({
    userId: z.string().uuid('Invalid user ID').optional(),
    title: z.string().min(1, 'Title is required').max(255, 'Title is too long'),
    message: z.string().min(1, 'Message is required'),
    type: z.nativeEnum(NotificationType),
    priority: z.nativeEnum(NotificationPriority).default(NotificationPriority.NORMAL),
    actionUrl: z.string().optional(),
    relatedId: z.string().optional(),
    relatedType: z.string().optional()
  })
});

// Update notification schema (only for marking as read)
export const updateNotificationSchema = z.object({
  body: z.object({
    isRead: z.boolean().optional()
  })
});

// Bulk mark as read schema
export const bulkMarkAsReadSchema = z.object({
  body: z.object({
    notificationIds: z.array(z.string().uuid('Invalid notification ID'))
  })
});

export type CreateNotificationInput = z.infer<typeof createNotificationSchema.shape.body>;