import type { CompletedSession } from '../../store/statsDataStore';
import { getWeeklyMuscleVolume } from './statsDerivations';
import { useUnits } from '../../utils/units';

interface Props {
  sessions: CompletedSession[];
}

/**
 * "This week · muscle focus" — horizontal bars of relative training volume
 * per muscle group (PROG-01). Bars are normalized to the busiest group.
 */
export default function WeeklyVolumeChart({ sessions }: Props) {
  const { weightFromKg, weightSuffix } = useUnits();
  const data = getWeeklyMuscleVolume(sessions);

  if (data.every((d) => d.volume === 0)) {
    return <p className="stats-empty">No volume logged this week yet.</p>;
  }

  const ranked = [...data]
    .filter((d) => d.volume > 0)
    .sort((a, b) => b.volume - a.volume);
  const max = ranked[0]?.volume ?? 1;

  return (
    <div className="card card-pad muscle-focus">
      {ranked.map((d) => (
        <div key={d.muscleGroup} className="mbar-row">
          <div className="mbar-lab">{d.muscleGroup}</div>
          <div className="mbar">
            <i style={{ width: `${Math.max(6, (d.volume / max) * 100)}%` }} />
          </div>
          <div className="mbar-pct">{Math.round(weightFromKg(d.volume)).toLocaleString('en-US')}</div>
        </div>
      ))}
      <div className="muscle-focus__caption">volume ({weightSuffix}) per muscle group</div>
    </div>
  );
}
