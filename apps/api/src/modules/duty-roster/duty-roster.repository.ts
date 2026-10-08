import { DutyRoster } from '@prisma/client';
import { prisma } from '../../config/database';

export const create = async (data: Omit<DutyRoster, 'id' | 'createdAt' | 'updatedAt'>): Promise<DutyRoster> => {
  return prisma.dutyRoster.create({ data });
};

export const findById = async (id: string): Promise<DutyRoster | null> => {
  return prisma.dutyRoster.findUnique({ where: { id } });
};

export const findAll = async (): Promise<DutyRoster[]> => {
  return prisma.dutyRoster.findMany();
};

export const findOnDutyDoctors = async (at: Date = new Date()) => {
  return prisma.dutyRoster.findMany({
    where: {
      startTime: { lte: at },
      endTime: { gte: at },
      staff: {
        isActive: true,
        role: { name: 'DOCTOR' },
      },
    },
    include: {
      staff: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
    orderBy: { startTime: 'asc' },
  });
};

export const getDoctorQueueLoads = async (doctorIds: string[], from: Date, to: Date) => {
  if (doctorIds.length === 0) return new Map<string, number>();

  const appointments = await prisma.appointment.groupBy({
    by: ['doctorId'],
    where: {
      doctorId: { in: doctorIds },
      appointmentDate: { gte: from, lt: to },
      status: { in: ['SCHEDULED', 'CONFIRMED', 'CHECKED_IN'] },
    },
    _count: { _all: true },
  });

  return new Map(
    appointments.map((appointment) => [appointment.doctorId as string, appointment._count._all])
  );
};

export const update = async (id: string, data: Partial<DutyRoster>): Promise<DutyRoster | null> => {
  return prisma.dutyRoster.update({ where: { id }, data });
};

export const remove = async (id: string): Promise<DutyRoster | null> => {
  return prisma.dutyRoster.delete({ where: { id } });
};