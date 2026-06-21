import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { capacitorStorage } from './capacitorStorage';

export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';

interface UserPreferencesState {
  // ── Existing ──────────────────────────────────────────────────────────────
  darkMode: boolean;
  calendarStartOnMonday: boolean;
  ageYears: number | null;
  weightKg: number | null;
  heightCm: number | null;
  sex: 'male' | 'female' | null;
  activityLevel: ActivityLevel;

  // ── General ───────────────────────────────────────────────────────────────
  logScoreDisplay: 'strength_score' | 'strength_balance' | 'both';

  // ── Workout › Display ─────────────────────────────────────────────────────
  showRepsTimeFirst: boolean;
  showPrsDuringWorkout: boolean;

  // ── Workout › Exercise Targets ────────────────────────────────────────────
  defaultSets: number;
  defaultRepsRange: string;
  defaultRestBetweenSetsSec: number;
  defaultRestBetweenExercisesSec: number;

  // ── Workout › Automation ──────────────────────────────────────────────────
  autoRestTimer: boolean;
  autoPlayVideo: boolean;

  // ── Account Details ───────────────────────────────────────────────────────
  firstName: string;
  lastName: string;
  phone: string;
  birthday: string;
  gender: 'male' | 'female' | 'other' | null;
  country: string;
  city: string;
  stateRegion: string;

  // ── Units & Measurements ──────────────────────────────────────────────────
  weightUnit: 'kg' | 'lbs';
  lengthUnit: 'cm' | 'in';

  // ── Notifications ─────────────────────────────────────────────────────────
  notificationsEnabled: boolean;
  restTimerSound: 'ding' | 'alarm';

  // ── Existing Actions ──────────────────────────────────────────────────────
  toggleDarkMode: () => void;
  toggleCalendarStartOnMonday: () => void;
  setDarkMode: (value: boolean) => void;
  setCalendarStartOnMonday: (value: boolean) => void;
  setBiometrics: (data: Partial<{ ageYears: number | null; weightKg: number | null; heightCm: number | null; sex: 'male' | 'female' | null; activityLevel: ActivityLevel }>) => void;

  // ── New Actions ───────────────────────────────────────────────────────────
  setLogScoreDisplay: (value: 'strength_score' | 'strength_balance' | 'both') => void;
  toggleShowRepsTimeFirst: () => void;
  toggleShowPrsDuringWorkout: () => void;
  setDefaultSets: (value: number) => void;
  setDefaultRepsRange: (value: string) => void;
  setDefaultRestBetweenSetsSec: (value: number) => void;
  setDefaultRestBetweenExercisesSec: (value: number) => void;
  toggleAutoRestTimer: () => void;
  toggleAutoPlayVideo: () => void;
  setAccountDetails: (data: Partial<{
    firstName: string;
    lastName: string;
    phone: string;
    birthday: string;
    gender: 'male' | 'female' | 'other' | null;
    country: string;
    city: string;
    stateRegion: string;
  }>) => void;
  setWeightUnit: (value: 'kg' | 'lbs') => void;
  setLengthUnit: (value: 'cm' | 'in') => void;
  toggleNotificationsEnabled: () => void;
  setRestTimerSound: (value: 'ding' | 'alarm') => void;
  resetPreferences: () => void;
}

const DEFAULTS = {
  darkMode: true,
  calendarStartOnMonday: true,
  ageYears: null,
  weightKg: null,
  heightCm: null,
  sex: null,
  activityLevel: 'moderate' as ActivityLevel,
  logScoreDisplay: 'both' as const,
  showRepsTimeFirst: true,
  showPrsDuringWorkout: true,
  defaultSets: 3,
  defaultRepsRange: '6-10',
  defaultRestBetweenSetsSec: 60,
  defaultRestBetweenExercisesSec: 90,
  autoRestTimer: true,
  autoPlayVideo: false,
  firstName: '',
  lastName: '',
  phone: '',
  birthday: '',
  gender: null as 'male' | 'female' | 'other' | null,
  country: '',
  city: '',
  stateRegion: '',
  weightUnit: 'kg' as const,
  lengthUnit: 'cm' as const,
  notificationsEnabled: false,
  restTimerSound: 'ding' as const,
};

