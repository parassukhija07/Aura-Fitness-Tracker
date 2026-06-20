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
  schedule: (string | null)[]; // length 7, index 0=Sunday … 6=Saturday; element = workout id or null (Rest Day)
}

export type SetType = 'Normal' | 'Drop Set' | 'Rest-Pause' | 'Failure' | 'Partials';

// A single logged set within an active workout session.
export interface LoggedSet {
  reps: number;
  weight: number;       // weight value as entered (unit-agnostic, number only)
  setType?: SetType;
  completed: boolean;   // true once the user marks the set done
}

// An exercise instance inside an active session. Denormalized snapshot of an
// Exercise so the session is self-contained even if the source Exercise changes.
export interface SessionExercise {
  exerciseId: string;       // FK -> Exercise.id
  exerciseName: string;     // mirror of Exercise.name (snapshot at session start)
  muscleGroup: MuscleGroup; // mirror of Exercise.muscleGroup (snapshot)
  defaultSets: number;      // mirror of Exercise.defaultSets (target set count)
  sets: LoggedSet[];        // the actual logged sets for this exercise
}

// The full state of a workout currently in progress.
export interface ActiveSessionState {
  workoutId: string;        // FK -> WorkoutProgram.id (the program being run)
  startTime: string;        // ISO datetime string (NOT a Date object)
  exercises: SessionExercise[];
  elapsedTime: number;      // elapsed seconds since session start
}

export interface CustomWorkoutExercise {
  exerciseId: string;
  exerciseName: string;
  targetSets: number;
  targetReps: string;
}

export interface CustomWorkout {
  id: string;
  name: string;
  exercises: CustomWorkoutExercise[];
  createdAt: string;
}
