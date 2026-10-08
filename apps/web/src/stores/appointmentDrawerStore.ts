import { create } from 'zustand';

interface AppointmentDrawerState {
  isDrawerOpen: boolean;
  selectedAppointmentId: string | null;
  openDrawer: () => void;
  closeDrawer: () => void;
  selectAppointment: (appointmentId: string) => void;
  clearSelectedAppointment: () => void;
}

export const useAppointmentDrawerStore = create<AppointmentDrawerState>((set) => ({
  isDrawerOpen: false,
  selectedAppointmentId: null,
  openDrawer: () => set({ isDrawerOpen: true }),
  closeDrawer: () => set({ isDrawerOpen: false, selectedAppointmentId: null }),
  selectAppointment: (appointmentId) => set({ selectedAppointmentId: appointmentId }),
  clearSelectedAppointment: () => set({ selectedAppointmentId: null }),
}));