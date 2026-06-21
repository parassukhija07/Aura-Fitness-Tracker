import { useWorkoutDataStore } from '../../store/workoutDataStore';
import type { CablePulley } from '../../types/workout';

interface Props {
  exerciseIndex: number;
}

const OPTIONS: CablePulley[] = ['single', 'double'];

export default function CablePulleySelector({ exerciseIndex }: Props) {
  const cablePulley = useWorkoutDataStore(
    (s) => s.activeSession?.exercises[exerciseIndex]?.cablePulley
  );
  const setCablePulley = useWorkoutDataStore((s) => s.setCablePulley);

  const active = cablePulley ?? 'single';

  return (
    <div className="awd-cable">
      <div className="awd-card__label">Cable Pulley</div>
      <div className="awd-cable__toggle">
        {OPTIONS.map((opt) => (
          <button
            key={opt}
            type="button"
            className={`awd-cable__option${active === opt ? ' awd-cable__option--active' : ''}`}
            onClick={() => setCablePulley(exerciseIndex, opt)}
          >
            {opt === 'single' ? 'Single' : 'Double'}
          </button>
        ))}
      </div>
    </div>
  );
}
