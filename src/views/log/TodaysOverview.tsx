import { useState } from 'react';
import type { DayWorkout } from './logDates';
import { isSameDay, startOfDay } from './logDates';
import type { WorkoutProgram, CustomWorkout } from '../../types/workout';
import WorkoutPickerSheet from './WorkoutPickerSheet';

interface TodaysOverviewProps {
  activeDate: Date;
  dayWorkout: DayWorkout;
  programName?: string;
  sundayIndex: number;
  programs: WorkoutProgram[];
  userPrograms: WorkoutProgram[];
  userWorkouts: CustomWorkout[];
  onAssignWorkout: (workoutId: string) => void;
  onSetRestDay: () => void;
}

export default function TodaysOverview({
  activeDate,
  dayWorkout,
  programName,
  programs,
  userPrograms,
  userWorkouts,
  onAssignWorkout,
  onSetRestDay,
}: TodaysOverviewProps) {
  const [sheetOpen, setSheetOpen] = useState(false);

  const isActiveDateToday = isSameDay(activeDate, startOfDay(new Date()));
  const heading = isActiveDateToday
    ? "Today's Overview"
    : activeDate.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
      });

  const isWorkoutPlanned = !dayWorkout.isRestDay && !dayWorkout.beforeStart;

  return (
    <div className="log-overview">
      <p className="log-overview__title">{heading}</p>
      {programName && <p className="log-overview__sub">{programName}</p>}

      {dayWorkout.beforeStart ? (
        <div className="log-empty">Your program hasn&apos;t started yet.</div>
      ) : dayWorkout.isRestDay ? (
        <>
          <div className="log-empty">Rest day &mdash; no exercises planned.</div>
          <div className="log-overview__controls">
            <button
              type="button"
              className="log-actions__btn"
              onClick={() => setSheetOpen(true)}
            >
              Add Workout Anyway
            </button>
          </div>
        </>
      ) : (
        <>
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
          <div className="log-overview__controls">
            <button
              type="button"
              className="log-actions__btn"
              onClick={() => setSheetOpen(true)}
            >
              Switch Workout
            </button>
            <button
              type="button"
              className="log-actions__btn"
              onClick={onSetRestDay}
            >
              Mark as Rest Day
            </button>
          </div>
        </>
      )}

      {sheetOpen && (
        <WorkoutPickerSheet
          title={isWorkoutPlanned ? 'Switch Workout' : 'Add Workout'}
          programs={programs}
          userPrograms={userPrograms}
          userWorkouts={userWorkouts}
          onPick={(id) => { onAssignWorkout(id); setSheetOpen(false); }}
          onClose={() => setSheetOpen(false)}
        />
      )}
    </div>
  );
}
