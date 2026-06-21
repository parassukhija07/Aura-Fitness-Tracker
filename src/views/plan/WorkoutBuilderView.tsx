import { useState } from 'react';
import { useWorkoutDataStore } from '../../store/workoutDataStore';
import type { Exercise, CustomWorkoutExercise } from '../../types/workout';
import ExerciseSelectorModal from './ExerciseSelectorModal';
import './workoutBuilder.css';
import { triggerLightImpact } from '../../utils/haptics';

interface WorkoutBuilderViewProps { onClose: () => void; }

export default function WorkoutBuilderView({ onClose }: WorkoutBuilderViewProps) {
  const [name, setName] = useState('');
  const [draftExercises, setDraftExercises] = useState<CustomWorkoutExercise[]>([]);
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const saveCustomWorkout = useWorkoutDataStore((s) => s.saveCustomWorkout);

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

  function handleSetField(index: number, field: 'targetSets' | 'targetReps', value: string) {
    setDraftExercises((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;
        if (field === 'targetSets') {
          const n = parseInt(value, 10);
          const safe = Number.isNaN(n) ? 1 : Math.max(1, n);
          return { ...item, targetSets: safe };
        }
        return { ...item, targetReps: value };
      })
    );
  }

  function handleRemove(index: number) {
    setDraftExercises((prev) => prev.filter((_, i) => i !== index));
  }

  function handleSave() {
    if (name.trim() === '' || draftExercises.length === 0) return;
    triggerLightImpact();
    saveCustomWorkout(name, draftExercises);
    onClose();
  }

  return (
    <div className="workout-builder">
      <header className="workout-builder__header">
        <button type="button" className="workout-builder__back" aria-label="Cancel" onClick={onClose}>‹</button>
        <input
          type="text"
          className="workout-builder__name-input"
          placeholder="Workout Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </header>

      <div className="workout-builder__list">
        {draftExercises.length === 0 && (
          <p className="plan-empty">No exercises yet. Add one to get started.</p>
        )}
        {draftExercises.map((ex, i) => (
          <div key={`${ex.exerciseId}-${i}`} className="workout-builder__exercise">
            <span className="workout-builder__exercise-name">{ex.exerciseName}</span>
            <div className="workout-builder__inputs">
              <input
                type="number" min={1} inputMode="numeric"
                className="workout-builder__sets-input"
                aria-label={`${ex.exerciseName} target sets`}
                value={ex.targetSets}
                onChange={(e) => handleSetField(i, 'targetSets', e.target.value)}
              />
              <input
                type="text"
                className="workout-builder__reps-input"
                aria-label={`${ex.exerciseName} target reps`}
                placeholder="8-12"
                value={ex.targetReps}
                onChange={(e) => handleSetField(i, 'targetReps', e.target.value)}
              />
              <button type="button" className="workout-builder__remove" aria-label="Remove exercise" onClick={() => handleRemove(i)}>×</button>
            </div>
          </div>
        ))}
      </div>

      <button type="button" className="workout-builder__add-btn" onClick={() => setIsSelectorOpen(true)}>+ Add Exercise</button>
      <button type="button" className="workout-builder__save-btn" disabled={name.trim() === '' || draftExercises.length === 0} onClick={handleSave}>Save Workout</button>

      {isSelectorOpen && (
        <ExerciseSelectorModal
          onSelect={handleAddExercise}
          onClose={() => setIsSelectorOpen(false)}
        />
      )}
    </div>
  );
}
