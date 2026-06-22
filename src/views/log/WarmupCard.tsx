import { useWorkoutDataStore } from '../../store/workoutDataStore';
import { getWarmupSets, getLastPr } from './pr';
import { useUnits } from '../../utils/units';

interface Props {
  exerciseIndex: number;
}

export default function WarmupCard({ exerciseIndex }: Props) {
  const exercise = useWorkoutDataStore(
    (s) => s.activeSession?.exercises[exerciseIndex]
  );
  const { fmtWeight } = useUnits();

  if (!exercise) return null;

  // Working weight: first non-zero entered set weight, else last PR weight, else 0
  const firstNonZero = exercise.sets.find((s) => s.weight > 0)?.weight ?? 0;
  const prWeight = getLastPr(exercise)?.weight ?? 0;
  const workingWeight = firstNonZero > 0 ? firstNonZero : prWeight;

  const sets = getWarmupSets(exerciseIndex, workingWeight);
  if (sets.length === 0) return null;

  return (
    <div className="awd-card">
      <div className="awd-card__label">Warm-up Sets</div>
      <div className="awd-warmup">
        {sets.map((s, i) => (
          <div key={i} className="awd-warmup__row">
            <span className="awd-warmup__pct">{Math.round(s.pct * 100)}%</span>
            <span className="awd-warmup__weight">
              {workingWeight === 0 ? '—' : fmtWeight(s.weight)}
            </span>
            <span className="awd-warmup__reps">× {s.reps}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
