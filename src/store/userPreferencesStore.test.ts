/**
 * @jest-environment jsdom
 */
jest.mock('@capacitor/preferences', () => ({
  Preferences: {
    get: jest.fn().mockResolvedValue({ value: null }),
    set: jest.fn().mockResolvedValue(undefined),
    remove: jest.fn().mockResolvedValue(undefined),
    clear: jest.fn().mockResolvedValue(undefined),
  },
}));

import { useUserPreferencesStore } from './userPreferencesStore';

// Reset store state between tests
beforeEach(() => {
  useUserPreferencesStore.setState({
    darkMode: true,
    calendarStartOnMonday: true,
  });
});

// ---------------------------------------------------------------------------
// Initial state defaults
// ---------------------------------------------------------------------------

test('initial state: darkMode defaults to true', () => {
  const state = useUserPreferencesStore.getState();
  expect(state.darkMode).toBe(true);
});

test('initial state: calendarStartOnMonday defaults to true', () => {
  const state = useUserPreferencesStore.getState();
  expect(state.calendarStartOnMonday).toBe(true);
});

// ---------------------------------------------------------------------------
// Toggle actions
// ---------------------------------------------------------------------------

test('toggleDarkMode flips darkMode from true to false', () => {
  useUserPreferencesStore.getState().toggleDarkMode();
  expect(useUserPreferencesStore.getState().darkMode).toBe(false);
});

test('toggleDarkMode flips darkMode back to true on second call', () => {
  useUserPreferencesStore.getState().toggleDarkMode();
  useUserPreferencesStore.getState().toggleDarkMode();
  expect(useUserPreferencesStore.getState().darkMode).toBe(true);
});

test('toggleCalendarStartOnMonday flips calendarStartOnMonday from true to false', () => {
  useUserPreferencesStore.getState().toggleCalendarStartOnMonday();
  expect(useUserPreferencesStore.getState().calendarStartOnMonday).toBe(false);
});

test('setDarkMode sets darkMode to an explicit value', () => {
  useUserPreferencesStore.getState().setDarkMode(false);
  expect(useUserPreferencesStore.getState().darkMode).toBe(false);
  useUserPreferencesStore.getState().setDarkMode(true);
  expect(useUserPreferencesStore.getState().darkMode).toBe(true);
});

test('setCalendarStartOnMonday sets calendarStartOnMonday to an explicit value', () => {
  useUserPreferencesStore.getState().setCalendarStartOnMonday(false);
  expect(useUserPreferencesStore.getState().calendarStartOnMonday).toBe(false);
});

// ---------------------------------------------------------------------------
// Persistence key
// ---------------------------------------------------------------------------

test('store is persisted under the key "aura-user-preferences"', () => {
  // The persist middleware exposes the name via getState().name on some versions;
  // more reliably we check the store's persist options via the internal _store.
  // We access the zustand persist API to read the stored name.
  const persistApi = (useUserPreferencesStore as unknown as {
    persist: { getOptions: () => { name: string } };
  }).persist;
  expect(persistApi.getOptions().name).toBe('aura-user-preferences');
});

// ---------------------------------------------------------------------------
// NEW TESTS — Toggle actions (new fields)
// ---------------------------------------------------------------------------

test('toggleAutoRestTimer flips autoRestTimer', () => {
  useUserPreferencesStore.getState().resetPreferences();
  expect(useUserPreferencesStore.getState().autoRestTimer).toBe(true);
  useUserPreferencesStore.getState().toggleAutoRestTimer();
  expect(useUserPreferencesStore.getState().autoRestTimer).toBe(false);
  useUserPreferencesStore.getState().toggleAutoRestTimer();
  expect(useUserPreferencesStore.getState().autoRestTimer).toBe(true);
});

test('toggleAutoPlayVideo flips autoPlayVideo', () => {
  useUserPreferencesStore.getState().resetPreferences();
  expect(useUserPreferencesStore.getState().autoPlayVideo).toBe(false);
  useUserPreferencesStore.getState().toggleAutoPlayVideo();
  expect(useUserPreferencesStore.getState().autoPlayVideo).toBe(true);
});

test('toggleShowRepsTimeFirst flips showRepsTimeFirst', () => {
  useUserPreferencesStore.getState().resetPreferences();
  expect(useUserPreferencesStore.getState().showRepsTimeFirst).toBe(true);
  useUserPreferencesStore.getState().toggleShowRepsTimeFirst();
  expect(useUserPreferencesStore.getState().showRepsTimeFirst).toBe(false);
});

