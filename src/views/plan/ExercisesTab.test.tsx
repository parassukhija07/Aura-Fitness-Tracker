/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom';
import { render, screen, fireEvent, within } from '@testing-library/react';
import ExercisesTab from './ExercisesTab';

// Mock framer-motion so motion.div renders as a plain div
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, ...rest }: React.HTMLAttributes<HTMLDivElement>) =>
      // strip framer-motion specific props before passing to div
      <div className={className}>{children}</div>,
  },
}));

// ─── helpers ────────────────────────────────────────────────────────────────

function getCards() {
  return screen.queryAllByRole('heading').length > 0
    ? screen.getAllByRole('heading')
    : document.querySelectorAll('.plan-card');
}

function getCardNames() {
  return Array.from(document.querySelectorAll('.plan-card__name')).map(
    (el) => el.textContent ?? ''
  );
}

// ─── Happy Path ──────────────────────────────────────────────────────────────

describe('ExercisesTab — happy path', () => {
  beforeEach(() => render(<ExercisesTab />));

  test('renders all 56 exercise cards when no filter is active', () => {
    const cards = document.querySelectorAll('.plan-card');
    expect(cards).toHaveLength(56);
  });

  test('renders the search input with placeholder text', () => {
    expect(
      screen.getByPlaceholderText('Search exercises')
    ).toBeInTheDocument();
  });

  test('renders 7 filter chips (All + 6 muscle groups)', () => {
    const chips = document.querySelectorAll('.exercises-tab__chip');
    expect(chips).toHaveLength(7);
    const labels = Array.from(chips).map((c) => c.textContent);
    expect(labels).toEqual(['All', 'Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core']);
  });

  test('"All" chip has the active class on initial render', () => {
    const allChip = screen.getByRole('button', { name: 'All' });
    expect(allChip).toHaveClass('exercises-tab__chip--active');
  });

  test('each card shows name, muscleGroup, and equipment badge', () => {
    // Spot-check first entry: Barbell Bench Press
    const cardNames = document.querySelectorAll('.plan-card__name');
    const cardSubs = document.querySelectorAll('.plan-card__sub');
    const cardBadges = document.querySelectorAll('.plan-badge');

    const names = Array.from(cardNames).map((el) => el.textContent);
    const subs = Array.from(cardSubs).map((el) => el.textContent);
    const badges = Array.from(cardBadges).map((el) => el.textContent);

    expect(names).toContain('Barbell Bench Press');
    const idx = names.indexOf('Barbell Bench Press');
    expect(subs[idx]).toBe('Chest');
    expect(badges[idx]).toBe('Barbell');
  });
});

// ─── Edge Cases ──────────────────────────────────────────────────────────────

describe('ExercisesTab — edge cases', () => {
  beforeEach(() => render(<ExercisesTab />));

  test('search is case-insensitive: " BENCH " returns bench exercises', () => {
    const input = screen.getByPlaceholderText('Search exercises');
    fireEvent.change(input, { target: { value: ' BENCH ' } });

    const names = getCardNames();
    // All returned cards must contain "bench" (case-insensitive)
    names.forEach((name) => {
      expect(name.toLowerCase()).toContain('bench');
    });
    // Known bench exercises that should appear
    expect(names).toContain('Barbell Bench Press');
    expect(names).toContain('Dumbbell Bench Press');
  });

  test('Chest chip filters to exactly 10 Chest exercises', () => {
    fireEvent.click(screen.getByRole('button', { name: 'Chest' }));
    const cards = document.querySelectorAll('.plan-card');
    expect(cards).toHaveLength(10);

    const subs = Array.from(document.querySelectorAll('.plan-card__sub')).map(
      (el) => el.textContent
    );
    subs.forEach((s) => expect(s).toBe('Chest'));
  });

  test('Core chip filters to exactly 8 Core exercises', () => {
    fireEvent.click(screen.getByRole('button', { name: 'Core' }));
    const cards = document.querySelectorAll('.plan-card');
    expect(cards).toHaveLength(8);
  });

  test('clicking "All" after a chip filter resets to 56 cards', () => {
    fireEvent.click(screen.getByRole('button', { name: 'Chest' }));
    expect(document.querySelectorAll('.plan-card')).toHaveLength(10);

    fireEvent.click(screen.getByRole('button', { name: 'All' }));
    expect(document.querySelectorAll('.plan-card')).toHaveLength(56);
  });

  test('active chip class moves to the clicked chip', () => {
    const chestBtn = screen.getByRole('button', { name: 'Chest' });
    fireEvent.click(chestBtn);
    expect(chestBtn).toHaveClass('exercises-tab__chip--active');
    expect(screen.getByRole('button', { name: 'All' })).not.toHaveClass(
      'exercises-tab__chip--active'
    );
  });

  test('Shoulders chip filters to exactly 9 Shoulder exercises', () => {
    fireEvent.click(screen.getByRole('button', { name: 'Shoulders' }));
    const cards = document.querySelectorAll('.plan-card');
    expect(cards).toHaveLength(9);
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
    expect(document.querySelectorAll('.plan-card')).toHaveLength(0);
  });

  test('search with no matching name shows empty state', () => {
    const input = screen.getByPlaceholderText('Search exercises');
    fireEvent.change(input, { target: { value: 'zzzzzznotanexercise' } });
    expect(screen.getByText('No exercises match your search.')).toBeInTheDocument();
  });

  test('plan-grid is NOT rendered when empty state is shown', () => {
    const input = screen.getByPlaceholderText('Search exercises');
    fireEvent.change(input, { target: { value: 'zzzzzznotanexercise' } });
    expect(document.querySelector('.plan-grid')).toBeNull();
  });

  test('whitespace-only search shows all 56 exercises (empty trimmed query)', () => {
    const input = screen.getByPlaceholderText('Search exercises');
    fireEvent.change(input, { target: { value: '     ' } });
    expect(document.querySelectorAll('.plan-card')).toHaveLength(56);
  });
});
