import api from './api';

export interface DutyRoster {
  id: string;
  staffId: string;
  startTime: string;
  endTime: string;
}

export const getDutyRosters = async (): Promise<DutyRoster[]> => {
  const response = await api.get('/duty-roster');
  return response.data;
};

export const createDutyRoster = async (data: Omit<DutyRoster, 'id'>): Promise<DutyRoster> => {
  const response = await api.post('/duty-roster', data);
  return response.data;
};

export const updateDutyRoster = async (id: string, data: Partial<DutyRoster>): Promise<DutyRoster> => {
  const response = await api.put(`/duty-roster/${id}`, data);
  return response.data;
};

export const deleteDutyRoster = async (id: string): Promise<void> => {
  await api.delete(`/duty-roster/${id}`);
};