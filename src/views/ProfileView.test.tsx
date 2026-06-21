/**
 * @jest-environment jsdom
 */
jest.mock('../store/userPreferencesStore');
import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import ProfileView from './ProfileView';
import { useUserPreferencesStore } from '../store/userPreferencesStore';

jest.mock('../lib/firebase', () => ({
  auth: { signOut: jest.fn(), onAuthStateChanged: jest.fn() },
  db: {},
  app: {}
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
    toggleDarkMode,
    toggleCalendarStartOnMonday,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  const state = buildState();
  (useUserPreferencesStore as unknown as jest.Mock).mockImplementation(
    (selector: (s: typeof state) => unknown) => selector(state)
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
  expect(screen.getByRole('heading', { level: 2, name: /general/i })).toBeInTheDocument();
});

test('renders Dark Mode toggle switch', () => {
  render(<ProfileView />);
  const toggle = screen.getByRole('switch', { name: 'Dark Mode' });
  expect(toggle).toBeInTheDocument();
});

test('renders Start Week on Monday toggle switch', () => {
  render(<ProfileView />);
  const toggle = screen.getByRole('switch', { name: 'Start Week on Monday' });
  expect(toggle).toBeInTheDocument();
});

test('Dark Mode toggle has aria-checked=true when darkMode=true', () => {
  render(<ProfileView />);
  const toggle = screen.getByRole('switch', { name: 'Dark Mode' });
  expect(toggle).toHaveAttribute('aria-checked', 'true');
  expect(toggle).toHaveClass('toggle--on');
});

test('Start Week on Monday toggle has aria-checked=true when calendarStartOnMonday=true', () => {
  render(<ProfileView />);
  const toggle = screen.getByRole('switch', { name: 'Start Week on Monday' });
  expect(toggle).toHaveAttribute('aria-checked', 'true');
  expect(toggle).toHaveClass('toggle--on');
});

// ---------------------------------------------------------------------------
// Toggle interactions call store actions
// ---------------------------------------------------------------------------

test('clicking Dark Mode toggle calls toggleDarkMode', () => {
  render(<ProfileView />);
  fireEvent.click(screen.getByRole('switch', { name: 'Dark Mode' }));
  expect(toggleDarkMode).toHaveBeenCalledTimes(1);
});

test('clicking Start Week on Monday toggle calls toggleCalendarStartOnMonday', () => {
  render(<ProfileView />);
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
  const toggle = screen.getByRole('switch', { name: 'Start Week on Monday' });
  expect(toggle).toHaveAttribute('aria-checked', 'false');
  expect(toggle).not.toHaveClass('toggle--on');
});
