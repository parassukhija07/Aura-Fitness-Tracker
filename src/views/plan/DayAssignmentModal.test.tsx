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

import * as React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useWorkoutDataStore } from '../../store/workoutDataStore';
import DayAssignmentModal from './DayAssignmentModal';

const PROGRAMS = [
  { id: 'prog-1', name: 'Full Body A', description: '', exercises: [] },
  { id: 'prog-2', name: 'Upper Lower', description: '', exercises: [] },
];
const USER_WORKOUTS = [
  { id: 'custom-1', name: 'My Push Day', exercises: [], createdAt: '2026-01-01T00:00:00.000Z' },
];

const BASE_USER_PLAN = {
  id: 'user-plan-1',
  activeProgramId: 'prog-1',
  startDate: '2026-06-20',
  currentWeek: 1,
  currentDay: 1,
  schedule: [null, null, null, null, null, null, null] as (string | null)[],
};

beforeEach(() => {
  useWorkoutDataStore.setState({
    userPlan: { ...BASE_USER_PLAN },
    programs: PROGRAMS,
    userWorkouts: USER_WORKOUTS,
  });
});

function renderModal(overrides?: Partial<{ dayIndex: number; dayLabel: string; onClose: () => void }>) {
  const onClose = jest.fn();
  const props = { dayIndex: 1, dayLabel: 'Monday', onClose, ...overrides };
  const result = render(<DayAssignmentModal {...props} />);
  return { ...result, onClose };
}

// Happy path ─────────────────────────────────────────────────────────────────

test('renders all programs and userWorkouts in the combined list', () => {
  renderModal();
  expect(screen.getByText('Full Body A')).toBeInTheDocument();
  expect(screen.getByText('Upper Lower')).toBeInTheDocument();
  expect(screen.getByText('My Push Day')).toBeInTheDocument();
  // kind badges
  expect(screen.getAllByText('Program')).toHaveLength(2);
  expect(screen.getByText('Custom')).toBeInTheDocument();
});

test('dialog has accessible label containing the day name', () => {
  renderModal({ dayLabel: 'Wednesday' });
  expect(screen.getByRole('dialog', { name: /Assign workout to Wednesday/i })).toBeInTheDocument();
});

test('clicking a workout item calls assignWorkoutToDay with correct id and calls onClose', () => {
  const { onClose } = renderModal({ dayIndex: 3 });
  fireEvent.click(screen.getByText('Full Body A').closest('button')!);
  const schedule = useWorkoutDataStore.getState().userPlan!.schedule;
  expect(schedule[3]).toBe('prog-1');
  expect(onClose).toHaveBeenCalledTimes(1);
});

// Edge case ───────────────────────────────────────────────────────────────────

test('empty catalog shows "No workouts available." and "Set as Rest Day" is still visible', () => {
  useWorkoutDataStore.setState({ programs: [], userWorkouts: [] });
  renderModal();
  expect(screen.getByText('No workouts available.')).toBeInTheDocument();
  expect(screen.getByText('Set as Rest Day')).toBeInTheDocument();
});

// Failure / interaction cases ─────────────────────────────────────────────────

test('"Set as Rest Day" calls assignWorkoutToDay with null and closes', () => {
  // pre-assign something so we can verify it gets cleared
  useWorkoutDataStore.setState({
    userPlan: { ...BASE_USER_PLAN, schedule: ['prog-1', null, null, null, null, null, null] },
  });
  const { onClose } = renderModal({ dayIndex: 0 });
  fireEvent.click(screen.getByText('Set as Rest Day'));
  expect(useWorkoutDataStore.getState().userPlan!.schedule[0]).toBeNull();
  expect(onClose).toHaveBeenCalledTimes(1);
});

test('backdrop click calls onClose', () => {
  const { onClose } = renderModal();
  const backdrop = screen.getByRole('presentation');
  // Simulate clicking the backdrop element itself (not a child)
  fireEvent.click(backdrop, { target: backdrop });
  expect(onClose).toHaveBeenCalledTimes(1);
});
