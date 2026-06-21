import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { capacitorStorage } from './capacitorStorage';

export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';

interface UserPreferencesState {
  darkMode: boolean;
  calendarStartOnMonday: boolean;
  ageYears: number | null;
  weightKg: number | null;
  heightCm: number | null;
  sex: 'male' | 'female' | null;
  activityLevel: ActivityLevel;
  toggleDarkMode: () => void;
  toggleCalendarStartOnMonday: () => void;
  setDarkMode: (value: boolean) => void;
  setCalendarStartOnMonday: (value: boolean) => void;
  setBiometrics: (data: Partial<{ ageYears: number | null; weightKg: number | null; heightCm: number | null; sex: 'male' | 'female' | null; activityLevel: ActivityLevel }>) => void;
}

export const useUserPreferencesStore = create<UserPreferencesState>()(
  persist(
    immer((set) => ({
      darkMode: true,
      calendarStartOnMonday: true,
      ageYears: null,
      weightKg: null,
      heightCm: null,
      sex: null,
      activityLevel: 'moderate' as ActivityLevel,

      toggleDarkMode: () =>
        set((state) => { state.darkMode = !state.darkMode; }),
      toggleCalendarStartOnMonday: () =>
        set((state) => { state.calendarStartOnMonday = !state.calendarStartOnMonday; }),
      setDarkMode: (value) =>
        set((state) => { state.darkMode = value; }),
      setCalendarStartOnMonday: (value) =>
        set((state) => { state.calendarStartOnMonday = value; }),
      setBiometrics: (data) =>
        set((state) => { Object.assign(state, data); }),
    })),
    {
      name: 'aura-user-preferences',
      storage: createJSONStorage(() => capacitorStorage),
      version: 2,
      migrate: (state: unknown, version: number) =>
        version < 2
          ? { ...(state as object), ageYears: null, weightKg: null, heightCm: null, sex: null, activityLevel: 'moderate' }
          : (state as UserPreferencesState),
      partialize: (state) => ({
        darkMode: state.darkMode,
        calendarStartOnMonday: state.calendarStartOnMonday,
        ageYears: state.ageYears,
        weightKg: state.weightKg,
        heightCm: state.heightCm,
        sex: state.sex,
        activityLevel: state.activityLevel,
      }),
    }
  )
);
