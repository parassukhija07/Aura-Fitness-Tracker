/**
 * @jest-environment jsdom
 */

// Mock stores before imports
jest.mock('../store/userPreferencesStore');
jest.mock('../store/workoutDataStore');
jest.mock('../store/authStore');

import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import ProfileView from './ProfileView';
import { useUserPreferencesStore } from '../store/userPreferencesStore';
import { useWorkoutDataStore } from '../store/workoutDataStore';
import { useAuthStore } from '../store/authStore';

jest.mock('../lib/firebase', () => ({
  auth: {},
  db: {},
  app: {},
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
  },
}));

// ---------------------------------------------------------------------------
// Mock store factories
// ---------------------------------------------------------------------------

const mockToggleDarkMode = jest.fn();
const mockToggleCalendarStartOnMonday = jest.fn();
const mockToggleAutoRestTimer = jest.fn();
const mockToggleNotificationsEnabled = jest.fn();
const mockSetWeightUnit = jest.fn();
const mockSetLengthUnit = jest.fn();
const mockSetLogScoreDisplay = jest.fn();
const mockSetRestTimerSound = jest.fn();
const mockSetDefaultSets = jest.fn();
const mockSetDefaultRepsRange = jest.fn();
const mockSetDefaultRestBetweenSetsSec = jest.fn();
const mockSetDefaultRestBetweenExercisesSec = jest.fn();
const mockToggleShowRepsTimeFirst = jest.fn();
const mockToggleShowPrsDuringWorkout = jest.fn();
const mockToggleAutoPlayVideo = jest.fn();
const mockSetAccountDetails = jest.fn();
const mockSetBiometrics = jest.fn();
const mockSetDarkMode = jest.fn();
const mockSetCalendarStartOnMonday = jest.fn();
const mockResetPreferences = jest.fn();
const mockResetToSeed = jest.fn();

function buildPrefsState(overrides: Record<string, unknown> = {}) {
  return {
    darkMode: true,
    calendarStartOnMonday: true,
    logScoreDisplay: 'both',
    showRepsTimeFirst: true,
    showPrsDuringWorkout: true,
    defaultSets: 3,
    defaultRepsRange: '6-10',
    defaultRestBetweenSetsSec: 60,
    defaultRestBetweenExercisesSec: 90,
    autoRestTimer: true,
    autoPlayVideo: false,
    firstName: 'Jane',
    lastName: 'Doe',
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
    ageYears: null,
    weightKg: null,
    heightCm: null,
    sex: null,
    activityLevel: 'moderate',
    // actions
    toggleDarkMode: mockToggleDarkMode,
    toggleCalendarStartOnMonday: mockToggleCalendarStartOnMonday,
    setDarkMode: mockSetDarkMode,
    setCalendarStartOnMonday: mockSetCalendarStartOnMonday,
    setBiometrics: mockSetBiometrics,
    setLogScoreDisplay: mockSetLogScoreDisplay,
    toggleShowRepsTimeFirst: mockToggleShowRepsTimeFirst,
    toggleShowPrsDuringWorkout: mockToggleShowPrsDuringWorkout,
    setDefaultSets: mockSetDefaultSets,
    setDefaultRepsRange: mockSetDefaultRepsRange,
    setDefaultRestBetweenSetsSec: mockSetDefaultRestBetweenSetsSec,
    setDefaultRestBetweenExercisesSec: mockSetDefaultRestBetweenExercisesSec,
    toggleAutoRestTimer: mockToggleAutoRestTimer,
    toggleAutoPlayVideo: mockToggleAutoPlayVideo,
    setAccountDetails: mockSetAccountDetails,
    setWeightUnit: mockSetWeightUnit,
    setLengthUnit: mockSetLengthUnit,
    toggleNotificationsEnabled: mockToggleNotificationsEnabled,
    setRestTimerSound: mockSetRestTimerSound,
    resetPreferences: mockResetPreferences,
    ...overrides,
  };
}

const mockGetState = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();

  const prefsState = buildPrefsState();
  (useUserPreferencesStore as unknown as jest.Mock).mockImplementation(
    (selector: (s: typeof prefsState) => unknown) => selector(prefsState)
  );
  (useUserPreferencesStore as unknown as { getState: jest.Mock }).getState = mockGetState.mockReturnValue(prefsState);

  (useWorkoutDataStore as unknown as jest.Mock).mockImplementation(
    (selector: (s: { resetToSeed: jest.Mock }) => unknown) =>
      selector({ resetToSeed: mockResetToSeed })
  );
  (useWorkoutDataStore as unknown as { getState: jest.Mock }).getState = jest.fn().mockReturnValue({
    resetToSeed: mockResetToSeed,
  });

  (useAuthStore as unknown as jest.Mock).mockImplementation(
    (selector: (s: { user: { uid: string; email: string } | null }) => unknown) =>
      selector({ user: { uid: 'uid-1', email: 'test@example.com' } })
  );
});

