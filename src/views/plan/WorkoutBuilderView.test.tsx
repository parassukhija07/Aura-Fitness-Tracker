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

// Mock the store so we can control what it returns and spy on saveCustomWorkout
jest.mock('../../store/workoutDataStore');
jest.mock('../../utils/haptics', () => ({
  triggerLightImpact: jest.fn(),
  triggerSuccess: jest.fn(),
  triggerSelection: jest.fn(),
}));

import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import WorkoutBuilderView from './WorkoutBuilderView';
import { useWorkoutDataStore } from '../../store/workoutDataStore';

// ---------------------------------------------------------------------------
// Store mock setup
// ---------------------------------------------------------------------------

const saveCustomWorkout = jest.fn();

// Minimal exercise list for the selector modal (loaded through the store)
const MOCK_EXERCISES = [
  {
    id: 'barbell-bench-press',
    name: 'Barbell Bench Press',
    muscleGroup: 'Chest',
    defaultSets: 3,
    defaultRepsMin: 6,
    defaultRepsMax: 10,
  },
  {
    id: 'barbell-back-squat',
    name: 'Barbell Back Squat',
    muscleGroup: 'Legs',
    defaultSets: 3,
    defaultRepsMin: 5,
    defaultRepsMax: 8,
  },
];

function buildStoreState(overrides: Record<string, unknown> = {}) {
  return {
    exercises: MOCK_EXERCISES,
    saveCustomWorkout,
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  (useWorkoutDataStore as unknown as jest.Mock).mockImplementation(
    (selector: (s: ReturnType<typeof buildStoreState>) => unknown) =>
      selector(buildStoreState()),
  );
});

// ---------------------------------------------------------------------------
// Happy path
// ---------------------------------------------------------------------------

test('renders the workout name input and Save Workout button', () => {
  render(<WorkoutBuilderView onClose={jest.fn()} />);
  expect(screen.getByPlaceholderText('Workout Name')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /save workout/i })).toBeInTheDocument();
});

test('Save button is disabled when name is empty and no exercises are added', () => {
  render(<WorkoutBuilderView onClose={jest.fn()} />);
  expect(screen.getByRole('button', { name: /save workout/i })).toBeDisabled();
});

test('Save button is disabled when name is provided but no exercises are added', () => {
  render(<WorkoutBuilderView onClose={jest.fn()} />);
  fireEvent.change(screen.getByPlaceholderText('Workout Name'), { target: { value: 'Push Day' } });
  expect(screen.getByRole('button', { name: /save workout/i })).toBeDisabled();
});

test('Save button becomes enabled after providing name and adding an exercise', () => {
  render(<WorkoutBuilderView onClose={jest.fn()} />);

  // Type a workout name
  fireEvent.change(screen.getByPlaceholderText('Workout Name'), { target: { value: 'Push Day' } });

  // Open exercise selector
  fireEvent.click(screen.getByRole('button', { name: /add exercise/i }));

  // Click the first exercise in the modal
  fireEvent.click(screen.getByRole('button', { name: /barbell bench press/i }));

  expect(screen.getByRole('button', { name: /save workout/i })).not.toBeDisabled();
});

test('clicking Save calls saveCustomWorkout with the workout name and exercises, then calls onClose', () => {
  const onClose = jest.fn();
  render(<WorkoutBuilderView onClose={onClose} />);

  fireEvent.change(screen.getByPlaceholderText('Workout Name'), { target: { value: 'Push Day' } });
  fireEvent.click(screen.getByRole('button', { name: /add exercise/i }));
  fireEvent.click(screen.getByRole('button', { name: /barbell bench press/i }));
  fireEvent.click(screen.getByRole('button', { name: /save workout/i }));

  expect(saveCustomWorkout).toHaveBeenCalledTimes(1);
  expect(saveCustomWorkout).toHaveBeenCalledWith(
    'Push Day',
    expect.arrayContaining([
      expect.objectContaining({ exerciseId: 'barbell-bench-press', exerciseName: 'Barbell Bench Press' }),
    ]),
  );
  expect(onClose).toHaveBeenCalledTimes(1);
});

// ---------------------------------------------------------------------------
// Edge case — handleSetField targetSets NaN / clamp
// ---------------------------------------------------------------------------

test('handleSetField clamps targetSets to 1 on non-numeric input, never showing NaN', () => {
  render(<WorkoutBuilderView onClose={jest.fn()} />);

  // Add an exercise first
  fireEvent.click(screen.getByRole('button', { name: /add exercise/i }));
  fireEvent.click(screen.getByRole('button', { name: /barbell bench press/i }));

  // The sets input for Barbell Bench Press (defaultSets=3)
  const setsInput = screen.getByLabelText('Barbell Bench Press target sets') as HTMLInputElement;
  expect(setsInput.value).toBe('3');

  // Type a non-numeric string
  fireEvent.change(setsInput, { target: { value: 'abc' } });

  // Value must be '1' (fallback), never NaN
  expect(setsInput.value).toBe('1');
  expect(Number.isNaN(Number(setsInput.value))).toBe(false);
});

test('handleSetField clamps targetSets to 1 when user enters 0', () => {
  render(<WorkoutBuilderView onClose={jest.fn()} />);
  fireEvent.click(screen.getByRole('button', { name: /add exercise/i }));
  fireEvent.click(screen.getByRole('button', { name: /barbell bench press/i }));

  const setsInput = screen.getByLabelText('Barbell Bench Press target sets') as HTMLInputElement;
  fireEvent.change(setsInput, { target: { value: '0' } });
  expect(setsInput.value).toBe('1');
});

// ---------------------------------------------------------------------------
// Failure case — Cancel / onClose called without saving
// ---------------------------------------------------------------------------

test('clicking the Cancel (back) button calls onClose without saving', () => {
  const onClose = jest.fn();
  render(<WorkoutBuilderView onClose={onClose} />);
  fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
  expect(onClose).toHaveBeenCalledTimes(1);
  expect(saveCustomWorkout).not.toHaveBeenCalled();
});

test('clicking Save when name is whitespace-only does NOT call saveCustomWorkout or onClose', () => {
  const onClose = jest.fn();
  render(<WorkoutBuilderView onClose={onClose} />);

  // Provide only whitespace — button stays disabled
  fireEvent.change(screen.getByPlaceholderText('Workout Name'), { target: { value: '   ' } });

  // Button should remain disabled (whitespace trims to empty)
  expect(screen.getByRole('button', { name: /save workout/i })).toBeDisabled();
  expect(saveCustomWorkout).not.toHaveBeenCalled();
  expect(onClose).not.toHaveBeenCalled();
});
