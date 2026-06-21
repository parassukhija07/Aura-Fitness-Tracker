/**
 * @jest-environment jsdom
 */
jest.mock('@capacitor/preferences', () => ({
  Preferences: {
    get: jest.fn().mockResolvedValue({ value: null }),
    set: jest.fn().mockResolvedValue(undefined),
    remove: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('recharts', () => {
  const React = require('react');
  const passthrough =
    (name: string) =>
    ({ children }: { children?: React.ReactNode }) =>
      React.createElement(name, null, children);
  return {
    ResponsiveContainer: ({ children }: { children?: React.ReactNode }) =>
      React.createElement('div', null, children),
    LineChart: passthrough('div'),
    Line: () => null,
    XAxis: () => null,
    YAxis: () => null,
    Tooltip: () => null,
    CartesianGrid: () => null,
  };
});
jest.mock('../store/statsDataStore');
jest.mock('../store/bodyDataStore', () => ({
  useBodyDataStore: (selector: (s: { logs: unknown[] }) => unknown) =>
    selector({ logs: [] }),
}));

// userPreferencesStore is used by NutritionTab; mock it so no Capacitor I/O occurs.
// Default values represent an incomplete biometric profile (all nulls) so the
// nutri-warning is shown instead of the target card by default.
const mockSetBiometrics = jest.fn();
jest.mock('../store/userPreferencesStore', () => ({
  useUserPreferencesStore: jest.fn((selector: (s: Record<string, unknown>) => unknown) =>
    selector({
      ageYears: null,
      weightKg: null,
      heightCm: null,
      sex: null,
      activityLevel: 'moderate',
      setBiometrics: mockSetBiometrics,
    })
  ),
}));
import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import ProgressionView from './ProgressionView';
import { useStatsDataStore } from '../store/statsDataStore';

const FAKE_STATE = {
  completedWorkoutDates: [] as string[],
  lifetimeStats: { totalSessions: 1, totalSets: 2, totalVolumeKg: 3, totalPRs: 4 },
};

beforeEach(() => {
  (useStatsDataStore as unknown as jest.Mock).mockImplementation(
    (selector: (s: typeof FAKE_STATE) => unknown) => selector(FAKE_STATE)
  );
});

test('defaults to the Stats tab as active', () => {
  render(<ProgressionView />);
  const statsBtn = screen.getByRole('tab', { name: 'Stats' });
  const bodyBtn = screen.getByRole('tab', { name: 'Body' });
  expect(statsBtn).toHaveClass('prog-tabs__tab--active');
  expect(bodyBtn).not.toHaveClass('prog-tabs__tab--active');
});

test('renders Stats content by default', () => {
  render(<ProgressionView />);
  expect(screen.getByText('Consistency')).toBeInTheDocument();
  expect(screen.getByText('Lifetime')).toBeInTheDocument();
  expect(screen.queryByText('Coming soon')).toBeNull();
});

test('switches active class to Body on click', () => {
  render(<ProgressionView />);
  fireEvent.click(screen.getByRole('tab', { name: 'Body' }));
  expect(screen.getByRole('tab', { name: 'Body' })).toHaveClass('prog-tabs__tab--active');
  expect(screen.getByRole('tab', { name: 'Stats' })).not.toHaveClass('prog-tabs__tab--active');
});

test('swaps content to BodyTab on click', () => {
  render(<ProgressionView />);
  fireEvent.click(screen.getByRole('tab', { name: 'Body' }));
  expect(screen.getByText('Log Measurement')).toBeInTheDocument();
  expect(screen.queryByText('Consistency')).toBeNull();
});

// ── Nutrition tab tests ──────────────────────────────────────────────────────

test('Nutrition tab button is rendered in the tab list', () => {
  render(<ProgressionView />);
  expect(screen.getByRole('tab', { name: 'Nutrition' })).toBeInTheDocument();
});

// Happy path: switching to Nutrition tab shows the biometric form
test('switches active class to Nutrition on click and shows biometric inputs', () => {
  render(<ProgressionView />);
  fireEvent.click(screen.getByRole('tab', { name: 'Nutrition' }));
  expect(screen.getByRole('tab', { name: 'Nutrition' })).toHaveClass('prog-tabs__tab--active');
  expect(screen.getByRole('tab', { name: 'Stats' })).not.toHaveClass('prog-tabs__tab--active');
  // The biometric form fields are always visible
  expect(screen.getByLabelText('Age (years)')).toBeInTheDocument();
  expect(screen.getByLabelText('Weight (kg)')).toBeInTheDocument();
  expect(screen.getByLabelText('Height (cm)')).toBeInTheDocument();
});

// Edge case: when biometrics are null (default), .nutri-warning renders and .target-card is absent
test('shows nutri-warning when biometrics are incomplete (ready = false)', () => {
  const { container } = render(<ProgressionView />);
  fireEvent.click(screen.getByRole('tab', { name: 'Nutrition' }));
  expect(
    screen.getByText(/Enter your age, weight, height, and sex to see daily targets/i)
  ).toBeInTheDocument();
  // The target card must NOT be in the DOM
  expect(container.querySelector('.target-card')).toBeNull();
});

// Failure case: with complete biometrics, target-card renders and warning is hidden
test('shows target-card and hides warning when biometrics are complete (ready = true)', () => {
  // Override the store mock for this test to return valid biometrics
  const { useUserPreferencesStore } = require('../store/userPreferencesStore');
  (useUserPreferencesStore as jest.Mock).mockImplementation(
    (selector: (s: Record<string, unknown>) => unknown) =>
      selector({
        ageYears: 30,
        weightKg: 80,
        heightCm: 180,
        sex: 'male',
        activityLevel: 'moderate',
        setBiometrics: mockSetBiometrics,
      })
  );

  const { container } = render(<ProgressionView />);
  fireEvent.click(screen.getAllByRole('tab', { name: 'Nutrition' })[0]);
  // target-card must be present
  expect(container.querySelector('.target-card')).not.toBeNull();
  // The warning must be gone
  expect(screen.queryByText(/Enter your age, weight, height, and sex/i)).toBeNull();
  // All four macro-cell values must be present
  const macroCells = container.querySelectorAll('.target-card__macros .macro-cell__value');
  expect(macroCells.length).toBe(4);
});
