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

jest.mock('../../store/workoutDataStore');
jest.mock('../../utils/haptics', () => ({
  triggerLightImpact: jest.fn(),
  triggerSuccess: jest.fn(),
  triggerSelection: jest.fn(),
}));

// Minimal ExerciseSelectorModal stub: clicking an exercise button fires onSelect
jest.mock('./ExerciseSelectorModal', () => ({
  __esModule: true,
  default: ({ onSelect, onClose }: {
    onSelect: (ex: { id: string; name: string; muscleGroup: string; defaultSets: number; defaultRepsMin: number; defaultRepsMax: number }) => void;
    onClose: () => void;
  }) => (
    <div data-testid="exercise-selector">
      <button
        onClick={() =>
          onSelect({
            id: 'pull-up',
            name: 'Pull Up',
            muscleGroup: 'Back',
            defaultSets: 3,
            defaultRepsMin: 6,
            defaultRepsMax: 12,
          })
        }
      >
        Pull Up
      </button>
      <button onClick={onClose}>Close Selector</button>
    </div>
  ),
}));

import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import WorkoutBuilderModal from './WorkoutBuilderModal';
import { useWorkoutDataStore } from '../../store/workoutDataStore';

// ---------------------------------------------------------------------------
// Store mock helpers
// ---------------------------------------------------------------------------

const createWorkout = jest.fn();
const addExerciseToWorkout = jest.fn();

function buildStoreState(overrides: Record<string, unknown> = {}) {
  return {
    createWorkout,
    addExerciseToWorkout,
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  createWorkout.mockReturnValue('custom-xyz');
  (useWorkoutDataStore as unknown as jest.Mock).mockImplementation(
    (selector: (s: ReturnType<typeof buildStoreState>) => unknown) =>
      selector(buildStoreState()),
  );
});

// ---------------------------------------------------------------------------
// Happy path
// ---------------------------------------------------------------------------

test('renders the Workout Name input and Save Workout button', () => {
  render(<WorkoutBuilderModal onComplete={jest.fn()} onClose={jest.fn()} />);
  expect(screen.getByPlaceholderText('Workout Name')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /save workout/i })).toBeInTheDocument();
});

test('renders the Add Exercise button', () => {
  render(<WorkoutBuilderModal onComplete={jest.fn()} onClose={jest.fn()} />);
  expect(screen.getByRole('button', { name: /add exercise/i })).toBeInTheDocument();
});

test('adding an exercise displays it in the list', () => {
  render(<WorkoutBuilderModal onComplete={jest.fn()} onClose={jest.fn()} />);
  fireEvent.click(screen.getByRole('button', { name: /add exercise/i }));
  fireEvent.click(screen.getByRole('button', { name: /pull up/i }));
  expect(screen.getByText('Pull Up')).toBeInTheDocument();
});

test('clicking Save calls createWorkout and addExerciseToWorkout, then onComplete', () => {
  const onComplete = jest.fn();
  render(<WorkoutBuilderModal onComplete={onComplete} onClose={jest.fn()} />);

  fireEvent.change(screen.getByPlaceholderText('Workout Name'), { target: { value: 'Pull Day' } });
  fireEvent.click(screen.getByRole('button', { name: /add exercise/i }));
  fireEvent.click(screen.getByRole('button', { name: /pull up/i }));
  fireEvent.click(screen.getByRole('button', { name: /save workout/i }));

  expect(createWorkout).toHaveBeenCalledWith('Pull Day');
  expect(addExerciseToWorkout).toHaveBeenCalledWith(
    'custom-xyz',
    expect.objectContaining({ exerciseId: 'pull-up', exerciseName: 'Pull Up', targetSets: 3, targetReps: '6-12' }),
  );
  expect(onComplete).toHaveBeenCalledWith('custom-xyz');
});

// ---------------------------------------------------------------------------
// Edge case — Save disabled unless both name and at least one exercise present
// ---------------------------------------------------------------------------

test('Save Workout button is disabled when name is empty', () => {
  render(<WorkoutBuilderModal onComplete={jest.fn()} onClose={jest.fn()} />);
  // Add an exercise but leave name blank
  fireEvent.click(screen.getByRole('button', { name: /add exercise/i }));
  fireEvent.click(screen.getByRole('button', { name: /pull up/i }));
  expect(screen.getByRole('button', { name: /save workout/i })).toBeDisabled();
});

test('Save Workout button is disabled when no exercises are added', () => {
  render(<WorkoutBuilderModal onComplete={jest.fn()} onClose={jest.fn()} />);
  fireEvent.change(screen.getByPlaceholderText('Workout Name'), { target: { value: 'Pull Day' } });
  expect(screen.getByRole('button', { name: /save workout/i })).toBeDisabled();
});

// ---------------------------------------------------------------------------
// Failure case — close without saving
// ---------------------------------------------------------------------------

test('clicking the close button calls onClose without saving', () => {
  const onClose = jest.fn();
  const onComplete = jest.fn();
  render(<WorkoutBuilderModal onComplete={onComplete} onClose={onClose} />);
  fireEvent.click(screen.getByRole('button', { name: /close/i }));
  expect(onClose).toHaveBeenCalledTimes(1);
  expect(createWorkout).not.toHaveBeenCalled();
  expect(onComplete).not.toHaveBeenCalled();
});
