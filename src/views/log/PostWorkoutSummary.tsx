import { motion } from 'framer-motion';
import { useWorkoutDataStore } from '../../store/workoutDataStore';
import { overlayTransition } from '../../utils/motion';
import { formatElapsed } from './formatElapsed';
import { evaluateCelebration } from './pr';

interface Props {
  onSave: () => void;
}

export default function PostWorkoutSummary({ onSave }: Props) {
  const activeSession = useWorkoutDataStore((s) => s.activeSession);
  const endSession = useWorkoutDataStore((s) => s.endSession);
  const setSessionNotes = useWorkoutDataStore((s) => s.setSessionNotes);

  if (!activeSession) return null;

  const duration = formatElapsed(activeSession.elapsedTime);

  const totalVolume = activeSession.exercises.reduce((acc, ex) => {
    return acc + ex.sets
      .filter((s) => s.completed)
      .reduce((setAcc, s) => setAcc + s.weight * s.reps, 0);
  }, 0);

  const prsHit = activeSession.exercises.filter(
    (ex) => evaluateCelebration(ex).kind === 'pr'
  ).length;

  const handleSave = () => {
    endSession();
    onSave();
  };

  return (
    <motion.div className="awd-summary" {...overlayTransition}>
      <div className="awd-summary__panel">
        <div className="awd-summary__title">Workout Complete</div>

        <div className="awd-summary__stats">
          <div className="awd-summary__stat">
            <div className="awd-summary__stat-value">{duration}</div>
            <div className="awd-summary__stat-label">Duration</div>
          </div>
          <div className="awd-summary__stat">
            <div className="awd-summary__stat-value">{Math.round(totalVolume)}kg</div>
            <div className="awd-summary__stat-label">Total Volume</div>
          </div>
          <div className="awd-summary__stat">
            <div className="awd-summary__stat-value">{prsHit}</div>
            <div className="awd-summary__stat-label">PRs Hit</div>
          </div>
        </div>

        <label className="awd-summary__notes-label" htmlFor="session-notes">
          Session Notes
        </label>
        <textarea
          id="session-notes"
          className="awd-summary__notes"
          placeholder="How did the session feel?"
          value={activeSession.sessionNotes ?? ''}
          onChange={(e) => setSessionNotes(e.target.value)}
          rows={3}
        />

        <button type="button" className="awd-summary__save" onClick={handleSave}>
          Save Workout
        </button>
      </div>
    </motion.div>
  );
}
