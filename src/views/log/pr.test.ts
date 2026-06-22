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

// Mutable state so individual tests can inject history
let mockCompletedWorkouts: any[] = [];

// Mock the store so pr.ts can call getExerciseById and bestSetFromHistory
jest.mock('../../store/workoutDataStore', () => ({
  useWorkoutDataStore: {
    getState: jest.fn(() => ({
      get completedWorkouts() { return mockCompletedWorkouts; },
      getExerciseById: (id: string) => {
        const catalogue: Record<string, {
          defaultRepsMin?: number;
          defaultRepsMax: number;
          equipment?: string;
          muscleGroup?: string;
        }> = {
          'barbell-bench-press': { defaultRepsMin: 6, defaultRepsMax: 10, equipment: 'Barbell', muscleGroup: 'Chest' },
          'cable-crossover': { defaultRepsMin: 10, defaultRepsMax: 15, equipment: 'Cable', muscleGroup: 'Chest' },
          'barbell-back-squat': { defaultRepsMin: 5, defaultRepsMax: 8, equipment: 'Barbell', muscleGroup: 'Legs' },
          'pull-up': { defaultRepsMin: 6, defaultRepsMax: 12, equipment: 'Bodyweight', muscleGroup: 'Back' },
        };
        return catalogue[id];
      },
    })),
  },
}));

beforeEach(() => {
  mockCompletedWorkouts = [];
});

