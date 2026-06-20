import type { DayWorkout } from './logDates';
import { isSameDay, startOfDay } from './logDates';

interface TodaysOverviewProps {
  activeDate: Date;
  dayWorkout: DayWorkout;
  programName?: string;
}

export default function TodaysOverview({
  activeDate,
  dayWorkout,
  programName,
}: TodaysOverviewProps) {
  const isActiveDateToday = isSameDay(activeDate, startOfDay(new Date()));
  const heading = isActiveDateToday
    ? "Today's Overview"
    : activeDate.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
      });

  return (
    <div className="log-overview">
      <p className="log-overview__title">{heading}</p>
      {programName && <p className="log-overview__sub">{programName}</p>}

      {dayWorkout.beforeStart ? (
        <div className="log-empty">Your program hasn&apos;t started yet.</div>
      ) : dayWorkout.isRestDay ? (
        <div className="log-empty">Rest day &mdash; no exercises planned.</div>
      ) : (
        <div className="log-card">
          {dayWorkout.exercises.map((ex) => (
            <div key={ex.exerciseId} className="log-exercise">
              <div className="log-exercise__info">
                <span className="log-exercise__name">{ex.name}</span>
                <span className="log-exercise__meta">
                  {ex.sets} sets &middot; {ex.repsMin}&ndash;{ex.repsMax} reps
                </span>
              </div>
              <span className="log-badge">{ex.muscleGroup}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
