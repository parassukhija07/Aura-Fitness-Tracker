/**
 * @jest-environment jsdom
 */
jest.mock('../store/userPreferencesStore');
jest.mock('../store/workoutDataStore');
jest.mock('../store/authStore');

import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import ProfileView from './ProfileView';

// The Profile tab is now hub-and-spoke; General/Notifications/Units live on the
// "General & Preferences" sub-screen. Navigate there before asserting on them.
function gotoPreferences() {
  fireEvent.click(screen.getByRole('button', { name: /General & Preferences/i }));
}
import { useUserPreferencesStore } from '../store/userPreferencesStore';
import { useWorkoutDataStore } from '../store/workoutDataStore';
import { useAuthStore } from '../store/authStore';

jest.mock('../lib/firebase', () => ({
  auth: {},
  db: {},
  app: {}
}));

jest.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  signOut: jest.fn().mockResolvedValue(undefined),
  onAuthStateChanged: jest.fn(() => jest.fn()), // returns unsubscribe fn
}));

jest.mock('../services/cloudSync', () => ({
  backupToCloud: jest.fn(),
  restoreFromCloud: jest.fn(),
}));

jest.mock('../utils/haptics', () => ({
  triggerSuccess: jest.fn(),
}));

jest.mock('framer-motion', () => ({
  motion: {
    section: ({ children, ...props }: React.HTMLAttributes<HTMLElement> & { children?: React.ReactNode }) => (
      <section {...props}>{children}</section>
    ),
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement> & { children?: React.ReactNode }) => (
      <div {...props}>{children}</div>
    ),
  },
  AnimatePresence: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}));

// ---------------------------------------------------------------------------
// Fake store state wired up before each test
// ---------------------------------------------------------------------------

const toggleDarkMode = jest.fn();
const toggleCalendarStartOnMonday = jest.fn();

function buildState(overrides: { darkMode?: boolean; calendarStartOnMonday?: boolean } = {}) {
  return {
    darkMode: overrides.darkMode ?? true,
    calendarStartOnMonday: overrides.calendarStartOnMonday ?? true,
    // New fields with defaults so ProfileView renders without crashing
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
    gender: null as null,
    country: '',
    city: '',
    stateRegion: '',
    weightUnit: 'kg' as const,
    lengthUnit: 'cm' as const,
    notificationsEnabled: false,
    restTimerSound: 'ding' as const,
    ageYears: null as null,
    weightKg: null as null,
    heightCm: null as null,
    sex: null as null,
    activityLevel: 'moderate' as const,
    // actions
    toggleDarkMode,
    toggleCalendarStartOnMonday,
    setDarkMode: jest.fn(),
    setCalendarStartOnMonday: jest.fn(),
    setBiometrics: jest.fn(),
    setLogScoreDisplay: jest.fn(),
    toggleShowRepsTimeFirst: jest.fn(),
    toggleShowPrsDuringWorkout: jest.fn(),
    setDefaultSets: jest.fn(),
    setDefaultRepsRange: jest.fn(),
    setDefaultRestBetweenSetsSec: jest.fn(),
    setDefaultRestBetweenExercisesSec: jest.fn(),
    toggleAutoRestTimer: jest.fn(),
    toggleAutoPlayVideo: jest.fn(),
    setAccountDetails: jest.fn(),
    setWeightUnit: jest.fn(),
    setLengthUnit: jest.fn(),
    toggleNotificationsEnabled: jest.fn(),
    setRestTimerSound: jest.fn(),
    resetPreferences: jest.fn(),
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  const state = buildState();
  (useUserPreferencesStore as unknown as jest.Mock).mockImplementation(
    (selector: (s: typeof state) => unknown) => selector(state)
  );
  (useUserPreferencesStore as unknown as { getState: jest.Mock }).getState = jest.fn().mockReturnValue(state);

  (useWorkoutDataStore as unknown as jest.Mock).mockImplementation(
    (selector: (s: { resetToSeed: jest.Mock }) => unknown) =>
      selector({ resetToSeed: jest.fn() })
  );
  (useWorkoutDataStore as unknown as { getState: jest.Mock }).getState = jest.fn().mockReturnValue({
    resetToSeed: jest.fn(),
  });

  (useAuthStore as unknown as jest.Mock).mockImplementation(
    (selector: (s: { user: null }) => unknown) => selector({ user: null })
  );
});

