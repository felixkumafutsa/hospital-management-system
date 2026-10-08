import * as dutyRosterRepository from './duty-roster.repository';
import { DutyRoster } from '@prisma/client';

export const createDutyRoster = async (data: Omit<DutyRoster, 'id' | 'createdAt' | 'updatedAt'>): Promise<DutyRoster> => {
  return dutyRosterRepository.create(data);
};

export const getDutyRosterById = async (id: string): Promise<DutyRoster | null> => {
  return dutyRosterRepository.findById(id);
};

export const getAllDutyRosters = async (): Promise<DutyRoster[]> => {
  return dutyRosterRepository.findAll();
};

export const updateDutyRosterById = async (id: string, data: Partial<DutyRoster>): Promise<DutyRoster | null> => {
  return dutyRosterRepository.update(id, data);
};

export const deleteDutyRosterById = async (id: string): Promise<DutyRoster | null> => {
  return dutyRosterRepository.remove(id);
};