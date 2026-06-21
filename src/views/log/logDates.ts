import type { UserPlan, WorkoutProgram, Exercise, CustomWorkout } from '../../types/workout';

export interface DayExercise {
  exerciseId: string;
  name: string;
  muscleGroup: string;
  sets: number;
  repsMin: number;
  repsMax: number;
}

export interface DayWorkout {
  isRestDay: boolean;
  beforeStart: boolean;
  exercises: DayExercise[];
}

// 'YYYY-MM-DD' -> local midnight Date (avoids UTC-parse timezone bug)
export function parseIsoDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

// Strip time component; return local midnight clone
export function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

// Monday-anchored start of the week containing `d`. Mon = index 0.
// JS getDay(): Sun=0..Sat=6. Convert: mondayOffset = (getDay()+6)%7.
export function startOfWeek(d: Date, startOnMonday: boolean = true): Date {
  const base = startOfDay(d);
  const offset = startOnMonday
    ? (base.getDay() + 6) % 7
    : base.getDay();
  return new Date(base.getFullYear(), base.getMonth(), base.getDate() - offset);
}

// Build the 7 visible day Dates for a given base week + offset.
// base = startOfWeek(today); result[i] = base + (weekOffset*7 + i) days, i=0..6 (Mon..Sun)
export function getWeekDays(today: Date, weekOffset: number, startOnMonday: boolean = true): Date[] {
  const base = startOfWeek(today, startOnMonday);
  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const offset = weekOffset * 7 + i;
    days.push(new Date(base.getFullYear(), base.getMonth(), base.getDate() + offset));
  }
  return days;
}

const WORKOUT_DAYS = [0, 2, 4];

// Non-exported helper: split "8-12" or "10" into { repsMin, repsMax }
function parseRepRange(targetReps: string): { repsMin: number; repsMax: number } {
  const parts = String(targetReps).split('-').map((s) => parseInt(s.trim(), 10));
  const repsMin = Number.isNaN(parts[0]) ? 0 : parts[0];
  const repsMax = parts.length > 1 && !Number.isNaN(parts[1]) ? parts[1] : repsMin;
  return { repsMin, repsMax };
}

interface SlotLookups {
  programs: WorkoutProgram[];
  userPrograms: WorkoutProgram[];
  userWorkouts: CustomWorkout[];
}

// Non-exported helper: resolve a schedule slot id to DayExercise[].
// Program-first, then custom workout, else [].
function resolveSlot(
  id: string,
  lookups: SlotLookups,
  getExerciseById: (id: string) => Exercise | undefined
): DayExercise[] {
  // Try WorkoutProgram (programs then userPrograms)
  const program =
    lookups.programs.find((p) => p.id === id) ??
    lookups.userPrograms.find((p) => p.id === id);

  if (program != null) {
    return program.exercises.map((pe) => {
      const ex = getExerciseById(pe.exerciseId);
      return {
        exerciseId: pe.exerciseId,
        name: ex?.name ?? pe.exerciseId,
        muscleGroup: ex?.muscleGroup ?? '—',
        sets: pe.sets,
        repsMin: pe.repsMin,
        repsMax: pe.repsMax,
      };
    });
  }

  // Try CustomWorkout
  const workout = lookups.userWorkouts.find((w) => w.id === id);
  if (workout != null) {
    return workout.exercises.map((e) => {
      const ex = getExerciseById(e.exerciseId);
      const { repsMin, repsMax } = parseRepRange(e.targetReps);
      return {
        exerciseId: e.exerciseId,
        name: ex?.name ?? e.exerciseName ?? e.exerciseId,
        muscleGroup: ex?.muscleGroup ?? '—',
        sets: e.targetSets,
        repsMin,
        repsMax,
      };
    });
  }

  return [];
}

// Core mapping — Decision #2 Option A
export function getDayWorkout(
  activeDate: Date,
  userPlan: UserPlan | null,
  activeProgram: WorkoutProgram | undefined,
  getExerciseById: (id: string) => Exercise | undefined,
  lookups: SlotLookups = { programs: [], userPrograms: [], userWorkouts: [] },
  explicitRest: boolean = false
): DayWorkout {
  // Step 1: no plan or program
  if (userPlan == null || activeProgram == null) {
    return { isRestDay: true, beforeStart: false, exercises: [] };
  }

  // Step 2: compute dayIndex
  const start = parseIsoDate(userPlan.startDate);
  const dayIndex = Math.floor(
    (startOfDay(activeDate).getTime() - start.getTime()) / 86400000
  );

  if (dayIndex < 0) {
    return { isRestDay: true, beforeStart: true, exercises: [] };
  }

  // Step 3: explicit rest override (in-memory, not persisted)
  if (explicitRest) {
    return { isRestDay: true, beforeStart: false, exercises: [] };
  }

  // Step 4: check schedule slot (Sunday-anchored index 0=Sun…6=Sat)
  const sundayIndex = startOfDay(activeDate).getDay();
  const slot = userPlan.schedule?.[sundayIndex] ?? null;

  if (slot != null) {
    const exercises = resolveSlot(slot, lookups, getExerciseById);
    if (exercises.length > 0) {
      return { isRestDay: false, beforeStart: false, exercises };
    }
    // Unknown/deleted id — treat as rest
    return { isRestDay: true, beforeStart: false, exercises: [] };
  }

  // Step 5: fallback to existing WORKOUT_DAYS cycle (unchanged)
  const cycleDay = ((dayIndex % 7) + 7) % 7;

  if (!WORKOUT_DAYS.includes(cycleDay)) {
    return { isRestDay: true, beforeStart: false, exercises: [] };
  }

  const exercises: DayExercise[] = activeProgram.exercises.map((pe) => {
    const ex = getExerciseById(pe.exerciseId);
    return {
      exerciseId: pe.exerciseId,
      name: ex?.name ?? pe.exerciseId,
      muscleGroup: ex?.muscleGroup ?? '—',
      sets: pe.sets,
      repsMin: pe.repsMin,
      repsMax: pe.repsMax,
    };
  });

  return { isRestDay: false, beforeStart: false, exercises };
}
