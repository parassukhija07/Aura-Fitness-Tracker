import { motion } from 'framer-motion';
import { overlayTransition, panelTransition } from '../../utils/motion';
import { triggerSelection } from '../../utils/haptics';
import type { WorkoutProgram, CustomWorkout } from '../../types/workout';

interface WorkoutPickerSheetProps {
  title: string;
  programs: WorkoutProgram[];
  userPrograms: WorkoutProgram[];
  userWorkouts: CustomWorkout[];
  onPick: (workoutId: string) => void;
  onClose: () => void;
}

export default function WorkoutPickerSheet({
  title,
  programs,
  userPrograms,
  userWorkouts,
  onPick,
  onClose,
}: WorkoutPickerSheetProps): JSX.Element {
  const options = [
    ...programs.map((p) => ({ id: p.id, name: p.name, kind: 'Program' as const })),
    ...userPrograms.map((p) => ({ id: p.id, name: p.name, kind: 'Program' as const })),
    ...userWorkouts.map((w) => ({ id: w.id, name: w.name, kind: 'Custom' as const })),
  ];

  return (
    <motion.div
      className="awd-sheet-backdrop"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      {...overlayTransition}
    >
      <motion.div
        className="awd-sheet"
        role="dialog"
        aria-modal="true"
        {...panelTransition}
      >
        <p className="awd-sheet__title">{title}</p>

        {options.length === 0 ? (
          <p className="log-empty">No workouts available. Create one in the Plan tab.</p>
        ) : (
          options.map((o) => (
            <button
              key={o.id}
              type="button"
              className="awd-sheet__option"
              onClick={() => {
                triggerSelection();
                onPick(o.id);
              }}
            >
              {o.name}
            </button>
          ))
        )}

        <button
          type="button"
          className="awd-sheet__option awd-sheet__option--cancel"
          onClick={onClose}
        >
          Cancel
        </button>
      </motion.div>
    </motion.div>
  );
}
