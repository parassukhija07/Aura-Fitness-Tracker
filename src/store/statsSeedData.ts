import type { CompletedSession } from './statsDataStore';

const key = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const today = new Date();
const monday = new Date(
  today.getFullYear(),
  today.getMonth(),
  today.getDate() - ((today.getDay() + 6) % 7)
);
const wednesday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 2);
const friday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 4);

const twoWeeksAgo = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 14);
const threeWeeksAgo = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 21);

export const SEED_COMPLETED_SESSIONS: CompletedSession[] = [
  {
    date: key(monday),
    exercises: [
      {
        exerciseId: 'barbell-bench-press',
        exerciseName: 'Barbell Bench Press',
        muscleGroup: 'Chest',
        sets: [
          { reps: 8, weight: 80, completed: true },
          { reps: 6, weight: 90, completed: true },
          { reps: 5, weight: 100, completed: true },
        ],
      },
      {
        exerciseId: 'overhead-press',
        exerciseName: 'Overhead Press',
        muscleGroup: 'Shoulders',
        sets: [
          { reps: 10, weight: 50, completed: true },
          { reps: 8, weight: 55, completed: true },
          { reps: 8, weight: 55, completed: false },
        ],
      },
    ],
  },
  {
    date: key(wednesday),
    exercises: [
      {
        exerciseId: 'deadlift',
        exerciseName: 'Deadlift',
        muscleGroup: 'Back',
        sets: [
          { reps: 5, weight: 140, completed: true },
          { reps: 5, weight: 150, completed: true },
          { reps: 3, weight: 160, completed: true },
        ],
      },
      {
        exerciseId: 'barbell-back-squat',
        exerciseName: 'Barbell Back Squat',
        muscleGroup: 'Legs',
        sets: [
          { reps: 8, weight: 100, completed: true },
          { reps: 8, weight: 110, completed: true },
          { reps: 6, weight: 120, completed: true },
        ],
      },
    ],
  },
  {
    date: key(friday),
    exercises: [
      {
        exerciseId: 'barbell-curl',
        exerciseName: 'Barbell Curl',
        muscleGroup: 'Arms',
        sets: [
          { reps: 12, weight: 40, completed: true },
          { reps: 10, weight: 45, completed: true },
          { reps: 8, weight: 50, completed: true },
        ],
      },
      {
        exerciseId: 'cable-crunch',
        exerciseName: 'Cable Crunch',
        muscleGroup: 'Core',
        sets: [
          { reps: 15, weight: 30, completed: true },
          { reps: 15, weight: 35, completed: true },
          { reps: 12, weight: 35, completed: true },
        ],
      },
    ],
  },
  {
    date: key(twoWeeksAgo),
    exercises: [
      {
        exerciseId: 'barbell-bench-press',
        exerciseName: 'Barbell Bench Press',
        muscleGroup: 'Chest',
        sets: [
          { reps: 8, weight: 80, completed: true },
          { reps: 6, weight: 85, completed: true },
        ],
      },
      {
        exerciseId: 'deadlift',
        exerciseName: 'Deadlift',
        muscleGroup: 'Back',
        sets: [
          { reps: 5, weight: 130, completed: true },
          { reps: 5, weight: 140, completed: true },
        ],
      },
    ],
  },
  {
    date: key(threeWeeksAgo),
    exercises: [
      {
        exerciseId: 'overhead-press',
        exerciseName: 'Overhead Press',
        muscleGroup: 'Shoulders',
        sets: [
          { reps: 10, weight: 45, completed: true },
          { reps: 8, weight: 50, completed: true },
        ],
      },
      {
        exerciseId: 'barbell-back-squat',
        exerciseName: 'Barbell Back Squat',
        muscleGroup: 'Legs',
        sets: [
          { reps: 8, weight: 95, completed: true },
          { reps: 8, weight: 100, completed: true },
        ],
      },
    ],
  },
];
