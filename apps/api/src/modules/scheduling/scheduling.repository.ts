import { prisma } from '../../config/database';
import { ShiftType } from '@prisma/client';
import type { CreateScheduleInput, CreateTimeOffInput } from '@packages/types';

// Staff Schedule operations
export const createStaffSchedule = async (data: CreateScheduleInput) => {
  return prisma.staffSchedule.create({
    data: {
      userId: data.userId,
      shiftDate: new Date(data.shiftDate),
      shiftType: data.shiftType,
      startTime: data.startTime,
      endTime: data.endTime,
      department: data.department || null,
      notes: data.notes || null
    },
    include: {
      staff: {
        select: {
          id: true,
          staffId: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true
        }
      }
    }
  });
};

export const findScheduleById = async (id: string) => {
  return prisma.staffSchedule.findUnique({
    where: { id },
    include: {
      staff: {
        select: {
          id: true,
          staffId: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true
        }
      }
    }
  });
};

export const findSchedulesByUser = async (userId: string, startDate?: string, endDate?: string) => {
  const whereClause: any = { userId };
  
  if (startDate && endDate) {
    whereClause.shiftDate = {
      gte: startDate,
      lte: endDate
    };
  }
  
  return prisma.staffSchedule.findMany({
    where: whereClause,
    orderBy: { shiftDate: 'asc' },
    include: {
      staff: {
        select: {
          id: true,
          staffId: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true
        }
      }
    }
  });
};

export const findSchedulesByDepartment = async (department: string, date: string) => {
  return prisma.staffSchedule.findMany({
    where: {
      department,
      shiftDate: date
    },
    orderBy: { shiftType: 'asc' },
    include: {
      staff: {
        select: {
          id: true,
          staffId: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true
        }
      }
    }
  });
};

export const getAllSchedules = async (skip: number, take: number, filters?: any) => {
  const whereClause: any = {};
  
  if (filters?.startDate && filters?.endDate) {
    whereClause.shiftDate = {
      gte: filters.startDate,
      lte: filters.endDate
    };
  }
  
  if (filters?.department) {
    whereClause.department = filters.department;
  }
  
  const [schedules, total] = await Promise.all([
    prisma.staffSchedule.findMany({
      skip,
      take,
      where: whereClause,
      orderBy: { shiftDate: 'desc' },
      include: {
        staff: {
          select: {
            id: true,
            staffId: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true
          }
        }
      }
    }),
    prisma.staffSchedule.count({ where: whereClause })
  ]);
  
  return { schedules, total };
};

export const updateSchedule = async (id: string, data: Omit<Partial<CreateScheduleInput>, 'userId'>) => {
  const updateData: any = {};
  if (data.shiftDate) updateData.shiftDate = new Date(data.shiftDate);
  if (data.shiftType) updateData.shiftType = data.shiftType;
  if (data.startTime) updateData.startTime = data.startTime;
  if (data.endTime) updateData.endTime = data.endTime;
  if (data.department !== undefined) updateData.department = data.department || null;
  if (data.notes !== undefined) updateData.notes = data.notes || null;
  
  return prisma.staffSchedule.update({
    where: { id },
    data: updateData,
    include: {
      staff: true
    }
  });
};

export const deleteSchedule = async (id: string) => {
  return prisma.staffSchedule.delete({
    where: { id }
  });
};

// Time Off Request operations
export const createTimeOffRequest = async (data: CreateTimeOffInput, userId: string) => {
  return prisma.timeOffRequest.create({
    data: {
      ...data,
      userId,
      status: 'PENDING'
    },
    include: {
      staff: {
        select: {
          id: true,
          staffId: true,
          firstName: true,
          lastName: true,
          email: true
        }
      }
    }
  });
};

export const findTimeOffRequestById = async (id: string) => {
  return prisma.timeOffRequest.findUnique({
    where: { id },
    include: {
      staff: true
    }
  });
};

export const getPendingTimeOffRequests = async () => {
  return prisma.timeOffRequest.findMany({
    where: { status: 'PENDING' },
    orderBy: { createdAt: 'asc' },
    include: {
      staff: {
        select: {
          id: true,
          staffId: true,
          firstName: true,
          lastName: true,
          email: true
        }
      }
    }
  });
};

export const findTimeOffByUser = async (userId: string) => {
  return prisma.timeOffRequest.findMany({
    where: { userId },
    orderBy: { startDate: 'desc' },
    include: {
      staff: true
    }
  });
};

export const approveTimeOffRequest = async (id: string, approverId: string) => {
  return prisma.timeOffRequest.update({
    where: { id },
    data: {
      status: 'APPROVED',
      approverId,
      approvedAt: new Date()
    },
    include: {
      staff: true
    }
  });
};

export const rejectTimeOffRequest = async (id: string, approverId: string) => {
  return prisma.timeOffRequest.update({
    where: { id },
    data: {
      status: 'REJECTED',
      approverId,
      approvedAt: new Date()
    },
    include: {
      staff: true
    }
  });
};

// Get scheduling statistics
export const getSchedulingStats = async () => {
  const today = new Date().toISOString().split('T')[0];
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
  
  const [todaysSchedules, pendingRequests, thisMonthSchedules] = await Promise.all([
    prisma.staffSchedule.count({
      where: { shiftDate: today }
    }),
    prisma.timeOffRequest.count({
      where: { status: 'PENDING' }
    }),
    prisma.staffSchedule.count({
      where: {
        shiftDate: {
          gte: startOfMonth
        }
      }
    })
  ]);

  return {
    staffOnDutyToday: todaysSchedules,
    pendingTimeOffRequests: pendingRequests,
    totalSchedulesThisMonth: thisMonthSchedules
  };
};

// Check for schedule conflicts
export const checkScheduleConflict = async (userId: string, shiftDate: string, shiftType: ShiftType) => {
  const existing = await prisma.staffSchedule.findFirst({
    where: {
      userId,
      shiftDate: new Date(shiftDate),
      shiftType
    }
  });
  
  return !!existing;
};