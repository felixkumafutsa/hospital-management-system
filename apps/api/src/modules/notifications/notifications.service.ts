import {
  findNotificationById,
  getUserNotifications,
  getUnreadNotificationCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  createRoleNotification
} from './notifications.repository';
import { ApiError } from '../../middlewares/errorHandler';
import { NotificationType, NotificationPriority, TriageLevel } from '@prisma/client';

// Get notification by ID
export const getNotificationById = async (id: string) => {
  const notification = await findNotificationById(id);
  if (!notification) {
    throw new ApiError(404, 'NOTIFICATION_NOT_FOUND', 'Notification not found');
  }
  return { success: true, notification };
};

// Get all notifications for current user
export const getUserNotificationsService = async (
  userId: string,
  limit?: number,
  offset?: number
) => {
  const result = await getUserNotifications(userId, limit, offset);
  const unreadCount = await getUnreadNotificationCount(userId);
  return { 
    success: true, 
    ...result,
    unreadCount
  };
};

// Get unread count
export const getUnreadCountService = async (userId: string) => {
  const count = await getUnreadNotificationCount(userId);
  return { success: true, unreadCount: count };
};

// Mark notification as read
export const markNotificationAsRead = async (id: string) => {
  const notification = await findNotificationById(id);
  if (!notification) {
    throw new ApiError(404, 'NOTIFICATION_NOT_FOUND', 'Notification not found');
  }
  
  const updatedNotification = await markAsRead(id);
  return { 
    success: true, 
    message: 'Notification marked as read',
    notification: updatedNotification
  };
};

// Mark all notifications as read for user
export const markAllNotificationsAsRead = async (userId: string) => {
  await markAllAsRead(userId);
  return { 
    success: true, 
    message: 'All notifications marked as read'
  };
};

// Delete notification
export const deleteNotificationService = async (id: string) => {
  const notification = await findNotificationById(id);
  if (!notification) {
    throw new ApiError(404, 'NOTIFICATION_NOT_FOUND', 'Notification not found');
  }
  
  await deleteNotification(id);
  return { 
    success: true, 
    message: 'Notification deleted successfully'
  };
};

// Helper: Notify doctors about new lab results
export const notifyDoctorsOfLabResults = async (visitId: string, patientName: string) => {
  return createRoleNotification(
    'DOCTOR',
    'Lab Results Available',
    `Lab results are available for patient ${patientName} (Visit ID: ${visitId})`,
    NotificationType.LAB_RESULT_AVAILABLE,
    NotificationPriority.HIGH,
    visitId,
    'VISIT',
    `/visits/${visitId}`
  );
};

// Helper: Notify lab technicians when patient is sent to lab
export const notifyLabTechniciansOfNewPatient = async (visitId: string, patientName: string) => {
  return createRoleNotification(
    'LAB_TECH',
    'New Patient in Laboratory Queue',
    `Patient ${patientName} has been sent to the laboratory (Visit ID: ${visitId})`,
    NotificationType.SYSTEM,
    NotificationPriority.NORMAL,
    visitId,
    'VISIT',
    `/laboratory/visits/${visitId}`
  );
};

// Helper: Notify pharmacists when patient is sent to pharmacy
export const notifyPharmacistsOfNewPrescription = async (visitId: string, patientName: string) => {
  return createRoleNotification(
    'PHARMACIST',
    'New Prescription Ready',
    `Patient ${patientName} is waiting for prescription dispensing (Visit ID: ${visitId})`,
    NotificationType.PRESCRIPTION_READY,
    NotificationPriority.NORMAL,
    visitId,
    'VISIT',
    `/pharmacy/visits/${visitId}`
  );
};

// Helper: Notify all staff of emergency case
export const notifyEmergencyCase = async (visitId: string, patientName: string, triageLevel: TriageLevel) => {
  return createRoleNotification(
    'DOCTOR',
    'NEW EMERGENCY CASE',
    `Emergency case admitted: ${patientName} (Triage: ${triageLevel}, Visit ID: ${visitId})`,
    NotificationType.EMERGENCY_ALERT,
    NotificationPriority.URGENT,
    visitId,
    'VISIT',
    `/emergency/visits/${visitId}`
  );
};

// Helper: Notify about admission
export const notifyAdmission = async (patientName: string, ward: string, bedNumber: string, visitId: string) => {
  return createRoleNotification(
    'NURSE',
    'New Patient Admission',
    `Patient ${patientName} has been admitted to ${ward}, Bed ${bedNumber}. Attending doctor assigned. (Visit ID: ${visitId})`,
    NotificationType.ADMISSION_UPDATE,
    NotificationPriority.HIGH,
    visitId,
    'VISIT',
    `/admissions/${visitId}`
  );
};

// Helper: Notify about discharge
export const notifyDischarge = async (patientName: string, ward: string | null, bedNumber: string | null, visitId: string) => {
  const bedInfo = ward && bedNumber ? `from ${ward}, Bed ${bedNumber}` : '';
  return createRoleNotification(
    'CASHIER',
    'Patient Discharged',
    `Patient ${patientName} has been discharged ${bedInfo}. Final billing needs to be processed. (Visit ID: ${visitId})`,
    NotificationType.ADMISSION_UPDATE,
    NotificationPriority.NORMAL,
    visitId,
    'VISIT',
    `/billing/${visitId}`
  );
};