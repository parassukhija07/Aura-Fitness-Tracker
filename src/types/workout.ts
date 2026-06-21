export type MuscleGroup =
  | 'Chest' | 'Back' | 'Legs' | 'Shoulders' | 'Arms' | 'Core';

export type Equipment = 'Barbell' | 'Dumbbell' | 'Machine' | 'Cable' | 'Smith' | 'Bodyweight';

export interface Exercise {
  id: string;            // stable slug, e.g. 'barbell-bench-press'
  name: string;
  muscleGroup: MuscleGroup;
  defaultSets: number;   // default target set count
  defaultRepsMin: number;
  defaultRepsMax: number;
  equipment: Equipment;
  custom?: boolean;          // true for user-created exercises
  formTips?: string;         // optional
  imageUrl?: string;         // optional
  videoUrl?: string;         // optional
  difficulty?: 'Beginner' | 'Intermediate' | 'Advanced'; // optional
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

export type CablePulley = 'single' | 'double';

// A single logged set within an active workout session.
export interface LoggedSet {
  reps: number;
  weight: number;       // weight value as entered (unit-agnostic, number only)
  setType?: SetType;
  completed: boolean;   // true once the user marks the set done
  note?: string;        // per-set free-text note
}

// An exercise instance inside an active session. Denormalized snapshot of an
// Exercise so the session is self-contained even if the source Exercise changes.
export interface SessionExercise {
  exerciseId: string;       // FK -> Exercise.id
  exerciseName: string;     // mirror of Exercise.name (snapshot at session start)
  muscleGroup: MuscleGroup; // mirror of Exercise.muscleGroup (snapshot)
  defaultSets: number;      // mirror of Exercise.defaultSets (target set count)
  sets: LoggedSet[];        // the actual logged sets for this exercise
  cablePulley?: CablePulley;     // only set when equipment === 'Cable'
  supersetGroupId?: string;      // exercises sharing the same id form a superset; undefined = none
}

// The full state of a workout currently in progress.
export interface ActiveSessionState {
  workoutId: string;        // FK -> WorkoutProgram.id (the program being run)
  startTime: string;        // ISO datetime string (NOT a Date object)
  exercises: SessionExercise[];
  elapsedTime: number;      // elapsed seconds since session start
  interExerciseRestStartedAt?: string | null; // ISO datetime when 90s inter-exercise rest started; null/undefined = not running
  sessionNotes?: string;    // saved on the post-workout summary
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

// ─── Catalog types (read-only seed library, PRD 3.2 / 3.3) ───────────────
export type ProgramGoal = 'Strength' | 'Hypertrophy' | 'Endurance' | 'Fat Loss';

// A single exercise slot inside a catalog workout (reuses Exercise.id + rep targets).
export interface CatalogWorkoutExercise {
  exerciseId: string;   // FK -> Exercise.id (must exist in exercises.json)
  sets: number;
  repsMin: number;
  repsMax: number;
}

// A standalone workout in the Workout Library (PRD 3.3).
export interface CatalogWorkout {
  id: string;                 // stable slug, e.g. 'lib-push-day'
  name: string;
  muscleGroup: MuscleGroup;   // primary muscle group for filtering
  category: string;           // e.g. 'Push', 'Pull', 'Legs', 'Upper', 'Lower', 'Full Body'
  exercises: CatalogWorkoutExercise[];
}

// A workout grouping inside a catalog program (PRD 3.2 — "see its workouts and exercises").
export interface CatalogProgramWorkout {
  name: string;               // e.g. 'Push Day'
  exercises: CatalogWorkoutExercise[];
}

// A full program in the Program Library (PRD 3.2).
export interface CatalogProgram {
  id: string;                 // stable slug, e.g. 'lib-ppl'
  name: string;
  description: string;
  goal: ProgramGoal;          // single goal tag for filter chips
  workouts: CatalogProgramWorkout[];
}

// ─── Workout History types ─────────────────────────────────────────────────
export interface CompletedSet {
  reps: number;
  weight: number;
  setType?: SetType;
  note?: string;
}

export interface CompletedExercise {
  exerciseId: string;
  exerciseName: string;
  muscleGroup: MuscleGroup;
  cablePulley?: CablePulley;
  supersetGroupId?: string;
  sets: CompletedSet[];     // only completed sets are stored
}

export interface CompletedWorkout {
  id: string;               // `session-${epochMs}`
  programId: string;        // mirrors ActiveSessionState.workoutId
  programName: string;
  date: string;             // ISO date 'YYYY-MM-DD' (session start day)
  startTime: string;        // ISO datetime
  durationSeconds: number;
  totalVolume: number;      // sum(weight*reps) over completed sets
  prCount: number;
  exercises: CompletedExercise[];
  sessionNotes?: string;
  logSource: 'live' | 'past'; // 'live' = ran timer; 'past' = manually logged
}
