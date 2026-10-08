import { create } from 'zustand';

interface ConsultationDrawerState {
  isOpen: boolean;
  selectedConsultationId: string | null;
  openDrawer: () => void;
  closeDrawer: () => void;
  selectConsultation: (consultationId: string) => void;
  clearSelectedConsultation: () => void;
}

export const useConsultationDrawerStore = create<ConsultationDrawerState>((set) => ({
  isOpen: false,
  selectedConsultationId: null,
  openDrawer: () => set({ isOpen: true }),
  closeDrawer: () => set({ isOpen: false, selectedConsultationId: null }),
  selectConsultation: (consultationId) => set({ selectedConsultationId: consultationId }),
  clearSelectedConsultation: () => set({ selectedConsultationId: null }),
}));