import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type {
  Exercise,
  Equipment,
  MuscleGroup,
  WorkoutProgram,
  UserPlan,
  SessionExercise,
  ActiveSessionState,
  LoggedSet,
  SetType,
  CustomWorkout,
  CustomWorkoutExercise,
  CablePulley,
  CatalogProgram,
  CatalogWorkout,
  CompletedWorkout,
  CompletedExercise,
  CompletedSet,
  PlanEditPayload,
} from '../types/workout';
import { SEED_EXERCISES, SEED_PROGRAMS, SEED_USER_PLAN } from './seedData';
import { capacitorStorage } from './capacitorStorage';
import exercisesData from '../data/exercises.json';

// ─── State + Actions ───────────────────────────────────────────────────────────
interface WorkoutDataState {
  exercises: Exercise[];
  programs: WorkoutProgram[];
  userPlan: UserPlan | null;
  activeSession: ActiveSessionState | null;
  userWorkouts: CustomWorkout[];
  userPrograms: WorkoutProgram[];
  completedWorkouts: CompletedWorkout[];

  // selectors-as-helpers (pure reads; keep minimal)
  getActiveProgram: () => WorkoutProgram | undefined;
  getExerciseById: (id: string) => Exercise | undefined;

  // actions
  setActiveProgram: (programId: string) => void;
  advanceDay: () => void;       // increments currentDay; rolls over at 7 -> resets to 1 and increments currentWeek
  resetToSeed: () => void;      // restores SEED_* values
  startSession: (program: WorkoutProgram, exercises: SessionExercise[]) => void;
  endSession: () => void;
  cancelSession: () => void;
  updateElapsedTime: (seconds: number) => void;
  completeSet: (exerciseIndex: number, setIndex: number) => void;
  addSet: (exerciseIndex: number) => void;
  deleteSet: (exerciseIndex: number, setIndex: number) => void;
  updateSetField: (exerciseIndex: number, setIndex: number, field: 'weight' | 'reps', value: number) => void;
  updateSetType: (exerciseIndex: number, setIndex: number, setType: SetType) => void;
  saveCustomWorkout: (name: string, exercises: CustomWorkoutExercise[]) => void;
  assignWorkoutToDay: (dayIndex: number, workoutId: string | null) => void;
  createProgram: (name: string, description: string) => string;
  addWorkoutToProgram: (programId: string, workoutId: string) => void;
  createWorkout: (name: string) => string;
  addExerciseToWorkout: (workoutId: string, exercise: CustomWorkoutExercise) => void;
  replaceExerciseInWorkout: (workoutId: string, index: number, exercise: CustomWorkoutExercise) => void;
  updateActiveSchedule: (schedule: (string | null)[]) => void;

  // New actions — Exercise Detail View
  updateSetNote: (exerciseIndex: number, setIndex: number, note: string) => void;
  setCablePulley: (exerciseIndex: number, pulley: CablePulley) => void;
  setSupersetGroup: (exerciseIndices: number[], groupId: string | null) => void;
  startInterExerciseRest: () => void;
  clearInterExerciseRest: () => void;
  setSessionNotes: (notes: string) => void;
  stripEmptySets: (exerciseIndex: number) => void;

  addCatalogProgramToMyPlans: (program: CatalogProgram) => string; // returns new userProgram id ('' on failure)
  addCatalogWorkoutToMyPlans: (workout: CatalogWorkout) => string; // returns new userWorkout id ('' on failure)

  // Gap A — scoped edit save
  applyPlanEdit: (scope: 'today' | 'permanent', payload: PlanEditPayload) => void;

  // Gap C — direct workout exercise update (for non-plan-derived custom workouts)
  updateWorkoutExercises: (workoutId: string, exercises: CustomWorkoutExercise[], restBetweenExercisesSec?: number) => void;

