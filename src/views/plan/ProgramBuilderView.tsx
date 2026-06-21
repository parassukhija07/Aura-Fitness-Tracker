import { useState } from 'react';
import { useWorkoutDataStore } from '../../store/workoutDataStore';
import WorkoutBuilderModal from './WorkoutBuilderModal';
import { motion } from 'framer-motion';
import { pageTransition } from '../../utils/motion';
import { triggerLightImpact } from '../../utils/haptics';
import './workoutBuilder.css';
import './plan.css';

interface ProgramBuilderViewProps {
  onClose: () => void;
}

export default function ProgramBuilderView({ onClose }: ProgramBuilderViewProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [programId, setProgramId] = useState<string | null>(null);
  const [isWorkoutModalOpen, setIsWorkoutModalOpen] = useState(false);

  const createProgram = useWorkoutDataStore((s) => s.createProgram);
  const addWorkoutToProgram = useWorkoutDataStore((s) => s.addWorkoutToProgram);
  const setActiveProgram = useWorkoutDataStore((s) => s.setActiveProgram);
  const updateActiveSchedule = useWorkoutDataStore((s) => s.updateActiveSchedule);
  const userPrograms = useWorkoutDataStore((s) => s.userPrograms);

  const currentProgram = userPrograms.find((p) => p.id === programId);
  const exercises = currentProgram?.exercises ?? [];

  function handleSaveProgram() {
    if (name.trim() === '') return;
    if (programId !== null) {
      triggerLightImpact();
      return;
    }
    const id = createProgram(name, description);
    if (id === '') return;
    setProgramId(id);
    triggerLightImpact();
  }

  function handleAddWorkout() {
    if (programId === null) {
      if (name.trim() === '') return;
      const id = createProgram(name, description);
      if (id === '') return;
      setProgramId(id);
      setIsWorkoutModalOpen(true);
    } else {
      setIsWorkoutModalOpen(true);
    }
  }

  function handleWorkoutDone(workoutId: string) {
    if (programId) addWorkoutToProgram(programId, workoutId);
    setIsWorkoutModalOpen(false);
  }

  function handleSetActive() {
    if (!programId || exercises.length === 0) return;
    setActiveProgram(programId);
    updateActiveSchedule([null, programId, null, programId, null, programId, null]);
    triggerLightImpact();
    onClose();
  }

  return (
    <motion.div className="workout-builder" {...pageTransition}>
      <header className="workout-builder__header">
        <button type="button" className="workout-builder__back" aria-label="Cancel" onClick={onClose}>‹</button>
        <input
          type="text"
          className="workout-builder__name-input"
          placeholder="Program Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </header>

      <input
        type="text"
        className="workout-builder__name-input"
        placeholder="Description (optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        style={{ margin: '0 16px 8px', width: 'calc(100% - 32px)' }}
      />

      <div className="workout-builder__list">
        {exercises.length === 0 && (
          <p className="plan-empty">No workouts added yet. Add a workout to get started.</p>
        )}
        {exercises.map((ex, i) => (
          <div key={`${ex.exerciseId}-${i}`} className="workout-builder__exercise">
            <span className="workout-builder__exercise-name">{ex.exerciseId}</span>
            <span className="workout-builder__inputs">
              {ex.sets} sets · {ex.repsMin}–{ex.repsMax} reps
            </span>
          </div>
        ))}
      </div>

      <button type="button" className="workout-builder__add-btn" onClick={handleAddWorkout}>+ Add Workout</button>
      <button
        type="button"
        className="workout-builder__save-btn"
        disabled={name.trim() === ''}
        onClick={handleSaveProgram}
      >
        {programId ? 'Program Saved' : 'Create Program'}
      </button>
      <button
        type="button"
        className="workout-builder__save-btn"
        disabled={!programId || exercises.length === 0}
        onClick={handleSetActive}
        style={{ marginTop: 8 }}
      >
        Set as Active Program
      </button>

      {isWorkoutModalOpen && (
        <WorkoutBuilderModal
          onComplete={handleWorkoutDone}
          onClose={() => setIsWorkoutModalOpen(false)}
        />
      )}
    </motion.div>
  );
}
