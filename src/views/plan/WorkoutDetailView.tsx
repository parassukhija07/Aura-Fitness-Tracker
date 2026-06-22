import { useState } from 'react';
import { motion } from 'framer-motion';
import { pageTransition } from '../../utils/motion';
import { useWorkoutDataStore } from '../../store/workoutDataStore';
import { triggerLightImpact } from '../../utils/haptics';
import type { CatalogWorkout } from '../../types/workout';
import WorkoutEditorView from './WorkoutEditorView';
import './programLibrary.css';

interface WorkoutDetailViewProps {
  workout: CatalogWorkout;
  onClose: () => void;
  onAdded?: () => void;
}

export default function WorkoutDetailView({ workout, onClose, onAdded }: WorkoutDetailViewProps): JSX.Element {
  const getExerciseById = useWorkoutDataStore((s) => s.getExerciseById);
  const addCatalogWorkoutToMyPlans = useWorkoutDataStore((s) => s.addCatalogWorkoutToMyPlans);
  const userWorkouts = useWorkoutDataStore((s) => s.userWorkouts);

  const [added, setAdded] = useState(() =>
    userWorkouts.some((w) => w.id === `myplan-${workout.id}`)
  );
  const [editing, setEditing] = useState(false);

  function handleAdd() {
    addCatalogWorkoutToMyPlans(workout);
    triggerLightImpact();
    setAdded(true);
    onAdded?.();
  }

  if (editing) {
    const myplanId = `myplan-${workout.id}`;
    return (
      <WorkoutEditorView
        workoutId={myplanId}
        workoutName={workout.name}
        sourceKind="userWorkout"
        isPlanDerived
        onClose={() => setEditing(false)}
      />
    );
  }

  return (
    <motion.div className="prog-lib-detail" {...pageTransition}>
      <div className="prog-lib-detail__header">
        <button type="button" className="prog-lib-detail__back" aria-label="Back" onClick={onClose}>
          ‹
        </button>
        <span className="prog-lib-detail__title">{workout.name}</span>
      </div>

      <p className="prog-lib-detail__desc">{workout.category} &middot; {workout.muscleGroup}</p>

      {workout.exercises.map((e, ei) => (
        <div key={`${e.exerciseId}-${ei}`} className="prog-lib-detail__exercise">
          <span className="prog-lib-detail__exercise-name">
            {getExerciseById(e.exerciseId)?.name ?? e.exerciseId}
          </span>
          <span className="prog-lib-detail__exercise-meta">
            {e.sets} sets &times; {e.repsMin}–{e.repsMax} reps
          </span>
        </div>
      ))}

      <button
        type="button"
        className="prog-lib-detail__add-btn"
        disabled={added}
        onClick={handleAdd}
      >
        {added ? 'Added to My Plans ✓' : 'Add to My Plans'}
      </button>
      {added && (
        <button
          type="button"
          className="prog-lib-detail__add-btn"
          style={{ marginTop: 8, background: 'var(--surface)', color: 'var(--accent)' }}
          onClick={() => setEditing(true)}
        >
          Edit Workout
        </button>
      )}
    </motion.div>
  );
}
