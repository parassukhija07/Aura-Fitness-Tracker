import type { UserPlan, WorkoutProgram, Exercise } from '../../types/workout';

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

// Core mapping — Decision #2 Option A
export function getDayWorkout(
  activeDate: Date,
  userPlan: UserPlan | null,
  activeProgram: WorkoutProgram | undefined,
  getExerciseById: (id: string) => Exercise | undefined
): DayWorkout {
  if (userPlan == null || activeProgram == null) {
    return { isRestDay: true, beforeStart: false, exercises: [] };
  }

  const start = parseIsoDate(userPlan.startDate);
  const dayIndex = Math.floor(
    (startOfDay(activeDate).getTime() - start.getTime()) / 86400000
  );

  if (dayIndex < 0) {
    return { isRestDay: true, beforeStart: true, exercises: [] };
  }

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
