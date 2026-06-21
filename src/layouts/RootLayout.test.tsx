/**
 * @jest-environment jsdom
 */
jest.mock('../store/userPreferencesStore');
jest.mock('../store/navStore', () => ({
  useNavStore: jest.fn((selector: (s: { setActiveTab: () => void }) => unknown) =>
    selector({ setActiveTab: jest.fn() })
  ),
}));
jest.mock('react-router-dom', () => ({
  useLocation: () => ({ pathname: '/log' }),
  Outlet: () => null,
}));
jest.mock('../components/BottomNav', () => ({
  __esModule: true,
  default: () => null,
}));

import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import RootLayout from './RootLayout';
import { useUserPreferencesStore } from '../store/userPreferencesStore';

jest.mock('../lib/firebase', () => ({
  auth: { signOut: jest.fn(), onAuthStateChanged: jest.fn() },
  db: {},
  app: {}
}));

function mockDarkMode(value: boolean) {
  const state = { darkMode: value, setActiveTab: jest.fn() };
  (useUserPreferencesStore as unknown as jest.Mock).mockImplementation(
    (selector: (s: typeof state) => unknown) => selector(state)
  );
}

beforeEach(() => {
  // Remove any residual class from a previous test
  document.documentElement.classList.remove('dark-theme');
});

// ---------------------------------------------------------------------------
// Happy path — darkMode=true adds "dark-theme" class to <html>
// ---------------------------------------------------------------------------

test('adds dark-theme class to document.documentElement when darkMode is true', () => {
  mockDarkMode(true);
  render(<RootLayout />);
  expect(document.documentElement.classList.contains('dark-theme')).toBe(true);
});

// ---------------------------------------------------------------------------
// Failure / toggled-off — darkMode=false removes the class
// ---------------------------------------------------------------------------

test('does not add dark-theme class when darkMode is false', () => {
  mockDarkMode(false);
  render(<RootLayout />);
  expect(document.documentElement.classList.contains('dark-theme')).toBe(false);
});

test('removes pre-existing dark-theme class when darkMode is false', () => {
  // Simulate a class being present (e.g., from a prior render or hydration)
  document.documentElement.classList.add('dark-theme');
  mockDarkMode(false);
  render(<RootLayout />);
  expect(document.documentElement.classList.contains('dark-theme')).toBe(false);
});
