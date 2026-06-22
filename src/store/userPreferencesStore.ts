import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { capacitorStorage } from './capacitorStorage';

function clampInt(value: number, min: number, max: number, fallback: number): number {
  const n = Math.round(Number(value));
  if (Number.isNaN(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

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

  // ── Connected apps ────────────────────────────────────────────────────────
  appleHealthEnabled: boolean;
  googleHealthEnabled: boolean;

  // ── Gap F: Nutrition target weight ───────────────────────────────────────
  targetWeightKg: number | null;

  // ── Gap G: Profile photo ──────────────────────────────────────────────────
  avatarDataUrl: string | null;

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
  toggleAppleHealth: () => void;
  toggleGoogleHealth: () => void;
  resetPreferences: () => void;

  // ── Gap F/G new actions ───────────────────────────────────────────────────
  setTargetWeight: (value: number | null) => void;
  setAvatar: (dataUrl: string | null) => void;
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
  appleHealthEnabled: false,
  googleHealthEnabled: false,
  targetWeightKg: null as number | null,
  avatarDataUrl: null as string | null,
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
        set((state) => { state.defaultSets = clampInt(value, 1, 10, state.defaultSets); }),
      setDefaultRepsRange: (value) =>
        set((state) => { state.defaultRepsRange = value; }),
      setDefaultRestBetweenSetsSec: (value) =>
        set((state) => { state.defaultRestBetweenSetsSec = clampInt(value, 10, 600, state.defaultRestBetweenSetsSec); }),
      setDefaultRestBetweenExercisesSec: (value) =>
        set((state) => { state.defaultRestBetweenExercisesSec = clampInt(value, 10, 600, state.defaultRestBetweenExercisesSec); }),
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
      toggleAppleHealth: () =>
        set((state) => { state.appleHealthEnabled = !state.appleHealthEnabled; }),
      toggleGoogleHealth: () =>
        set((state) => { state.googleHealthEnabled = !state.googleHealthEnabled; }),
      resetPreferences: () =>
        set((state) => { Object.assign(state, DEFAULTS); }),

      // Gap F
      setTargetWeight: (value) =>
        set((state) => { state.targetWeightKg = value; }),

      // Gap G
      setAvatar: (dataUrl) =>
        set((state) => { state.avatarDataUrl = dataUrl; }),
    })),
    {
      name: 'aura-user-preferences',
      storage: createJSONStorage(() => capacitorStorage),
      version: 5,
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
        if (version < 4) {
          s = { ...s, appleHealthEnabled: false, googleHealthEnabled: false };
        }
        if (version < 5) {
          s = { ...s, targetWeightKg: null, avatarDataUrl: null };
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
        appleHealthEnabled: state.appleHealthEnabled,
        googleHealthEnabled: state.googleHealthEnabled,
        targetWeightKg: state.targetWeightKg,
        avatarDataUrl: state.avatarDataUrl,
      }),
    }
  )
);
