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
import SetRow from './SetRow';
import { useWorkoutDataStore } from '../../store/workoutDataStore';
import { triggerSuccess } from '../../utils/haptics';
import type { LoggedSet } from '../../types/workout';

const mockCompleteSet = jest.fn();
const mockUpdateSetField = jest.fn();
const mockUpdateSetType = jest.fn();

function buildSet(overrides: Partial<LoggedSet> = {}): LoggedSet {
  return { reps: 0, weight: 0, completed: false, setType: 'Normal', ...overrides };
}

beforeEach(() => {
  jest.clearAllMocks();
  (useWorkoutDataStore as unknown as jest.Mock).mockImplementation(
    (selector: (s: object) => unknown) =>
      selector({
        completeSet: mockCompleteSet,
        updateSetField: mockUpdateSetField,
        updateSetType: mockUpdateSetType,
      }),
  );
});

// ---------------------------------------------------------------------------
// Happy path — checkbox fires triggerSuccess when transitioning to completed
// ---------------------------------------------------------------------------

test('checkbox onChange fires triggerSuccess once when set is not yet completed', () => {
  const set = buildSet({ completed: false, weight: 100, reps: 8 });
  render(<SetRow exerciseIndex={0} setIndex={0} set={set} onDelete={jest.fn()} />);

  const checkbox = screen.getByRole('checkbox');
  fireEvent.click(checkbox);

  expect(triggerSuccess).toHaveBeenCalledTimes(1);
  expect(mockCompleteSet).toHaveBeenCalledWith(0, 0);
});

// ---------------------------------------------------------------------------
// Edge case — handleBlur fires triggerSuccess only when weight>0 and reps>0
// ---------------------------------------------------------------------------

test('handleBlur fires triggerSuccess when set is uncompleted with weight and reps > 0', () => {
  const set = buildSet({ completed: false, weight: 80, reps: 5 });
  render(<SetRow exerciseIndex={1} setIndex={2} set={set} onDelete={jest.fn()} />);

  // Blur the weight input
  const inputs = screen.getAllByRole('textbox');
  fireEvent.blur(inputs[0]);

  expect(triggerSuccess).toHaveBeenCalledTimes(1);
  expect(mockCompleteSet).toHaveBeenCalledWith(1, 2);
});

test('handleBlur does NOT fire triggerSuccess when weight is 0', () => {
  const set = buildSet({ completed: false, weight: 0, reps: 5 });
  render(<SetRow exerciseIndex={0} setIndex={0} set={set} onDelete={jest.fn()} />);

  const inputs = screen.getAllByRole('textbox');
  fireEvent.blur(inputs[0]);

  expect(triggerSuccess).not.toHaveBeenCalled();
  expect(mockCompleteSet).not.toHaveBeenCalled();
});

// ---------------------------------------------------------------------------
// Failure case — triggerSuccess does NOT fire when un-checking a completed set
// ---------------------------------------------------------------------------

test('checkbox onChange does NOT fire triggerSuccess when set is already completed (un-check)', () => {
  const set = buildSet({ completed: true, weight: 100, reps: 8 });
  render(<SetRow exerciseIndex={0} setIndex={0} set={set} onDelete={jest.fn()} />);

  const checkbox = screen.getByRole('checkbox');
  fireEvent.click(checkbox);

  expect(triggerSuccess).not.toHaveBeenCalled();
  // completeSet (toggle) is still called
  expect(mockCompleteSet).toHaveBeenCalledWith(0, 0);
});