export const useUserPreferencesStore = create<UserPreferencesState>()(
  persist(
    immer((set) => ({
      // ── Initial State ──────────────────────────────────────────────────────
      ...DEFAULTS,

      // ── Existing Actions ───────────────────────────────────────────────────
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

      // ── New Actions ────────────────────────────────────────────────────────
      setLogScoreDisplay: (value) =>
        set((state) => { state.logScoreDisplay = value; }),
      toggleShowRepsTimeFirst: () =>
        set((state) => { state.showRepsTimeFirst = !state.showRepsTimeFirst; }),
      toggleShowPrsDuringWorkout: () =>
        set((state) => { state.showPrsDuringWorkout = !state.showPrsDuringWorkout; }),
      setDefaultSets: (value) =>
        set((state) => { state.defaultSets = value; }),
      setDefaultRepsRange: (value) =>
        set((state) => { state.defaultRepsRange = value; }),
      setDefaultRestBetweenSetsSec: (value) =>
        set((state) => { state.defaultRestBetweenSetsSec = value; }),
      setDefaultRestBetweenExercisesSec: (value) =>
        set((state) => { state.defaultRestBetweenExercisesSec = value; }),
      toggleAutoRestTimer: () =>
        set((state) => { state.autoRestTimer = !state.autoRestTimer; }),
      toggleAutoPlayVideo: () =>
        set((state) => { state.autoPlayVideo = !state.autoPlayVideo; }),
      setAccountDetails: (data) =>
        set((state) => { Object.assign(state, data); }),
      setWeightUnit: (value) =>
        set((state) => { state.weightUnit = value; }),
      setLengthUnit: (value) =>
        set((state) => { state.lengthUnit = value; }),
      toggleNotificationsEnabled: () =>
        set((state) => { state.notificationsEnabled = !state.notificationsEnabled; }),
      setRestTimerSound: (value) =>
        set((state) => { state.restTimerSound = value; }),
      resetPreferences: () =>
        set((state) => { Object.assign(state, DEFAULTS); }),
    })),
    {
      name: 'aura-user-preferences',
      storage: createJSONStorage(() => capacitorStorage),
      version: 3,
      migrate: (state: unknown, version: number) => {
        let s = state as Record<string, unknown>;
        if (version < 2) {
          s = { ...s, ageYears: null, weightKg: null, heightCm: null, sex: null, activityLevel: 'moderate' };
        }
        if (version < 3) {
          s = {
            ...s,
            logScoreDisplay: 'both',
            showRepsTimeFirst: true,
            showPrsDuringWorkout: true,
            defaultSets: 3,
            defaultRepsRange: '6-10',
            defaultRestBetweenSetsSec: 60,
            defaultRestBetweenExercisesSec: 90,
            autoRestTimer: true,
            autoPlayVideo: false,
            firstName: '',
            lastName: '',
            phone: '',
            birthday: '',
            gender: null,
            country: '',
            city: '',
            stateRegion: '',
            weightUnit: 'kg',
            lengthUnit: 'cm',
            notificationsEnabled: false,
            restTimerSound: 'ding',
          };
        }
        return s as unknown as UserPreferencesState;
      },
      partialize: (state) => ({
        darkMode: state.darkMode,
        calendarStartOnMonday: state.calendarStartOnMonday,
        ageYears: state.ageYears,
        weightKg: state.weightKg,
        heightCm: state.heightCm,
        sex: state.sex,
        activityLevel: state.activityLevel,
        logScoreDisplay: state.logScoreDisplay,
        showRepsTimeFirst: state.showRepsTimeFirst,
        showPrsDuringWorkout: state.showPrsDuringWorkout,
        defaultSets: state.defaultSets,
        defaultRepsRange: state.defaultRepsRange,
        defaultRestBetweenSetsSec: state.defaultRestBetweenSetsSec,
        defaultRestBetweenExercisesSec: state.defaultRestBetweenExercisesSec,
        autoRestTimer: state.autoRestTimer,
        autoPlayVideo: state.autoPlayVideo,
        firstName: state.firstName,
        lastName: state.lastName,
        phone: state.phone,
        birthday: state.birthday,
        gender: state.gender,
        country: state.country,
        city: state.city,
        stateRegion: state.stateRegion,
        weightUnit: state.weightUnit,
        lengthUnit: state.lengthUnit,
        notificationsEnabled: state.notificationsEnabled,
        restTimerSound: state.restTimerSound,
      }),
    }
  )
);
