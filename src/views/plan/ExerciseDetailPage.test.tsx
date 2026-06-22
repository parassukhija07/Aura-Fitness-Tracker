/**
 * @jest-environment jsdom
 */
jest.mock('framer-motion', () => {
  const React = require('react');
  return {
    motion: {
      div: ({ children, ...rest }: React.HTMLAttributes<HTMLDivElement>) =>
        React.createElement('div', rest, children),
    },
    AnimatePresence: ({ children }: { children?: React.ReactNode }) => children,
  };
});
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
jest.mock('../../store/workoutDataStore', () => ({
  useWorkoutDataStore: (sel: (s: typeof fakeStore) => unknown) => sel(fakeStore),
}));
jest.mock('../log/exerciseMeta', () => ({
  getVideoUrl: () => 'https://youtube.com/search?q=bench+press',
  getTip: () => 'Keep your back flat and core tight throughout the movement.',
}));

import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import ExerciseDetailPage from './ExerciseDetailPage';
import type { CustomWorkout } from '../../types/workout';

const mockAddExerciseToWorkout = jest.fn();
const mockAddExerciseToSession = jest.fn();
const mockReplaceExerciseInWorkout = jest.fn();

const fakeStore = {
  activeSession: null as null | { exerciseIndex: number },
  userPlan: { schedule: ['workout-1', null, null, null, null, null, null], activeProgramId: null } as { schedule: (string | null)[]; activeProgramId: string | null },
  userWorkouts: [{ id: 'workout-1', name: 'Push Day', exercises: [], createdAt: '2026-01-01T00:00:00.000Z' }] as CustomWorkout[],
  addExerciseToWorkout: mockAddExerciseToWorkout,
  addExerciseToSession: mockAddExerciseToSession,
  replaceExerciseInWorkout: mockReplaceExerciseInWorkout,
};

const EXERCISE = {
  id: 'barbell-bench-press',
  name: 'Barbell Bench Press',
  muscleGroup: 'Chest' as const,
  equipment: 'Barbell' as const,
  defaultSets: 3,
  defaultRepsMin: 8,
  defaultRepsMax: 12,
};

const onBack = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  fakeStore.activeSession = null;
  fakeStore.userPlan = { schedule: ['workout-1', null, null, null, null, null, null], activeProgramId: null };
  fakeStore.userWorkouts = [{ id: 'workout-1', name: 'Push Day', exercises: [], createdAt: '2026-01-01T00:00:00.000Z' }];
  fakeStore.addExerciseToSession = mockAddExerciseToSession;
  fakeStore.replaceExerciseInWorkout = mockReplaceExerciseInWorkout;
  window.open = jest.fn();
});

test('renders exercise name in header', () => {
  render(<ExerciseDetailPage exercise={EXERCISE} onBack={onBack} />);
  expect(screen.getByText('Barbell Bench Press')).toBeInTheDocument();
});

test('renders muscle group chip', () => {
  render(<ExerciseDetailPage exercise={EXERCISE} onBack={onBack} />);
  expect(screen.getAllByText('Chest').length).toBeGreaterThanOrEqual(1);
});

test('play button is present in hero', () => {
  render(<ExerciseDetailPage exercise={EXERCISE} onBack={onBack} />);
  expect(screen.getByRole('button', { name: /play exercise video/i })).toBeInTheDocument();
});

test('play button opens video URL', () => {
  render(<ExerciseDetailPage exercise={EXERCISE} onBack={onBack} />);
  fireEvent.click(screen.getByRole('button', { name: /play exercise video/i }));
  expect(window.open).toHaveBeenCalledWith(
    'https://youtube.com/search?q=bench+press',
    '_blank',
    'noopener,noreferrer'
  );
});

test('pro tip card renders tip text', () => {
  render(<ExerciseDetailPage exercise={EXERCISE} onBack={onBack} />);
  expect(screen.getByText('Pro Tip')).toBeInTheDocument();
  expect(screen.getByText(/Keep your back flat/)).toBeInTheDocument();
});