// ---------------------------------------------------------------------------
// Workout Settings section renders
// ---------------------------------------------------------------------------

test('"Workout · Display" section header renders', () => {
  render(<ProfileView />);
  expect(screen.getByRole('heading', { level: 2, name: /workout.*display/i })).toBeInTheDocument();
});

test('"Show Reps/Time First" toggle renders in Workout Display section', () => {
  render(<ProfileView />);
  expect(screen.getByRole('switch', { name: 'Show Reps/Time First' })).toBeInTheDocument();
});

test('"Show PRs During Workout" toggle renders', () => {
  render(<ProfileView />);
  expect(screen.getByRole('switch', { name: 'Show PRs During Workout' })).toBeInTheDocument();
});

test('"Workout · Exercise Targets" section header renders', () => {
  render(<ProfileView />);
  expect(screen.getByRole('heading', { level: 2, name: /workout.*exercise targets/i })).toBeInTheDocument();
});

test('"Default Sets" input renders with correct value', () => {
  render(<ProfileView />);
  const input = screen.getByRole('spinbutton', { name: 'Default Sets' });
  expect(input).toBeInTheDocument();
  expect(input).toHaveValue(3);
});

test('"Workout · Automation" section header renders', () => {
  render(<ProfileView />);
  expect(screen.getByRole('heading', { level: 2, name: /workout.*automation/i })).toBeInTheDocument();
});

test('"Auto Rest Timer" toggle renders', () => {
  render(<ProfileView />);
  expect(screen.getByRole('switch', { name: 'Auto Rest Timer' })).toBeInTheDocument();
});

test('"Auto Play Video" toggle renders', () => {
  render(<ProfileView />);
  expect(screen.getByRole('switch', { name: 'Auto Play Video' })).toBeInTheDocument();
});

// ---------------------------------------------------------------------------
// Units & Measurements section renders
// ---------------------------------------------------------------------------

test('"Units & Measurements" section header renders', () => {
  render(<ProfileView />);
  expect(screen.getByRole('heading', { level: 2, name: /units/i })).toBeInTheDocument();
});

test('"Weight Unit" select renders', () => {
  render(<ProfileView />);
  expect(screen.getByRole('combobox', { name: 'Weight Unit' })).toBeInTheDocument();
});

test('"Length Unit" select renders', () => {
  render(<ProfileView />);
  expect(screen.getByRole('combobox', { name: 'Length Unit' })).toBeInTheDocument();
});

// ---------------------------------------------------------------------------
// Account Details section renders
// ---------------------------------------------------------------------------

test('"Account Details" section header renders', () => {
  render(<ProfileView />);
  expect(screen.getByRole('heading', { level: 2, name: /account details/i })).toBeInTheDocument();
});

test('"First Name" input renders', () => {
  render(<ProfileView />);
  expect(screen.getByRole('textbox', { name: 'First Name' })).toBeInTheDocument();
});

test('"Last Name" input renders', () => {
  render(<ProfileView />);
  expect(screen.getByRole('textbox', { name: 'Last Name' })).toBeInTheDocument();
});

test('Email is displayed as read-only value from auth (not an input)', () => {
  render(<ProfileView />);
  // The Account Details section renders email as a read-only span (not input)
  // There is no input with aria-label="Email"
  const emailInputs = document.querySelectorAll('input[aria-label="Email"]');
  expect(emailInputs.length).toBe(0);
  // The email text appears somewhere in the document (could be multiple places)
  const emailElements = screen.getAllByText('test@example.com');
  expect(emailElements.length).toBeGreaterThan(0);
});

// ---------------------------------------------------------------------------
// Log Out button is present (when user is logged in)
// ---------------------------------------------------------------------------

test('"Session" section renders when user is logged in', () => {
  render(<ProfileView />);
  expect(screen.getByRole('heading', { level: 2, name: /session/i })).toBeInTheDocument();
});

test('"Log Out" button is present when user is logged in', () => {
  render(<ProfileView />);
  expect(screen.getByRole('button', { name: 'Log Out' })).toBeInTheDocument();
});