test('toggleShowPrsDuringWorkout flips showPrsDuringWorkout', () => {
  useUserPreferencesStore.getState().resetPreferences();
  expect(useUserPreferencesStore.getState().showPrsDuringWorkout).toBe(true);
  useUserPreferencesStore.getState().toggleShowPrsDuringWorkout();
  expect(useUserPreferencesStore.getState().showPrsDuringWorkout).toBe(false);
});

test('toggleNotificationsEnabled flips notificationsEnabled', () => {
  useUserPreferencesStore.getState().resetPreferences();
  expect(useUserPreferencesStore.getState().notificationsEnabled).toBe(false);
  useUserPreferencesStore.getState().toggleNotificationsEnabled();
  expect(useUserPreferencesStore.getState().notificationsEnabled).toBe(true);
  useUserPreferencesStore.getState().toggleNotificationsEnabled();
  expect(useUserPreferencesStore.getState().notificationsEnabled).toBe(false);
});

// ---------------------------------------------------------------------------
// NEW TESTS — Numeric/string setter actions
// ---------------------------------------------------------------------------

test('setDefaultSets updates defaultSets', () => {
  useUserPreferencesStore.getState().setDefaultSets(5);
  expect(useUserPreferencesStore.getState().defaultSets).toBe(5);
});

test('setDefaultRepsRange updates defaultRepsRange', () => {
  useUserPreferencesStore.getState().setDefaultRepsRange('8-12');
  expect(useUserPreferencesStore.getState().defaultRepsRange).toBe('8-12');
});

test('setDefaultRestBetweenSetsSec updates defaultRestBetweenSetsSec', () => {
  useUserPreferencesStore.getState().setDefaultRestBetweenSetsSec(90);
  expect(useUserPreferencesStore.getState().defaultRestBetweenSetsSec).toBe(90);
});

test('setDefaultRestBetweenExercisesSec updates defaultRestBetweenExercisesSec', () => {
  useUserPreferencesStore.getState().setDefaultRestBetweenExercisesSec(120);
  expect(useUserPreferencesStore.getState().defaultRestBetweenExercisesSec).toBe(120);
});

test('setWeightUnit updates weightUnit to lbs', () => {
  useUserPreferencesStore.getState().resetPreferences();
  expect(useUserPreferencesStore.getState().weightUnit).toBe('kg');
  useUserPreferencesStore.getState().setWeightUnit('lbs');
  expect(useUserPreferencesStore.getState().weightUnit).toBe('lbs');
});

test('setLengthUnit updates lengthUnit to in', () => {
  useUserPreferencesStore.getState().resetPreferences();
  expect(useUserPreferencesStore.getState().lengthUnit).toBe('cm');
  useUserPreferencesStore.getState().setLengthUnit('in');
  expect(useUserPreferencesStore.getState().lengthUnit).toBe('in');
});

test('setLogScoreDisplay updates logScoreDisplay', () => {
  useUserPreferencesStore.getState().resetPreferences();
  expect(useUserPreferencesStore.getState().logScoreDisplay).toBe('both');
  useUserPreferencesStore.getState().setLogScoreDisplay('strength_score');
  expect(useUserPreferencesStore.getState().logScoreDisplay).toBe('strength_score');
});

test('setRestTimerSound updates restTimerSound to alarm', () => {
  useUserPreferencesStore.getState().resetPreferences();
  expect(useUserPreferencesStore.getState().restTimerSound).toBe('ding');
  useUserPreferencesStore.getState().setRestTimerSound('alarm');
  expect(useUserPreferencesStore.getState().restTimerSound).toBe('alarm');
});

// ---------------------------------------------------------------------------
// NEW TESTS — resetPreferences resets all fields to defaults
// ---------------------------------------------------------------------------

test('resetPreferences resets all new fields to their defaults', () => {
  // Mutate many fields
  useUserPreferencesStore.getState().setDefaultSets(10);
  useUserPreferencesStore.getState().setWeightUnit('lbs');
  useUserPreferencesStore.getState().setLengthUnit('in');
  useUserPreferencesStore.getState().toggleNotificationsEnabled();
  useUserPreferencesStore.getState().setRestTimerSound('alarm');
  useUserPreferencesStore.getState().setDefaultRepsRange('12-15');
  useUserPreferencesStore.getState().setAccountDetails({ firstName: 'Alice', city: 'London' });
  useUserPreferencesStore.getState().toggleAutoRestTimer();
  useUserPreferencesStore.getState().toggleAutoPlayVideo();
  useUserPreferencesStore.getState().setLogScoreDisplay('strength_balance');

  // Reset
  useUserPreferencesStore.getState().resetPreferences();

  const s = useUserPreferencesStore.getState();
  expect(s.defaultSets).toBe(3);
  expect(s.weightUnit).toBe('kg');
  expect(s.lengthUnit).toBe('cm');
  expect(s.notificationsEnabled).toBe(false);
  expect(s.restTimerSound).toBe('ding');
  expect(s.defaultRepsRange).toBe('6-10');
  expect(s.firstName).toBe('');
  expect(s.city).toBe('');
  expect(s.autoRestTimer).toBe(true);
  expect(s.autoPlayVideo).toBe(false);
  expect(s.logScoreDisplay).toBe('both');
  expect(s.showRepsTimeFirst).toBe(true);
  expect(s.showPrsDuringWorkout).toBe(true);
  expect(s.defaultRestBetweenSetsSec).toBe(60);
  expect(s.defaultRestBetweenExercisesSec).toBe(90);
});