// ---------------------------------------------------------------------------
// Happy path — renders correctly with default state (darkMode=true, monday=true)
// ---------------------------------------------------------------------------

test('renders the "Profile" heading', () => {
  render(<ProfileView />);
  expect(screen.getByRole('heading', { level: 1, name: 'Profile' })).toBeInTheDocument();
});

test('renders the "General" section header', () => {
  render(<ProfileView />);
  gotoPreferences();
  expect(screen.getByRole('heading', { level: 2, name: /general/i })).toBeInTheDocument();
});

test('renders Dark Mode toggle switch', () => {
  render(<ProfileView />);
  gotoPreferences();
  const toggle = screen.getByRole('switch', { name: 'Dark Mode' });
  expect(toggle).toBeInTheDocument();
});

test('renders Start Week on Monday toggle switch', () => {
  render(<ProfileView />);
  gotoPreferences();
  const toggle = screen.getByRole('switch', { name: 'Start Week on Monday' });
  expect(toggle).toBeInTheDocument();
});

test('Dark Mode toggle has aria-checked=true when darkMode=true', () => {
  render(<ProfileView />);
  gotoPreferences();
  const toggle = screen.getByRole('switch', { name: 'Dark Mode' });
  expect(toggle).toHaveAttribute('aria-checked', 'true');
  expect(toggle).toHaveClass('toggle--on');
});

test('Start Week on Monday toggle has aria-checked=true when calendarStartOnMonday=true', () => {
  render(<ProfileView />);
  gotoPreferences();
  const toggle = screen.getByRole('switch', { name: 'Start Week on Monday' });
  expect(toggle).toHaveAttribute('aria-checked', 'true');
  expect(toggle).toHaveClass('toggle--on');
});

// ---------------------------------------------------------------------------
// Toggle interactions call store actions
// ---------------------------------------------------------------------------

test('clicking Dark Mode toggle calls toggleDarkMode', () => {
  render(<ProfileView />);
  gotoPreferences();
  fireEvent.click(screen.getByRole('switch', { name: 'Dark Mode' }));
  expect(toggleDarkMode).toHaveBeenCalledTimes(1);
});

test('clicking Start Week on Monday toggle calls toggleCalendarStartOnMonday', () => {
  render(<ProfileView />);
  gotoPreferences();
  fireEvent.click(screen.getByRole('switch', { name: 'Start Week on Monday' }));
  expect(toggleCalendarStartOnMonday).toHaveBeenCalledTimes(1);
});

// ---------------------------------------------------------------------------
// Edge case — off state rendering
// ---------------------------------------------------------------------------

test('Dark Mode toggle has aria-checked=false and no toggle--on class when darkMode=false', () => {
  const state = buildState({ darkMode: false });
  (useUserPreferencesStore as unknown as jest.Mock).mockImplementation(
    (selector: (s: typeof state) => unknown) => selector(state)
  );
  render(<ProfileView />);
  gotoPreferences();
  const toggle = screen.getByRole('switch', { name: 'Dark Mode' });
  expect(toggle).toHaveAttribute('aria-checked', 'false');
  expect(toggle).not.toHaveClass('toggle--on');
});

test('Start Week on Monday toggle has no toggle--on class when calendarStartOnMonday=false', () => {
  const state = buildState({ calendarStartOnMonday: false });
  (useUserPreferencesStore as unknown as jest.Mock).mockImplementation(
    (selector: (s: typeof state) => unknown) => selector(state)
  );
  render(<ProfileView />);
  gotoPreferences();
  const toggle = screen.getByRole('switch', { name: 'Start Week on Monday' });
  expect(toggle).toHaveAttribute('aria-checked', 'false');
  expect(toggle).not.toHaveClass('toggle--on');
});
