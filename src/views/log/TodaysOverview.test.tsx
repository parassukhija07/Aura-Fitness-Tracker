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
test('renders exercise card and Start / Switch buttons when workout is planned', () => {
  render(<TodaysOverview {...BASE_PROPS} dayWorkout={WORKOUT_DAY} />);

  expect(screen.getByText('Back Squat')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /start workout/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Switch' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /log past/i })).toBeInTheDocument();
});

// ---------------------------------------------------------------------------
// Happy path — Start Workout invokes onStartWorkout
// ---------------------------------------------------------------------------
test('"Start Workout" button calls onStartWorkout', () => {
  const onStartWorkout = jest.fn();
  render(<TodaysOverview {...BASE_PROPS} dayWorkout={WORKOUT_DAY} onStartWorkout={onStartWorkout} />);

  fireEvent.click(screen.getByRole('button', { name: /start workout/i }));
  expect(onStartWorkout).toHaveBeenCalledTimes(1);
});

// ---------------------------------------------------------------------------
// Happy path — Rest Day is set via the ⋯ Manage sheet (template behavior)
// ---------------------------------------------------------------------------
test('"Make it a Rest Day" in Manage sheet calls onSetRestDay', () => {
  const onSetRestDay = jest.fn();
  render(<TodaysOverview {...BASE_PROPS} dayWorkout={WORKOUT_DAY} onSetRestDay={onSetRestDay} />);

  fireEvent.click(screen.getByRole('button', { name: 'Manage today' }));
  fireEvent.click(screen.getByText('Make it a Rest Day'));
  expect(onSetRestDay).toHaveBeenCalledTimes(1);
});

// ---------------------------------------------------------------------------
// Happy path — "Switch" button opens SourcePickerSheet, then selecting
// "From a Program" opens WorkoutPickerSheet with "Switch Workout" title
// ---------------------------------------------------------------------------
test('"Switch" button opens WorkoutPickerSheet via SourcePickerSheet', () => {
  render(<TodaysOverview {...BASE_PROPS} dayWorkout={WORKOUT_DAY} />);

  // Step 1: click Switch — SourcePickerSheet should appear
  fireEvent.click(screen.getByRole('button', { name: 'Switch' }));
  expect(screen.getByText('From a Program')).toBeInTheDocument();
  expect(screen.getByText('A Saved Workout')).toBeInTheDocument();

  // Step 2: click a source option — WorkoutPickerSheet should appear with correct title
  fireEvent.click(screen.getByText('From a Program'));
  expect(screen.getByText('Switch Workout', { selector: '.awd-sheet__title' })).toBeInTheDocument();
});

// ---------------------------------------------------------------------------
// Edge case — rest day (not beforeStart) renders Add a Workout button
// ---------------------------------------------------------------------------
test('renders "Add a Workout" button on rest day (not beforeStart)', () => {
  render(<TodaysOverview {...BASE_PROPS} dayWorkout={REST_DAY} />);

  expect(screen.getByText(/rest day/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Add a Workout' })).toBeInTheDocument();
});

// ---------------------------------------------------------------------------
// Edge case — "Add a Workout" opens SourcePickerSheet first, then
// selecting a source opens WorkoutPickerSheet with "Add Workout" title
// ---------------------------------------------------------------------------
test('"Add a Workout" opens WorkoutPickerSheet with "Add Workout" title via SourcePickerSheet', () => {
  render(<TodaysOverview {...BASE_PROPS} dayWorkout={REST_DAY} />);

  // Step 1: click Add a Workout — SourcePickerSheet should appear
  fireEvent.click(screen.getByRole('button', { name: 'Add a Workout' }));
  expect(screen.getByText('From a Program')).toBeInTheDocument();

  // Step 2: pick a source — WorkoutPickerSheet should open with "Add Workout" title
  fireEvent.click(screen.getByText('From a Program'));
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
// (two-step flow: Add a Workout -> SourcePickerSheet -> WorkoutPickerSheet -> pick)
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

  // Step 1: open SourcePickerSheet
  fireEvent.click(screen.getByRole('button', { name: 'Add a Workout' }));
  expect(screen.getByText('From a Program')).toBeInTheDocument();

  // Step 2: select a source to open WorkoutPickerSheet
  fireEvent.click(screen.getByText('From a Program'));
  expect(screen.getByText('Add Workout', { selector: '.awd-sheet__title' })).toBeInTheDocument();

  // Step 3: pick a workout
  fireEvent.click(screen.getByRole('button', { name: 'My Program' }));

  expect(onAssignWorkout).toHaveBeenCalledWith('prog-1');
  // Sheet should be gone after selection
  expect(screen.queryByText('Add Workout', { selector: '.awd-sheet__title' })).toBeNull();
});

// ---------------------------------------------------------------------------
// ManageTodaySheet — ellipsis button opens ManageTodaySheet
// ---------------------------------------------------------------------------
test('ellipsis button opens ManageTodaySheet with management options', () => {
  render(<TodaysOverview {...BASE_PROPS} dayWorkout={WORKOUT_DAY} />);

  // Click the ellipsis (Manage today) button
  fireEvent.click(screen.getByRole('button', { name: 'Manage today' }));

  // ManageTodaySheet should be visible with its options
  expect(screen.getByText('Switch to Another Workout')).toBeInTheDocument();
  expect(screen.getByText('Make it a Rest Day')).toBeInTheDocument();
  expect(screen.getByText('Remove')).toBeInTheDocument();
});

// ---------------------------------------------------------------------------
// ManageTodaySheet — "Switch to Another Workout" leads to SourcePickerSheet
// ---------------------------------------------------------------------------
test('"Switch to Another Workout" in ManageTodaySheet opens SourcePickerSheet', () => {
  render(<TodaysOverview {...BASE_PROPS} dayWorkout={WORKOUT_DAY} />);

  // Open ManageTodaySheet via ellipsis
  fireEvent.click(screen.getByRole('button', { name: 'Manage today' }));
  expect(screen.getByText('Switch to Another Workout')).toBeInTheDocument();

  // Click "Switch to Another Workout" — ManageTodaySheet closes, SourcePickerSheet opens
  fireEvent.click(screen.getByText('Switch to Another Workout'));
  expect(screen.getByText('From a Program')).toBeInTheDocument();
  expect(screen.getByText('A Saved Workout')).toBeInTheDocument();
});
