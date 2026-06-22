import type { SessionExercise } from '../../types/workout';
import { suggestProgression, type ProgressionAction } from './pr';
import { useUnits } from '../../utils/units';

interface Props {
  exercise: SessionExercise;
}

const ACTION_LABEL: Record<ProgressionAction, string> = {
  'increase-load': 'Add load',
  'add-rep': 'Add a rep',
  hold: 'Hold steady',
  deload: 'Deload',
  'first-time': 'Baseline',
};

const ACTION_MOD: Record<ProgressionAction, string> = {
  'increase-load': 'up',
  'add-rep': 'up',
  hold: 'hold',
  deload: 'down',
  'first-time': 'neutral',
};

export default function TargetCard({ exercise }: Props) {
  const { fmtWeight } = useUnits();
  const suggestion = suggestProgression(exercise);
  // A "first-time" suggestion with no baseline weight means we have nothing to
  // go on yet — prompt the user to log a set rather than show a bare rep count.
  const hasTarget =
    suggestion.action !== 'first-time' ? true : suggestion.weight > 0;

  return (
    <div className="awd-card awd-card--target">
      <div className="awd-card__label-row">
        <span className="awd-card__label">Today&apos;s Target</span>
        <span className={`awd-target__badge awd-target__badge--${ACTION_MOD[suggestion.action]}`}>
          {ACTION_LABEL[suggestion.action]}
        </span>
      </div>
      {hasTarget ? (
        <>
          <div className="awd-target__value">
            {suggestion.weight > 0 ? `${fmtWeight(suggestion.weight)} × ${suggestion.reps}` : `${suggestion.reps} reps`}
          </div>
          <div className="awd-target__reason">{suggestion.reason}</div>
        </>
      ) : (
        <div className="awd-card__empty">Log a set to get a target</div>
      )}
    </div>
  );
}