  // In-session mutation actions
  addExerciseToSession: (exerciseId: string) => void;
  removeExerciseFromSession: (exerciseIndex: number) => void;
  reorderSessionExercise: (fromIndex: number, toIndex: number) => void;
  substituteExercise: (exerciseIndex: number, newExerciseId: string) => void;

  // Custom exercise creation
  createExercise: (input: {
    name: string;
    muscleGroup: MuscleGroup;
    equipment: Equipment;
    difficulty?: Exercise['difficulty'];
    formTips?: string;
    imageUrl?: string;
    videoUrl?: string;
  }) => string; // returns new exercise id, or '' on invalid (empty name)

  // History
  logPastWorkout: (workout: CompletedWorkout) => void;
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
      userPrograms: [],
      completedWorkouts: [],

      // ─── Selectors ───────────────────────────────────────────────────────
      getActiveProgram: () => {
        const id = get().userPlan?.activeProgramId;
        return get().programs.find((p) => p.id === id) ?? get().userPrograms.find((p) => p.id === id);
      },

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
          state.userPrograms = [];
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
          const session = state.activeSession;
          if (!session) return;

          // Build completed exercises (only exercises with >= 1 completed set)
          const completedExercises: CompletedExercise[] = [];
          for (const ex of session.exercises) {
            const completedSets: CompletedSet[] = ex.sets
              .filter((s: LoggedSet) => s.completed)
              .map((s: LoggedSet) => ({
                reps: s.reps,
                weight: s.weight,
                setType: s.setType,
                note: s.note,
              }));
            if (completedSets.length === 0) continue;
            completedExercises.push({
              exerciseId: ex.exerciseId,
              exerciseName: ex.exerciseName,
              muscleGroup: ex.muscleGroup,
              cablePulley: ex.cablePulley,
              supersetGroupId: ex.supersetGroupId,
              sets: completedSets,
            });
          }

          // If no completed sets at all, just null the session (cancel path)
          if (completedExercises.length === 0) {
            state.activeSession = null;
            return;
          }

          // Compute total volume
          const totalVolume = completedExercises.reduce((acc, ex) => {
            return acc + ex.sets.reduce((s, set) => s + set.weight * set.reps, 0);
          }, 0);

          // Compute date from startTime
          const startDate = new Date(session.startTime);
          const date = startDate.toLocaleDateString('en-CA'); // YYYY-MM-DD

          // Compute prCount against existing history (before pushing new record)
          // We need to check inline since we can't call imported pr.ts helpers from store
          const existingHistory = state.completedWorkouts;
          let prCount = 0;
          for (const ex of session.exercises) {
            const completedSets = ex.sets.filter((s: LoggedSet) => s.completed && s.weight > 0);
            if (completedSets.length === 0) continue;
            const bestSessionSet = completedSets.reduce((best: LoggedSet, s: LoggedSet) => {
              if (s.weight > best.weight) return s;
              if (s.weight === best.weight && s.reps > best.reps) return s;
              return best;
            });

            // Find best historical set for this exercise
            let bestHistWeight = 0;
            let bestHistReps = 0;
            for (const workout of existingHistory) {
              for (const histEx of workout.exercises) {
                if (histEx.exerciseId !== ex.exerciseId) continue;
                for (const set of histEx.sets) {
                  if (set.weight > bestHistWeight) {
                    bestHistWeight = set.weight;
                    bestHistReps = set.reps;
                  } else if (set.weight === bestHistWeight && set.reps > bestHistReps) {
                    bestHistReps = set.reps;
                  }
                }
              }
            }

            const noHistory = bestHistWeight === 0 && bestHistReps === 0;
            const isNewPr = noHistory
              ? bestSessionSet.weight > 0
              : bestSessionSet.weight > bestHistWeight ||
                (bestSessionSet.weight === bestHistWeight && bestSessionSet.reps > bestHistReps);

            if (isNewPr) prCount++;
          }

          // Look up program name
          const prog =
            state.programs.find((p) => p.id === session.workoutId) ??
            state.userPrograms.find((p) => p.id === session.workoutId);
          const programName = prog?.name ?? session.workoutId;

