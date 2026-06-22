import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { pageTransition } from '../../utils/motion';
import { useWorkoutDataStore } from '../../store/workoutDataStore';
import { useUserPreferencesStore } from '../../store/userPreferencesStore';
import { triggerLightImpact } from '../../utils/haptics';
import type { CustomWorkoutExercise } from '../../types/workout';
import { Button } from '../../design';
import { SaveScopeSheet } from './SaveScopeSheet';
import ExerciseSelectorModal from './ExerciseSelectorModal';
import { ChevronLeftIcon, PlusIcon } from '../../components/icons/AuraIcons';
import './plan.css';

export interface WorkoutEditorViewProps {
  workoutId: string;
  workoutName: string;
  /** The kind of source. Plain custom workouts without plan linkage use 'userWorkout' but
   *  the editor calls updateWorkoutExercises directly (no scope sheet). Pass isPlanDerived=true
   *  when the workout was generated from a program/catalog (id starts with 'myplan-') to trigger
   *  the SaveScopeSheet. */
  sourceKind: 'userWorkout' | 'userProgram' | 'program';
  isPlanDerived?: boolean;
  onClose: () => void;
}

export default function WorkoutEditorView({
  workoutId,
  workoutName,
  sourceKind,
  isPlanDerived = false,
  onClose,
}: WorkoutEditorViewProps) {
  const userWorkouts = useWorkoutDataStore((s) => s.userWorkouts);
  const userPrograms = useWorkoutDataStore((s) => s.userPrograms);
  const programs = useWorkoutDataStore((s) => s.programs);
  const getExerciseById = useWorkoutDataStore((s) => s.getExerciseById);
  const updateWorkoutExercises = useWorkoutDataStore((s) => s.updateWorkoutExercises);
  const applyPlanEdit = useWorkoutDataStore((s) => s.applyPlanEdit);

  const defaultRestSetsSec = useUserPreferencesStore((s) => s.defaultRestBetweenSetsSec);
  const defaultRestExSec = useUserPreferencesStore((s) => s.defaultRestBetweenExercisesSec);

  // ── Load initial draft ───────────────────────────────────────────────────────
  function loadInitialExercises(): CustomWorkoutExercise[] {
    if (sourceKind === 'userWorkout') {
      const w = userWorkouts.find((x) => x.id === workoutId);
      return w?.exercises.map((e) => ({ ...e })) ?? [];
    }
    if (sourceKind === 'userProgram') {
      const p = userPrograms.find((x) => x.id === workoutId);
      return (p?.exercises ?? []).map((e) => ({
        exerciseId: e.exerciseId,
        exerciseName: getExerciseById(e.exerciseId)?.name ?? e.exerciseId,
        targetSets: e.sets,
        targetReps: e.repsMin === e.repsMax ? String(e.repsMin) : `${e.repsMin}-${e.repsMax}`,
      }));
    }
    // 'program' — predefined; we load from programs or try myplan- copy
    const src = programs.find((x) => x.id === workoutId) ?? userPrograms.find((x) => x.id === `myplan-${workoutId}`);
    return (src?.exercises ?? []).map((e) => ({
      exerciseId: e.exerciseId,
      exerciseName: getExerciseById(e.exerciseId)?.name ?? e.exerciseId,
      targetSets: e.sets,
      targetReps: e.repsMin === e.repsMax ? String(e.repsMin) : `${e.repsMin}-${e.repsMax}`,
    }));
  }

  function loadInitialRestBetweenEx(): number {
    if (sourceKind === 'userWorkout') {
      const w = userWorkouts.find((x) => x.id === workoutId);
      return w?.restBetweenExercisesSec ?? defaultRestExSec;
    }
    return defaultRestExSec;
  }

  const [exercises, setExercises] = useState<CustomWorkoutExercise[]>(loadInitialExercises);
  const [restBetweenExSec, setRestBetweenExSec] = useState(loadInitialRestBetweenEx);
  const [showSelector, setShowSelector] = useState(false);
  const [scopeOpen, setScopeOpen] = useState(false);

  // ── Draft mutations ──────────────────────────────────────────────────────────
  const updateExercise = useCallback((idx: number, patch: Partial<CustomWorkoutExercise>) => {
    setExercises((prev) => prev.map((ex, i) => (i === idx ? { ...ex, ...patch } : ex)));
  }, []);

  const removeExercise = useCallback((idx: number) => {
    setExercises((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  const moveExercise = useCallback((fromIdx: number, dir: -1 | 1) => {
    setExercises((prev) => {
      const next = [...prev];
      const toIdx = fromIdx + dir;
      if (toIdx < 0 || toIdx >= next.length) return prev;
      [next[fromIdx], next[toIdx]] = [next[toIdx], next[fromIdx]];
      return next;
    });
  }, []);

  // ── Save flow ────────────────────────────────────────────────────────────────
  function handleSaveIntent() {
    triggerLightImpact();
    if (isPlanDerived || sourceKind === 'userProgram' || sourceKind === 'program') {
      setScopeOpen(true);
    } else {
      // Direct custom workout — save immediately
      updateWorkoutExercises(workoutId, exercises, restBetweenExSec);
      onClose();
    }
  }

  function handleJustToday() {
    applyPlanEdit('today', { sourceKind, sourceId: workoutId, exercises, restBetweenExercisesSec: restBetweenExSec });
    onClose();
  }

  function handlePermanently() {
    applyPlanEdit('permanent', { sourceKind, sourceId: workoutId, exercises, restBetweenExercisesSec: restBetweenExSec });
    onClose();
  }

  return (
    <motion.div className="wkted" {...pageTransition} style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg)', overflow: 'hidden' }}>
      {/* Header */}
      <div className="wkted__header">
        <button type="button" className="wkted__back" aria-label="Back" onClick={onClose}>
          <ChevronLeftIcon size={18} />
        </button>
        <span className="wkted__title">{workoutName}</span>
        <button type="button" className="wkted__save-btn" onClick={handleSaveIntent}>
          Save
        </button>
      </div>

      {/* Scrollable body */}
      <div className="wkted__body">

        {/* Rest between exercises */}
        <div className="wkted__section-label">Rest Between Exercises</div>
        <div className="wkted__rest-row">
          <span className="wkted__rest-label">Default rest (sec)</span>
          <input
            className="wkted__rest-input"
            type="number"
            inputMode="numeric"
            min={10}
            max={600}
            value={restBetweenExSec}
            onChange={(e) => {
              const n = parseInt(e.target.value, 10);
              if (!Number.isNaN(n)) setRestBetweenExSec(Math.min(600, Math.max(10, n)));
            }}
          />
        </div>

        {/* Exercise list */}
        <div className="wkted__section-label">Exercises</div>

        {exercises.length === 0 && (
          <p className="plan-empty">No exercises yet. Tap + to add one.</p>
        )}

        {exercises.map((ex, idx) => {
          const exRecord = getExerciseById(ex.exerciseId);
          const displayName = ex.exerciseName || exRecord?.name || ex.exerciseId;
          const restSec = ex.restBetweenSetsSec ?? defaultRestSetsSec;
          return (
            <div key={`${ex.exerciseId}-${idx}`} className="wkted__ex-card">
              <div className="wkted__ex-header">
                <span className="wkted__ex-name">{displayName}</span>
                <div className="wkted__ex-actions">
                  <button
                    type="button"
                    className="wkted__ex-btn"
                    onClick={() => moveExercise(idx, -1)}
                    disabled={idx === 0}
                    aria-label="Move up"
                  >↑</button>
                  <button
                    type="button"
                    className="wkted__ex-btn"
                    onClick={() => moveExercise(idx, 1)}
                    disabled={idx === exercises.length - 1}
                    aria-label="Move down"
                  >↓</button>
                  <button
                    type="button"
                    className="wkted__ex-btn wkted__ex-btn--del"
                    onClick={() => removeExercise(idx)}
                    aria-label="Remove exercise"
                  >✕</button>
                </div>
              </div>

              <div className="wkted__ex-fields">
                <label className="wkted__field">
                  <span>Sets</span>
                  <input
                    className="wkted__num-input"
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={20}
                    value={ex.targetSets}
                    onChange={(e) => {
                      const n = parseInt(e.target.value, 10);
                      if (!Number.isNaN(n) && n >= 1) updateExercise(idx, { targetSets: n });
                    }}
                  />
                </label>
                <label className="wkted__field">
                  <span>Reps</span>
                  <input
                    className="wkted__num-input"
                    type="text"
                    inputMode="numeric"
                    value={ex.targetReps}
                    onChange={(e) => updateExercise(idx, { targetReps: e.target.value })}
                  />
                </label>
                <label className="wkted__field">
                  <span>Rest (sec)</span>
                  <input
                    className="wkted__num-input"
                    type="number"
                    inputMode="numeric"
                    min={10}
                    max={600}
                    value={restSec}
                    onChange={(e) => {
                      const n = parseInt(e.target.value, 10);
                      if (!Number.isNaN(n)) updateExercise(idx, { restBetweenSetsSec: Math.min(600, Math.max(10, n)) });
                    }}
                  />
                </label>
              </div>
            </div>
          );
        })}

        {/* Add exercise button */}
        <div style={{ marginTop: 'var(--s3)' }}>
          <Button
            variant="tinted"
            size="md"
            fullWidth
            onClick={() => setShowSelector(true)}
          >
            <PlusIcon size={16} /> Add Exercise
          </Button>
        </div>
      </div>

      {showSelector && (
        <ExerciseSelectorModal
          onSelect={(ex) => {
            const defaultReps = ex.defaultRepsMin === ex.defaultRepsMax
              ? String(ex.defaultRepsMin)
              : `${ex.defaultRepsMin}-${ex.defaultRepsMax}`;
            setExercises((prev) => [...prev, {
              exerciseId: ex.id,
              exerciseName: ex.name,
              targetSets: ex.defaultSets,
              targetReps: defaultReps,
              restBetweenSetsSec: defaultRestSetsSec,
            }]);
            triggerLightImpact();
            setShowSelector(false);
          }}
          onClose={() => setShowSelector(false)}
        />
      )}

      <SaveScopeSheet
        open={scopeOpen}
        onClose={() => setScopeOpen(false)}
        onJustToday={handleJustToday}
        onPermanently={handlePermanently}
      />
    </motion.div>
  );
}
