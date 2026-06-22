import type { LoggedSet, SessionExercise } from '../../types/workout';
import { useWorkoutDataStore } from '../../store/workoutDataStore';
import { useUserPreferencesStore } from '../../store/userPreferencesStore';
import { formatWeight } from '../../utils/units';

/**
 * Format a canonical-kg weight for embedding in generated progression copy.
 * Reads the current weight unit directly (non-reactive) — these strings are
 * produced inside pure suggestion logic, not a React render.
 */
function w(kg: number): string {
  return formatWeight(kg, useUserPreferencesStore.getState().weightUnit);
}

export interface SetRef {
  weight: number;
  reps: number;
}

/** Returns the best completed set ranked by weight then reps. Null if none completed. */
export function bestCompletedSet(sets: LoggedSet[]): SetRef | null {
  const completed = sets.filter((s) => s.completed && s.weight > 0);
  if (completed.length === 0) return null;
  return completed.reduce((best, s) => {
    if (s.weight > best.weight) return s;
    if (s.weight === best.weight && s.reps > best.reps) return s;
    return best;
  });
}

/** Scans completed workout history for the best set by weight then reps for a given exerciseId. */
export function bestSetFromHistory(exerciseId: string): SetRef | null {
  const history = useWorkoutDataStore.getState().completedWorkouts;
  let bestWeight = 0;
  let bestReps = 0;
  let found = false;

  for (const workout of history) {
    for (const ex of workout.exercises) {
      if (ex.exerciseId !== exerciseId) continue;
      for (const set of ex.sets) {
        if (!found || set.weight > bestWeight || (set.weight === bestWeight && set.reps > bestReps)) {
          bestWeight = set.weight;
          bestReps = set.reps;
          found = true;
        }
      }
    }
  }

  return found ? { weight: bestWeight, reps: bestReps } : null;
}

/** Returns the best known PR for an exercise: checks history first, falls back to current session. */
export function getLastPr(exercise: SessionExercise): SetRef | null {
  const historyBest = bestSetFromHistory(exercise.exerciseId);
  if (historyBest !== null) return historyBest;
  return bestCompletedSet(exercise.sets);
}

export interface TargetSuggestion {
  plusWeight: SetRef;
  plusRep: SetRef;
}

/** Returns today's progression targets based on the session-local PR. Null when no PR exists. */
export function getTodaysTarget(exercise: SessionExercise): TargetSuggestion | null {
  const lastPr = getLastPr(exercise);
  if (lastPr === null) return null;
  return {
    plusWeight: { weight: lastPr.weight + 2.5, reps: lastPr.reps },
    plusRep: { weight: lastPr.weight, reps: lastPr.reps + 1 },
  };
}

// ── Progressive overload engine ────────────────────────────────────────────

export type ProgressionAction = 'increase-load' | 'add-rep' | 'hold' | 'deload' | 'first-time';

export interface ProgressionSuggestion {
  action: ProgressionAction;
  /** Recommended target for the top working set next session. */
  weight: number;
  reps: number;
  /** Short, human rationale shown in the UI. */
  reason: string;
}

/** The most recent completed session's sets for an exercise (chronologically latest). */
export function lastSessionSets(exerciseId: string): SetRef[] | null {
  const history = useWorkoutDataStore.getState().completedWorkouts;
  let latest: { date: string; sets: SetRef[] } | null = null;
  for (const workout of history) {
    for (const ex of workout.exercises) {
      if (ex.exerciseId !== exerciseId) continue;
      const sets = ex.sets
        .filter((s) => s.weight > 0 || s.reps > 0)
        .map((s) => ({ weight: s.weight, reps: s.reps }));
      if (sets.length === 0) continue;
      if (latest === null || workout.date > latest.date) {
        latest = { date: workout.date, sets };
      }
    }
  }
  return latest ? latest.sets : null;
}

// Smallest sensible load jump for an exercise, based on equipment & muscle group.
function loadIncrement(exerciseId: string): number {
  const ex = useWorkoutDataStore.getState().getExerciseById(exerciseId);
  if (!ex) return 2.5;
  // Big compound lower-body / posterior-chain barbell work tolerates larger jumps.
  const bigLift =
    ex.equipment === 'Barbell' && (ex.muscleGroup === 'Legs' || ex.muscleGroup === 'Back');
  if (bigLift) return 5;
  if (ex.equipment === 'Bodyweight') return 0; // progress via reps, not load
  return 2.5;
}

/**
 * Double-progression overload recommendation derived from the LAST session's
 * performance for this exercise, evaluated against the catalog rep range.
 *
 * - All sets hit the top of the range  → add load (reset reps to range bottom)
 * - Hit at least the range bottom       → keep load, add a rep (double progression)
 * - Fell below the range bottom         → hold (repeat) or deload after a stall
 * - No history                          → first-time target from catalog defaults
 */
