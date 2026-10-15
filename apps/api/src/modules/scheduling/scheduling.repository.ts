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

interface ScheduleWhereClause {
  userId: string;
  shiftDate?: {
    gte: string;
    lte: string;
  };
}

export const findSchedulesByUser = async (userId: string, startDate?: string, endDate?: string) => {
  const whereClause: ScheduleWhereClause = { userId };
  
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

interface ScheduleFilters {
  startDate?: string;
  endDate?: string;
  department?: string;
}

interface AllSchedulesWhereClause {
  shiftDate?: {
    gte: string;
    lte: string;
  };
  department?: string;
}

export const getAllSchedules = async (skip: number, take: number, filters?: ScheduleFilters) => {
  const whereClause: AllSchedulesWhereClause = {};
  
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
  const updateData: Partial<CreateScheduleInput> = {
    ...(data.shiftDate && { shiftDate: new Date(data.shiftDate).toISOString() }),
    ...(data.shiftType && { shiftType: data.shiftType }),
    ...(data.startTime && { startTime: data.startTime }),
    ...(data.endTime && { endTime: data.endTime }),
    ...(data.department !== undefined && { department: data.department || undefined }),
    ...(data.notes !== undefined && { notes: data.notes || undefined }),
  };
  
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

interface ScheduleConflictWhereClause {
  userId: string;
  shiftDate: string;
  shiftType: ShiftType;
  id?: {
    not: string;
  };
}

export const checkScheduleConflict = async (
  userId: string,
  shiftDate: string,
  shiftType: ShiftType,
  excludeScheduleId?: string
) => {
  const where: ScheduleConflictWhereClause = {
    userId,
    shiftDate,
    shiftType,
  };

  if (excludeScheduleId) {
    where.id = { not: excludeScheduleId };
  }

  const existing = await prisma.staffSchedule.findFirst({
    where: {
      ...where,
      shiftDate: new Date(shiftDate),
    },
  });
  return !!existing;
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
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  const onLeave = await prisma.timeOffRequest.count({
    where: {
      status: 'APPROVED',
      startDate: { lte: today },
      endDate: { gte: today },
    },
  });
  
  // This is a placeholder. You need to map shift types to hours.
  const hours = await prisma.staffSchedule.findMany({
    where: {
      shiftDate: {
        gte: startOfWeek,
        lte: endOfWeek,
      },
    },
  });
  
  const totalHours = hours.reduce((acc, s) => {
    if (s.shiftType === ShiftType.DAY) return acc + 8;
    if (s.shiftType === ShiftType.MORNING || s.shiftType === ShiftType.AFTERNOON) return acc + 4;
    if (s.shiftType === ShiftType.NIGHT) return acc + 12;
    return acc;
  }, 0);


  const upcomingShifts = await prisma.staffSchedule.count({
    where: {
      shiftDate: {
        gte: today,
      },
    },
  });

  return {
    onLeave,
    weeklyHours: totalHours,
    upcomingShifts,
  };
};