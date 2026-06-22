/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import ExercisesTab from './ExercisesTab';

// Mock framer-motion so motion.div renders as a plain div
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className }: React.HTMLAttributes<HTMLDivElement>) =>
      // strip framer-motion specific props before passing to div
      <div className={className}>{children}</div>,
  },
}));

// Mock the store to return the real exercises catalog
jest.mock('../../store/workoutDataStore', () => ({
  useWorkoutDataStore: (sel: (s: any) => any) => sel({ exercises: require('../../data/exercises.json') }),
}));

// Mock CreateExerciseSheet to avoid Sheet/portal/framer-motion complexity
jest.mock('./CreateExerciseSheet', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: () => React.createElement(React.Fragment, null),
  };
});

// ─── helpers ────────────────────────────────────────────────────────────────

function getCellNames() {
  return Array.from(document.querySelectorAll('.exercises-tab__cell-name')).map(
    (el) => el.textContent ?? ''
  );
}

// Derive expected counts from the same catalog the component renders, so the
// tests stay correct as the exercise library grows.
const CATALOG = require('../../data/exercises.json') as Array<{ muscleGroup: string }>;
const TOTAL_EXERCISES = CATALOG.length;
const countByGroup = (g: string) => CATALOG.filter((e) => e.muscleGroup === g).length;

// ─── Happy Path ──────────────────────────────────────────────────────────────

describe('ExercisesTab — happy path', () => {
  beforeEach(() => render(<ExercisesTab />));

  test('renders all exercise cells when no filter is active', () => {
    const cells = document.querySelectorAll('.exercises-tab__cell');
    expect(cells).toHaveLength(TOTAL_EXERCISES);
  });

  test('renders the search input with placeholder text', () => {
    expect(
      screen.getByPlaceholderText('Search exercises')
    ).toBeInTheDocument();
  });

  test('renders 7 body-part filter chips (All + 6 muscle groups)', () => {
    const chips = document.querySelectorAll('[aria-label="Filter by body part"] .aura-chip');
    expect(chips).toHaveLength(7);
    const labels = Array.from(chips).map((c) => c.textContent);
    expect(labels).toEqual(['All', 'Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core']);
  });

  test('"All" body-part chip has the selected class on initial render', () => {
    const bodyPartGroup = document.querySelector('[aria-label="Filter by body part"]')!;
    const allChip = Array.from(bodyPartGroup.querySelectorAll('.aura-chip')).find(
      (el) => el.textContent === 'All'
    ) as HTMLElement;
    expect(allChip).toHaveClass('aura-chip--selected');
  });

  test('each cell shows name and muscle · equipment meta', () => {
    // Spot-check first entry: Barbell Bench Press
    const cellNames = document.querySelectorAll('.exercises-tab__cell-name');
    const cellMetas = document.querySelectorAll('.exercises-tab__cell-meta');

    const names = Array.from(cellNames).map((el) => el.textContent);
    const metas = Array.from(cellMetas).map((el) => el.textContent);

    expect(names).toContain('Barbell Bench Press');
    const idx = names.indexOf('Barbell Bench Press');
    expect(metas[idx]).toBe('Chest · Barbell');
  });
});

// ─── Edge Cases ──────────────────────────────────────────────────────────────

