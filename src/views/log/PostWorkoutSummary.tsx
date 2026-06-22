import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useWorkoutDataStore } from '../../store/workoutDataStore';
import { overlayTransition } from '../../utils/motion';
import { formatElapsed } from './formatElapsed';
import { isExercisePrAgainstHistory } from './pr';
import { triggerSuccess } from '../../utils/haptics';
import { useUnits } from '../../utils/units';

interface Props {
  onSave: () => void;
}

export default function PostWorkoutSummary({ onSave }: Props) {
  const activeSession = useWorkoutDataStore((s) => s.activeSession);
  const endSession = useWorkoutDataStore((s) => s.endSession);
  const setSessionNotes = useWorkoutDataStore((s) => s.setSessionNotes);
  const { fmtWeight } = useUnits();

  if (!activeSession) return null;

  const duration = formatElapsed(activeSession.elapsedTime);

  const totalVolume = activeSession.exercises.reduce((acc, ex) => {
    return acc + ex.sets
      .filter((s) => s.completed)
      .reduce((setAcc, s) => setAcc + s.weight * s.reps, 0);
  }, 0);

  const prsHit = activeSession.exercises.filter(
    (ex) => isExercisePrAgainstHistory(ex)
  ).length;

  // Gap E: trigger haptic + show celebration banner on mount when PRs were hit
  useEffect(() => {
    if (prsHit > 0) {
      triggerSuccess();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSave = () => {
    endSession();
    onSave();
  };

  return (
    <motion.div className="awd-summary" {...overlayTransition}>
      <div className="awd-summary__panel">
        {prsHit > 0 && (
          <div className="awd-summary__celebration" role="status" aria-live="polite">
            <span className="awd-summary__celebration-icon" aria-hidden="true">🏆</span>
            <div>
              <strong>{prsHit} Personal Record{prsHit > 1 ? 's' : ''} Hit!</strong>
              <div style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 2 }}>
                Outstanding performance today — keep crushing it!
              </div>
            </div>
          </div>
        )}
        <div className="awd-summary__title">Workout Complete</div>

        <div className="awd-summary__stats">
          <div className="awd-summary__stat">
            <div className="awd-summary__stat-value">{duration}</div>
            <div className="awd-summary__stat-label">Duration</div>
          </div>
          <div className="awd-summary__stat">
            <div className="awd-summary__stat-value">{fmtWeight(Math.round(totalVolume))}</div>
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
