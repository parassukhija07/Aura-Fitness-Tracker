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

jest.mock('../../utils/haptics', () => ({
  triggerLightImpact: jest.fn(),
  triggerSuccess: jest.fn(),
  triggerSelection: jest.fn(),
}));

jest.mock('framer-motion', () => {
  const React = require('react');
  return {
    motion: {
      div: React.forwardRef((props: Record<string, unknown>, ref: unknown) => {
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
import WorkoutPickerSheet from './WorkoutPickerSheet';
import { triggerSelection } from '../../utils/haptics';
import type { WorkoutProgram, CustomWorkout } from '../../types/workout';

const PROGRAMS: WorkoutProgram[] = [
  { id: 'prog-1', name: 'Strength A', description: '', exercises: [] },
];
const USER_PROGRAMS: WorkoutProgram[] = [
  { id: 'uprog-1', name: 'My Custom Program', description: '', exercises: [] },
];
const USER_WORKOUTS: CustomWorkout[] = [
  { id: 'cw-1', name: 'HIIT Session', exercises: [], createdAt: '2026-01-01T00:00:00.000Z' },
];

const BASE_PROPS = {
  title: 'Switch Workout',
  programs: PROGRAMS,
  userPrograms: USER_PROGRAMS,
  userWorkouts: USER_WORKOUTS,
  onPick: jest.fn(),
  onClose: jest.fn(),
};

beforeEach(() => {
  jest.clearAllMocks();
});

// ---------------------------------------------------------------------------
// Happy path — renders all workout options merged from all three arrays
// ---------------------------------------------------------------------------
test('renders all workout options from programs, userPrograms, and userWorkouts', () => {
  render(<WorkoutPickerSheet {...BASE_PROPS} />);

  expect(screen.getByRole('button', { name: 'Strength A' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'My Custom Program' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'HIIT Session' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
});

// ---------------------------------------------------------------------------
// Happy path — clicking an option fires triggerSelection and calls onPick with correct id
// ---------------------------------------------------------------------------
test('clicking an option fires triggerSelection and calls onPick with correct workoutId', () => {
  const onPick = jest.fn();
  render(<WorkoutPickerSheet {...BASE_PROPS} onPick={onPick} />);

  fireEvent.click(screen.getByRole('button', { name: 'Strength A' }));

  expect(triggerSelection).toHaveBeenCalledTimes(1);
  expect(onPick).toHaveBeenCalledWith('prog-1');
});

test('clicking a custom workout option calls onPick with custom workout id', () => {
  const onPick = jest.fn();
  render(<WorkoutPickerSheet {...BASE_PROPS} onPick={onPick} />);

  fireEvent.click(screen.getByRole('button', { name: 'HIIT Session' }));

  expect(onPick).toHaveBeenCalledWith('cw-1');
});

// ---------------------------------------------------------------------------
// Edge case — empty state renders message and still shows Cancel
// ---------------------------------------------------------------------------
test('renders empty-state message when all arrays are empty', () => {
  render(
    <WorkoutPickerSheet
      title="Add Workout"
      programs={[]}
      userPrograms={[]}
      userWorkouts={[]}
      onPick={jest.fn()}
      onClose={jest.fn()}
    />,
  );

  expect(screen.getByText(/no workouts available/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
});

// ---------------------------------------------------------------------------
// Failure case — Cancel button calls onClose
// ---------------------------------------------------------------------------
test('Cancel button calls onClose', () => {
  const onClose = jest.fn();
  render(<WorkoutPickerSheet {...BASE_PROPS} onClose={onClose} />);

  fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

  expect(onClose).toHaveBeenCalledTimes(1);
});

// ---------------------------------------------------------------------------
// Failure case — clicking backdrop calls onClose, clicking sheet interior does not
// ---------------------------------------------------------------------------
test('clicking the backdrop calls onClose', () => {
  const onClose = jest.fn();
  const { container } = render(<WorkoutPickerSheet {...BASE_PROPS} onClose={onClose} />);

  const backdrop = container.querySelector('.awd-sheet-backdrop') as HTMLElement;
  fireEvent.click(backdrop);

  expect(onClose).toHaveBeenCalledTimes(1);
});
