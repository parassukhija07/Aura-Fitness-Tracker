import { useState } from 'react';
import type { DayWorkout } from './logDates';
import { isSameDay, startOfDay } from './logDates';
import type { WorkoutProgram, CustomWorkout } from '../../types/workout';
import WorkoutPickerSheet from './WorkoutPickerSheet';
import { MoonIcon } from '../../components/icons/AuraIcons';
import { Button } from '../../design';

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

const MAX_VISIBLE = 4;

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
    ? 'TODAY'
    : activeDate.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
      }).toUpperCase();

  const isWorkoutPlanned = !dayWorkout.isRestDay && !dayWorkout.beforeStart;
  const visibleExercises = dayWorkout.exercises.slice(0, MAX_VISIBLE);
  const hiddenCount = dayWorkout.exercises.length - MAX_VISIBLE;

  return (
    <div className="log-overview">
      <p className="log-overview__title">{heading}</p>
      {programName && (
        <div className="log-overview__program-badge">{programName}</div>
      )}

      {dayWorkout.beforeStart ? (
        <div className="log-card log-card--dashed">
          <div className="log-empty__title">Program hasn't started yet</div>
          <div className="log-empty__sub">Check back on the start date.</div>
        </div>
      ) : dayWorkout.isRestDay ? (
        <>
          <div className="log-rest-card">
            <div className="log-rest-card__icon">
              <MoonIcon size={32} />
            </div>
            <div className="log-rest-card__title">Rest Day</div>
            <div className="log-rest-card__sub">Recovery is part of the plan.</div>
          </div>
          <div className="log-overview__controls">
            <Button variant="tinted" size="md" fullWidth onClick={() => setSheetOpen(true)}>
              Add a Workout
            </Button>
          </div>
        </>
      ) : dayWorkout.exercises.length === 0 ? (
        <>
          <div className="log-card log-card--dashed">
            <div className="log-empty__title">No workout planned</div>
            <div className="log-empty__sub">Add a workout to get started.</div>
          </div>
          <div className="log-overview__controls">
            <Button variant="tinted" size="md" fullWidth onClick={() => setSheetOpen(true)}>
              Add a Workout
            </Button>
          </div>
        </>
      ) : (
        <>
          <div className="log-card">
            <div className="log-card__header">
              <div className="log-card__name">Today&apos;s Workout</div>
              <div className="log-card__meta">
                {dayWorkout.exercises.length} exercises
              </div>
            </div>
            {visibleExercises.map((ex, idx) => (
              <div key={ex.exerciseId} className="log-exercise">
                <div className="log-exercise__info">
                  <span className="log-exercise__num">{idx + 1}</span>
                  <div>
                    <div className="log-exercise__name">{ex.name}</div>
                    <div className="log-exercise__meta">
                      {ex.sets} sets &middot; {ex.repsMin}–{ex.repsMax} reps
                    </div>
                  </div>
                </div>
                <span className="log-badge">{ex.muscleGroup}</span>
              </div>
            ))}
            {hiddenCount > 0 && (
              <div className="log-more">+{hiddenCount} more exercises</div>
            )}
          </div>
          <div className="log-overview__controls">
            <Button variant="secondary" size="md" fullWidth onClick={() => setSheetOpen(true)}>
              Switch
            </Button>
            <Button variant="secondary" size="md" fullWidth onClick={onSetRestDay}>
              Rest Day
            </Button>
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
