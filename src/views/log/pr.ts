import type { LoggedSet, SessionExercise } from '../../types/workout';
import { useWorkoutDataStore } from '../../store/workoutDataStore';

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

/** Session-local PR: best completed set for this exercise in the current session. */
export function getLastPr(exercise: SessionExercise): SetRef | null {
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

  // Any completed set with weight > 0 is treated as a PR (session-local baseline)
  if (best.weight > 0) {
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
