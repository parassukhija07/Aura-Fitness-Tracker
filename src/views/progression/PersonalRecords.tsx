import type { CompletedSession } from '../../store/statsDataStore';
import { getPersonalRecords, groupPersonalRecords } from './statsDerivations';

interface Props {
  sessions: CompletedSession[];
}

export default function PersonalRecords({ sessions }: Props) {
  const groups = groupPersonalRecords(getPersonalRecords(sessions));

  if (groups.length === 0) {
    return <p className="stats-empty">No personal records yet.</p>;
  }

  return (
    <>
      {groups.map((group) => (
        <div className="pr-group" key={group.muscleGroup}>
          <h3 className="pr-group__title">{group.muscleGroup}</h3>
          <div className="pr-grid">
            {group.records.map((r) => (
              <div className="pr-card" key={r.exerciseId}>
                <span className="pr-card__name">{r.exerciseName}</span>
                <span className="pr-card__value">{r.bestWeight}kg × {r.bestReps}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </>
  );
}
