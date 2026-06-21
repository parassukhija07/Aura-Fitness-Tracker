/**
 * @jest-environment jsdom
 */

// Must mock before any store import
jest.mock('@capacitor/preferences', () => ({
  Preferences: {
    get: jest.fn().mockResolvedValue({ value: null }),
    set: jest.fn().mockResolvedValue(undefined),
    remove: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('../../utils/haptics', () => ({
  triggerLightImpact: jest.fn(),
  triggerSuccess: jest.fn(),
  triggerSelection: jest.fn(),
}));

// Mock framer-motion so motion.div renders as a plain div
jest.mock('framer-motion', () => {
  const React = require('react');
  return {
    motion: {
      div: React.forwardRef((props: Record<string, unknown>, ref: unknown) => {
        // Strip framer-motion-only props
        const { initial, animate, exit, transition, whileTap, whileHover, ...rest } = props;
        void initial; void animate; void exit; void transition; void whileTap; void whileHover;
        return React.createElement('div', { ...rest, ref });
      }),
    },
    AnimatePresence: ({ children }: { children: React.ReactNode }) => React.createElement(React.Fragment, null, children),
  };
});

jest.mock('../../utils/motion', () => ({
  overlayTransition: {},
  panelTransition: {},
}));

import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import TodaysOverview from './TodaysOverview';
import type { DayWorkout } from './logDates';
import type { WorkoutProgram, CustomWorkout } from '../../types/workout';

// Fixed date: today (Monday 2026-06-15)
const TODAY = new Date(2026, 5, 15); // local midnight

const BASE_PROPS = {
  activeDate: TODAY,
  sundayIndex: TODAY.getDay(), // 1 (Monday)
  programs: [] as WorkoutProgram[],
  userPrograms: [] as WorkoutProgram[],
  userWorkouts: [] as CustomWorkout[],
  onAssignWorkout: jest.fn(),
  onSetRestDay: jest.fn(),
};

const REST_DAY: DayWorkout = { isRestDay: true, beforeStart: false, exercises: [] };
const BEFORE_START: DayWorkout = { isRestDay: true, beforeStart: true, exercises: [] };
const WORKOUT_DAY: DayWorkout = {
  isRestDay: false,
  beforeStart: false,
  exercises: [
    { exerciseId: 'squat', name: 'Back Squat', muscleGroup: 'Legs', sets: 3, repsMin: 5, repsMax: 8 },
  ],
};

beforeEach(() => {
  jest.clearAllMocks();
});

// ---------------------------------------------------------------------------
// Happy path — workout planned renders exercise card and control buttons
// ---------------------------------------------------------------------------
test('renders exercise card and Switch Workout / Mark as Rest Day buttons when workout is planned', () => {
  render(<TodaysOverview {...BASE_PROPS} dayWorkout={WORKOUT_DAY} />);

  expect(screen.getByText('Back Squat')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Switch Workout' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Mark as Rest Day' })).toBeInTheDocument();
});

// ---------------------------------------------------------------------------
// Happy path — "Mark as Rest Day" button calls onSetRestDay
// ---------------------------------------------------------------------------
test('"Mark as Rest Day" button calls onSetRestDay', () => {
  const onSetRestDay = jest.fn();
  render(<TodaysOverview {...BASE_PROPS} dayWorkout={WORKOUT_DAY} onSetRestDay={onSetRestDay} />);

  fireEvent.click(screen.getByRole('button', { name: 'Mark as Rest Day' }));
  expect(onSetRestDay).toHaveBeenCalledTimes(1);
});

// ---------------------------------------------------------------------------
// Happy path — "Switch Workout" opens picker sheet
// ---------------------------------------------------------------------------
test('"Switch Workout" button opens WorkoutPickerSheet', () => {
  render(<TodaysOverview {...BASE_PROPS} dayWorkout={WORKOUT_DAY} />);

  fireEvent.click(screen.getByRole('button', { name: 'Switch Workout' }));
  // Sheet title should appear
  expect(screen.getByText('Switch Workout', { selector: '.awd-sheet__title' })).toBeInTheDocument();
});

// ---------------------------------------------------------------------------
// Edge case — rest day (not beforeStart) renders Add Workout Anyway button
// ---------------------------------------------------------------------------
test('renders "Add Workout Anyway" button on rest day (not beforeStart)', () => {
  render(<TodaysOverview {...BASE_PROPS} dayWorkout={REST_DAY} />);

  expect(screen.getByText(/rest day/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Add Workout Anyway' })).toBeInTheDocument();
});

// ---------------------------------------------------------------------------
// Edge case — "Add Workout Anyway" opens picker sheet with "Add Workout" title
// ---------------------------------------------------------------------------
test('"Add Workout Anyway" opens WorkoutPickerSheet with "Add Workout" title', () => {
  render(<TodaysOverview {...BASE_PROPS} dayWorkout={REST_DAY} />);

  fireEvent.click(screen.getByRole('button', { name: 'Add Workout Anyway' }));
  expect(screen.getByText('Add Workout', { selector: '.awd-sheet__title' })).toBeInTheDocument();
});

// ---------------------------------------------------------------------------
// Edge case — beforeStart renders no control buttons
// ---------------------------------------------------------------------------
test('beforeStart state renders no control buttons', () => {
  render(<TodaysOverview {...BASE_PROPS} dayWorkout={BEFORE_START} />);

  expect(screen.queryByRole('button', { name: /workout|rest/i })).toBeNull();
});

// ---------------------------------------------------------------------------
// Failure case — onAssignWorkout is called and sheet closes when picking
// ---------------------------------------------------------------------------
test('picking a workout calls onAssignWorkout with workoutId and closes sheet', () => {
  const onAssignWorkout = jest.fn();
  const programs: WorkoutProgram[] = [
    { id: 'prog-1', name: 'My Program', description: '', exercises: [] },
  ];

  render(
    <TodaysOverview
      {...BASE_PROPS}
      dayWorkout={REST_DAY}
      programs={programs}
      onAssignWorkout={onAssignWorkout}
    />,
  );

  fireEvent.click(screen.getByRole('button', { name: 'Add Workout Anyway' }));
  fireEvent.click(screen.getByRole('button', { name: 'My Program' }));

  expect(onAssignWorkout).toHaveBeenCalledWith('prog-1');
  // Sheet should be gone after selection
  expect(screen.queryByText('Add Workout', { selector: '.awd-sheet__title' })).toBeNull();
});
