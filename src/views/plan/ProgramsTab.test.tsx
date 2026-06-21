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

jest.mock('framer-motion', () => {
  const React = require('react');
  return {
    motion: {
      div: ({ children, ...rest }: React.HTMLAttributes<HTMLDivElement>) =>
        React.createElement('div', rest, children),
    },
    AnimatePresence: ({ children }: { children?: React.ReactNode }) =>
      React.createElement(React.Fragment, null, children),
  };
});

jest.mock('../../utils/haptics', () => ({
  triggerLightImpact: jest.fn(),
}));

// Mock seed data with a small deterministic fixture
const MOCK_PROGRAMS = [
  {
    id: 'lib-ppl',
    name: 'Push Pull Legs',
    description: 'Classic hypertrophy split',
    goal: 'Hypertrophy',
    workouts: [
      { name: 'Push', exercises: [{ exerciseId: 'barbell-bench-press', sets: 4, repsMin: 8, repsMax: 12 }] },
    ],
  },
  {
    id: 'lib-upper-lower',
    name: 'Upper Lower Split',
    description: 'Strength focused',
    goal: 'Strength',
    workouts: [
      { name: 'Upper A', exercises: [{ exerciseId: 'overhead-press', sets: 3, repsMin: 5, repsMax: 5 }] },
    ],
  },
  {
    id: 'lib-full-body',
    name: 'Full Body 3-Day',
    description: 'Endurance training',
    goal: 'Endurance',
    workouts: [
      { name: 'Day 1', exercises: [{ exerciseId: 'deadlift', sets: 3, repsMin: 10, repsMax: 15 }] },
    ],
  },
];

jest.mock('../../data/seedPrograms', () => ({
  SEED_CATALOG_PROGRAMS: MOCK_PROGRAMS,
}));

// Mock ProgramDetailView so we don't pull in its transitive deps
jest.mock('./ProgramDetailView', () => ({
  __esModule: true,
  default: ({ program, onClose }: { program: { name: string }; onClose: () => void }) => {
    const React = require('react');
    return React.createElement(
      'div',
      { 'data-testid': 'program-detail-view' },
      React.createElement('span', null, program.name),
      React.createElement('button', { onClick: onClose, 'aria-label': 'Close detail' }, 'Close'),
    );
  },
}));

// Mock ProgramBuilderView
jest.mock('./ProgramBuilderView', () => ({
  __esModule: true,
  default: ({ onClose }: { onClose: () => void }) => {
    const React = require('react');
    return React.createElement(
      'div',
      { 'data-testid': 'program-builder-view' },
      React.createElement('button', { onClick: onClose, 'aria-label': 'Close builder' }, 'Close'),
    );
  },
}));

import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useWorkoutDataStore } from '../../store/workoutDataStore';
import ProgramsTab from './ProgramsTab';

beforeEach(() => {
  useWorkoutDataStore.setState({ userPrograms: [] });
});

// ─── Happy Path ───────────────────────────────────────────────────────────────

test('renders all catalog program cards on initial load', () => {
  render(<ProgramsTab />);
  expect(screen.getByText('Push Pull Legs')).toBeInTheDocument();
  expect(screen.getByText('Upper Lower Split')).toBeInTheDocument();
  expect(screen.getByText('Full Body 3-Day')).toBeInTheDocument();
});

test('clicking a catalog card opens ProgramDetailView', () => {
  render(<ProgramsTab />);
  expect(screen.queryByTestId('program-detail-view')).not.toBeInTheDocument();

  fireEvent.click(screen.getByText('Push Pull Legs'));

  expect(screen.getByTestId('program-detail-view')).toBeInTheDocument();
  expect(screen.getByText('Push Pull Legs', { selector: 'span' })).toBeInTheDocument();
});

test('closing detail view returns to the catalog grid', () => {
  render(<ProgramsTab />);
  fireEvent.click(screen.getByText('Push Pull Legs'));
  expect(screen.getByTestId('program-detail-view')).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: 'Close detail' }));
  expect(screen.queryByTestId('program-detail-view')).not.toBeInTheDocument();
  expect(screen.getByText('Push Pull Legs')).toBeInTheDocument();
});

// ─── Edge Case: filter chip + search query simultaneously ─────────────────────

test('goal chip filter narrows visible programs', () => {
  render(<ProgramsTab />);
  fireEvent.click(screen.getByRole('button', { name: 'Strength' }));

  expect(screen.getByText('Upper Lower Split')).toBeInTheDocument();
  expect(screen.queryByText('Push Pull Legs')).not.toBeInTheDocument();
  expect(screen.queryByText('Full Body 3-Day')).not.toBeInTheDocument();
});

test('search query and chip filter combined return only matching programs', () => {
  render(<ProgramsTab />);
  // Activate 'Hypertrophy' chip
  fireEvent.click(screen.getByRole('button', { name: 'Hypertrophy' }));
  // Type a query that matches nothing in Hypertrophy
  fireEvent.change(screen.getByRole('textbox', { name: /search programs/i }), {
    target: { value: 'Full' },
  });

  // "Full Body 3-Day" is Endurance, not Hypertrophy → should NOT appear
  expect(screen.queryByText('Full Body 3-Day')).not.toBeInTheDocument();
  // "Push Pull Legs" is Hypertrophy but doesn't contain "Full" → should NOT appear
  expect(screen.queryByText('Push Pull Legs')).not.toBeInTheDocument();
  expect(screen.getByText('No programs match your search.')).toBeInTheDocument();
});

// ─── Failure Case: empty state ────────────────────────────────────────────────

test('shows empty state div when no programs match search query', () => {
  render(<ProgramsTab />);
  fireEvent.change(screen.getByRole('textbox', { name: /search programs/i }), {
    target: { value: 'xyzzy-nonexistent' },
  });

  expect(screen.getByText('No programs match your search.')).toBeInTheDocument();
  // Cards should be gone
  expect(screen.queryByText('Push Pull Legs')).not.toBeInTheDocument();
});
