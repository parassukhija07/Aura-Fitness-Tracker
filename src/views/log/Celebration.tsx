import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { overlayTransition } from '../../utils/motion';
import type { CelebrationOutcome } from './pr';

interface Props {
  outcome: CelebrationOutcome;
  onDone: () => void;
}

export default function Celebration({ outcome, onDone }: Props) {
  useEffect(() => {
    const id = setTimeout(onDone, 2500);
    return () => clearTimeout(id);
  }, [onDone]);

  return (
    <motion.div
      className="awd-celebration"
      {...overlayTransition}
      onClick={onDone}
    >
      {outcome.kind === 'pr' && (
        <div className="awd-celebration__pr">
          <motion.div
            className="awd-celebration__badge"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          >
            <span className="awd-celebration__emoji" aria-hidden="true">🎉</span>
            <div className="awd-celebration__pr-text">Personal Record!</div>
            <div className="awd-celebration__pr-stats">
              {outcome.weight}kg × {outcome.reps} reps
            </div>
          </motion.div>
        </div>
      )}
      {outcome.kind === 'extra-reps' && (
        <div className="awd-celebration__message">{outcome.message}</div>
      )}
      {outcome.kind === 'generic' && (
        <div className="awd-celebration__message">{outcome.message}</div>
      )}
      <div className="awd-celebration__hint">Tap to dismiss</div>
    </motion.div>
  );
}