test('"Log Out" section is NOT rendered when user is null', () => {
  (useAuthStore as unknown as jest.Mock).mockImplementation(
    (selector: (s: { user: null }) => unknown) => selector({ user: null })
  );
  render(<ProfileView />);
  expect(screen.queryByRole('button', { name: 'Log Out' })).not.toBeInTheDocument();
});

// ---------------------------------------------------------------------------
// Export Data button is present
// ---------------------------------------------------------------------------

test('"Export Data" button is present in Data Management section', () => {
  render(<ProfileView />);
  expect(screen.getByRole('button', { name: 'Export Data' })).toBeInTheDocument();
});

test('"Data Management" section header renders', () => {
  render(<ProfileView />);
  expect(screen.getByRole('heading', { level: 2, name: /data management/i })).toBeInTheDocument();
});

test('"Reset Workout Data" button is present', () => {
  render(<ProfileView />);
  expect(screen.getByRole('button', { name: 'Reset Workout Data' })).toBeInTheDocument();
});

test('"Reset All Data" button is present', () => {
  render(<ProfileView />);
  expect(screen.getByRole('button', { name: 'Reset All Data' })).toBeInTheDocument();
});

// ---------------------------------------------------------------------------
// handleLogOut — window.confirm guard
// ---------------------------------------------------------------------------

test('clicking Log Out with confirm=false does NOT call signOut', () => {
  const { signOut } = require('firebase/auth');
  jest.spyOn(window, 'confirm').mockReturnValue(false);
  render(<ProfileView />);
  fireEvent.click(screen.getByRole('button', { name: 'Log Out' }));
  expect(signOut).not.toHaveBeenCalled();
});

test('clicking Log Out with confirm=true calls signOut', async () => {
  const { signOut } = require('firebase/auth');
  jest.spyOn(window, 'confirm').mockReturnValue(true);
  const { act } = require('@testing-library/react');
  render(<ProfileView />);
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Log Out' }));
    await Promise.resolve();
  });
  expect(signOut).toHaveBeenCalled();
});

// ---------------------------------------------------------------------------
// handleResetWorkoutData — window.confirm guard
// ---------------------------------------------------------------------------

test('clicking Reset Workout Data with confirm=false does NOT call resetToSeed', () => {
  jest.spyOn(window, 'confirm').mockReturnValue(false);
  render(<ProfileView />);
  fireEvent.click(screen.getByRole('button', { name: 'Reset Workout Data' }));
  expect(mockResetToSeed).not.toHaveBeenCalled();
});

test('clicking Reset Workout Data with confirm=true calls resetToSeed', () => {
  jest.spyOn(window, 'confirm').mockReturnValue(true);
  render(<ProfileView />);
  fireEvent.click(screen.getByRole('button', { name: 'Reset Workout Data' }));
  expect(mockResetToSeed).toHaveBeenCalledTimes(1);
  expect(mockResetPreferences).not.toHaveBeenCalled();
});

// ---------------------------------------------------------------------------
// handleResetAllData — window.confirm guard
// ---------------------------------------------------------------------------

test('clicking Reset All Data with confirm=false does NOT call resetToSeed or resetPreferences', () => {
  jest.spyOn(window, 'confirm').mockReturnValue(false);
  render(<ProfileView />);
  fireEvent.click(screen.getByRole('button', { name: 'Reset All Data' }));
  expect(mockResetToSeed).not.toHaveBeenCalled();
  expect(mockResetPreferences).not.toHaveBeenCalled();
});

test('clicking Reset All Data with confirm=true calls both resetToSeed and resetPreferences', () => {
  jest.spyOn(window, 'confirm').mockReturnValue(true);
  render(<ProfileView />);
  fireEvent.click(screen.getByRole('button', { name: 'Reset All Data' }));
  expect(mockResetToSeed).toHaveBeenCalledTimes(1);
  expect(mockResetPreferences).toHaveBeenCalledTimes(1);
});

// ---------------------------------------------------------------------------
// handleExport — blob download and URL.revokeObjectURL called
// ---------------------------------------------------------------------------

test('clicking Export Data calls URL.revokeObjectURL', () => {
  const mockCreateObjectURL = jest.fn().mockReturnValue('blob:mock-url');
  const mockRevokeObjectURL = jest.fn();
  Object.defineProperty(window, 'URL', {
    writable: true,
    value: { createObjectURL: mockCreateObjectURL, revokeObjectURL: mockRevokeObjectURL },
  });

  render(<ProfileView />);
  fireEvent.click(screen.getByRole('button', { name: 'Export Data' }));
  expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
});