          const record: CompletedWorkout = {
            id: `session-${Date.now()}`,
            programId: session.workoutId,
            programName,
            date,
            startTime: session.startTime,
            durationSeconds: session.elapsedTime,
            totalVolume,
            prCount,
            exercises: completedExercises,
            sessionNotes: session.sessionNotes,
            logSource: 'live',
          };

          state.completedWorkouts.push(record);
          state.activeSession = null;
        }),

      cancelSession: () =>
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

      assignWorkoutToDay: (dayIndex, workoutId) =>
        set((state) => {
          if (!state.userPlan) return;
          if (!Number.isInteger(dayIndex)) return;
          if (dayIndex < 0 || dayIndex > 6) return;
          if (!Array.isArray(state.userPlan.schedule) || state.userPlan.schedule.length !== 7) {
            state.userPlan.schedule = [null, null, null, null, null, null, null];
          }
          state.userPlan.schedule[dayIndex] = workoutId;
        }),

      createProgram: (name, description) => {
        let id = '';
        set((state) => {
          const trimmed = name.trim();
          if (trimmed.length === 0) return;
          id = `program-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
          state.userPrograms.push({ id, name: trimmed, description: description.trim(), exercises: [] });
        });
        return id;
      },

      createWorkout: (name) => {
        let id = '';
        set((state) => {
          const trimmed = name.trim();
          if (trimmed.length === 0) return;
          id = `custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
          state.userWorkouts.push({ id, name: trimmed, exercises: [], createdAt: new Date().toISOString() });
        });
        return id;
      },

      addExerciseToWorkout: (workoutId, exercise) =>
        set((state) => {
          const w = state.userWorkouts.find((x) => x.id === workoutId);
          if (!w) return;
          if (!exercise || typeof exercise.exerciseId !== 'string' || exercise.exerciseId.length === 0) return;
          w.exercises.push({
            exerciseId: exercise.exerciseId,
            exerciseName: exercise.exerciseName,
            targetSets: Math.max(1, exercise.targetSets || 1),
            targetReps: exercise.targetReps,
          });
        }),

      replaceExerciseInWorkout: (workoutId, index, exercise) =>
        set((state) => {
          const w = state.userWorkouts.find((x) => x.id === workoutId);
          if (!w) return;
          if (index < 0 || index >= w.exercises.length) return;
          if (!exercise || typeof exercise.exerciseId !== 'string' || exercise.exerciseId.length === 0) return;
          w.exercises[index] = {
            exerciseId: exercise.exerciseId,
            exerciseName: exercise.exerciseName,
            targetSets: Math.max(1, exercise.targetSets || 1),
            targetReps: exercise.targetReps,
          };
        }),

      addWorkoutToProgram: (programId, workoutId) =>
        set((state) => {
          const prog = state.userPrograms.find((p) => p.id === programId);
          if (!prog) return;
          const w = state.userWorkouts.find((x) => x.id === workoutId);
          if (!w) return;
          for (const ex of w.exercises) {
            const parts = String(ex.targetReps).split('-').map((s) => parseInt(s.trim(), 10));
            const min = Number.isNaN(parts[0]) ? 0 : parts[0];
            const max = parts.length > 1 && !Number.isNaN(parts[1]) ? parts[1] : min;
            prog.exercises.push({ exerciseId: ex.exerciseId, sets: ex.targetSets, repsMin: min, repsMax: max });
          }
        }),

      updateActiveSchedule: (schedule) =>
        set((state) => {
          if (!state.userPlan) return;
          if (!Array.isArray(schedule) || schedule.length !== 7) return;
          state.userPlan.schedule = schedule.map((v) => (typeof v === 'string' && v.length > 0 ? v : null));
        }),

      updateSetNote: (exerciseIndex, setIndex, note) =>
        set((state) => {
          const set_ = state.activeSession?.exercises[exerciseIndex]?.sets[setIndex];
          if (!set_) return;
          set_.note = note;
        }),

      setCablePulley: (exerciseIndex, pulley) =>
        set((state) => {
          const ex = state.activeSession?.exercises[exerciseIndex];
          if (!ex) return;
          ex.cablePulley = pulley;
        }),

      setSupersetGroup: (exerciseIndices, groupId) =>
        set((state) => {
          if (!state.activeSession) return;
          for (const idx of exerciseIndices) {
            const ex = state.activeSession.exercises[idx];
            if (!ex) continue;
            ex.supersetGroupId = groupId ?? undefined;
          }
        }),

      startInterExerciseRest: () =>
        set((state) => {
          if (!state.activeSession) return;
          state.activeSession.interExerciseRestStartedAt = new Date().toISOString();
        }),

      clearInterExerciseRest: () =>
        set((state) => {
          if (!state.activeSession) return;
          state.activeSession.interExerciseRestStartedAt = null;
        }),

      setSessionNotes: (notes) =>
        set((state) => {
          if (!state.activeSession) return;
          state.activeSession.sessionNotes = notes;
        }),

      stripEmptySets: (exerciseIndex) =>
        set((state) => {
          const ex = state.activeSession?.exercises[exerciseIndex];
          if (!ex) return;
          const cleaned = ex.sets.filter(
            (s: LoggedSet) => s.completed || s.reps !== 0 || s.weight !== 0
          );
          ex.sets = cleaned.length > 0 ? cleaned : ex.sets.slice(0, 1);
        }),

      // ─── Gap A: scoped edit save ──────────────────────────────────────────

      applyPlanEdit: (scope, payload) => {
        if (scope === 'today') return; // live session already holds the edit; nothing to persist
        set((state) => {
          const { sourceKind, sourceId, exercises, restBetweenExercisesSec } = payload;

          if (sourceKind === 'userWorkout') {
            const w = state.userWorkouts.find((x) => x.id === sourceId);
            if (!w) return;
            w.exercises = exercises.map((e) => ({
              exerciseId: e.exerciseId,
              exerciseName: e.exerciseName,
              targetSets: e.targetSets,
              targetReps: e.targetReps,
              restBetweenSetsSec: e.restBetweenSetsSec,
            }));
            if (restBetweenExercisesSec !== undefined) {
              w.restBetweenExercisesSec = restBetweenExercisesSec;
            }
          } else if (sourceKind === 'userProgram') {
            const prog = state.userPrograms.find((p) => p.id === sourceId);
            if (!prog) return;
            prog.exercises = exercises.map((e) => {
              const parts = String(e.targetReps).split('-').map((s) => parseInt(s.trim(), 10));
              const min = Number.isNaN(parts[0]) ? 0 : parts[0];
              const max = parts.length > 1 && !Number.isNaN(parts[1]) ? parts[1] : min;
              return { exerciseId: e.exerciseId, sets: e.targetSets, repsMin: min, repsMax: max };
            });
          } else if (sourceKind === 'program') {
            // Do NOT mutate state.programs. Route to myplan- copy.
            const myplanId = `myplan-${sourceId}`;
            let userProg = state.userPrograms.find((p) => p.id === myplanId);
            if (!userProg) {
              // Guard: max 3 myplan- entries
              const myplanCount = state.userPrograms.filter((p) => p.id.startsWith('myplan-')).length;
              if (myplanCount >= 3) return;
              const seed = state.programs.find((p) => p.id === sourceId);
              userProg = {
                id: myplanId,
                name: seed?.name ?? sourceId,
                description: seed?.description ?? '',
                exercises: [],
              };
              state.userPrograms.push(userProg);
            }
            userProg.exercises = exercises.map((e) => {
              const parts = String(e.targetReps).split('-').map((s) => parseInt(s.trim(), 10));
              const min = Number.isNaN(parts[0]) ? 0 : parts[0];
              const max = parts.length > 1 && !Number.isNaN(parts[1]) ? parts[1] : min;
              return { exerciseId: e.exerciseId, sets: e.targetSets, repsMin: min, repsMax: max };
            });
          }
        });
      },

      // ─── Gap C: direct custom workout exercise update ─────────────────────

      updateWorkoutExercises: (workoutId, exercises, restBetweenExercisesSec) =>
        set((state) => {
          const w = state.userWorkouts.find((x) => x.id === workoutId);
          if (!w) return;
          w.exercises = exercises.map((e) => ({
            exerciseId: e.exerciseId,
            exerciseName: e.exerciseName,
            targetSets: e.targetSets,
            targetReps: e.targetReps,
            restBetweenSetsSec: e.restBetweenSetsSec,
          }));
          if (restBetweenExercisesSec !== undefined) {
            w.restBetweenExercisesSec = restBetweenExercisesSec;
          }
        }),

      addCatalogProgramToMyPlans: (program) => {
        let newId = '';
        set((state) => {
          if (!program || typeof program.id !== 'string' || program.id.length === 0) return;
          // Gap B: max 3 myplan- entries
          const myplanCount = state.userPrograms.filter((p) => p.id.startsWith('myplan-')).length;
          const already = state.userPrograms.find((p) => p.id === `myplan-${program.id}`);
          if (already) { newId = already.id; return; }
          if (myplanCount >= 3) { return; } // at limit
          newId = `myplan-${program.id}`;
          const flat = program.workouts.flatMap((w) =>
            w.exercises.map((e) => ({
              exerciseId: e.exerciseId, sets: e.sets, repsMin: e.repsMin, repsMax: e.repsMax,
            }))
          );
          state.userPrograms.push({
            id: newId, name: program.name, description: program.description, exercises: flat,
          });
        });
        return newId;
      },

      addCatalogWorkoutToMyPlans: (workout) => {
        let newId = '';
        set((state) => {
          if (!workout || typeof workout.id !== 'string' || workout.id.length === 0) return;
          const already = state.userWorkouts.find((w) => w.id === `myplan-${workout.id}`);
          if (already) { newId = already.id; return; }
          newId = `myplan-${workout.id}`;
          state.userWorkouts.push({
            id: newId,
            name: workout.name,
            exercises: workout.exercises.map((e) => ({
              exerciseId: e.exerciseId,
              exerciseName: '', // resolved at render via getExerciseById; empty is acceptable
              targetSets: e.sets,
              targetReps: e.repsMin === e.repsMax ? String(e.repsMin) : `${e.repsMin}-${e.repsMax}`,
            })),
            createdAt: new Date().toISOString(),
          });
        });
        return newId;
      },

      // ─── In-session mutations ─────────────────────────────────────────────

      addExerciseToSession: (exerciseId: string) =>
        set((state) => {
          if (!state.activeSession) return;
          const ex = state.exercises.find((e) => e.id === exerciseId);
          if (!ex) return;
          state.activeSession.exercises.push({
            exerciseId: ex.id,
            exerciseName: ex.name,
            muscleGroup: ex.muscleGroup,
            defaultSets: ex.defaultSets,
            sets: [{ reps: 0, weight: 0, setType: 'Normal', completed: false }],
          });
        }),

      removeExerciseFromSession: (exerciseIndex: number) =>
        set((state) => {
          if (!state.activeSession) return;
          const exercises = state.activeSession.exercises;
          if (exerciseIndex < 0 || exerciseIndex >= exercises.length) return;

          const removedGroupId = exercises[exerciseIndex].supersetGroupId;
          exercises.splice(exerciseIndex, 1);

          // If removed exercise was in a superset, check if the group now has only 1 member
          if (removedGroupId) {
            const remaining = exercises.filter((e) => e.supersetGroupId === removedGroupId);
            if (remaining.length === 1) {
              remaining[0].supersetGroupId = undefined;
            }
          }
        }),

      reorderSessionExercise: (fromIndex: number, toIndex: number) =>
        set((state) => {
          if (!state.activeSession) return;
          const exercises = state.activeSession.exercises;
          const n = exercises.length;
          if (
            fromIndex < 0 || fromIndex >= n ||
            toIndex < 0 || toIndex >= n ||
            fromIndex === toIndex
          ) {
            return;
          }
          const [moved] = exercises.splice(fromIndex, 1);
          exercises.splice(toIndex, 0, moved);
        }),

      substituteExercise: (exerciseIndex: number, newExerciseId: string) =>
        set((state) => {
          if (!state.activeSession) return;
          const exercises = state.activeSession.exercises;
          if (exerciseIndex < 0 || exerciseIndex >= exercises.length) return;
          const newEx = state.exercises.find((e) => e.id === newExerciseId);
          if (!newEx) return;
          const existing = exercises[exerciseIndex];
          exercises[exerciseIndex] = {
            exerciseId: newEx.id,
            exerciseName: newEx.name,
            muscleGroup: newEx.muscleGroup,
            defaultSets: newEx.defaultSets,
            sets: [{ reps: 0, weight: 0, setType: 'Normal', completed: false }],
            supersetGroupId: existing.supersetGroupId, // KEEP superset
            // cablePulley is cleared (not carried over)
          };
        }),

      // ─── Custom exercise creation ─────────────────────────────────────────

      createExercise: (input) => {
        let newId = '';
        set((state) => {
          const trimmed = input.name.trim();
          if (trimmed.length === 0) return;
          const slug = trimmed
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');
          const rand = Math.random().toString(36).slice(2, 7);
          newId = `${slug}-${rand}`;
          const newExercise: Exercise = {
            id: newId,
            name: trimmed,
            muscleGroup: input.muscleGroup,
            equipment: input.equipment,
            defaultSets: 3,
            defaultRepsMin: 8,
            defaultRepsMax: 12,
            custom: true,
            difficulty: input.difficulty ?? 'Intermediate',
            formTips: input.formTips,
            imageUrl: input.imageUrl,
            videoUrl: input.videoUrl,
          };
          state.exercises.push(newExercise);
        });
        return newId;
      },

      // ─── History ──────────────────────────────────────────────────────────

      logPastWorkout: (workout: CompletedWorkout) =>
        set((state) => {
          state.completedWorkouts.push(workout);
        }),
    })),
    {
      name: 'aura-workout-data',
      storage: createJSONStorage(() => capacitorStorage),
      version: 4,
      migrate: (persistedState: any, _fromVersion: number) => {
        if (persistedState?.userPlan && !Array.isArray(persistedState.userPlan.schedule)) {
          persistedState.userPlan.schedule = [null, null, null, null, null, null, null];
        }
        // v3: ensure completedWorkouts exists
        if (!Array.isArray(persistedState?.completedWorkouts)) {
          persistedState.completedWorkouts = [];
        }
        // v4: restBetweenSetsSec / restBetweenExercisesSec are optional on exercises/workouts
        // No backfill needed — readers fall back to userPreferencesStore defaults when undefined.

        // v3: backfill equipment on persisted exercises that lack it
        if (Array.isArray(persistedState?.exercises)) {
          const seedMap = new Map(
            (exercisesData as Array<{ id: string; equipment?: string }>).map((e) => [e.id, e.equipment])
          );
          persistedState.exercises = persistedState.exercises.map((ex: any) => {
            if (!ex.equipment) {
              ex.equipment = seedMap.get(ex.id) ?? 'Barbell';
            }
            return ex;
          });
        }
        return persistedState;
      },
      partialize: (state) => ({
        exercises: state.exercises,
        programs: state.programs,
        userPlan: state.userPlan,
        activeSession: state.activeSession,
        userWorkouts: state.userWorkouts,
        userPrograms: state.userPrograms,
        completedWorkouts: state.completedWorkouts,
      }),
    }
  )
);
