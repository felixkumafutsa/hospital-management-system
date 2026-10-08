import create from 'zustand';
import { User, getUsers } from '../services/userService';

interface UserState {
  users: User[];
  loading: boolean;
  error: string | null;
  fetchUsers: () => Promise<void>;
}

export const useUserStore = create<UserState>((set) => ({
  users: [],
  loading: false,
  error: null,
  fetchUsers: async () => {
    set({ loading: true, error: null });
    try {
      const response = await getUsers();
      set({ users: response, loading: false });
    } catch (error) {
      set({ loading: false, error: 'Failed to fetch users' });
    }
  },
}));