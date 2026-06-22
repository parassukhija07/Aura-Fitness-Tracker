import { getStrengthScore, getStrengthBalance } from './statsDerivations';
import type { CompletedSession } from '../../store/statsDataStore';

const NOW = new Date(2026, 5, 22); // 2026-06-22

function session(date: string, exercises: CompletedSession['exercises']): CompletedSession {
  return { date, exercises };
}

describe('strength score & balance', () => {
  test('empty history → score 0, all shares 0', () => {
    expect(getStrengthScore([], NOW)).toBe(0);
    const bal = getStrengthBalance([], NOW);
    expect(bal.every((b) => b.share === 0)).toBe(true);
  });

  test('recent volume yields a bounded 0–100 score', () => {
    const sessions = [
      session('2026-06-20', [
        { exerciseId: 'bp', exerciseName: 'Bench', muscleGroup: 'Chest', sets: [
          { reps: 10, weight: 100, completed: true },
          { reps: 10, weight: 100, completed: true },
        ] },
      ]),
    ];
    const score = getStrengthScore(sessions, NOW);
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  test('only completed sets within 28 days count toward balance', () => {
    const sessions = [
      session('2026-06-20', [
        { exerciseId: 'bp', exerciseName: 'Bench', muscleGroup: 'Chest', sets: [
          { reps: 10, weight: 100, completed: true },
        ] },
        { exerciseId: 'dl', exerciseName: 'Deadlift', muscleGroup: 'Back', sets: [
          { reps: 5, weight: 100, completed: false }, // not completed → ignored
        ] },
      ]),
      session('2026-01-01', [ // older than 28d → ignored
        { exerciseId: 'sq', exerciseName: 'Squat', muscleGroup: 'Legs', sets: [
          { reps: 10, weight: 200, completed: true },
        ] },
      ]),
    ];
    const bal = getStrengthBalance(sessions, NOW);
    const chest = bal.find((b) => b.muscleGroup === 'Chest')!;
    const legs = bal.find((b) => b.muscleGroup === 'Legs')!;
    expect(chest.share).toBeCloseTo(1, 5);
    expect(legs.share).toBe(0);
  });
});
