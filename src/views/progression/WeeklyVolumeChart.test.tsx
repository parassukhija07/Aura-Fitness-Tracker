/**
 * @jest-environment jsdom
 */
jest.mock('recharts', () => {
  const React = require('react');
  const passthrough =
    (name: string) =>
    ({ children }: { children?: React.ReactNode }) =>
      React.createElement(name, null, children);
  return {
    ResponsiveContainer: ({ children }: { children?: React.ReactNode }) =>
      React.createElement('div', null, children),
    LineChart: passthrough('div'),
    Line: () => null,
    XAxis: () => null,
    YAxis: () => null,
    Tooltip: () => null,
    CartesianGrid: () => null,
    BarChart: passthrough('div'),
    Bar: passthrough('div'),
    Cell: () => null,
  };
});

import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import WeeklyVolumeChart from './WeeklyVolumeChart';
import type { CompletedSession } from '../../store/statsDataStore';

const todayKey = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

test('shows empty state when sessions is empty', () => {
  render(<WeeklyVolumeChart sessions={[]} />);
  expect(screen.getByText('No volume logged this week yet.')).toBeInTheDocument();
});

test('hides empty state when there is a completed weighted set this week', () => {
  const session: CompletedSession = {
    date: todayKey(),
    exercises: [
      {
        exerciseId: 'barbell-bench-press',
        exerciseName: 'Barbell Bench Press',
        muscleGroup: 'Chest',
        sets: [{ reps: 5, weight: 100, completed: true }],
      },
    ],
  };
  const { container } = render(<WeeklyVolumeChart sessions={[session]} />);
  expect(container.querySelector('.stats-empty')).toBeNull();
});
