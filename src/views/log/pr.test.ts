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

// Mock the store so pr.ts can call getExerciseById
jest.mock('../../store/workoutDataStore', () => ({
  useWorkoutDataStore: {
    getState: jest.fn(() => ({
      getExerciseById: (id: string) => {
        const catalogue: Record<string, { defaultRepsMax: number }> = {
          'barbell-bench-press': { defaultRepsMax: 10 },
          'cable-crossover': { defaultRepsMax: 15 },
        };
        return catalogue[id];
      },
    })),
  },
}));

import {
  bestCompletedSet,
  getLastPr,
  getTodaysTarget,
  getWarmupSets,
  evaluateCelebration,
} from './pr';
import type { LoggedSet, SessionExercise } from '../../types/workout';

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeSet(weight: number, reps: number, completed = true): LoggedSet {
  return { weight, reps, completed, setType: 'Normal' };
}

function makeExercise(
  sets: LoggedSet[],
  overrides: Partial<SessionExercise> = {}
): SessionExercise {
  return {
    exerciseId: 'barbell-bench-press',
    exerciseName: 'Barbell Bench Press',
    muscleGroup: 'Chest',
    defaultSets: 3,
    sets,
    ...overrides,
  };
}

// ── bestCompletedSet ──────────────────────────────────────────────────────────

test('bestCompletedSet returns null when no sets are completed', () => {
  const sets: LoggedSet[] = [makeSet(100, 5, false), makeSet(80, 8, false)];
  expect(bestCompletedSet(sets)).toBeNull();
});

test('bestCompletedSet returns null when no completed set has weight > 0', () => {
  const sets: LoggedSet[] = [makeSet(0, 5, true)];
  expect(bestCompletedSet(sets)).toBeNull();
});

test('bestCompletedSet picks the heaviest set', () => {
  const sets: LoggedSet[] = [makeSet(80, 10), makeSet(100, 5), makeSet(90, 8)];
  expect(bestCompletedSet(sets)).toEqual({ weight: 100, reps: 5, completed: true, setType: 'Normal' });
});

test('bestCompletedSet breaks ties by reps', () => {
  const sets: LoggedSet[] = [makeSet(100, 5), makeSet(100, 8)];
  expect(bestCompletedSet(sets)).toEqual({ weight: 100, reps: 8, completed: true, setType: 'Normal' });
});

// ── getLastPr ─────────────────────────────────────────────────────────────────

test('getLastPr returns null for empty sets', () => {
  const ex = makeExercise([]);
  expect(getLastPr(ex)).toBeNull();
});

test('getLastPr returns null when no set is completed', () => {
  const ex = makeExercise([makeSet(100, 5, false)]);
  expect(getLastPr(ex)).toBeNull();
});

test('getLastPr returns best completed set', () => {
  const ex = makeExercise([makeSet(80, 10), makeSet(100, 5)]);
  const pr = getLastPr(ex);
  expect(pr?.weight).toBe(100);
  expect(pr?.reps).toBe(5);
});

// ── getTodaysTarget ───────────────────────────────────────────────────────────

test('getTodaysTarget returns null when no PR exists', () => {
  const ex = makeExercise([]);
  expect(getTodaysTarget(ex)).toBeNull();
});

test('getTodaysTarget returns null when sets exist but none completed', () => {
  const ex = makeExercise([makeSet(100, 5, false)]);
  expect(getTodaysTarget(ex)).toBeNull();
});

test('getTodaysTarget plusWeight adds 2.5kg', () => {
  const ex = makeExercise([makeSet(100, 8)]);
  const target = getTodaysTarget(ex);
  expect(target?.plusWeight).toEqual({ weight: 102.5, reps: 8 });
});

test('getTodaysTarget plusRep adds 1 rep', () => {
  const ex = makeExercise([makeSet(100, 8)]);
  const target = getTodaysTarget(ex);
  expect(target?.plusRep).toEqual({ weight: 100, reps: 9 });
});

// ── getWarmupSets ─────────────────────────────────────────────────────────────

test('getWarmupSets index 0 returns 3 warm-up sets', () => {
  const sets = getWarmupSets(0, 100);
  expect(sets).toHaveLength(3);
  expect(sets[0]).toEqual({ weight: 50, reps: 10, pct: 0.5 });
  expect(sets[1]).toEqual({ weight: 70, reps: 5, pct: 0.7 });
  expect(sets[2]).toEqual({ weight: 85, reps: 2, pct: 0.85 });
});

test('getWarmupSets index 1 returns 2 warm-up sets', () => {
  const sets = getWarmupSets(1, 100);
  expect(sets).toHaveLength(2);
  expect(sets[0]).toEqual({ weight: 50, reps: 10, pct: 0.5 });
  expect(sets[1]).toEqual({ weight: 70, reps: 5, pct: 0.7 });
});

test('getWarmupSets index 2 returns empty array', () => {
  expect(getWarmupSets(2, 100)).toHaveLength(0);
});

test('getWarmupSets index >= 2 returns empty array', () => {
  expect(getWarmupSets(5, 100)).toHaveLength(0);
});

test('getWarmupSets rounds weight to nearest 2.5', () => {
  // 60kg * 0.7 = 42, rounded to nearest 2.5 = 42.5
  const sets = getWarmupSets(0, 60);
  expect(sets[1].weight).toBe(42.5);
});

test('getWarmupSets with workingWeight 0 returns 0 weights', () => {
  const sets = getWarmupSets(0, 0);
  sets.forEach((s) => expect(s.weight).toBe(0));
});

// ── evaluateCelebration ───────────────────────────────────────────────────────

test('evaluateCelebration returns generic when no completed sets', () => {
  const ex = makeExercise([makeSet(0, 5, false)]);
  expect(evaluateCelebration(ex).kind).toBe('generic');
});

test('evaluateCelebration returns generic when weight is 0', () => {
  const ex = makeExercise([makeSet(0, 5, true)]);
  expect(evaluateCelebration(ex).kind).toBe('generic');
});

test('evaluateCelebration returns pr when completed set has weight > 0 within rep range', () => {
  const ex = makeExercise([makeSet(100, 8)]);
  const outcome = evaluateCelebration(ex);
  expect(outcome.kind).toBe('pr');
  if (outcome.kind === 'pr') {
    expect(outcome.weight).toBe(100);
    expect(outcome.reps).toBe(8);
  }
});

test('evaluateCelebration returns extra-reps when reps exceed defaultRepsMax', () => {
  // barbell-bench-press has defaultRepsMax 10 in mock
  const ex = makeExercise([makeSet(80, 15)]);
  const outcome = evaluateCelebration(ex);
  expect(outcome.kind).toBe('extra-reps');
});

test('evaluateCelebration extra-reps message includes rep count', () => {
  const ex = makeExercise([makeSet(80, 15)]);
  const outcome = evaluateCelebration(ex);
  if (outcome.kind === 'extra-reps') {
    expect(outcome.message).toContain('15');
  }
});

test('evaluateCelebration falls back to repsMax 8 for unknown exercise', () => {
  const ex = makeExercise([makeSet(100, 10)], { exerciseId: 'unknown-exercise' });
  // 10 reps > 8 fallback => extra-reps
  const outcome = evaluateCelebration(ex);
  expect(outcome.kind).toBe('extra-reps');
});
