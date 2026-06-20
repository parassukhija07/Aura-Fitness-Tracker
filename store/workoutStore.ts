import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Types ───────────────────────────────────────────────────────────────────

export type SetType = 'normal' | 'dropset' | 'rest-pause' | 'failure' | 'partials';
export type CableType = 'single' | 'double' | null;

export interface WorkoutSet {
  id: string;
  setNumber: number;
  weight: number | null;
  reps: number | null;
  completed: boolean;
  setType: SetType;
  cableType: CableType;
  notes: string;
}

export interface QueuedExercise {
  id: string;
  name: string;
  targetMuscle: string;
  youtubeId: string | null;
  sets: WorkoutSet[];
  targetSets: number;
  targetRepsMin: number;
  targetRepsMax: number;
  completed: boolean;
}

export interface RestTimerState {
  active: boolean;
  secondsRemaining: number;
  totalSeconds: number;
  type: 'intra-set' | 'inter-exercise';
}

export interface PlannedDay {
  workoutName: string;
  exercises: Pick<QueuedExercise, 'id' | 'name' | 'targetMuscle'>[];
  isRestDay: boolean;
}

export interface WorkoutSessionState {
  isActive: boolean;
  sessionStartTime: Date | null;
  sessionElapsedSeconds: number;
  exerciseQueue: QueuedExercise[];
  currentExerciseIndex: number;
  restTimer: RestTimerState;
  sessionNotes: string;
  weekPlan: Record<string, PlannedDay>; // key: ISO date string YYYY-MM-DD
}

// ─── Actions ─────────────────────────────────────────────────────────────────

export interface WorkoutSessionActions {
  startSession: (exercises: QueuedExercise[]) => void;
  endSession: () => void;
  cancelSession: () => void;
  tickSession: () => void;
  setCurrentExercise: (index: number) => void;
  completeSet: (exerciseId: string, setId: string) => void;
  updateSet: (exerciseId: string, setId: string, patch: Partial<WorkoutSet>) => void;
  addSet: (exerciseId: string) => void;
  deleteSet: (exerciseId: string, setId: string) => void;
  completeExercise: (exerciseId: string) => void;
  startRestTimer: (seconds: number, type: RestTimerState['type']) => void;
  tickRestTimer: () => void;
  stopRestTimer: () => void;
  setSessionNotes: (notes: string) => void;
  setWeekPlan: (plan: Record<string, PlannedDay>) => void;
}

// ─── Initial State ────────────────────────────────────────────────────────────

const initialState: WorkoutSessionState = {
  isActive: false,
  sessionStartTime: null,
  sessionElapsedSeconds: 0,
  exerciseQueue: [],
  currentExerciseIndex: 0,
  restTimer: {
    active: false,
    secondsRemaining: 0,
    totalSeconds: 0,
    type: 'inter-exercise',
  },
  sessionNotes: '',
  weekPlan: {},
};

// ─── Store ────────────────────────────────────────────────────────────────────

export const useWorkoutStore = create<WorkoutSessionState & WorkoutSessionActions>()(
  persist(
    immer((set) => ({
      ...initialState,

      startSession: (exercises) =>
        set((state) => {
          state.isActive = true;
          state.sessionStartTime = new Date();
          state.sessionElapsedSeconds = 0;
          state.exerciseQueue = exercises;
          state.currentExerciseIndex = 0;
          state.sessionNotes = '';
        }),

      endSession: () =>
        set((state) => {
          state.isActive = false;
          state.sessionStartTime = null;
          state.sessionElapsedSeconds = 0;
          state.exerciseQueue = [];
          state.currentExerciseIndex = 0;
          state.restTimer = { ...initialState.restTimer };
          state.sessionNotes = '';
        }),

      cancelSession: () =>
        set((state) => {
          state.isActive = false;
          state.sessionStartTime = null;
          state.sessionElapsedSeconds = 0;
          state.exerciseQueue = [];
          state.currentExerciseIndex = 0;
          state.restTimer = { ...initialState.restTimer };
          state.sessionNotes = '';
        }),

      tickSession: () =>
        set((state) => {
          if (state.isActive) {
            state.sessionElapsedSeconds += 1;
          }
        }),

      setCurrentExercise: (index) =>
        set((state) => {
          state.currentExerciseIndex = index;
        }),

      completeSet: (exerciseId, setId) =>
        set((state) => {
          const exercise = state.exerciseQueue.find((e) => e.id === exerciseId);
          if (!exercise) return;
          const s = exercise.sets.find((s) => s.id === setId);
          if (s) s.completed = true;
        }),

      updateSet: (exerciseId, setId, patch) =>
        set((state) => {
          const exercise = state.exerciseQueue.find((e) => e.id === exerciseId);
          if (!exercise) return;
          const s = exercise.sets.find((s) => s.id === setId);
          if (s) Object.assign(s, patch);
        }),

      addSet: (exerciseId) =>
        set((state) => {
          const exercise = state.exerciseQueue.find((e) => e.id === exerciseId);
          if (!exercise) return;
          const newSetNumber = exercise.sets.length + 1;
          const newSet: WorkoutSet = {
            id: `${exerciseId}-set-${Date.now()}`,
            setNumber: newSetNumber,
            weight: null,
            reps: null,
            completed: false,
            setType: 'normal',
            cableType: null,
            notes: '',
          };
          exercise.sets.push(newSet);
        }),

      deleteSet: (exerciseId, setId) =>
        set((state) => {
          const exercise = state.exerciseQueue.find((e) => e.id === exerciseId);
          if (!exercise) return;
          const idx = exercise.sets.findIndex((s) => s.id === setId);
          if (idx !== -1) {
            exercise.sets.splice(idx, 1);
            // Re-number remaining sets
            exercise.sets.forEach((s, i) => {
              s.setNumber = i + 1;
            });
          }
        }),

      completeExercise: (exerciseId) =>
        set((state) => {
          const exercise = state.exerciseQueue.find((e) => e.id === exerciseId);
          if (exercise) exercise.completed = true;
        }),

      startRestTimer: (seconds, type) =>
        set((state) => {
          state.restTimer = {
            active: true,
            secondsRemaining: seconds,
            totalSeconds: seconds,
            type,
          };
        }),

      tickRestTimer: () =>
        set((state) => {
          if (!state.restTimer.active) return;
          const next = state.restTimer.secondsRemaining - 1;
          if (next <= 0) {
            // Clamp to 0 and auto-stop
            state.restTimer.secondsRemaining = 0;
            state.restTimer.active = false;
          } else {
            state.restTimer.secondsRemaining = next;
          }
        }),

      stopRestTimer: () =>
        set((state) => {
          state.restTimer.active = false;
          state.restTimer.secondsRemaining = 0;
        }),

      setSessionNotes: (notes) =>
        set((state) => {
          state.sessionNotes = notes;
        }),

      setWeekPlan: (plan) =>
        set((state) => {
          state.weekPlan = plan;
        }),
    })),
    {
      name: 'workout-store',
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist weekPlan — session state is ephemeral and Date objects
      // don't survive JSON serialization with correct types
      partialize: (state) => ({ weekPlan: state.weekPlan }),
    }
  )
);
