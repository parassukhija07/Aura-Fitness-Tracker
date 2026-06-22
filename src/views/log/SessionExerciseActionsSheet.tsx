import { motion } from 'framer-motion';
import { panelTransition } from '../../utils/motion';

interface Props {
  open: boolean;
  exerciseIndex: number;
  onSubstitute: () => void;   // opens ExerciseSelectorModal in parent
  onSuperset?: () => void;    // links with the next exercise
  canSuperset?: boolean;
  onAddAfter?: () => void;
  onRemove: () => void;
  onClose: () => void;
}

export default function SessionExerciseActionsSheet({
  open,
  onSubstitute,
  onSuperset,
  canSuperset,
  onAddAfter,
  onRemove,
  onClose,
}: Props) {
  if (!open) return null;

  return (
    <>
      <div className="awd-sheet-backdrop" onClick={onClose} />
      <motion.div className="awd-sheet" {...panelTransition}>
        <div className="awd-sheet__title">Exercise Options</div>
        <button
          type="button"
          className="awd-sheet__option awd-sheet__option--primary"
          onClick={onSubstitute}
        >
          Substitute Exercise
        </button>
        {canSuperset && onSuperset && (
          <button type="button" className="awd-sheet__option" onClick={onSuperset}>
            Create Superset with Next
          </button>
        )}
        {onAddAfter && (
          <button type="button" className="awd-sheet__option" onClick={onAddAfter}>
            Add Exercise After
          </button>
        )}
        <button
          type="button"
          className="awd-sheet__option awd-sheet__option--danger"
          onClick={onRemove}
        >
          Remove Exercise
        </button>
        <button
          type="button"
          className="awd-sheet__option awd-sheet__option--cancel"
          onClick={onClose}
        >
          Cancel
        </button>
      </motion.div>
    </>
  );
}
