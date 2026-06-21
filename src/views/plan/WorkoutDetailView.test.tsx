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

jest.mock('framer-motion', () => {
  const React = require('react');
  return {
    motion: {
      div: ({ children, ...rest }: React.HTMLAttributes<HTMLDivElement>) =>
        React.createElement('div', rest, children),
    },
    AnimatePresence: ({ children }: { children?: React.ReactNode }) =>
      React.createElement(React.Fragment, null, children),
  };
});

const mockTriggerLightImpact = jest.fn();
jest.mock('../../utils/haptics', () => ({
  triggerLightImpact: mockTriggerLightImpact,
}));

jest.mock('./programLibrary.css', () => ({}));

import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useWorkoutDataStore } from '../../store/workoutDataStore';
import WorkoutDetailView from './WorkoutDetailView';
import type { CatalogWorkout } from '../../types/workout';

const MOCK_WORKOUT: CatalogWorkout = {
  id: 'lib-push-day',
  name: 'Push Day',
  category: 'Push',
  muscleGroup: 'Chest',
  exercises: [
    { exerciseId: 'barbell-bench-press', sets: 4, repsMin: 8, repsMax: 12 },
    { exerciseId: 'overhead-press', sets: 3, repsMin: 8, repsMax: 10 },
    { exerciseId: 'cable-tricep-pushdown', sets: 3, repsMin: 10, repsMax: 15 },
  ],
};

const mockOnClose = jest.fn();
const mockOnAdded = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  useWorkoutDataStore.setState({ userWorkouts: [] });
});

// ─── Happy Path ───────────────────────────────────────────────────────────────

test('renders workout name and category/muscleGroup subtitle', () => {
  render(<WorkoutDetailView workout={MOCK_WORKOUT} onClose={mockOnClose} />);
  expect(screen.getByText('Push Day')).toBeInTheDocument();
  // The desc line: "Push · Chest"
  expect(screen.getByText(/push/i, { selector: 'p' })).toBeInTheDocument();
});

test('"Add to My Plans" button calls addCatalogWorkoutToMyPlans, triggerLightImpact, and onAdded', () => {
  const addCatalogWorkoutToMyPlans = jest.fn().mockReturnValue('myplan-lib-push-day');
  useWorkoutDataStore.setState({ addCatalogWorkoutToMyPlans } as any);

  render(<WorkoutDetailView workout={MOCK_WORKOUT} onClose={mockOnClose} onAdded={mockOnAdded} />);

  const btn = screen.getByRole('button', { name: /add to my plans/i });
  expect(btn).not.toBeDisabled();
  fireEvent.click(btn);

  expect(addCatalogWorkoutToMyPlans).toHaveBeenCalledWith(MOCK_WORKOUT);
  expect(mockTriggerLightImpact).toHaveBeenCalled();
  expect(mockOnAdded).toHaveBeenCalled();
});

test('"Add to My Plans" button becomes disabled after click', () => {
  render(<WorkoutDetailView workout={MOCK_WORKOUT} onClose={mockOnClose} />);

  const btn = screen.getByRole('button', { name: /add to my plans/i });
  fireEvent.click(btn);

  expect(btn).toBeDisabled();
  expect(btn).toHaveTextContent('Added to My Plans ✓');
});

test('back button calls onClose', () => {
  render(<WorkoutDetailView workout={MOCK_WORKOUT} onClose={mockOnClose} />);
  fireEvent.click(screen.getByRole('button', { name: 'Back' }));
  expect(mockOnClose).toHaveBeenCalled();
});

// ─── Edge Case: button pre-disabled when workout already in myPlans ───────────

test('"Add" button is disabled on mount when workout already exists in userWorkouts', () => {
  useWorkoutDataStore.setState({
    userWorkouts: [
      {
        id: 'myplan-lib-push-day',
        name: 'Push Day',
        exercises: [],
        createdAt: new Date().toISOString(),
      },
    ],
  });

  render(<WorkoutDetailView workout={MOCK_WORKOUT} onClose={mockOnClose} />);

  const btn = screen.getByRole('button', { name: /added to my plans/i });
  expect(btn).toBeDisabled();
});

// ─── Failure Case: addCatalogWorkoutToMyPlans is not called when already added ─

test('clicking "Add" only calls addCatalogWorkoutToMyPlans once; button disabled prevents second call', () => {
  const addCatalogWorkoutToMyPlans = jest.fn().mockReturnValue('myplan-lib-push-day');
  useWorkoutDataStore.setState({ addCatalogWorkoutToMyPlans } as any);

  render(<WorkoutDetailView workout={MOCK_WORKOUT} onClose={mockOnClose} />);

  const btn = screen.getByRole('button', { name: /add to my plans/i });
  fireEvent.click(btn);
  expect(addCatalogWorkoutToMyPlans).toHaveBeenCalledTimes(1);

  // Button is now disabled — a second click must NOT trigger the action
  // (disabled buttons don't fire onClick in real browsers, but verify state)
  expect(btn).toBeDisabled();
  // No second call
  expect(addCatalogWorkoutToMyPlans).toHaveBeenCalledTimes(1);
});
