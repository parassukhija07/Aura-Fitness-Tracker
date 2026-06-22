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

jest.mock('@capacitor/haptics', () => ({
  Haptics: {
    impact: jest.fn().mockResolvedValue(undefined),
    notification: jest.fn().mockResolvedValue(undefined),
    selectionChanged: jest.fn().mockResolvedValue(undefined),
  },
  ImpactStyle: { Light: 'LIGHT', Medium: 'MEDIUM', Heavy: 'HEAVY' },
  NotificationType: { Success: 'SUCCESS', Warning: 'WARNING', Error: 'ERROR' },
}));

// Mock framer-motion to avoid animation complexity in tests
jest.mock('framer-motion', () => {
  const React = require('react');
  return {
    motion: {
      div: ({ children, ...rest }: React.HTMLAttributes<HTMLDivElement>) =>
        React.createElement('div', rest, children),
    },
    AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
  };
});

// Mock the store to return controlled state
const mockStripEmptySets = jest.fn();
const mockAddSet = jest.fn();
const mockDeleteSet = jest.fn();
const mockUpdateSetNote = jest.fn();
const mockStartInterExerciseRest = jest.fn();

let mockExercises: any[] = [];

const mockStoreState = {
  addSet: null as any,
  deleteSet: null as any,
  updateSetNote: null as any,
  stripEmptySets: null as any,
  startInterExerciseRest: null as any,
  updateSetField: jest.fn(),
  updateSetType: jest.fn(),
  completeSet: jest.fn(),
  setCablePulley: jest.fn(),
  setSupersetGroup: jest.fn(),
  activeSession: null as any,
  completedWorkouts: [] as any[],
  getExerciseById: (id: string) => ({
    id,
    name: 'Test Exercise',
    muscleGroup: 'Chest',
    defaultSets: 3,
    defaultRepsMin: 6,
    defaultRepsMax: 10,
  }),
};

jest.mock('../../store/workoutDataStore', () => ({
  useWorkoutDataStore: Object.assign(
    jest.fn((selector: (s: any) => any) => selector(mockStoreState)),
    {
      getState: () => mockStoreState,
    }
  ),
}));

// Silence restTimerBus during tests
jest.mock('./restTimerBus', () => ({
  start: jest.fn(),
  stop: jest.fn(),
  subscribe: jest.fn((cb: (s: any) => void) => {
    cb({ seconds: 0, running: false });
    return () => {};
  }),
}));

import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import ExerciseDetailView from './ExerciseDetailView';
import type { SessionExercise } from '../../types/workout';

const baseExercise: SessionExercise = {
  exerciseId: 'barbell-bench-press',
  exerciseName: 'Barbell Bench Press',
  muscleGroup: 'Chest',
  defaultSets: 3,
  sets: [
    { reps: 0, weight: 0, setType: 'Normal', completed: false },
  ],
};

beforeEach(() => {
  jest.clearAllMocks();
  mockExercises = [baseExercise];
  mockStoreState.addSet = mockAddSet;
  mockStoreState.deleteSet = mockDeleteSet;
  mockStoreState.updateSetNote = mockUpdateSetNote;
  mockStoreState.stripEmptySets = mockStripEmptySets;
  mockStoreState.startInterExerciseRest = mockStartInterExerciseRest;
  mockStoreState.activeSession = {
    exercises: mockExercises,
    interExerciseRestStartedAt: null,
  };
});

test('renders exercise name in header', () => {
  render(
    <ExerciseDetailView
      exerciseIndex={0}
      exercise={baseExercise}
      onComplete={jest.fn()}
    />
  );
  expect(screen.getByText('Barbell Bench Press')).toBeInTheDocument();
});

test('renders muscle group badge', () => {
  render(
    <ExerciseDetailView
      exerciseIndex={0}
      exercise={baseExercise}
      onComplete={jest.fn()}
    />
  );
  expect(screen.getByText('Chest')).toBeInTheDocument();
});

