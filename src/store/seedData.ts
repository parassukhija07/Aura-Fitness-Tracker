import type { Exercise, WorkoutProgram, UserPlan } from '../types/workout';
import exercisesData from '../data/exercises.json';

export const SEED_EXERCISES: Exercise[] = (exercisesData as Array<{
  id: string;
  name: string;
  muscleGroup: Exercise['muscleGroup'];
  equipment: Exercise['equipment'];
  defaultSets: number;
  defaultRepsMin: number;
  defaultRepsMax: number;
  difficulty?: Exercise['difficulty'];
  category?: string;
  type?: string;
  musclesTargeted?: string[];
  proTips?: string[];
  videoUrl?: string;
  imageUrl?: string;
  warmupType?: string;
}>).map((e) => ({
  id: e.id,
  name: e.name,
  muscleGroup: e.muscleGroup,
  equipment: e.equipment ?? 'Barbell',
  defaultSets: e.defaultSets,
  defaultRepsMin: e.defaultRepsMin,
  defaultRepsMax: e.defaultRepsMax,
  difficulty: e.difficulty,
  category: e.category,
  type: e.type,
  musclesTargeted: e.musclesTargeted,
  proTips: e.proTips,
  videoUrl: e.videoUrl,
  imageUrl: e.imageUrl,
  warmupType: e.warmupType,
}));

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
  schedule: [null, null, null, null, null, null, null],
};
