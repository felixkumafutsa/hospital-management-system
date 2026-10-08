import { create } from 'zustand';

interface VisitDrawerState {
  isOpen: boolean;
  selectedVisitId: string | null;
  openDrawer: () => void;
  closeDrawer: () => void;
  selectVisit: (visitId: string) => void;
  clearSelectedVisit: () => void;
}

export const useVisitDrawerStore = create<VisitDrawerState>((set) => ({
  isOpen: false,
  selectedVisitId: null,
  openDrawer: () => set({ isOpen: true }),
  closeDrawer: () => set({ isOpen: false, selectedVisitId: null }),
  selectVisit: (visitId) => set({ selectedVisitId: visitId }),
  clearSelectedVisit: () => set({ selectedVisitId: null }),
}));