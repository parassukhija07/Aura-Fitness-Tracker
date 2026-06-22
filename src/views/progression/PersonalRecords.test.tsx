/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import PersonalRecords from './PersonalRecords';
import type { CompletedSession } from '../../store/statsDataStore';

const todayKey = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

test('shows empty state when sessions is empty', () => {
  render(<PersonalRecords sessions={[]} />);
  expect(screen.getByText('No personal records yet.')).toBeInTheDocument();
});

test('shows PR card for barbell bench press with 100kg x 5', () => {
  const session: CompletedSession = {
    date: todayKey(),
    exercises: [
      {
        exerciseId: 'barbell-bench-press',
        exerciseName: 'Barbell Bench Press',
        muscleGroup: 'Chest',
        sets: [
          { reps: 8, weight: 80, completed: true },
          { reps: 5, weight: 100, completed: true },
        ],
      },
    ],
  };
  const { container } = render(<PersonalRecords sessions={[session]} />);
  const prValue = container.querySelector('.pr-card__value');
  expect(prValue?.textContent).toBe('100 kg × 5');
  expect(screen.getByText('Chest')).toBeInTheDocument();
});
