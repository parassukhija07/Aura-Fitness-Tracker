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
jest.mock('./WorkoutBuilderModal', () => ({
  __esModule: true,
  default: ({ onClose }: { onClose: () => void }) => (
    <div data-testid="workout-builder-modal">
      <button onClick={onClose}>Close Modal</button>
    </div>
  ),
}));

import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import ProgramBuilderView from './ProgramBuilderView';
import { useWorkoutDataStore } from '../../store/workoutDataStore';

// ---------------------------------------------------------------------------
// Store mock helpers
// ---------------------------------------------------------------------------

const createProgram = jest.fn();
const addWorkoutToProgram = jest.fn();
const setActiveProgram = jest.fn();
const updateActiveSchedule = jest.fn();

function buildStoreState(overrides: Record<string, unknown> = {}) {
  return {
    userPrograms: [],
    createProgram,
    addWorkoutToProgram,
    setActiveProgram,
    updateActiveSchedule,
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  createProgram.mockReturnValue('');
  (useWorkoutDataStore as unknown as jest.Mock).mockImplementation(
    (selector: (s: ReturnType<typeof buildStoreState>) => unknown) =>
      selector(buildStoreState()),
  );
});

// ---------------------------------------------------------------------------
// Happy path
// ---------------------------------------------------------------------------

test('renders Program Name input and Create Program button', () => {
  render(<ProgramBuilderView onClose={jest.fn()} />);
  expect(screen.getByPlaceholderText('Program Name')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /create program/i })).toBeInTheDocument();
});

test('renders the Add Workout button', () => {
  render(<ProgramBuilderView onClose={jest.fn()} />);
  expect(screen.getByRole('button', { name: /add workout/i })).toBeInTheDocument();
});

test('Create Program button is disabled when name is empty', () => {
  render(<ProgramBuilderView onClose={jest.fn()} />);
  expect(screen.getByRole('button', { name: /create program/i })).toBeDisabled();
});

test('Create Program button becomes enabled after typing a name', () => {
  render(<ProgramBuilderView onClose={jest.fn()} />);
  fireEvent.change(screen.getByPlaceholderText('Program Name'), { target: { value: 'My Program' } });
  expect(screen.getByRole('button', { name: /create program/i })).not.toBeDisabled();
});

test('clicking Create Program calls createProgram with the name and description', () => {
  createProgram.mockReturnValue('program-123');
  (useWorkoutDataStore as unknown as jest.Mock).mockImplementation(
    (selector: (s: ReturnType<typeof buildStoreState>) => unknown) =>
      selector(buildStoreState()),
  );

  render(<ProgramBuilderView onClose={jest.fn()} />);
  fireEvent.change(screen.getByPlaceholderText('Program Name'), { target: { value: 'Push Pull Legs' } });
  fireEvent.change(screen.getByPlaceholderText('Description (optional)'), { target: { value: 'My desc' } });
  fireEvent.click(screen.getByRole('button', { name: /create program/i }));
  expect(createProgram).toHaveBeenCalledWith('Push Pull Legs', 'My desc');
});

// ---------------------------------------------------------------------------
// Edge case — Set as Active Program disabled states
// ---------------------------------------------------------------------------

test('Set as Active Program is disabled when programId is null (no program created)', () => {
  render(<ProgramBuilderView onClose={jest.fn()} />);
  expect(screen.getByRole('button', { name: /set as active program/i })).toBeDisabled();
});

test('Set as Active Program is disabled when program has no exercises even after creation', () => {
  // programId is set but exercises array is empty
  createProgram.mockReturnValue('program-abc');
  const emptyProgram = { id: 'program-abc', name: 'Empty', description: '', exercises: [] };
  (useWorkoutDataStore as unknown as jest.Mock).mockImplementation(
    (selector: (s: ReturnType<typeof buildStoreState>) => unknown) =>
      selector(buildStoreState({ userPrograms: [emptyProgram] })),
  );

  render(<ProgramBuilderView onClose={jest.fn()} />);
  fireEvent.change(screen.getByPlaceholderText('Program Name'), { target: { value: 'Empty' } });
  fireEvent.click(screen.getByRole('button', { name: /create program/i }));

  expect(screen.getByRole('button', { name: /set as active program/i })).toBeDisabled();
});

// ---------------------------------------------------------------------------
// Failure case — cancel calls onClose without saving
// ---------------------------------------------------------------------------

test('clicking the back/cancel button calls onClose without saving', () => {
  const onClose = jest.fn();
  render(<ProgramBuilderView onClose={onClose} />);
  fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
  expect(onClose).toHaveBeenCalledTimes(1);
  expect(createProgram).not.toHaveBeenCalled();
});
