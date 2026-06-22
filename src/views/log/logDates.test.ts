import {
  getDayWorkout,
  isSameDay,
  getWeekDays,
  type DayWorkout,
} from './logDates';
import type { UserPlan, WorkoutProgram, Exercise } from '../../types/workout';

// ---------------------------------------------------------------------------
// Self-contained fixtures
// ---------------------------------------------------------------------------

const EXERCISES: Exercise[] = [
  { id: 'squat',  name: 'Back Squat',  muscleGroup: 'Legs',  defaultSets: 3, defaultRepsMin: 5, defaultRepsMax: 8,  equipment: 'Barbell' },
  { id: 'bench',  name: 'Bench Press', muscleGroup: 'Chest', defaultSets: 3, defaultRepsMin: 6, defaultRepsMax: 10, equipment: 'Barbell' },
];

const getExerciseById = (id: string): Exercise | undefined =>
  EXERCISES.find((e) => e.id === id);

const PROGRAM: WorkoutProgram = {
  id: 'prog-1',
  name: 'Test Program',
  description: 'fixture',
  exercises: [
    { exerciseId: 'squat', sets: 3, repsMin: 5, repsMax: 8 },
    { exerciseId: 'bench', sets: 4, repsMin: 6, repsMax: 10 },
  ],
};

// startDate is a Monday. parseIsoDate('2026-06-15') -> Mon 15 Jun 2026.
// dayIndex 0 (start day) -> cycleDay 0 -> WORKOUT_DAYS=[0,2,4] -> workout day.
const PLAN: UserPlan = {
  id: 'plan-1',
  activeProgramId: 'prog-1',
  startDate: '2026-06-15',
  currentWeek: 1,
  currentDay: 1,
  schedule: [null, null, null, null, null, null, null],
};

// helper: local-midnight date constructor (matches parseIsoDate/startOfDay semantics)
const d = (y: number, m: number, day: number) => new Date(y, m - 1, day);

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test('getDayWorkout — userPlan is null returns rest/no-plan shape', () => {
  const result = getDayWorkout(d(2026, 6, 15), null, PROGRAM, getExerciseById);
  expect(result).toEqual<DayWorkout>({ isRestDay: true, beforeStart: false, exercises: [] });
});

test('getDayWorkout — activeProgram is undefined returns rest shape', () => {
  const result = getDayWorkout(d(2026, 6, 15), PLAN, undefined, getExerciseById);
  expect(result).toEqual<DayWorkout>({ isRestDay: true, beforeStart: false, exercises: [] });
});

test('getDayWorkout — date before startDate sets beforeStart true', () => {
  const result = getDayWorkout(d(2026, 6, 14), PLAN, PROGRAM, getExerciseById);
  expect(result.beforeStart).toBe(true);
  expect(result.isRestDay).toBe(true);
  expect(result.exercises.length).toBe(0);
});

test('getDayWorkout — rest day (cycleDay not in WORKOUT_DAYS)', () => {
  // start+1 = 2026-06-16 (Tue), dayIndex=1, cycleDay=1 — not in [0,2,4]
  const result = getDayWorkout(d(2026, 6, 16), PLAN, PROGRAM, getExerciseById);
  expect(result).toEqual<DayWorkout>({ isRestDay: true, beforeStart: false, exercises: [] });
});

test('getDayWorkout — workout day happy path', () => {
  // 2026-06-15 = start day, dayIndex=0, cycleDay=0 → workout day
  const result = getDayWorkout(d(2026, 6, 15), PLAN, PROGRAM, getExerciseById);
  expect(result.isRestDay).toBe(false);
  expect(result.beforeStart).toBe(false);
  expect(result.exercises.length).toBe(2);
  expect(result.exercises[0]).toEqual({
    exerciseId: 'squat',
    name: 'Back Squat',
    muscleGroup: 'Legs',
    sets: 3,
    repsMin: 5,
    repsMax: 8,
  });
  // sets comes from ProgramExercise override (4), not Exercise.defaultSets (3)
  expect(result.exercises[1].sets).toBe(4);
});

test('getDayWorkout — stale FK fallback uses exerciseId as name and "—" as muscleGroup', () => {
  const PROGRAM_BAD: WorkoutProgram = {
    ...PROGRAM,
    exercises: [
      ...PROGRAM.exercises,
      { exerciseId: 'ghost', sets: 2, repsMin: 1, repsMax: 3 },
    ],
  };
  const result = getDayWorkout(d(2026, 6, 15), PLAN, PROGRAM_BAD, getExerciseById);
  const ghost = result.exercises.find((e) => e.exerciseId === 'ghost');
  expect(ghost).toBeDefined();
  expect(ghost!.name).toBe('ghost');
  expect(ghost!.muscleGroup).toBe('—');
  expect(ghost!.sets).toBe(2);
});

test('getDayWorkout — far-future week wrap (dayIndex 14, cycleDay 0) is a workout day', () => {
  // start + 14 days = 2026-06-29, dayIndex=14, ((14%7)+7)%7=0 → cycleDay 0 → workout
  const result = getDayWorkout(d(2026, 6, 29), PLAN, PROGRAM, getExerciseById);
  expect(result.isRestDay).toBe(false);
  expect(result.exercises.length).toBe(2);
});

test('getDayWorkout — start+4 (Fri, cycleDay 4) is also a workout day', () => {
  // 2026-06-19 = start + 4 days (Fri), dayIndex=4, cycleDay=4 → in [0,2,4]
  const result = getDayWorkout(d(2026, 6, 19), PLAN, PROGRAM, getExerciseById);
  expect(result.isRestDay).toBe(false);
});

test('isSameDay — same calendar day, different time-of-day returns true', () => {
  expect(isSameDay(new Date(2026, 5, 20, 9, 0, 0), new Date(2026, 5, 20, 23, 59, 59))).toBe(true);
});

test('isSameDay — different calendar days returns false', () => {
  expect(isSameDay(d(2026, 6, 20), d(2026, 6, 21))).toBe(false);
});

test('getWeekDays — returns 7 Monday-anchored days for a Wednesday input', () => {
  // 2026-06-17 is a Wednesday; week starts Monday 2026-06-15
  const result = getWeekDays(d(2026, 6, 17), 0);
  expect(result.length).toBe(7);
  // result[0] must be Monday (JS getDay() === 1)
  expect(result[0].getDay()).toBe(1);
  // result[0] is 2026-06-15 (Mon)
  expect(isSameDay(result[0], d(2026, 6, 15))).toBe(true);
  // Each subsequent day is +1 from the previous
  for (let i = 1; i < 7; i++) {
    const expectedMs = result[i - 1].getTime() + 86400000;
    expect(result[i].getTime()).toBe(expectedMs);
  }
  // result[6] is Sunday 2026-06-21 (getDay() === 0)
  expect(isSameDay(result[6], d(2026, 6, 21))).toBe(true);
  expect(result[6].getDay()).toBe(0);
});

test('getWeekDays — weekOffset 1 shifts the window forward by 7 days', () => {
  // With weekOffset=1, result[0] should be 2026-06-22 (next Monday)
  const result = getWeekDays(d(2026, 6, 17), 1);
  expect(isSameDay(result[0], d(2026, 6, 22))).toBe(true);
});
