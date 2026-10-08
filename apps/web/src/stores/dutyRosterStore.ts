import { create } from "zustand";
import {
  DutyRoster,
  getDutyRosters,
  createDutyRoster,
  updateDutyRoster,
  deleteDutyRoster as deleteDutyRosterService,
} from "../services/dutyRosterService";

interface DutyRosterState {
  dutyRosters: DutyRoster[];
  loading: boolean;
  error: string | null;
  fetchDutyRosters: () => Promise<void>;
  addDutyRoster: (data: {
    staffId: string;
    startTime: string;
    endTime: string;
  }) => Promise<void>;
  editDutyRoster: (id: string, data: Partial<DutyRoster>) => Promise<void>;
  deleteDutyRoster: (id: string) => Promise<void>;
}

export const useDutyRosterStore = create<DutyRosterState>((set) => ({
  dutyRosters: [],
  loading: false,
  error: null,
  fetchDutyRosters: async () => {
    set({ loading: true, error: null });
    try {
      const dutyRosters = await getDutyRosters();
      set({ dutyRosters, loading: false });
    } catch (error) {
      set({ loading: false, error: "Failed to fetch duty rosters" });
    }
  },
  addDutyRoster: async (data) => {
    set({ loading: true, error: null });
    try {
      console.log('Sending duty roster data to backend:', data);
      const newDutyRoster = await createDutyRoster(data);
      set((state) => ({
        dutyRosters: [...state.dutyRosters, newDutyRoster],
        loading: false,
      }));
      console.log('Duty roster created successfully:', newDutyRoster);
    } catch (error: any) {
      console.error('Failed to add duty roster:', error.response?.data || error.message);
      // Log detailed validation errors if they exist
      if (error.response?.data?.errors) {
        console.error('Validation errors:', error.response.data.errors);
        // Create a user-friendly message from validation errors
        const firstError = error.response.data.errors[0];
        if (firstError) {
          set({ loading: false, error: `${firstError.field}: ${firstError.message}` });
          return;
        }
      }
      set({ loading: false, error: error.response?.data?.message || "Failed to add duty roster" });
    }
  },
  editDutyRoster: async (id, data) => {
    try {
      const updatedDutyRoster = await updateDutyRoster(id, data);
      set((state) => ({
        dutyRosters: state.dutyRosters.map((roster) =>
          roster.id === id ? updatedDutyRoster : roster
        ),
      }));
    } catch (error) {
      console.error("Failed to edit duty roster:", error);
    }
  },
  deleteDutyRoster: async (id) => {
    try {
      await deleteDutyRosterService(id);
      set((state) => ({
        dutyRosters: state.dutyRosters.filter((roster) => roster.id !== id),
      }));
    } catch (error) {
      console.error("Failed to delete duty roster:", error);
    }
  },
}));