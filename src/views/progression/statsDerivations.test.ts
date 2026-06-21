import {
  getWeeklyMuscleVolume,
  getPersonalRecords,
  groupPersonalRecords,
  MUSCLE_GROUPS,
} from './statsDerivations';
import type { CompletedSession } from '../../store/statsDataStore';

const makeSession = (date: string, overrides?: Partial<CompletedSession>): CompletedSession => ({
  date,
  exercises: [],
  ...overrides,
});

const todayKey = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const offsetKey = (days: number): string => {
  const d = new Date();
  const shifted = new Date(d.getFullYear(), d.getMonth(), d.getDate() - days);
  return `${shifted.getFullYear()}-${String(shifted.getMonth() + 1).padStart(2, '0')}-${String(shifted.getDate()).padStart(2, '0')}`;
};

// Test 1: empty input returns 6 data points each with volume 0 in MUSCLE_GROUPS order
test('empty sessions returns 6 muscle groups each with volume 0', () => {
  const result = getWeeklyMuscleVolume([]);
  expect(result).toHaveLength(6);
  result.forEach((d, i) => {
    expect(d.muscleGroup).toBe(MUSCLE_GROUPS[i]);
    expect(d.volume).toBe(0);
  });
});

// Test 2: session today with one completed Chest set and one incomplete => Chest volume 500
test('counts only completed sets for weekly volume', () => {
  const session: CompletedSession = makeSession(todayKey(), {
    exercises: [
      {
        exerciseId: 'barbell-bench-press',
        exerciseName: 'Barbell Bench Press',
        muscleGroup: 'Chest',
        sets: [
          { reps: 5, weight: 100, completed: true },
          { reps: 5, weight: 100, completed: false },
        ],
      },
    ],
  });
  const result = getWeeklyMuscleVolume([session]);
  const chestDatum = result.find((d) => d.muscleGroup === 'Chest');
  expect(chestDatum?.volume).toBe(500);
});

// Test 3: session dated 14 days ago contributes 0 to weekly volume
test('session 14 days ago does not contribute to weekly volume', () => {
  const session: CompletedSession = makeSession(offsetKey(14), {
    exercises: [
      {
        exerciseId: 'barbell-bench-press',
        exerciseName: 'Barbell Bench Press',
        muscleGroup: 'Chest',
        sets: [{ reps: 5, weight: 100, completed: true }],
      },
    ],
  });
  const result = getWeeklyMuscleVolume([session]);
  const chestDatum = result.find((d) => d.muscleGroup === 'Chest');
  expect(chestDatum?.volume).toBe(0);
});

// Test 4: PR picks best weight, and among equal weight picks higher reps
test('getPersonalRecords picks max weight and max reps on tie', () => {
  const session: CompletedSession = makeSession(todayKey(), {
    exercises: [
      {
        exerciseId: 'barbell-bench-press',
        exerciseName: 'Barbell Bench Press',
        muscleGroup: 'Chest',
        sets: [
          { reps: 3, weight: 100, completed: true },
          { reps: 5, weight: 100, completed: true },
        ],
      },
    ],
  });
  const records = getPersonalRecords([session]);
  expect(records).toHaveLength(1);
  expect(records[0].bestWeight).toBe(100);
  expect(records[0].bestReps).toBe(5);
});

// Test 5: PR skips bodyweight exercises (weight === 0)
test('getPersonalRecords skips exercises with weight 0', () => {
  const session: CompletedSession = makeSession(todayKey(), {
    exercises: [
      {
        exerciseId: 'pull-up',
        exerciseName: 'Pull-Up',
        muscleGroup: 'Back',
        sets: [{ reps: 10, weight: 0, completed: true }],
      },
    ],
  });
  const records = getPersonalRecords([session]);
  expect(records).toHaveLength(0);
});

// Test 6: groupPersonalRecords groups by muscle group and skips empty groups
test('groupPersonalRecords groups by muscle group and skips empty groups', () => {
  const records = [
    {
      exerciseId: 'barbell-bench-press',
      exerciseName: 'Barbell Bench Press',
      muscleGroup: 'Chest' as const,
      bestWeight: 100,
      bestReps: 5,
    },
    {
      exerciseId: 'deadlift',
      exerciseName: 'Deadlift',
      muscleGroup: 'Back' as const,
      bestWeight: 160,
      bestReps: 3,
    },
  ];
  const groups = groupPersonalRecords(records);
  expect(groups).toHaveLength(2);
  expect(groups[0].muscleGroup).toBe('Chest');
  expect(groups[1].muscleGroup).toBe('Back');
  // Shoulders, Arms, Legs, Core are skipped since they have no records
  const muscleGroupNames = groups.map((g) => g.muscleGroup);
  expect(muscleGroupNames).not.toContain('Shoulders');
  expect(muscleGroupNames).not.toContain('Arms');
  expect(muscleGroupNames).not.toContain('Legs');
  expect(muscleGroupNames).not.toContain('Core');
});
