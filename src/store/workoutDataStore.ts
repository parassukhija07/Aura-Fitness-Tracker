import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { Exercise, WorkoutProgram, UserPlan, SessionExercise, ActiveSessionState, LoggedSet, SetType, CustomWorkout, CustomWorkoutExercise } from '../types/workout';
import { SEED_EXERCISES, SEED_PROGRAMS, SEED_USER_PLAN } from './seedData';
import { capacitorStorage } from './capacitorStorage';

// ─── State + Actions ───────────────────────────────────────────────────────────
interface WorkoutDataState {
  exercises: Exercise[];
  programs: WorkoutProgram[];
  userPlan: UserPlan | null;
  activeSession: ActiveSessionState | null;
  userWorkouts: CustomWorkout[];

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
  addSet: (exerciseIndex: number) => void;
  deleteSet: (exerciseIndex: number, setIndex: number) => void;
  updateSetField: (exerciseIndex: number, setIndex: number, field: 'weight' | 'reps', value: number) => void;
  updateSetType: (exerciseIndex: number, setIndex: number, setType: SetType) => void;
  saveCustomWorkout: (name: string, exercises: CustomWorkoutExercise[]) => void;
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
      userWorkouts: [],

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
          state.userWorkouts = [];
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
          const ex = state.activeSession?.exercises[exerciseIndex];
          if (!ex) return;
          const set_ = ex.sets[setIndex];
          if (!set_) return;
          set_.completed = true;
          // auto-cleanup: drop fully-empty, uncompleted sets, but always keep >= 1 row
          const cleaned = ex.sets.filter(
            (s: LoggedSet) => s.completed || s.reps !== 0 || s.weight !== 0
          );
          ex.sets = cleaned.length > 0 ? cleaned : ex.sets;
        }),

      addSet: (exerciseIndex) =>
        set((state) => {
          const ex = state.activeSession?.exercises[exerciseIndex];
          if (!ex) return;
          ex.sets.push({ reps: 0, weight: 0, setType: 'Normal', completed: false });
        }),

      deleteSet: (exerciseIndex, setIndex) =>
        set((state) => {
          const ex = state.activeSession?.exercises[exerciseIndex];
          if (!ex) return;
          if (ex.sets.length <= 1) return;
          ex.sets.splice(setIndex, 1);
        }),

      updateSetField: (exerciseIndex, setIndex, field, value) =>
        set((state) => {
          const ex = state.activeSession?.exercises[exerciseIndex];
          if (!ex) return;
          const set_ = ex.sets[setIndex];
          if (!set_) return;
          set_[field] = value;
        }),

      updateSetType: (exerciseIndex, setIndex, setType) =>
        set((state) => {
          const ex = state.activeSession?.exercises[exerciseIndex];
          if (!ex) return;
          const set_ = ex.sets[setIndex];
          if (!set_) return;
          set_.setType = setType;
        }),

      saveCustomWorkout: (name, exercises) =>
        set((state) => {
          const trimmed = name.trim();
          if (trimmed.length === 0) return;
          if (exercises.length === 0) return;
          const id = `custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
          state.userWorkouts.push({
            id,
            name: trimmed,
            exercises: exercises.map((e) => ({
              exerciseId: e.exerciseId,
              exerciseName: e.exerciseName,
              targetSets: e.targetSets,
              targetReps: e.targetReps,
            })),
            createdAt: new Date().toISOString(),
          });
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
        userWorkouts: state.userWorkouts,
      }),
    }
  )
);
