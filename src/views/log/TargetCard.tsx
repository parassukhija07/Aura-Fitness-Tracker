import type { SessionExercise } from '../../types/workout';
import { getTodaysTarget } from './pr';

interface Props {
  exercise: SessionExercise;
}

export default function TargetCard({ exercise }: Props) {
  const target = getTodaysTarget(exercise);

  return (
    <div className="awd-card">
      <div className="awd-card__label">Today's Target</div>
      {target ? (
        <div className="awd-card__targets">
          <span className="awd-card__target-option">
            +Weight: {target.plusWeight.weight}kg × {target.plusWeight.reps}
          </span>
          <span className="awd-card__target-sep"> or </span>
          <span className="awd-card__target-option">
            +Rep: {target.plusRep.weight}kg × {target.plusRep.reps}
          </span>
        </div>
      ) : (
        <div className="awd-card__empty">Log a set to get a target</div>
      )}
    </div>
  );
}
