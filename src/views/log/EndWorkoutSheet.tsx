import { motion } from 'framer-motion';
import { useWorkoutDataStore } from '../../store/workoutDataStore';
import { panelTransition } from '../../utils/motion';

interface Props {
  onEndEarly: () => void;
  onCancel?: () => void;  // kept for backwards compatibility; use onClose instead
  onDiscard: () => void;  // "Discard" — clear session and navigate away
  onClose: () => void;
}

export default function EndWorkoutSheet({ onEndEarly, onDiscard, onClose }: Props) {
  const cancelSession = useWorkoutDataStore((s) => s.cancelSession);

  const handleDiscard = () => {
    cancelSession();
    onDiscard();
  };

  return (
    <>
      <div className="awd-sheet-backdrop" onClick={onClose} />
      <motion.div className="awd-sheet" {...panelTransition}>
        <div className="awd-sheet__title">End Workout</div>
        <button type="button" className="awd-sheet__option awd-sheet__option--primary" onClick={onEndEarly}>
          End Early &amp; Save
        </button>
        <button type="button" className="awd-sheet__option awd-sheet__option--danger" onClick={handleDiscard}>
          Discard Workout
        </button>
        <button type="button" className="awd-sheet__option" onClick={onClose}>
          Continue Workout
        </button>
      </motion.div>
    </>
  );
}