import {
  bestCompletedSet,
  getLastPr,
  getTodaysTarget,
  getWarmupSets,
  evaluateCelebration,
  isExercisePrAgainstHistory,
  bestSetFromHistory,
  suggestProgression,
  lastSessionSets,
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

// ── bestSetFromHistory ────────────────────────────────────────────────────────

test('bestSetFromHistory returns null when completedWorkouts is empty', () => {
  mockCompletedWorkouts = [];
  expect(bestSetFromHistory('barbell-bench-press')).toBeNull();
});

test('bestSetFromHistory returns null when exerciseId is not present in history', () => {
  mockCompletedWorkouts = [
    {
      exercises: [
        {
          exerciseId: 'different-exercise',
          sets: [{ weight: 100, reps: 8 }],
        },
      ],
    },
  ];
  expect(bestSetFromHistory('barbell-bench-press')).toBeNull();
});

test('bestSetFromHistory returns the best set by weight', () => {
  mockCompletedWorkouts = [
    {
      exercises: [
        {
          exerciseId: 'barbell-bench-press',
          sets: [
            { weight: 80, reps: 10 },
            { weight: 100, reps: 5 },
          ],
        },
      ],
    },
  ];
  const best = bestSetFromHistory('barbell-bench-press');
  expect(best).toEqual({ weight: 100, reps: 5 });
});

test('bestSetFromHistory breaks weight ties by reps', () => {
  mockCompletedWorkouts = [
    {
      exercises: [
        {
          exerciseId: 'barbell-bench-press',
          sets: [
            { weight: 100, reps: 5 },
            { weight: 100, reps: 10 },
          ],
        },
      ],
    },
  ];
  const best = bestSetFromHistory('barbell-bench-press');
  expect(best).toEqual({ weight: 100, reps: 10 });
});

test('bestSetFromHistory scans across multiple workouts', () => {
  mockCompletedWorkouts = [
    {
      exercises: [{ exerciseId: 'barbell-bench-press', sets: [{ weight: 80, reps: 10 }] }],
    },
    {
      exercises: [{ exerciseId: 'barbell-bench-press', sets: [{ weight: 120, reps: 4 }] }],
    },
  ];
  const best = bestSetFromHistory('barbell-bench-press');
  expect(best?.weight).toBe(120);
});

// ── isExercisePrAgainstHistory ────────────────────────────────────────────────

test('isExercisePrAgainstHistory returns false when no completed sets in session', () => {
  mockCompletedWorkouts = [];
  const ex = makeExercise([makeSet(100, 8, false)]);
  expect(isExercisePrAgainstHistory(ex)).toBe(false);
});

test('isExercisePrAgainstHistory returns false when no history and weight is 0', () => {
  mockCompletedWorkouts = [];
  const ex = makeExercise([makeSet(0, 5, true)]);
  expect(isExercisePrAgainstHistory(ex)).toBe(false);
});

test('isExercisePrAgainstHistory returns true when no history and weight > 0 (first-ever PR)', () => {
  mockCompletedWorkouts = [];
  const ex = makeExercise([makeSet(60, 8, true)]);
  expect(isExercisePrAgainstHistory(ex)).toBe(true);
});

test('isExercisePrAgainstHistory returns true when session weight beats historical best', () => {
  mockCompletedWorkouts = [
    {
      exercises: [{ exerciseId: 'barbell-bench-press', sets: [{ weight: 80, reps: 10 }] }],
    },
  ];
  const ex = makeExercise([makeSet(100, 8, true)]);
  expect(isExercisePrAgainstHistory(ex)).toBe(true);
});

test('isExercisePrAgainstHistory returns false when session weight is lower than historical best', () => {
  mockCompletedWorkouts = [
    {
      exercises: [{ exerciseId: 'barbell-bench-press', sets: [{ weight: 120, reps: 5 }] }],
    },
  ];
  const ex = makeExercise([makeSet(100, 8, true)]);
  expect(isExercisePrAgainstHistory(ex)).toBe(false);
});

test('isExercisePrAgainstHistory returns true when weight ties but reps exceed historical best', () => {
  mockCompletedWorkouts = [
    {
      exercises: [{ exerciseId: 'barbell-bench-press', sets: [{ weight: 100, reps: 5 }] }],
    },
  ];
  const ex = makeExercise([makeSet(100, 8, true)]);
  expect(isExercisePrAgainstHistory(ex)).toBe(true);
});

test('isExercisePrAgainstHistory returns false when weight ties and reps do not exceed historical best', () => {
  mockCompletedWorkouts = [
    {
      exercises: [{ exerciseId: 'barbell-bench-press', sets: [{ weight: 100, reps: 10 }] }],
    },
  ];
  const ex = makeExercise([makeSet(100, 8, true)]);
  expect(isExercisePrAgainstHistory(ex)).toBe(false);
});

// ── lastSessionSets ───────────────────────────────────────────────────────────

test('lastSessionSets returns null when no history for the exercise', () => {
  mockCompletedWorkouts = [];
  expect(lastSessionSets('barbell-bench-press')).toBeNull();
});

test('lastSessionSets returns the most recent session by date', () => {
  mockCompletedWorkouts = [
    { date: '2026-06-01', exercises: [{ exerciseId: 'barbell-bench-press', sets: [{ weight: 80, reps: 8 }] }] },
    { date: '2026-06-08', exercises: [{ exerciseId: 'barbell-bench-press', sets: [{ weight: 90, reps: 6 }] }] },
  ];
  const sets = lastSessionSets('barbell-bench-press');
  expect(sets).toEqual([{ weight: 90, reps: 6 }]);
});

// ── suggestProgression ────────────────────────────────────────────────────────

test('suggestProgression returns first-time when no history', () => {
  mockCompletedWorkouts = [];
  const ex = makeExercise([]);
  const s = suggestProgression(ex);
  expect(s.action).toBe('first-time');
  expect(s.reps).toBe(6); // repsMin for bench
});

test('suggestProgression increases load when all sets hit the top of the range', () => {
  // bench: range 6-10, barbell chest => +2.5kg
  mockCompletedWorkouts = [
    { date: '2026-06-08', exercises: [{ exerciseId: 'barbell-bench-press', sets: [
      { weight: 80, reps: 10 }, { weight: 80, reps: 10 }, { weight: 80, reps: 11 },
    ] }] },
  ];
  const s = suggestProgression(makeExercise([]));
  expect(s.action).toBe('increase-load');
  expect(s.weight).toBe(82.5);
  expect(s.reps).toBe(6);
});

test('suggestProgression uses a 5kg jump for big barbell lower-body lifts', () => {
  // squat: range 5-8, barbell legs => +5kg
  mockCompletedWorkouts = [
    { date: '2026-06-08', exercises: [{ exerciseId: 'barbell-back-squat', sets: [
      { weight: 100, reps: 8 }, { weight: 100, reps: 8 },
    ] }] },
  ];
  const s = suggestProgression(makeExercise([], { exerciseId: 'barbell-back-squat' }));
  expect(s.action).toBe('increase-load');
  expect(s.weight).toBe(105);
});

test('suggestProgression adds a rep (double progression) when within the range but not topped', () => {
  // bench hit 8 reps (range 6-10) => stay, add a rep
  mockCompletedWorkouts = [
    { date: '2026-06-08', exercises: [{ exerciseId: 'barbell-bench-press', sets: [
      { weight: 80, reps: 8 }, { weight: 80, reps: 8 },
    ] }] },
  ];
  const s = suggestProgression(makeExercise([]));
  expect(s.action).toBe('add-rep');
  expect(s.weight).toBe(80);
  expect(s.reps).toBe(9);
});

test('suggestProgression holds when last session fell short of the range bottom', () => {
  // bench only 4 reps (< min 6) => hold and consolidate
  mockCompletedWorkouts = [
    { date: '2026-06-08', exercises: [{ exerciseId: 'barbell-bench-press', sets: [
      { weight: 90, reps: 4 },
    ] }] },
  ];
  const s = suggestProgression(makeExercise([]));
  expect(s.action).toBe('hold');
  expect(s.weight).toBe(90);
  expect(s.reps).toBe(6);
});

test('suggestProgression progresses bodyweight by reps, not load', () => {
  // pull-up: range 6-12, bodyweight => topped at 12 => add rep, same (zero) load
  mockCompletedWorkouts = [
    { date: '2026-06-08', exercises: [{ exerciseId: 'pull-up', sets: [
      { weight: 0, reps: 12 }, { weight: 0, reps: 12 },
    ] }] },
  ];
  const s = suggestProgression(makeExercise([], { exerciseId: 'pull-up', muscleGroup: 'Back' }));
  expect(s.action).toBe('add-rep');
  expect(s.weight).toBe(0);
  expect(s.reps).toBe(13);
});
