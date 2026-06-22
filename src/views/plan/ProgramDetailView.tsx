import { useState } from 'react';
import { motion } from 'framer-motion';
import { pageTransition } from '../../utils/motion';
import { useWorkoutDataStore } from '../../store/workoutDataStore';
import { triggerLightImpact } from '../../utils/haptics';
import type { CatalogProgram } from '../../types/workout';
import WorkoutEditorView from './WorkoutEditorView';
import './programLibrary.css';

interface ProgramDetailViewProps {
  program: CatalogProgram;
  onClose: () => void;
  onAdded?: () => void;
}

export default function ProgramDetailView({ program, onClose, onAdded }: ProgramDetailViewProps): JSX.Element {
  const getExerciseById = useWorkoutDataStore((s) => s.getExerciseById);
  const addCatalogProgramToMyPlans = useWorkoutDataStore((s) => s.addCatalogProgramToMyPlans);
  const userPrograms = useWorkoutDataStore((s) => s.userPrograms);

  const [added, setAdded] = useState(() =>
    userPrograms.some((p) => p.id === `myplan-${program.id}`)
  );
  const [editingProgramId, setEditingProgramId] = useState<string | null>(null);

  function handleAdd() {
    addCatalogProgramToMyPlans(program);
    triggerLightImpact();
    setAdded(true);
    onAdded?.();
  }

  if (editingProgramId !== null) {
    return (
      <WorkoutEditorView
        workoutId={editingProgramId}
        workoutName={program.name}
        sourceKind="userProgram"
        isPlanDerived
        onClose={() => setEditingProgramId(null)}
      />
    );
  }

  return (
    <motion.div className="prog-lib-detail" {...pageTransition}>
      <div className="prog-lib-detail__header">
        <button type="button" className="prog-lib-detail__back" aria-label="Back" onClick={onClose}>
          ‹
        </button>
        <span className="prog-lib-detail__title">{program.name}</span>
      </div>

      <p className="prog-lib-detail__desc">{program.description}</p>
      <span className="prog-lib-detail__goal">{program.goal}</span>

      {program.workouts.map((workout, wi) => (
        <div key={wi} className="prog-lib-detail__workout">
          <p className="prog-lib-detail__workout-name">{workout.name}</p>
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
          onClick={() => setEditingProgramId(`myplan-${program.id}`)}
        >
          Edit Program Exercises
        </button>
      )}
    </motion.div>
  );
}