export function suggestProgression(exercise: SessionExercise): ProgressionSuggestion {
  const cat = useWorkoutDataStore.getState().getExerciseById(exercise.exerciseId);
  const repsMin = cat?.defaultRepsMin ?? 8;
  const repsMax = cat?.defaultRepsMax ?? 12;
  const inc = loadIncrement(exercise.exerciseId);

  const last = lastSessionSets(exercise.exerciseId);
  if (last === null || last.length === 0) {
    const startWeight = bestCompletedSet(exercise.sets)?.weight ?? 0;
    return {
      action: 'first-time',
      weight: startWeight,
      reps: repsMin,
      reason: 'First time logging this — aim for the lower end of the range and build from there.',
    };
  }

  // Use the heaviest set as the working reference; analyze reps at that load.
  const topWeight = last.reduce((m, s) => Math.max(m, s.weight), 0);
  const setsAtTop = last.filter((s) => s.weight === topWeight);
  const minRepsAtTop = setsAtTop.reduce((m, s) => Math.min(m, s.reps), Infinity);
  const allHitTop = minRepsAtTop >= repsMax;
  const hitRange = minRepsAtTop >= repsMin;

  if (allHitTop && inc > 0) {
    return {
      action: 'increase-load',
      weight: topWeight + inc,
      reps: repsMin,
      reason: `You completed ${repsMax}+ reps on every set at ${w(topWeight)} last time — add ${w(inc)} and reset to ${repsMin} reps.`,
    };
  }

  if (allHitTop && inc === 0) {
    // bodyweight: progress reps
    return {
      action: 'add-rep',
      weight: topWeight,
      reps: minRepsAtTop + 1,
      reason: `Topped the rep range last session — push for ${minRepsAtTop + 1} reps this time.`,
    };
  }

  if (hitRange) {
    return {
      action: 'add-rep',
      weight: topWeight,
      reps: Math.min(repsMax, minRepsAtTop + 1),
      reason: `Stay at ${w(topWeight)} and add a rep — work up to ${repsMax} before adding load.`,
    };
  }

  // Fell short of the range bottom last time → repeat to consolidate.
  return {
    action: 'hold',
    weight: topWeight,
    reps: repsMin,
    reason: `You came up short at ${w(topWeight)} last time — repeat it and nail ${repsMin} solid reps before progressing.`,
  };
}

export interface WarmupSet {
  weight: number;
  reps: number;
  pct: number;
}

const WARMUP_SCHEMES: Array<Array<{ pct: number; reps: number }>> = [
  [
    { pct: 0.5, reps: 10 },
    { pct: 0.7, reps: 5 },
    { pct: 0.85, reps: 2 },
  ],
  [
    { pct: 0.5, reps: 10 },
    { pct: 0.7, reps: 5 },
  ],
];

/** Returns warm-up sets for a given exercise index (0 = first, 1 = second, 2+ = none). */
export function getWarmupSets(index: number, workingWeight: number): WarmupSet[] {
  const scheme = WARMUP_SCHEMES[index];
  if (!scheme) return [];
  return scheme.map(({ pct, reps }) => ({
    weight: Math.round((workingWeight * pct) / 2.5) * 2.5,
    reps,
    pct,
  }));
}

/**
 * Returns true when the best completed set THIS session beats the historical best
 * (by weight, tie-broken by reps), OR when there is no history but a completed set
 * with weight > 0 exists.
 */
export function isExercisePrAgainstHistory(exercise: SessionExercise): boolean {
  const sessionBest = bestCompletedSet(exercise.sets);
  if (!sessionBest) return false;

  const histBest = bestSetFromHistory(exercise.exerciseId);
  if (histBest === null) {
    // No history — any completed set with weight > 0 is a first PR
    return sessionBest.weight > 0;
  }

  return (
    sessionBest.weight > histBest.weight ||
    (sessionBest.weight === histBest.weight && sessionBest.reps > histBest.reps)
  );
}

export type CelebrationOutcome =
  | { kind: 'pr'; weight: number; reps: number }
  | { kind: 'extra-reps'; message: string }
  | { kind: 'generic'; message: string };

/** Evaluates what celebration to show when an exercise is completed. */
export function evaluateCelebration(exercise: SessionExercise): CelebrationOutcome {
  const best = bestCompletedSet(exercise.sets);
  if (!best) {
    return { kind: 'generic', message: 'Great effort! Keep it up.' };
  }

  if (best.weight > 0 && isExercisePrAgainstHistory(exercise)) {
    // Check extra-reps: compare to defaultRepsMax from the exercise catalogue
    const catalogExercise = useWorkoutDataStore.getState().getExerciseById(exercise.exerciseId);
    const repsMax = catalogExercise?.defaultRepsMax ?? 8;
    if (best.reps > repsMax) {
      return {
        kind: 'extra-reps',
        message: `${best.reps} reps — crushed your target range of ${repsMax}!`,
      };
    }
    return { kind: 'pr', weight: best.weight, reps: best.reps };
  }

  return { kind: 'generic', message: 'Great effort! Keep it up.' };
}