test('renders video card button', () => {
  render(
    <ExerciseDetailView
      exerciseIndex={0}
      exercise={baseExercise}
      onComplete={jest.fn()}
    />
  );
  expect(screen.getByRole('button', { name: /Watch Barbell Bench Press proper form/i })).toBeInTheDocument();
});

test('renders "No PR logged yet" when no sets are completed', () => {
  render(
    <ExerciseDetailView
      exerciseIndex={0}
      exercise={baseExercise}
      onComplete={jest.fn()}
    />
  );
  expect(screen.getByText('No PR logged yet')).toBeInTheDocument();
});

test('renders "Log a set to get a target" when no sets are completed', () => {
  render(
    <ExerciseDetailView
      exerciseIndex={0}
      exercise={baseExercise}
      onComplete={jest.fn()}
    />
  );
  expect(screen.getByText('Log a set to get a target')).toBeInTheDocument();
});

test('renders progress bar label with 0/1', () => {
  render(
    <ExerciseDetailView
      exerciseIndex={0}
      exercise={baseExercise}
      onComplete={jest.fn()}
    />
  );
  expect(screen.getByText('0/1 sets completed')).toBeInTheDocument();
});

test('"+ Add Set" calls addSet', () => {
  render(
    <ExerciseDetailView
      exerciseIndex={0}
      exercise={baseExercise}
      onComplete={jest.fn()}
    />
  );
  fireEvent.click(screen.getByText('+ Add Set'));
  expect(mockAddSet).toHaveBeenCalledWith(0);
});

test('"Complete Exercise" calls stripEmptySets and startInterExerciseRest', () => {
  render(
    <ExerciseDetailView
      exerciseIndex={0}
      exercise={baseExercise}
      onComplete={jest.fn()}
    />
  );
  fireEvent.click(screen.getByText('Complete Exercise'));
  expect(mockStripEmptySets).toHaveBeenCalledWith(0);
  expect(mockStartInterExerciseRest).toHaveBeenCalled();
});

test('"Complete Exercise" calls onComplete after celebration dismisses', () => {
  const onComplete = jest.fn();
  render(
    <ExerciseDetailView
      exerciseIndex={0}
      exercise={baseExercise}
      onComplete={onComplete}
    />
  );
  // Complete without a completed set -> generic celebration -> auto-dismissed in 2500ms
  // We just fire complete and check the sequence without waiting for timer
  fireEvent.click(screen.getByText('Complete Exercise'));
  // The celebration should be visible; click to dismiss immediately
  const celebration = document.querySelector('.awd-celebration');
  if (celebration) fireEvent.click(celebration);
  expect(onComplete).toHaveBeenCalled();
});

test('does not render CablePulleySelector for non-cable exercise', () => {
  render(
    <ExerciseDetailView
      exerciseIndex={0}
      exercise={baseExercise}
      onComplete={jest.fn()}
    />
  );
  expect(screen.queryByText('Cable Pulley')).not.toBeInTheDocument();
});

test('renders CablePulleySelector for cable exercise', () => {
  const cableExercise: SessionExercise = {
    ...baseExercise,
    exerciseId: 'cable-crossover',
    exerciseName: 'Cable Crossover',
  };
  mockExercises = [cableExercise];
  render(
    <ExerciseDetailView
      exerciseIndex={0}
      exercise={cableExercise}
      onComplete={jest.fn()}
    />
  );
  expect(screen.getByText('Cable Pulley')).toBeInTheDocument();
});

test('shows coach tip text', () => {
  render(
    <ExerciseDetailView
      exerciseIndex={0}
      exercise={baseExercise}
      onComplete={jest.fn()}
    />
  );
  // Chest tip text starts with "Keep your shoulder blades"
  expect(screen.getByText(/Keep your shoulder blades/i)).toBeInTheDocument();
});

test('note toggle expands textarea for a set', () => {
  render(
    <ExerciseDetailView
      exerciseIndex={0}
      exercise={baseExercise}
      onComplete={jest.fn()}
    />
  );
  fireEvent.click(screen.getByText('+ Note'));
  expect(screen.getByPlaceholderText('Add a note for this set…')).toBeInTheDocument();
});