test('muscle activation bars render for Chest group', () => {
  render(<ExerciseDetailPage exercise={EXERCISE} onBack={onBack} />);
  expect(screen.getByText('100%')).toBeInTheDocument();
  expect(screen.getByText('Muscle Activation')).toBeInTheDocument();
});

test('body map SVG renders and MediaPlaceholder label="body map" is gone', () => {
  const { container } = render(<ExerciseDetailPage exercise={EXERCISE} onBack={onBack} />);
  // Gap D: BodyMap SVG should be present
  expect(container.querySelector('svg[aria-label="Body muscle map"]')).toBeInTheDocument();
  // The old MediaPlaceholder text "body map" must no longer be present
  expect(screen.queryByText('body map')).toBeNull();
});

test('back button calls onBack', () => {
  render(<ExerciseDetailPage exercise={EXERCISE} onBack={onBack} />);
  fireEvent.click(screen.getByRole('button', { name: /back/i }));
  expect(onBack).toHaveBeenCalledTimes(1);
});

test('"Add to Today\'s Workout" button is present', () => {
  render(<ExerciseDetailPage exercise={EXERCISE} onBack={onBack} />);
  expect(screen.getByRole('button', { name: /add to today/i })).toBeInTheDocument();
});

test('toast shown when no active session on "Add to Today"', () => {
  render(<ExerciseDetailPage exercise={EXERCISE} onBack={onBack} />);
  fireEvent.click(screen.getByRole('button', { name: /add to today/i }));
  expect(screen.getByRole('status')).toHaveTextContent(/No active workout/);
});

test('toast shown when active session exists on "Add to Today"', () => {
  fakeStore.activeSession = { exerciseIndex: 0 };
  render(<ExerciseDetailPage exercise={EXERCISE} onBack={onBack} />);
  fireEvent.click(screen.getByRole('button', { name: /add to today/i }));
  expect(screen.getByRole('status')).toHaveTextContent(/Added to your active workout/);
});

test('"Add to My Plan" button opens bottom sheet', () => {
  render(<ExerciseDetailPage exercise={EXERCISE} onBack={onBack} />);
  fireEvent.click(screen.getByRole('button', { name: /^add to a plan$/i }));
  expect(screen.getByRole('button', { name: 'Push Day' })).toBeInTheDocument();
});

test('selecting a workout shows append/replace options', () => {
  render(<ExerciseDetailPage exercise={EXERCISE} onBack={onBack} />);
  fireEvent.click(screen.getByRole('button', { name: /add to a plan/i }));
  fireEvent.click(screen.getByRole('button', { name: 'Push Day' }));
  expect(screen.getByRole('button', { name: /add as new exercise/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /replace an exercise/i })).toBeInTheDocument();
});

test('clicking "Add as New Exercise" calls addExerciseToWorkout and shows toast', () => {
  render(<ExerciseDetailPage exercise={EXERCISE} onBack={onBack} />);
  fireEvent.click(screen.getByRole('button', { name: /add to a plan/i }));
  fireEvent.click(screen.getByRole('button', { name: 'Push Day' }));
  fireEvent.click(screen.getByRole('button', { name: /add as new exercise/i }));
  expect(mockAddExerciseToWorkout).toHaveBeenCalledWith('workout-1', expect.objectContaining({
    exerciseId: 'barbell-bench-press',
    exerciseName: 'Barbell Bench Press',
    targetSets: 3,
    targetReps: '8-12',
  }));
  expect(screen.getByRole('status')).toHaveTextContent(/Added to Push Day/);
});

test('shows empty state when no plan workouts scheduled', () => {
  fakeStore.userPlan = { schedule: [null, null, null, null, null, null, null], activeProgramId: null };
  render(<ExerciseDetailPage exercise={EXERCISE} onBack={onBack} />);
  fireEvent.click(screen.getByRole('button', { name: /add to a plan/i }));
  expect(screen.getByText(/No editable workouts/)).toBeInTheDocument();
});
