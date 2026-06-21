import { useState } from 'react';
import { useWorkoutDataStore } from '../../store/workoutDataStore';
import type { Exercise, CustomWorkoutExercise } from '../../types/workout';
import ExerciseSelectorModal from './ExerciseSelectorModal';
import { motion } from 'framer-motion';
import { overlayTransition, panelTransition } from '../../utils/motion';
import { triggerLightImpact } from '../../utils/haptics';
import './workoutBuilder.css';

interface WorkoutBuilderModalProps {
  onComplete: (workoutId: string) => void;
  onClose: () => void;
}

export default function WorkoutBuilderModal({ onComplete, onClose }: WorkoutBuilderModalProps) {
  const [name, setName] = useState('');
  const [draftExercises, setDraftExercises] = useState<CustomWorkoutExercise[]>([]);
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const createWorkout = useWorkoutDataStore((s) => s.createWorkout);
  const addExerciseToWorkout = useWorkoutDataStore((s) => s.addExerciseToWorkout);

  function handleAddExercise(ex: Exercise) {
    const item: CustomWorkoutExercise = {
      exerciseId: ex.id,
      exerciseName: ex.name,
      targetSets: ex.defaultSets,
      targetReps: `${ex.defaultRepsMin}-${ex.defaultRepsMax}`,
    };
    setDraftExercises((prev) => [...prev, item]);
    setIsSelectorOpen(false);
  }

  function handleSave() {
    if (name.trim() === '' || draftExercises.length === 0) return;
    const id = createWorkout(name);
    if (id === '') return;
    draftExercises.forEach((ex) => addExerciseToWorkout(id, ex));
    triggerLightImpact();
    onComplete(id);
  }

  return (
    <motion.div
      className="exercise-modal__backdrop"
      role="presentation"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      {...overlayTransition}
    >
      <motion.div className="exercise-modal__panel" role="dialog" aria-modal="true" aria-label="Build Workout" {...panelTransition}>
        <header className="exercise-modal__header">
          <input
            type="text"
            className="workout-builder__name-input"
            placeholder="Workout Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <button type="button" className="exercise-modal__close" aria-label="Close" onClick={onClose}>×</button>
        </header>

        <div className="exercise-modal__list">
          {draftExercises.length === 0 && (
            <p className="plan-empty">No exercises yet. Add one to get started.</p>
          )}
          {draftExercises.map((ex, i) => (
            <div key={`${ex.exerciseId}-${i}`} className="exercise-modal__item workout-builder__exercise">
              <span className="exercise-modal__item-name">{ex.exerciseName}</span>
              <span className="exercise-modal__item-muscle">{ex.targetSets} sets · {ex.targetReps} reps</span>
            </div>
          ))}
        </div>

        <button type="button" className="workout-builder__add-btn" onClick={() => setIsSelectorOpen(true)}>+ Add Exercise</button>
        <button
          type="button"
          className="workout-builder__save-btn"
          disabled={name.trim() === '' || draftExercises.length === 0}
          onClick={handleSave}
        >
          Save Workout
        </button>
      </motion.div>

      {isSelectorOpen && (
        <ExerciseSelectorModal
          onSelect={handleAddExercise}
          onClose={() => setIsSelectorOpen(false)}
        />
      )}
    </motion.div>
  );
}
