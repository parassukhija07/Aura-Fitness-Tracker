import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { capacitorStorage } from './capacitorStorage';

interface UserPreferencesState {
  darkMode: boolean;
  calendarStartOnMonday: boolean;
  toggleDarkMode: () => void;
  toggleCalendarStartOnMonday: () => void;
  setDarkMode: (value: boolean) => void;
  setCalendarStartOnMonday: (value: boolean) => void;
}

export const useUserPreferencesStore = create<UserPreferencesState>()(
  persist(
    immer((set) => ({
      darkMode: true,
      calendarStartOnMonday: true,

      toggleDarkMode: () =>
        set((state) => { state.darkMode = !state.darkMode; }),
      toggleCalendarStartOnMonday: () =>
        set((state) => { state.calendarStartOnMonday = !state.calendarStartOnMonday; }),
      setDarkMode: (value) =>
        set((state) => { state.darkMode = value; }),
      setCalendarStartOnMonday: (value) =>
        set((state) => { state.calendarStartOnMonday = value; }),
    })),
    {
      name: 'aura-user-preferences',
      storage: createJSONStorage(() => capacitorStorage),
      version: 1,
      partialize: (state) => ({
        darkMode: state.darkMode,
        calendarStartOnMonday: state.calendarStartOnMonday,
      }),
    }
  )
);
