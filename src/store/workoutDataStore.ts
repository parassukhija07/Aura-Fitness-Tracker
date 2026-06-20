import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { Exercise, WorkoutProgram, UserPlan, SessionExercise, ActiveSessionState } from '../types/workout';
import { SEED_EXERCISES, SEED_PROGRAMS, SEED_USER_PLAN } from './seedData';
import { capacitorStorage } from './capacitorStorage';

// ─── State + Actions ───────────────────────────────────────────────────────────
interface WorkoutDataState {
  exercises: Exercise[];
  programs: WorkoutProgram[];
  userPlan: UserPlan | null;
  activeSession: ActiveSessionState | null;

  // selectors-as-helpers (pure reads; keep minimal)
  getActiveProgram: () => WorkoutProgram | undefined;
  getExerciseById: (id: string) => Exercise | undefined;

  // actions
  setActiveProgram: (programId: string) => void;
  advanceDay: () => void;       // increments currentDay; rolls over at 7 -> resets to 1 and increments currentWeek
  resetToSeed: () => void;      // restores SEED_* values
  startSession: (program: WorkoutProgram, exercises: SessionExercise[]) => void;
  endSession: () => void;
  updateElapsedTime: (seconds: number) => void;
  completeSet: (exerciseIndex: number, setIndex: number) => void;
}

// ─── Store ────────────────────────────────────────────────────────────────────
export const useWorkoutDataStore = create<WorkoutDataState>()(
  persist(
    immer((set, get) => ({
      // ─── Initial State ───────────────────────────────────────────────────
      exercises: SEED_EXERCISES,
      programs: SEED_PROGRAMS,
      userPlan: SEED_USER_PLAN,
      activeSession: null,

      // ─── Selectors ───────────────────────────────────────────────────────
      getActiveProgram: () =>
        get().programs.find((p) => p.id === get().userPlan?.activeProgramId),

      getExerciseById: (id: string) =>
        get().exercises.find((e) => e.id === id),

      // ─── Actions ─────────────────────────────────────────────────────────
      setActiveProgram: (programId: string) =>
        set((state) => {
          if (state.userPlan) {
            state.userPlan.activeProgramId = programId;
            state.userPlan.currentWeek = 1;
            state.userPlan.currentDay = 1;
          }
        }),

      advanceDay: () =>
        set((state) => {
          if (state.userPlan) {
            if (state.userPlan.currentDay >= 7) {
              state.userPlan.currentDay = 1;
              state.userPlan.currentWeek += 1;
            } else {
              state.userPlan.currentDay += 1;
            }
          }
        }),

      resetToSeed: () =>
        set((state) => {
          state.exercises = SEED_EXERCISES;
          state.programs = SEED_PROGRAMS;
          state.userPlan = SEED_USER_PLAN;
        }),

      startSession: (program, exercises) =>
        set((state) => {
          state.activeSession = {
            workoutId: program.id,
            startTime: new Date().toISOString(),
            exercises,
            elapsedTime: 0,
          };
        }),

      endSession: () =>
        set((state) => {
          state.activeSession = null;
        }),

      updateElapsedTime: (seconds) =>
        set((state) => {
          if (state.activeSession) {
            state.activeSession.elapsedTime = seconds;
          }
        }),

      completeSet: (exerciseIndex, setIndex) =>
        set((state) => {
          const set_ = state.activeSession?.exercises[exerciseIndex]?.sets[setIndex];
          if (set_) {
            set_.completed = true;
          }
        }),
    })),
    {
      name: 'aura-workout-data',
      storage: createJSONStorage(() => capacitorStorage),
      version: 1,
      partialize: (state) => ({
        exercises: state.exercises,
        programs: state.programs,
        userPlan: state.userPlan,
        activeSession: state.activeSession,
      }),
    }
  )
);
