jest.mock('@capacitor/preferences', () => ({
  Preferences: {
    get: jest.fn().mockResolvedValue({ value: null }),
    set: jest.fn().mockResolvedValue(undefined),
    remove: jest.fn().mockResolvedValue(undefined),
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
