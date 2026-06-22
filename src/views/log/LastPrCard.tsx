import type { SessionExercise } from '../../types/workout';
import { getLastPr } from './pr';
import { useUnits } from '../../utils/units';

interface Props {
  exercise: SessionExercise;
}

export default function LastPrCard({ exercise }: Props) {
  const { fmtWeight } = useUnits();
  const pr = getLastPr(exercise);

  return (
    <div className="awd-card">
      <div className="awd-card__label">Last PR</div>
      {pr ? (
        <div className="awd-card__value">
          {fmtWeight(pr.weight)} × {pr.reps} reps
        </div>
      ) : (
        <div className="awd-card__empty">No PR logged yet</div>
      )}
    </div>
  );
}
