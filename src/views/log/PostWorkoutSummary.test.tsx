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
    AnimatePresence: ({ children }: { children: React.ReactNode }) =>
      React.createElement(React.Fragment, null, children),
  };
});

jest.mock('../../utils/motion', () => ({
  overlayTransition: {},
  panelTransition: {},
}));

// Mock pr helper so we control whether a PR is flagged
jest.mock('./pr', () => ({
  isExercisePrAgainstHistory: jest.fn(),
}));

import '@testing-library/jest-dom';
import { render, screen, act } from '@testing-library/react';
import { triggerSuccess } from '../../utils/haptics';
import { isExercisePrAgainstHistory } from './pr';
import { useWorkoutDataStore } from '../../store/workoutDataStore';
import PostWorkoutSummary from './PostWorkoutSummary';

const mockIsExercisePr = isExercisePrAgainstHistory as jest.Mock;
const mockTriggerSuccess = triggerSuccess as jest.Mock;

function buildSession(prFlag: boolean) {
  return {
    workoutId: 'prog-1',
    startTime: new Date().toISOString(),
    elapsedTime: 3600,
    sessionNotes: '',
    exercises: [
      {
        exerciseId: 'squat',
        exerciseName: 'Squat',
        muscleGroup: 'Legs' as const,
        defaultSets: 3,
        sets: [{ reps: 5, weight: 100, completed: true, setType: 'Normal' as const }],
        _prFlag: prFlag, // used by our mock
      },
    ],
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  useWorkoutDataStore.setState({ activeSession: null, completedWorkouts: [] });
});

test('Gap E — celebration banner renders when prsHit > 0', async () => {
  mockIsExercisePr.mockReturnValue(true);
  useWorkoutDataStore.setState({ activeSession: buildSession(true) as any });
  await act(async () => {
    render(<PostWorkoutSummary onSave={() => {}} />);
  });
  expect(screen.getByRole('status')).toBeInTheDocument();
  expect(screen.getByText(/Personal Record/)).toBeInTheDocument();
});

test('Gap E — celebration banner is absent when prsHit === 0', async () => {
  mockIsExercisePr.mockReturnValue(false);
  useWorkoutDataStore.setState({ activeSession: buildSession(false) as any });
  await act(async () => {
    render(<PostWorkoutSummary onSave={() => {}} />);
  });
  expect(screen.queryByRole('status')).toBeNull();
});

test('Gap E — triggerSuccess is called on mount when prsHit > 0', async () => {
  mockIsExercisePr.mockReturnValue(true);
  useWorkoutDataStore.setState({ activeSession: buildSession(true) as any });
  await act(async () => {
    render(<PostWorkoutSummary onSave={() => {}} />);
  });
  expect(mockTriggerSuccess).toHaveBeenCalledTimes(1);
});

test('Gap E — triggerSuccess is NOT called when prsHit === 0', async () => {
  mockIsExercisePr.mockReturnValue(false);
  useWorkoutDataStore.setState({ activeSession: buildSession(false) as any });
  await act(async () => {
    render(<PostWorkoutSummary onSave={() => {}} />);
  });
  expect(mockTriggerSuccess).not.toHaveBeenCalled();
});

test('Gap E — returns null when no active session', () => {
  useWorkoutDataStore.setState({ activeSession: null });
  const { container } = render(<PostWorkoutSummary onSave={() => {}} />);
  expect(container.firstChild).toBeNull();
});
