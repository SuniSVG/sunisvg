import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AppState {
  // Pomodoro State
  pomodoroTimeLeft: number;
  pomodoroIsActive: boolean;
  pomodoroMode: 'work' | 'break';
  setPomodoroTimeLeft: (time: number) => void;
  setPomodoroIsActive: (isActive: boolean) => void;
  setPomodoroMode: (mode: 'work' | 'break') => void;
  resetPomodoro: () => void;

  // Quick Note State
  quickNote: string;
  setQuickNote: (note: string) => void;
}

const DEFAULT_WORK_TIME = 25 * 60;

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      pomodoroTimeLeft: DEFAULT_WORK_TIME,
      pomodoroIsActive: false,
      pomodoroMode: 'work',
      setPomodoroTimeLeft: (time) => set({ pomodoroTimeLeft: time }),
      setPomodoroIsActive: (isActive) => set({ pomodoroIsActive: isActive }),
      setPomodoroMode: (mode) => set({ pomodoroMode: mode }),
      resetPomodoro: () => set({ pomodoroTimeLeft: DEFAULT_WORK_TIME, pomodoroIsActive: false, pomodoroMode: 'work' }),

      quickNote: '',
      setQuickNote: (note) => set({ quickNote: note }),
    }),
    {
      name: 'edifyx-app-storage',
      partialize: (state) => ({ quickNote: state.quickNote }), // Only persist quickNote
    }
  )
);
