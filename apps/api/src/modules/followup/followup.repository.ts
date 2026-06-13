import { prisma } from '../../config/database';
import { FollowUpStatus } from '@prisma/client';
import { CreateFollowUpInput, UpdateFollowUpInput } from './followup.validator';

export const createFollowUp = async (data: CreateFollowUpInput) => {
  return await prisma.followUp.create({
    data: {
      ...data,
      followUpDate: new Date(data.followUpDate),
    },
    include: {
      patient: true,
      assignedDoctor: true,
      visit: true,
    },
  });
};

export const getFollowUpById = async (id: string) => {
  return await prisma.followUp.findUnique({
    where: { id },
    include: {
      patient: true,
      assignedDoctor: true,
      visit: true,
    },
  });
};

export const getPatientFollowUps = async (patientId: string, limit?: number, offset?: number) => {
  const [followUps, total] = await Promise.all([
    prisma.followUp.findMany({
      where: { patientId },
      include: {
        assignedDoctor: true,
        visit: true,
      },
      orderBy: { followUpDate: 'desc' },
      take: limit,
      skip: offset,
    }),
    prisma.followUp.count({ where: { patientId } }),
  ]);

  return { data: followUps, total, limit, offset };
};

export const getDoctorFollowUps = async (doctorId: string, limit?: number, offset?: number) => {
  const [followUps, total] = await Promise.all([
    prisma.followUp.findMany({
      where: { 
        assignedDoctorId: doctorId,
        status: 'SCHEDULED',
        followUpDate: { gte: new Date() },
      },
      include: {
        patient: true,
        visit: true,
      },
      orderBy: { followUpDate: 'asc' },
      take: limit,
      skip: offset,
    }),
    prisma.followUp.count({ 
      where: { 
        assignedDoctorId: doctorId,
        status: 'SCHEDULED',
      },
    }),
  ]);

  return { data: followUps, total, limit, offset };
};

export const getUpcomingFollowUps = async (days: number = 7, limit?: number, offset?: number) => {
  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + days);

  const [followUps, total] = await Promise.all([
    prisma.followUp.findMany({
      where: {
        status: 'SCHEDULED',
        followUpDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        patient: true,
        assignedDoctor: true,
        visit: true,
      },
      orderBy: { followUpDate: 'asc' },
      take: limit,
      skip: offset,
    }),
    prisma.followUp.count({
      where: {
        status: 'SCHEDULED',
        followUpDate: {
          gte: startDate,
          lte: endDate,
        },
      },
    }),
  ]);

  return { data: followUps, total, limit, offset };
};

export const updateFollowUp = async (id: string, data: UpdateFollowUpInput, completedBy?: string) => {
  const updateData: any = { ...data };
  
  if (data.followUpDate) {
    updateData.followUpDate = new Date(data.followUpDate);
  }

  if (data.status === 'COMPLETED' && completedBy) {
    updateData.completedAt = new Date();
    updateData.completedBy = completedBy;
  }

  return await prisma.followUp.update({
    where: { id },
    data: updateData,
    include: {
      patient: true,
      assignedDoctor: true,
      visit: true,
    },
  });
};

export const deleteFollowUp = async (id: string) => {
  return await prisma.followUp.delete({
    where: { id },
  });
};

export const getAllFollowUps = async (status?: string, limit?: number, offset?: number) => {
  const validStatuses = ['SCHEDULED', 'COMPLETED', 'MISSED'];
  const where = status && validStatuses.includes(status) ? { status: status as FollowUpStatus } : {};
  
  const [followUps, total] = await Promise.all([
    prisma.followUp.findMany({
      where,
      include: {
        patient: true,
        assignedDoctor: true,
        visit: true,
      },
      orderBy: { followUpDate: 'desc' },
      take: limit,
      skip: offset,
    }),
    prisma.followUp.count({ where }),
  ]);

  return { data: followUps, total, limit, offset };
};