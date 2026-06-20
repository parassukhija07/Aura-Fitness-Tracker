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

// Mock DayAssignmentModal so it doesn't pull in its own deps
jest.mock('./DayAssignmentModal', () => ({
  __esModule: true,
  default: ({ dayLabel, onClose }: { dayLabel: string; onClose: () => void }) => (
    <div data-testid="day-assignment-modal" data-day={dayLabel}>
      <button onClick={onClose} aria-label="Close">Close</button>
    </div>
  ),
}));

import * as React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useWorkoutDataStore } from '../../store/workoutDataStore';
import MyPlansTab from './MyPlansTab';

const BASE_USER_PLAN = {
  id: 'user-plan-1',
  activeProgramId: 'prog-1',
  startDate: '2026-06-20',
  currentWeek: 1,
  currentDay: 1,
  schedule: [null, null, null, null, null, null, null] as (string | null)[],
};

const PROGRAMS = [
  { id: 'prog-1', name: 'Full Body A', description: '', exercises: [] },
];

beforeEach(() => {
  useWorkoutDataStore.setState({
    userPlan: { ...BASE_USER_PLAN, schedule: [null, null, null, null, null, null, null] },
    programs: PROGRAMS,
    userWorkouts: [],
  });
});

test('renders 7 day cards', () => {
  render(<MyPlansTab />);
  const buttons = screen.getAllByRole('button', { name: /Edit (Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday)/i });
  expect(buttons).toHaveLength(7);
});

test('shows "Rest Day" for null schedule slots', () => {
  render(<MyPlansTab />);
  // All 7 slots are null → 7 "Rest Day" labels
  const restDaySpans = screen.getAllByText('Rest Day');
  expect(restDaySpans).toHaveLength(7);
});

test('shows workout name when a valid id is assigned', () => {
  useWorkoutDataStore.setState({
    userPlan: {
      ...BASE_USER_PLAN,
      schedule: ['prog-1', null, null, null, null, null, null],
    },
    programs: PROGRAMS,
    userWorkouts: [],
  });
  render(<MyPlansTab />);
  expect(screen.getByText('Full Body A')).toBeInTheDocument();
  // Remaining 6 days still show Rest Day
  const restDaySpans = screen.getAllByText('Rest Day');
  expect(restDaySpans).toHaveLength(6);
});

test('dangling id (workout deleted) falls back to "Rest Day"', () => {
  useWorkoutDataStore.setState({
    userPlan: {
      ...BASE_USER_PLAN,
      schedule: ['non-existent-id', null, null, null, null, null, null],
    },
    programs: PROGRAMS,
    userWorkouts: [],
  });
  render(<MyPlansTab />);
  // All 7 should render "Rest Day", none should render "undefined"
  const restDaySpans = screen.getAllByText('Rest Day');
  expect(restDaySpans).toHaveLength(7);
  expect(screen.queryByText('undefined')).not.toBeInTheDocument();
});

test('clicking a day card opens DayAssignmentModal for that day', () => {
  render(<MyPlansTab />);
  expect(screen.queryByTestId('day-assignment-modal')).not.toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: 'Edit Monday' }));

  const modal = screen.getByTestId('day-assignment-modal');
  expect(modal).toBeInTheDocument();
  expect(modal).toHaveAttribute('data-day', 'Monday');
});

test('closing the modal removes it from the DOM', () => {
  render(<MyPlansTab />);
  fireEvent.click(screen.getByRole('button', { name: 'Edit Friday' }));
  expect(screen.getByTestId('day-assignment-modal')).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: 'Close' }));
  expect(screen.queryByTestId('day-assignment-modal')).not.toBeInTheDocument();
});

test('renders empty-state when userPlan is null', () => {
  useWorkoutDataStore.setState({ userPlan: null });
  render(<MyPlansTab />);
  expect(screen.getByText(/No active plan/i)).toBeInTheDocument();
  expect(screen.queryAllByRole('button', { name: /Edit/i })).toHaveLength(0);
});
