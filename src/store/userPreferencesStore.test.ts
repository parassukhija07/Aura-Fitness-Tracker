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

test('setDefaultSets clamps out-of-range and NaN', () => {
  const a = useUserPreferencesStore.getState();
  a.setDefaultSets(99);
  expect(useUserPreferencesStore.getState().defaultSets).toBe(10);
  a.setDefaultSets(0);
  expect(useUserPreferencesStore.getState().defaultSets).toBe(1);
  a.setDefaultSets(3);
  a.setDefaultSets(NaN);
  expect(useUserPreferencesStore.getState().defaultSets).toBe(3); // fallback to current
});
test('setDefaultRestBetweenSetsSec clamps to [10,600]', () => {
  const a = useUserPreferencesStore.getState();
  a.setDefaultRestBetweenSetsSec(5);
  expect(useUserPreferencesStore.getState().defaultRestBetweenSetsSec).toBe(10);
  a.setDefaultRestBetweenSetsSec(9999);
  expect(useUserPreferencesStore.getState().defaultRestBetweenSetsSec).toBe(600);
});
test('setDefaultRestBetweenExercisesSec clamps to [10,600]', () => {
  const a = useUserPreferencesStore.getState();
  a.setDefaultRestBetweenExercisesSec(1);
  expect(useUserPreferencesStore.getState().defaultRestBetweenExercisesSec).toBe(10);
  a.setDefaultRestBetweenExercisesSec(1000);
  expect(useUserPreferencesStore.getState().defaultRestBetweenExercisesSec).toBe(600);
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

// Access the store's real migrate function via the persist API.
const migrate = (useUserPreferencesStore as unknown as {
  persist: { getOptions: () => { migrate: (s: unknown, v: number) => unknown } };
}).persist.getOptions().migrate;

test('migration v1→v3: real migrate adds biometric + all settings defaults, preserves existing', () => {
  const v1State = { darkMode: false, calendarStartOnMonday: false };
  const result = migrate(v1State, 1) as Record<string, unknown>;
  // biometrics (added by version < 2)
  expect(result.ageYears).toBeNull();
  expect(result.weightKg).toBeNull();
  expect(result.heightCm).toBeNull();
  expect(result.sex).toBeNull();
  expect(result.activityLevel).toBe('moderate');
  // settings (added by version < 3)
  expect(result.logScoreDisplay).toBe('both');
  expect(result.showRepsTimeFirst).toBe(true);
  expect(result.defaultSets).toBe(3);
  expect(result.defaultRepsRange).toBe('6-10');
  expect(result.defaultRestBetweenSetsSec).toBe(60);
  expect(result.defaultRestBetweenExercisesSec).toBe(90);
  expect(result.autoRestTimer).toBe(true);
  expect(result.autoPlayVideo).toBe(false);
  expect(result.firstName).toBe('');
  expect(result.gender).toBeNull();
  expect(result.weightUnit).toBe('kg');
  expect(result.lengthUnit).toBe('cm');
  expect(result.notificationsEnabled).toBe(false);
  expect(result.restTimerSound).toBe('ding');
  // existing preserved
  expect(result.darkMode).toBe(false);
  expect(result.calendarStartOnMonday).toBe(false);
});

test('migration v2→v3: real migrate adds settings without overwriting biometrics', () => {
  const v2State = {
    darkMode: true, calendarStartOnMonday: false,
    ageYears: 30, weightKg: 75, heightCm: 180, sex: 'male', activityLevel: 'active',
  };
  const result = migrate(v2State, 2) as Record<string, unknown>;
  // biometrics preserved exactly (version < 2 block must NOT run)
  expect(result.ageYears).toBe(30);
  expect(result.weightKg).toBe(75);
  expect(result.heightCm).toBe(180);
  expect(result.sex).toBe('male');
  expect(result.activityLevel).toBe('active');
  // settings defaults applied
  expect(result.logScoreDisplay).toBe('both');
  expect(result.defaultSets).toBe(3);
  expect(result.autoRestTimer).toBe(true);
  expect(result.notificationsEnabled).toBe(false);
  expect(result.weightUnit).toBe('kg');
  expect(result.restTimerSound).toBe('ding');
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

// ---------------------------------------------------------------------------
// Gap F — targetWeightKg default / set / migration
// ---------------------------------------------------------------------------

test('targetWeightKg defaults to null', () => {
  useUserPreferencesStore.getState().resetPreferences();
  expect(useUserPreferencesStore.getState().targetWeightKg).toBeNull();
});

test('setTargetWeight stores a numeric value', () => {
  useUserPreferencesStore.getState().setTargetWeight(75);
  expect(useUserPreferencesStore.getState().targetWeightKg).toBe(75);
});

test('setTargetWeight accepts null to clear', () => {
  useUserPreferencesStore.getState().setTargetWeight(75);
  useUserPreferencesStore.getState().setTargetWeight(null);
  expect(useUserPreferencesStore.getState().targetWeightKg).toBeNull();
});

test('resetPreferences resets targetWeightKg to null', () => {
  useUserPreferencesStore.getState().setTargetWeight(90);
  useUserPreferencesStore.getState().resetPreferences();
  expect(useUserPreferencesStore.getState().targetWeightKg).toBeNull();
});

test('migration v4→v5: backfills targetWeightKg=null and avatarDataUrl=null', () => {
  const v4State = { darkMode: true, calendarStartOnMonday: true, appleHealthEnabled: false, googleHealthEnabled: false };
  const result = migrate(v4State, 4) as Record<string, unknown>;
  expect(result.targetWeightKg).toBeNull();
  expect(result.avatarDataUrl).toBeNull();
});

// ---------------------------------------------------------------------------
// Gap G — avatarDataUrl default / set / migration
// ---------------------------------------------------------------------------

test('avatarDataUrl defaults to null', () => {
  useUserPreferencesStore.getState().resetPreferences();
  expect(useUserPreferencesStore.getState().avatarDataUrl).toBeNull();
});

test('setAvatar stores a data URL string', () => {
  const dataUrl = 'data:image/jpeg;base64,/9j/abc123';
  useUserPreferencesStore.getState().setAvatar(dataUrl);
  expect(useUserPreferencesStore.getState().avatarDataUrl).toBe(dataUrl);
});

test('setAvatar accepts null to clear', () => {
  useUserPreferencesStore.getState().setAvatar('data:image/jpeg;base64,abc');
  useUserPreferencesStore.getState().setAvatar(null);
  expect(useUserPreferencesStore.getState().avatarDataUrl).toBeNull();
});

test('resetPreferences resets avatarDataUrl to null', () => {
  useUserPreferencesStore.getState().setAvatar('data:image/jpeg;base64,abc');
  useUserPreferencesStore.getState().resetPreferences();
  expect(useUserPreferencesStore.getState().avatarDataUrl).toBeNull();
});