describe('ExercisesTab — edge cases', () => {
  beforeEach(() => render(<ExercisesTab />));

  test('search is case-insensitive: " BENCH " returns bench exercises', () => {
    const input = screen.getByPlaceholderText('Search exercises');
    fireEvent.change(input, { target: { value: ' BENCH ' } });

    const names = getCellNames();
    // All returned cells must contain "bench" (case-insensitive)
    names.forEach((name) => {
      expect(name.toLowerCase()).toContain('bench');
    });
    // Known bench exercises that should appear
    expect(names).toContain('Barbell Bench Press');
    expect(names).toContain('Dumbbell Bench Press');
  });

  test('Chest chip filters to only Chest exercises', () => {
    fireEvent.click(screen.getByRole('button', { name: 'Chest' }));
    const cells = document.querySelectorAll('.exercises-tab__cell');
    expect(cells).toHaveLength(countByGroup('Chest'));

    const metas = Array.from(document.querySelectorAll('.exercises-tab__cell-meta')).map(
      (el) => el.textContent
    );
    metas.forEach((s) => expect(s).toContain('Chest'));
  });

  test('Core chip filters to only Core exercises', () => {
    fireEvent.click(screen.getByRole('button', { name: 'Core' }));
    const cells = document.querySelectorAll('.exercises-tab__cell');
    expect(cells).toHaveLength(countByGroup('Core'));
  });

  test('clicking "All" after a chip filter resets to the full catalog', () => {
    fireEvent.click(screen.getByRole('button', { name: 'Chest' }));
    expect(document.querySelectorAll('.exercises-tab__cell')).toHaveLength(countByGroup('Chest'));

    const bodyPartGroup = document.querySelector('[aria-label="Filter by body part"]')!;
    const allChip = Array.from(bodyPartGroup.querySelectorAll('.aura-chip')).find(
      (el) => el.textContent === 'All'
    ) as HTMLElement;
    fireEvent.click(allChip);
    expect(document.querySelectorAll('.exercises-tab__cell')).toHaveLength(TOTAL_EXERCISES);
  });

  test('selected chip class moves to the clicked chip', () => {
    const chestBtn = screen.getByRole('button', { name: 'Chest' });
    fireEvent.click(chestBtn);
    expect(chestBtn).toHaveClass('aura-chip--selected');
    const bodyPartGroup = document.querySelector('[aria-label="Filter by body part"]')!;
    const allChip = Array.from(bodyPartGroup.querySelectorAll('.aura-chip')).find(
      (el) => el.textContent === 'All'
    ) as HTMLElement;
    expect(allChip).not.toHaveClass('aura-chip--selected');
  });

  test('Shoulders chip filters to only Shoulder exercises', () => {
    fireEvent.click(screen.getByRole('button', { name: 'Shoulders' }));
    const cells = document.querySelectorAll('.exercises-tab__cell');
    expect(cells).toHaveLength(countByGroup('Shoulders'));
  });
});

// ─── Failure / Empty State ────────────────────────────────────────────────────

describe('ExercisesTab — failure/empty states', () => {
  beforeEach(() => render(<ExercisesTab />));

  test('search + filter producing zero results shows the empty message', () => {
    // Filter to Chest, then search for something that won't match any chest exercise
    fireEvent.click(screen.getByRole('button', { name: 'Chest' }));
    const input = screen.getByPlaceholderText('Search exercises');
    fireEvent.change(input, { target: { value: 'xyznonexistent' } });

    expect(screen.getByText('No exercises match your search.')).toBeInTheDocument();
    expect(document.querySelectorAll('.exercises-tab__cell')).toHaveLength(0);
  });

  test('search with no matching name shows empty state', () => {
    const input = screen.getByPlaceholderText('Search exercises');
    fireEvent.change(input, { target: { value: 'zzzzzznotanexercise' } });
    expect(screen.getByText('No exercises match your search.')).toBeInTheDocument();
  });

  test('exercises-tab__grid is NOT rendered when empty state is shown', () => {
    const input = screen.getByPlaceholderText('Search exercises');
    fireEvent.change(input, { target: { value: 'zzzzzznotanexercise' } });
    expect(document.querySelector('.exercises-tab__grid')).toBeNull();
  });

  test('whitespace-only search shows all exercises (empty trimmed query)', () => {
    const input = screen.getByPlaceholderText('Search exercises');
    fireEvent.change(input, { target: { value: '     ' } });
    expect(document.querySelectorAll('.exercises-tab__cell')).toHaveLength(TOTAL_EXERCISES);
  });
});
