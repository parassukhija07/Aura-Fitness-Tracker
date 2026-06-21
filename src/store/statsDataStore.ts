import { create } from 'zustand';
import type { MuscleGroup } from '../types/workout';
import { SEED_COMPLETED_SESSIONS } from './statsSeedData';

export interface LifetimeStats {
  totalSessions: number;
  totalSets: number;
  totalVolumeKg: number;
  totalPRs: number;
}

export interface CompletedSessionSet { reps: number; weight: number; completed: boolean; }
export interface CompletedSessionExercise {
  exerciseId: string; exerciseName: string; muscleGroup: MuscleGroup; sets: CompletedSessionSet[];
}
export interface CompletedSession { date: string; exercises: CompletedSessionExercise[]; } // date = 'YYYY-MM-DD' local key

interface StatsState {
  completedWorkoutDates: string[];
  lifetimeStats: LifetimeStats;
  completedSessions: CompletedSession[];
}

export const useStatsDataStore = create<StatsState>()(() => ({
  completedWorkoutDates: [
    '2026-03-24', '2026-03-26', '2026-03-30',
    '2026-04-02', '2026-04-06', '2026-04-09', '2026-04-13', '2026-04-16',
    '2026-04-20', '2026-04-23', '2026-04-27',
    '2026-05-01', '2026-05-04', '2026-05-08', '2026-05-11', '2026-05-15',
    '2026-05-18', '2026-05-22', '2026-05-26', '2026-05-29',
    '2026-06-02', '2026-06-05', '2026-06-09', '2026-06-13', '2026-06-18',
  ],
  lifetimeStats: {
    totalSessions: 142,
    totalSets: 3680,
    totalVolumeKg: 1284500,
    totalPRs: 37,
  },
  completedSessions: SEED_COMPLETED_SESSIONS,
}));
