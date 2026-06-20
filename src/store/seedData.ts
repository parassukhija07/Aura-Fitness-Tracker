import type { Exercise, WorkoutProgram, UserPlan } from '../types/workout';

export const SEED_EXERCISES: Exercise[] = [
  {
    id: 'barbell-bench-press',
    name: 'Barbell Bench Press',
    muscleGroup: 'Chest',
    defaultSets: 3,
    defaultRepsMin: 6,
    defaultRepsMax: 10,
  },
  {
    id: 'barbell-back-squat',
    name: 'Barbell Back Squat',
    muscleGroup: 'Legs',
    defaultSets: 3,
    defaultRepsMin: 5,
    defaultRepsMax: 8,
  },
  {
    id: 'deadlift',
    name: 'Deadlift',
    muscleGroup: 'Back',
    defaultSets: 3,
    defaultRepsMin: 3,
    defaultRepsMax: 6,
  },
  {
    id: 'overhead-press',
    name: 'Overhead Press',
    muscleGroup: 'Shoulders',
    defaultSets: 3,
    defaultRepsMin: 8,
    defaultRepsMax: 12,
  },
  {
    id: 'pull-up',
    name: 'Pull-Up',
    muscleGroup: 'Back',
    defaultSets: 3,
    defaultRepsMin: 6,
    defaultRepsMax: 12,
  },
];

export const SEED_PROGRAMS: WorkoutProgram[] = [
  {
    id: 'full-body-a',
    name: 'Full Body A',
    description: 'A 3-day full-body strength program focused on compound lifts.',
    exercises: [
      { exerciseId: 'barbell-back-squat', sets: 3, repsMin: 5, repsMax: 8 },
      { exerciseId: 'barbell-bench-press', sets: 3, repsMin: 6, repsMax: 10 },
      { exerciseId: 'deadlift', sets: 3, repsMin: 3, repsMax: 6 },
      { exerciseId: 'overhead-press', sets: 3, repsMin: 8, repsMax: 12 },
      { exerciseId: 'pull-up', sets: 3, repsMin: 6, repsMax: 12 },
    ],
  },
];

export const SEED_USER_PLAN: UserPlan = {
  id: 'user-plan-1',
  activeProgramId: 'full-body-a',
  startDate: '2026-06-20',
  currentWeek: 1,
  currentDay: 1,
};
