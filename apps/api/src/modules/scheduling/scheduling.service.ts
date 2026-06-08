import { 
  createStaffSchedule,
  findScheduleById,
  findSchedulesByUser,
  findSchedulesByDepartment,
  getAllSchedules,
  updateSchedule,
  deleteSchedule,
  createTimeOffRequest,
  findTimeOffRequestById,
  getPendingTimeOffRequests,
  findTimeOffByUser,
  approveTimeOffRequest,
  rejectTimeOffRequest,
  getSchedulingStats,
  checkScheduleConflict
} from './scheduling.repository';
import { ApiError } from '../../middlewares/errorHandler';
import type { 
  CreateScheduleInput, 
  CreateTimeOffInput
} from '@packages/types';
import { ListSchedulesInput } from './scheduling.validator';

// Schedule Service functions
export const addStaffSchedule = async (data: CreateScheduleInput) => {
  // Check for conflicts
  const hasConflict = await checkScheduleConflict(data.userId, data.shiftDate, data.shiftType);
  if (hasConflict) {
    throw new ApiError(409,'Schedule conflict: Staff member already has a shift at this time', 'SCHEDULE_CONFLICT');
  }
  
  const schedule = await createStaffSchedule(data);
  return schedule;
};

export const getSchedule = async (id: string) => {
  const schedule = await findScheduleById(id);
  if (!schedule) {
    throw new ApiError(404,'Schedule not found', 'NOT_FOUND');
  }
  return schedule;
};

export const getSchedulesForUser = async (userId: string, startDate?: string, endDate?: string) => {
  return findSchedulesByUser(userId, startDate, endDate);
};

export const getSchedulesForDepartment = async (department: string, date: string) => {
  return findSchedulesByDepartment(department, date);
};

export const listSchedules = async (input: ListSchedulesInput) => {
  const page = input.page || 1;
  const limit = input.limit || 20;
  const skip = (page - 1) * limit;
  
  const filters = {
    startDate: input.startDate,
    endDate: input.endDate,
    department: input.department
  };
  
  const { schedules, total } = await getAllSchedules(skip, limit, filters);
  
  return {
    schedules,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1
    }
  };
};

export const updateStaffSchedule = async (id: string, data: Partial<CreateScheduleInput>) => {
  const existing = await findScheduleById(id);
  if (!existing) {
    throw new ApiError(404,'Schedule not found', 'NOT_FOUND');
  }
  
  // If we're changing date/shift, check for conflicts
  if (data.shiftDate || data.shiftType) {
    const newDate = data.shiftDate || existing.shiftDate;
    const newType = data.shiftType || existing.shiftType;
    const userId = data.userId || existing.userId;
    
    const hasConflict = await checkScheduleConflict(userId, newDate, newType);
    if (hasConflict && (data.shiftDate || data.shiftType)) {
      // Only throw if we're actually modifying these fields
      throw new ApiError(409,'Schedule conflict: Staff member already has a shift at this time', 'SCHEDULE_CONFLICT');
    }
  }
  
  return updateSchedule(id, data);
};

export const removeSchedule = async (id: string) => {
  const existing = await findScheduleById(id);
  if (!existing) {
    throw new ApiError(404,'Schedule not found', 'NOT_FOUND');
  }
  
  await deleteSchedule(id);
  return { success: true };
};

// Time Off Request Service functions
export const submitTimeOffRequest = async (data: CreateTimeOffInput, userId: string) => {
  const request = await createTimeOffRequest(data, userId);
  return request;
};

export const getTimeOffRequest = async (id: string) => {
  const request = await findTimeOffRequestById(id);
  if (!request) {
    throw new ApiError(404,'Time off request not found', 'NOT_FOUND');
  }
  return request;
};

export const getPendingRequests = async () => {
  return getPendingTimeOffRequests();
};

export const getTimeOffForUser = async (userId: string) => {
  return findTimeOffByUser(userId);
};

export const processTimeOffRequest = async (id: string, action: 'APPROVE' | 'REJECTED', approverId: string) => {
  const existing = await findTimeOffRequestById(id);
  if (!existing) {
    throw new ApiError(404,'Time off request not found', 'NOT_FOUND');
  }
  
  if (existing.status !== 'PENDING') {
    throw new ApiError(400,'Request has already been processed', 'REQUEST_ALREADY_PROCESSED');
  }
  
  if (action === 'APPROVE') {
    return approveTimeOffRequest(id, approverId);
  } else {
    return rejectTimeOffRequest(id, approverId);
  }
};

// Dashboard statistics
export const getSchedulingDashboardStats = async () => {
  return getSchedulingStats();
};
