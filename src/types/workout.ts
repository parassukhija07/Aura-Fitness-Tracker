export type MuscleGroup =
  | 'Chest' | 'Back' | 'Legs' | 'Shoulders' | 'Arms' | 'Core';

export interface Exercise {
  id: string;            // stable slug, e.g. 'barbell-bench-press'
  name: string;
  muscleGroup: MuscleGroup;
  defaultSets: number;   // default target set count
  defaultRepsMin: number;
  defaultRepsMax: number;
}

// An exercise as it appears within a program (id reference + per-program overrides)
export interface ProgramExercise {
  exerciseId: string;    // FK -> Exercise.id
  sets: number;
  repsMin: number;
  repsMax: number;
}

export interface WorkoutProgram {
  id: string;
  name: string;
  description: string;
  exercises: ProgramExercise[];
}

export interface UserPlan {
  id: string;
  activeProgramId: string; // FK -> WorkoutProgram.id
  startDate: string;       // ISO date string 'YYYY-MM-DD' (NOT a Date object)
  currentWeek: number;     // 1-based
  currentDay: number;      // 1-based
}
