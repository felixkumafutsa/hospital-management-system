import api from './api';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export const getUsers = async (): Promise<User[]> => {
  const response = await api.get('/users');
  // Handle both formats: direct array or wrapped in data property
  return Array.isArray(response.data) ? response.data : (response.data?.data || []);
};