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
    BarChart: passthrough('div'),
    Bar: () => null,
    Cell: () => null,
    AreaChart: passthrough('div'),
    Area: () => null,
  };
});
jest.mock('../store/statsDataStore');
jest.mock('../store/bodyDataStore', () => ({
  useBodyDataStore: (selector: (s: { logs: unknown[]; photos: unknown[]; addPhoto: () => void; deletePhoto: () => void }) => unknown) =>
    selector({ logs: [], photos: [], addPhoto: () => {}, deletePhoto: () => {} }),
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
  completedSessions: [] as never[],
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
  expect(statsBtn).toHaveClass('aura-seg__option--active');
  expect(bodyBtn).not.toHaveClass('aura-seg__option--active');
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
  expect(screen.getByRole('tab', { name: 'Body' })).toHaveClass('aura-seg__option--active');
  expect(screen.getByRole('tab', { name: 'Stats' })).not.toHaveClass('aura-seg__option--active');
});

test('swaps content to BodyTab on click', () => {
  render(<ProgressionView />);
  fireEvent.click(screen.getByRole('tab', { name: 'Body' }));
  // BODY-01 shows the weight card and a "Log" action
  expect(screen.getByText(/WEIGHT/)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /^Log$/i })).toBeInTheDocument();
  expect(screen.queryByText('Consistency')).toBeNull();
});

// ── Nutrition tab tests ──────────────────────────────────────────────────────

test('Nutrition tab button is rendered after selecting Body', () => {
  render(<ProgressionView />);
  fireEvent.click(screen.getByRole('tab', { name: 'Body' }));
  expect(screen.getByRole('tab', { name: 'Nutrition' })).toBeInTheDocument();
});

// Happy path: switching to Nutrition tab reveals biometric inputs after tapping Edit
test('switches active class to Nutrition on click and shows biometric inputs', () => {
  render(<ProgressionView />);
  fireEvent.click(screen.getByRole('tab', { name: 'Body' }));
  fireEvent.click(screen.getByRole('tab', { name: 'Nutrition' }));
  expect(screen.getByRole('tab', { name: 'Nutrition' })).toHaveClass('aura-seg__option--active');
  expect(screen.getByRole('tab', { name: 'Stats' })).not.toHaveClass('aura-seg__option--active');
  // Inputs live behind the profile "Edit" toggle
  fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
  expect(screen.getByLabelText('Age')).toBeInTheDocument();
  expect(screen.getByLabelText(/Weight/)).toBeInTheDocument();
  expect(screen.getByLabelText(/Height/)).toBeInTheDocument();
});

// Edge case: when biometrics are null (default), the warning renders and no targets card
test('shows nutri-warning when biometrics are incomplete (ready = false)', () => {
  const { container } = render(<ProgressionView />);
  fireEvent.click(screen.getByRole('tab', { name: 'Body' }));
  fireEvent.click(screen.getByRole('tab', { name: 'Nutrition' }));
  expect(container.querySelector('.nutri-warning')).not.toBeNull();
  // No macro bars without a complete profile
  expect(container.querySelector('.nutri-targets__cal')).toBeNull();
});

// Failure case: with complete biometrics, daily targets render and warning is hidden
test('shows daily targets and hides warning when biometrics are complete (ready = true)', () => {
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
  fireEvent.click(screen.getByRole('tab', { name: 'Body' }));
  fireEvent.click(screen.getAllByRole('tab', { name: 'Nutrition' })[0]);
  // Calories headline present
  expect(container.querySelector('.nutri-targets__cal')).not.toBeNull();
  expect(container.querySelector('.nutri-warning')).toBeNull();
  // Four macro bars (Protein/Carbs/Fats/Fiber)
  const macroRows = container.querySelectorAll('.mbar-row');
  expect(macroRows.length).toBe(4);
});
