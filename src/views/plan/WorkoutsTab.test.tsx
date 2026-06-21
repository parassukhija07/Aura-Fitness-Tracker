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

jest.mock('../../utils/haptics', () => ({
  triggerLightImpact: jest.fn(),
}));

// Small deterministic fixture
const MOCK_WORKOUTS = [
  {
    id: 'lib-push-day',
    name: 'Push Day',
    category: 'Push',
    muscleGroup: 'Chest',
    exercises: [
      { exerciseId: 'barbell-bench-press', sets: 4, repsMin: 8, repsMax: 12 },
      { exerciseId: 'overhead-press', sets: 3, repsMin: 8, repsMax: 12 },
    ],
  },
  {
    id: 'lib-pull-day',
    name: 'Pull Day',
    category: 'Pull',
    muscleGroup: 'Back',
    exercises: [
      { exerciseId: 'deadlift', sets: 3, repsMin: 5, repsMax: 5 },
    ],
  },
  {
    id: 'lib-leg-day',
    name: 'Leg Day',
    category: 'Legs',
    muscleGroup: 'Legs',
    exercises: [
      { exerciseId: 'barbell-back-squat', sets: 4, repsMin: 6, repsMax: 10 },
    ],
  },
];

jest.mock('../../data/seedWorkouts', () => ({
  SEED_CATALOG_WORKOUTS: MOCK_WORKOUTS,
}));

// Mock WorkoutDetailView
jest.mock('./WorkoutDetailView', () => ({
  __esModule: true,
  default: ({ workout, onClose }: { workout: { name: string }; onClose: () => void }) => {
    const React = require('react');
    return React.createElement(
      'div',
      { 'data-testid': 'workout-detail-view' },
      React.createElement('span', null, workout.name),
      React.createElement('button', { onClick: onClose, 'aria-label': 'Close detail' }, 'Close'),
    );
  },
}));

// Mock WorkoutBuilderView
jest.mock('./WorkoutBuilderView', () => ({
  __esModule: true,
  default: ({ onClose }: { onClose: () => void }) => {
    const React = require('react');
    return React.createElement(
      'div',
      { 'data-testid': 'workout-builder-view' },
      React.createElement('button', { onClick: onClose, 'aria-label': 'Close builder' }, 'Close'),
    );
  },
}));

import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useWorkoutDataStore } from '../../store/workoutDataStore';
import WorkoutsTab from './WorkoutsTab';

beforeEach(() => {
  useWorkoutDataStore.setState({
    userWorkouts: [],
    userPlan: null,
    activeSession: null,
  });
});

// ─── Happy Path ───────────────────────────────────────────────────────────────

test('renders all catalog workout cards on initial load', () => {
  render(<WorkoutsTab />);
  expect(screen.getByText('Push Day')).toBeInTheDocument();
  expect(screen.getByText('Pull Day')).toBeInTheDocument();
  expect(screen.getByText('Leg Day')).toBeInTheDocument();
});

test('clicking a workout card opens WorkoutDetailView', () => {
  render(<WorkoutsTab />);
  expect(screen.queryByTestId('workout-detail-view')).not.toBeInTheDocument();

  fireEvent.click(screen.getByText('Push Day'));

  expect(screen.getByTestId('workout-detail-view')).toBeInTheDocument();
  expect(screen.getByText('Push Day', { selector: 'span' })).toBeInTheDocument();
});

test('closing detail view returns to catalog grid', () => {
  render(<WorkoutsTab />);
  fireEvent.click(screen.getByText('Pull Day'));
  fireEvent.click(screen.getByRole('button', { name: 'Close detail' }));

  expect(screen.queryByTestId('workout-detail-view')).not.toBeInTheDocument();
  expect(screen.getByText('Pull Day')).toBeInTheDocument();
});

// ─── Edge Case: chip + search simultaneously ──────────────────────────────────

test('category chip filter restricts visible workouts', () => {
  render(<WorkoutsTab />);
  fireEvent.click(screen.getByRole('button', { name: 'Push' }));

  expect(screen.getByText('Push Day')).toBeInTheDocument();
  expect(screen.queryByText('Pull Day')).not.toBeInTheDocument();
  expect(screen.queryByText('Leg Day')).not.toBeInTheDocument();
});

test('chip filter combined with search query applies both predicates', () => {
  render(<WorkoutsTab />);
  // Select Pull chip
  fireEvent.click(screen.getByRole('button', { name: 'Pull' }));
  // Type a search that only matches a Push category item
  fireEvent.change(screen.getByRole('textbox', { name: /search workouts/i }), {
    target: { value: 'Push' },
  });

  // Nothing satisfies both Pull category AND name contains "Push"
  expect(screen.queryByText('Push Day')).not.toBeInTheDocument();
  expect(screen.queryByText('Pull Day')).not.toBeInTheDocument();
  expect(screen.getByText('No workouts match your search.')).toBeInTheDocument();
});

// ─── Failure Case: empty state ────────────────────────────────────────────────

test('shows empty state when search matches no workouts', () => {
  render(<WorkoutsTab />);
  fireEvent.change(screen.getByRole('textbox', { name: /search workouts/i }), {
    target: { value: 'zzz-nonexistent' },
  });

  expect(screen.getByText('No workouts match your search.')).toBeInTheDocument();
  expect(screen.queryByText('Push Day')).not.toBeInTheDocument();
});
