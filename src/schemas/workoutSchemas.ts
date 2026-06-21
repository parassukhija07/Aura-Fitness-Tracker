import { z } from 'zod';

// ─── Primitives / Enums ──────────────────────────────────────────────────────
export const MuscleGroupSchema = z.enum([
  'Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core',
]);

export const SetTypeSchema = z.enum([
  'Normal', 'Drop Set', 'Rest-Pause', 'Failure', 'Partials',
]);

// ─── Catalog ─────────────────────────────────────────────────────────────────
export const ExerciseSchema = z.object({
  id: z.string(),
  name: z.string(),
  muscleGroup: MuscleGroupSchema,
  defaultSets: z.number(),
  defaultRepsMin: z.number(),
  defaultRepsMax: z.number(),
});

export const ProgramExerciseSchema = z.object({
  exerciseId: z.string(),
  sets: z.number(),
  repsMin: z.number(),
  repsMax: z.number(),
});

export const WorkoutProgramSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  exercises: z.array(ProgramExerciseSchema),
});

export const UserPlanSchema = z.object({
  id: z.string(),
  activeProgramId: z.string(),
  startDate: z.string(),
  currentWeek: z.number(),
  currentDay: z.number(),
  schedule: z.array(z.string().nullable()),
});

// ─── Session ─────────────────────────────────────────────────────────────────
export const LoggedSetSchema = z.object({
  reps: z.number(),
  weight: z.number(),
  setType: SetTypeSchema.optional(),
  completed: z.boolean(),
});

export const SessionExerciseSchema = z.object({
  exerciseId: z.string(),
  exerciseName: z.string(),
  muscleGroup: MuscleGroupSchema,
  defaultSets: z.number(),
  sets: z.array(LoggedSetSchema),
});

export const ActiveSessionStateSchema = z.object({
  workoutId: z.string(),
  startTime: z.string(),
  exercises: z.array(SessionExerciseSchema),
  elapsedTime: z.number(),
});

// ─── Custom Workouts ─────────────────────────────────────────────────────────
export const CustomWorkoutExerciseSchema = z.object({
  exerciseId: z.string(),
  exerciseName: z.string(),
  targetSets: z.number(),
  targetReps: z.string(),
});

export const CustomWorkoutSchema = z.object({
  id: z.string(),
  name: z.string(),
  exercises: z.array(CustomWorkoutExerciseSchema),
  createdAt: z.string(),
});

// ─── Store State Shapes (serializable subset) ────────────────────────────────
// Mirrors workoutDataStore partialize: exercises, programs, userPlan,
// activeSession, userWorkouts. Action functions are NOT part of the backup.
export const WorkoutDataSchema = z.object({
  exercises: z.array(ExerciseSchema),
  programs: z.array(WorkoutProgramSchema),
  userPlan: UserPlanSchema.nullable(),
  activeSession: ActiveSessionStateSchema.nullable(),
  userWorkouts: z.array(CustomWorkoutSchema),
});

// Mirrors statsDataStore LifetimeStats. NOTE: field is totalVolumeKg.
export const LifetimeStatsSchema = z.object({
  totalSessions: z.number(),
  totalSets: z.number(),
  totalVolumeKg: z.number(),
  totalPRs: z.number(),
});

export const StatsDataSchema = z.object({
  completedWorkoutDates: z.array(z.string()),
  lifetimeStats: LifetimeStatsSchema,
});

// ─── Body Measurements ───────────────────────────────────────────────────────
// Mirrors BodyMeasurement (src/types/body.ts). Optional interface fields use
// .optional(); nested measurements object and all its keys are optional.
export const BodyMeasurementSchema = z.object({
  id: z.string(),
  date: z.string(),
  weightKg: z.number(),
  bodyFatPercentage: z.number().optional(),
  measurements: z
    .object({
      neck: z.number().optional(),
      shoulders: z.number().optional(),
      chest: z.number().optional(),
      waist: z.number().optional(),
      hips: z.number().optional(),
      arms: z.number().optional(),
      thighs: z.number().optional(),
    })
    .optional(),
  notes: z.string().optional(),
});

export const ProgressPhotoSchema = z.object({
  id: z.string(),
  date: z.string(),
  dataUrl: z.string(),
});

// Mirrors bodyDataStore partialize: { logs, photos }. Action functions are NOT backed up.
export const BodyDataSchema = z.object({
  logs: z.array(BodyMeasurementSchema),
  photos: z.array(ProgressPhotoSchema).optional(),
});

// ─── Backup Payload ──────────────────────────────────────────────────────────
// Top-level Firestore doc also contains updatedAt; default Zod strips it,
// which is correct (restore does not need it).
export const BackupPayloadSchema = z.object({
  workoutData: WorkoutDataSchema,
  statsData: StatsDataSchema,
  bodyData: BodyDataSchema.optional(),
});
