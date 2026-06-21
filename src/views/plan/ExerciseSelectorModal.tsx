import { useState } from 'react';
import { useWorkoutDataStore } from '../../store/workoutDataStore';
import type { Exercise } from '../../types/workout';
import './workoutBuilder.css';
import { motion } from 'framer-motion';
import { overlayTransition, panelTransition } from '../../utils/motion';

interface ExerciseSelectorModalProps {
  onSelect: (exercise: Exercise) => void;
  onClose: () => void;
}

export default function ExerciseSelectorModal({ onSelect, onClose }: ExerciseSelectorModalProps) {
  const exercises = useWorkoutDataStore((s) => s.exercises);
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();
  const filtered = exercises.filter((e) => e.name.toLowerCase().includes(q) || e.muscleGroup.toLowerCase().includes(q));
  return (
    <motion.div className="exercise-modal__backdrop" role="presentation"
         onClick={(e) => { if (e.target === e.currentTarget) onClose(); }} {...overlayTransition}>
      <motion.div className="exercise-modal__panel" role="dialog" aria-modal="true" aria-label="Select Exercise" {...panelTransition}>
        <header className="exercise-modal__header">
          <input
            type="text" className="exercise-modal__search"
            placeholder="Search exercises" aria-label="Search exercises"
            value={query} onChange={(e) => setQuery(e.target.value)}
          />
          <button type="button" className="exercise-modal__close" aria-label="Close" onClick={onClose}>×</button>
        </header>
        <div className="exercise-modal__list">
          {filtered.length === 0 && <p className="plan-empty">No exercises found.</p>}
          {filtered.map((ex) => (
            <button key={ex.id} type="button" className="exercise-modal__item" onClick={() => onSelect(ex)}>
              <span className="exercise-modal__item-name">{ex.name}</span>
              <span className="exercise-modal__item-muscle">{ex.muscleGroup}</span>
            </button>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
