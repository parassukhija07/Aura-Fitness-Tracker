import { useWorkoutDataStore } from '../../store/workoutDataStore';
import './workoutBuilder.css';
import './plan.css';
import { motion } from 'framer-motion';
import { overlayTransition, panelTransition } from '../../utils/motion';

interface DayAssignmentModalProps {
  dayIndex: number;
  dayLabel: string;
  onClose: () => void;
}

export default function DayAssignmentModal({ dayIndex, dayLabel, onClose }: DayAssignmentModalProps) {
  const programs = useWorkoutDataStore((s) => s.programs);
  const userWorkouts = useWorkoutDataStore((s) => s.userWorkouts);
  const assignWorkoutToDay = useWorkoutDataStore((s) => s.assignWorkoutToDay);

  const options = [
    ...programs.map((p) => ({ id: p.id, name: p.name, kind: 'Program' as const })),
    ...userWorkouts.map((w) => ({ id: w.id, name: w.name, kind: 'Custom' as const })),
  ];

  function handlePick(id: string) { assignWorkoutToDay(dayIndex, id); onClose(); }
  function handleRest()           { assignWorkoutToDay(dayIndex, null); onClose(); }

  return (
    <motion.div className="exercise-modal__backdrop" role="presentation"
         onClick={(e) => { if (e.target === e.currentTarget) onClose(); }} {...overlayTransition}>
      <motion.div className="exercise-modal__panel" role="dialog" aria-modal="true"
           aria-label={`Assign workout to ${dayLabel}`} {...panelTransition}>
        <header className="exercise-modal__header">
          <span className="exercise-modal__item-name">{dayLabel}</span>
          <button type="button" className="exercise-modal__close" aria-label="Close" onClick={onClose}>×</button>
        </header>
        <div className="exercise-modal__list">
          <button type="button" className="exercise-modal__item" onClick={handleRest}>
            <span className="exercise-modal__item-name">Set as Rest Day</span>
          </button>
          {options.length === 0 && <p className="plan-empty">No workouts available.</p>}
          {options.map((o) => (
            <button key={o.id} type="button" className="exercise-modal__item" onClick={() => handlePick(o.id)}>
              <span className="exercise-modal__item-name">{o.name}</span>
              <span className="exercise-modal__item-muscle">{o.kind}</span>
            </button>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
