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
import ProgramDetailView from './ProgramDetailView';
import type { CatalogProgram } from '../../types/workout';

const MOCK_PROGRAM: CatalogProgram = {
  id: 'lib-ppl',
  name: 'Push Pull Legs',
  description: 'Classic hypertrophy split',
  goal: 'Hypertrophy',
  workouts: [
    {
      name: 'Push Day',
      exercises: [
        { exerciseId: 'barbell-bench-press', sets: 4, repsMin: 8, repsMax: 12 },
        { exerciseId: 'overhead-press', sets: 3, repsMin: 8, repsMax: 10 },
      ],
    },
    {
      name: 'Pull Day',
      exercises: [
        { exerciseId: 'deadlift', sets: 3, repsMin: 5, repsMax: 5 },
      ],
    },
  ],
};

const mockOnClose = jest.fn();
const mockOnAdded = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  useWorkoutDataStore.setState({ userPrograms: [] });
});

// ─── Happy Path ───────────────────────────────────────────────────────────────

test('renders program name, description, and goal badge', () => {
  render(<ProgramDetailView program={MOCK_PROGRAM} onClose={mockOnClose} />);
  expect(screen.getByText('Push Pull Legs')).toBeInTheDocument();
  expect(screen.getByText('Classic hypertrophy split')).toBeInTheDocument();
  expect(screen.getByText('Hypertrophy')).toBeInTheDocument();
});

test('renders workout section names', () => {
  render(<ProgramDetailView program={MOCK_PROGRAM} onClose={mockOnClose} />);
  expect(screen.getByText('Push Day')).toBeInTheDocument();
  expect(screen.getByText('Pull Day')).toBeInTheDocument();
});

test('"Add to My Plans" button calls addCatalogProgramToMyPlans, triggerLightImpact, and onAdded on click', () => {
  const addCatalogProgramToMyPlans = jest.fn().mockReturnValue('myplan-lib-ppl');
  useWorkoutDataStore.setState({ addCatalogProgramToMyPlans } as any);

  render(<ProgramDetailView program={MOCK_PROGRAM} onClose={mockOnClose} onAdded={mockOnAdded} />);

  const btn = screen.getByRole('button', { name: /add to my plans/i });
  expect(btn).not.toBeDisabled();
  fireEvent.click(btn);

  expect(addCatalogProgramToMyPlans).toHaveBeenCalledWith(MOCK_PROGRAM);
  expect(mockTriggerLightImpact).toHaveBeenCalled();
  expect(mockOnAdded).toHaveBeenCalled();
});

test('"Add to My Plans" button becomes disabled after click', () => {
  render(<ProgramDetailView program={MOCK_PROGRAM} onClose={mockOnClose} />);

  const btn = screen.getByRole('button', { name: /add to my plans/i });
  fireEvent.click(btn);

  expect(btn).toBeDisabled();
  expect(btn).toHaveTextContent('Added to My Plans ✓');
});

test('back button calls onClose', () => {
  render(<ProgramDetailView program={MOCK_PROGRAM} onClose={mockOnClose} />);
  fireEvent.click(screen.getByRole('button', { name: 'Back' }));
  expect(mockOnClose).toHaveBeenCalled();
});

// ─── Edge Case: button pre-disabled when already in myPlans ──────────────────

test('"Add" button is disabled on mount when program already exists in userPrograms', () => {
  useWorkoutDataStore.setState({
    userPrograms: [
      { id: 'myplan-lib-ppl', name: 'Push Pull Legs', description: '', exercises: [] },
    ],
  });

  render(<ProgramDetailView program={MOCK_PROGRAM} onClose={mockOnClose} />);

  const btn = screen.getByRole('button', { name: /added to my plans/i });
  expect(btn).toBeDisabled();
});

// ─── Failure Case: unresolved exerciseId falls back to raw id string ──────────

test('renders raw exerciseId as fallback when getExerciseById returns undefined', () => {
  // Override getExerciseById to always return undefined
  useWorkoutDataStore.setState({
    getExerciseById: () => undefined,
  } as any);

  const programWithUnknownEx: CatalogProgram = {
    ...MOCK_PROGRAM,
    workouts: [
      {
        name: 'Mystery Workout',
        exercises: [{ exerciseId: 'unknown-exercise-id', sets: 3, repsMin: 8, repsMax: 12 }],
      },
    ],
  };

  render(<ProgramDetailView program={programWithUnknownEx} onClose={mockOnClose} />);
  // Should render raw id, not crash or show "undefined"
  expect(screen.getByText('unknown-exercise-id')).toBeInTheDocument();
  expect(screen.queryByText('undefined')).not.toBeInTheDocument();
});
