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

import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import ExerciseSelectorModal from './ExerciseSelectorModal';
import { useWorkoutDataStore } from '../../store/workoutDataStore';
import type { Exercise } from '../../types/workout';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const MOCK_EXERCISES: Exercise[] = [
  { id: 'barbell-bench-press', name: 'Barbell Bench Press', muscleGroup: 'Chest',     defaultSets: 3, defaultRepsMin: 6, defaultRepsMax: 10, equipment: 'Barbell' },
  { id: 'barbell-back-squat',  name: 'Barbell Back Squat',  muscleGroup: 'Legs',      defaultSets: 3, defaultRepsMin: 5, defaultRepsMax: 8,  equipment: 'Barbell' },
  { id: 'deadlift',            name: 'Deadlift',            muscleGroup: 'Back',      defaultSets: 3, defaultRepsMin: 3, defaultRepsMax: 6,  equipment: 'Barbell' },
  { id: 'overhead-press',      name: 'Overhead Press',      muscleGroup: 'Shoulders', defaultSets: 3, defaultRepsMin: 6, defaultRepsMax: 10, equipment: 'Barbell' },
];

beforeEach(() => {
  jest.clearAllMocks();
  (useWorkoutDataStore as unknown as jest.Mock).mockImplementation(
    (selector: (s: { exercises: Exercise[] }) => unknown) =>
      selector({ exercises: MOCK_EXERCISES }),
  );
});

// ---------------------------------------------------------------------------
// Happy path — renders exercise list
// ---------------------------------------------------------------------------

test('renders all exercises from the store by default', () => {
  render(<ExerciseSelectorModal onSelect={jest.fn()} onClose={jest.fn()} />);
  expect(screen.getByText('Barbell Bench Press')).toBeInTheDocument();
  expect(screen.getByText('Barbell Back Squat')).toBeInTheDocument();
  expect(screen.getByText('Deadlift')).toBeInTheDocument();
  expect(screen.getByText('Overhead Press')).toBeInTheDocument();
});

test('renders the search input', () => {
  render(<ExerciseSelectorModal onSelect={jest.fn()} onClose={jest.fn()} />);
  expect(screen.getByRole('textbox', { name: /search exercises/i })).toBeInTheDocument();
});

test('clicking an exercise item calls onSelect with the correct Exercise object', () => {
  const onSelect = jest.fn();
  render(<ExerciseSelectorModal onSelect={onSelect} onClose={jest.fn()} />);
  fireEvent.click(screen.getByRole('button', { name: /barbell bench press/i }));
  expect(onSelect).toHaveBeenCalledTimes(1);
  expect(onSelect).toHaveBeenCalledWith(MOCK_EXERCISES[0]);
});

// ---------------------------------------------------------------------------
// Edge case — search filtering
// ---------------------------------------------------------------------------

test('search by name (case-insensitive) filters the list correctly', () => {
  render(<ExerciseSelectorModal onSelect={jest.fn()} onClose={jest.fn()} />);
  fireEvent.change(screen.getByRole('textbox', { name: /search exercises/i }), { target: { value: 'dead' } });
  expect(screen.getByText('Deadlift')).toBeInTheDocument();
  expect(screen.queryByText('Barbell Bench Press')).not.toBeInTheDocument();
  expect(screen.queryByText('Barbell Back Squat')).not.toBeInTheDocument();
});

test('search by muscleGroup (case-insensitive) shows matching exercises', () => {
  render(<ExerciseSelectorModal onSelect={jest.fn()} onClose={jest.fn()} />);
  fireEvent.change(screen.getByRole('textbox', { name: /search exercises/i }), { target: { value: 'CHEST' } });
  expect(screen.getByText('Barbell Bench Press')).toBeInTheDocument();
  expect(screen.queryByText('Deadlift')).not.toBeInTheDocument();
  expect(screen.queryByText('Barbell Back Squat')).not.toBeInTheDocument();
});

test('search with no match shows "No exercises found." message', () => {
  render(<ExerciseSelectorModal onSelect={jest.fn()} onClose={jest.fn()} />);
  fireEvent.change(screen.getByRole('textbox', { name: /search exercises/i }), { target: { value: 'zzznomatch' } });
  expect(screen.getByText(/no exercises found/i)).toBeInTheDocument();
});

// ---------------------------------------------------------------------------
// Failure case — backdrop and close button
// ---------------------------------------------------------------------------

test('clicking the Close button calls onClose', () => {
  const onClose = jest.fn();
  render(<ExerciseSelectorModal onSelect={jest.fn()} onClose={onClose} />);
  fireEvent.click(screen.getByRole('button', { name: /close/i }));
  expect(onClose).toHaveBeenCalledTimes(1);
});

test('clicking an exercise item does NOT call onClose', () => {
  const onClose = jest.fn();
  render(<ExerciseSelectorModal onSelect={jest.fn()} onClose={onClose} />);
  fireEvent.click(screen.getByRole('button', { name: /deadlift/i }));
  expect(onClose).not.toHaveBeenCalled();
});