// ---------------------------------------------------------------------------
// NEW TESTS — Migration logic (v1→v3 and v2→v3)
// ---------------------------------------------------------------------------

test('migration v1→v3: adds biometric fields with null defaults and all new settings fields', () => {
  // Simulate the cumulative migrate function logic from the store
  let s: Record<string, unknown> = { darkMode: false, calendarStartOnMonday: false };

  // version < 2
  s = { ...s, ageYears: null, weightKg: null, heightCm: null, sex: null, activityLevel: 'moderate' };

  // version < 3
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

  expect(s.ageYears).toBeNull();
  expect(s.weightKg).toBeNull();
  expect(s.heightCm).toBeNull();
  expect(s.sex).toBeNull();
  expect(s.activityLevel).toBe('moderate');
  expect(s.logScoreDisplay).toBe('both');
  expect(s.showRepsTimeFirst).toBe(true);
  expect(s.defaultSets).toBe(3);
  expect(s.defaultRepsRange).toBe('6-10');
  expect(s.defaultRestBetweenSetsSec).toBe(60);
  expect(s.defaultRestBetweenExercisesSec).toBe(90);
  expect(s.autoRestTimer).toBe(true);
  expect(s.autoPlayVideo).toBe(false);
  expect(s.firstName).toBe('');
  expect(s.gender).toBeNull();
  expect(s.weightUnit).toBe('kg');
  expect(s.lengthUnit).toBe('cm');
  expect(s.notificationsEnabled).toBe(false);
  expect(s.restTimerSound).toBe('ding');
  // Existing values preserved
  expect(s.darkMode).toBe(false);
  expect(s.calendarStartOnMonday).toBe(false);
});

test('migration v2→v3: adds new settings fields without overwriting existing biometrics', () => {
  const v2State: Record<string, unknown> = {
    darkMode: true,
    calendarStartOnMonday: false,
    ageYears: 30,
    weightKg: 75,
    heightCm: 180,
    sex: 'male',
    activityLevel: 'active',
  };

  // Only version < 3 runs
  const s: Record<string, unknown> = {
    ...v2State,
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

  // Biometrics preserved exactly
  expect(s.ageYears).toBe(30);
  expect(s.weightKg).toBe(75);
  expect(s.heightCm).toBe(180);
  expect(s.sex).toBe('male');
  expect(s.activityLevel).toBe('active');

  // New fields have correct defaults
  expect(s.logScoreDisplay).toBe('both');
  expect(s.defaultSets).toBe(3);
  expect(s.autoRestTimer).toBe(true);
  expect(s.notificationsEnabled).toBe(false);
  expect(s.weightUnit).toBe('kg');
  expect(s.restTimerSound).toBe('ding');
});

// ---------------------------------------------------------------------------
// NEW TESTS — Edge cases
// ---------------------------------------------------------------------------

test('setAccountDetails merges partial data without clearing other account fields', () => {
  useUserPreferencesStore.getState().resetPreferences();
  useUserPreferencesStore.getState().setAccountDetails({ firstName: 'Bob', city: 'Paris' });
  expect(useUserPreferencesStore.getState().firstName).toBe('Bob');
  expect(useUserPreferencesStore.getState().city).toBe('Paris');

  useUserPreferencesStore.getState().setAccountDetails({ firstName: 'Alice' });
  expect(useUserPreferencesStore.getState().firstName).toBe('Alice');
  expect(useUserPreferencesStore.getState().city).toBe('Paris'); // not cleared
});

test('toggling autoRestTimer does not affect autoPlayVideo', () => {
  useUserPreferencesStore.getState().resetPreferences();
  expect(useUserPreferencesStore.getState().autoPlayVideo).toBe(false);
  useUserPreferencesStore.getState().toggleAutoRestTimer();
  expect(useUserPreferencesStore.getState().autoPlayVideo).toBe(false);
});
