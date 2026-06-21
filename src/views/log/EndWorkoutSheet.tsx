import { motion } from 'framer-motion';
import { useWorkoutDataStore } from '../../store/workoutDataStore';
import { panelTransition } from '../../utils/motion';

interface Props {
  onEndEarly: () => void;
  onCancel: () => void;
  onClose: () => void;
}

export default function EndWorkoutSheet({ onEndEarly, onCancel, onClose }: Props) {
  const endSession = useWorkoutDataStore((s) => s.endSession);

  const handleCancelWorkout = () => {
    if (window.confirm('Discard this workout? All logged sets will be lost.')) {
      endSession();
      onCancel();
    }
  };

  return (
    <>
      <div className="awd-sheet-backdrop" onClick={onClose} />
      <motion.div className="awd-sheet" {...panelTransition}>
        <div className="awd-sheet__title">End Workout</div>
        <button type="button" className="awd-sheet__option awd-sheet__option--primary" onClick={onEndEarly}>
          End Early &amp; Save
        </button>
        <button type="button" className="awd-sheet__option awd-sheet__option--danger" onClick={handleCancelWorkout}>
          Cancel Workout
        </button>
        <button type="button" className="awd-sheet__option" onClick={onClose}>
          Keep Going
        </button>
      </motion.div>
    </>
  );
}
