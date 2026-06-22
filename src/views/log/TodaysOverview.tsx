import { useState } from 'react';
import type { DayWorkout } from './logDates';
import type { WorkoutProgram, CustomWorkout } from '../../types/workout';
import WorkoutPickerSheet from './WorkoutPickerSheet';
import { SourcePickerSheet } from './SourcePickerSheet';
import { ManageTodaySheet } from './ManageTodaySheet';
import LogPastWorkoutSheet from './LogPastWorkoutSheet';
import {
  MoonIcon,
  EllipsisIcon,
  SparkleIcon,
  PlayIcon,
  HistoryIcon,
  ChevronRightIcon,
} from '../../components/icons/AuraIcons';
import { Button } from '../../design';

interface TodaysOverviewProps {
  activeDate: Date;
  dayWorkout: DayWorkout;
  programName?: string;
  /** Display name for the day's planned workout (e.g. "Push Day A"). */
  workoutName?: string;
  /** Whether a session can be started (active program present). */
  canStart?: boolean;
  sundayIndex: number;
  programs: WorkoutProgram[];
  userPrograms: WorkoutProgram[];
  userWorkouts: CustomWorkout[];
  onAssignWorkout: (workoutId: string) => void;
  onSetRestDay: () => void;
  onStartWorkout?: () => void;
}

const MAX_VISIBLE = 3;
const MINUTES_PER_SET = 3.2;

function estimateMinutes(totalSets: number): number {
  return Math.max(10, Math.round((totalSets * MINUTES_PER_SET) / 5) * 5);
}

export default function TodaysOverview({
  activeDate,
  dayWorkout,
  programName,
  workoutName,
  canStart = true,
  programs,
  userPrograms,
  userWorkouts,
  onAssignWorkout,
  onSetRestDay,
  onStartWorkout,
}: TodaysOverviewProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sourcePickerOpen, setSourcePickerOpen] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
  const [logPastOpen, setLogPastOpen] = useState(false);

  const isWorkoutPlanned = !dayWorkout.isRestDay && !dayWorkout.beforeStart && dayWorkout.exercises.length > 0;
  const visibleExercises = dayWorkout.exercises.slice(0, MAX_VISIBLE);
  const hiddenCount = dayWorkout.exercises.length - MAX_VISIBLE;

  const totalSets = dayWorkout.exercises.reduce((sum, ex) => sum + ex.sets, 0);
  const muscles = Array.from(new Set(dayWorkout.exercises.map((ex) => ex.muscleGroup).filter((m) => m && m !== '—')));
  const metaParts = [
    `${dayWorkout.exercises.length} exercise${dayWorkout.exercises.length === 1 ? '' : 's'}`,
    `~${estimateMinutes(totalSets)} min`,
  ];
  if (muscles.length) metaParts.push(muscles.join(', '));

  return (
    <div className="log-overview">
      {programName && (
        <div className="log-overview__program-badge">
          <SparkleIcon size={13} />
          {programName}
        </div>
      )}

      {dayWorkout.beforeStart ? (
        <div className="log-card log-card--dashed">
          <div className="log-empty__title">Program hasn&apos;t started yet</div>
          <div className="log-empty__sub">Check back on the start date.</div>
        </div>
      ) : dayWorkout.isRestDay ? (
        <>
          <div className="log-rest-card">
            <div className="log-rest-card__icon">
              <MoonIcon size={30} />
            </div>
            <div className="log-rest-card__title">Rest Day</div>
            <div className="log-rest-card__sub">
              Recovery is where the gains happen. Nothing scheduled today.
            </div>
          </div>
          <div className="sec-label">Did you train anyway?</div>
          <Button variant="tinted" size="lg" fullWidth onClick={() => setSourcePickerOpen(true)}>
            Add a Workout
          </Button>
          <button
            type="button"
            className="log-convert-row"
            onClick={() => setSourcePickerOpen(true)}
          >
            <span className="log-convert-row__label">Convert to training day</span>
            <ChevronRightIcon size={18} />
          </button>
        </>
      ) : dayWorkout.exercises.length === 0 ? (
        <>
          <div className="log-card log-card--dashed">
            <div className="log-empty__icon">
              <PlayIcon size={26} />
            </div>
            <div className="log-empty__title">Nothing planned</div>
            <div className="log-empty__sub">
              No workout scheduled. Start something fresh or log a session you already did.
            </div>
          </div>
          <div className="log-actions">
            <Button variant="primary" size="lg" fullWidth onClick={() => setSourcePickerOpen(true)}>
              Add a Workout
            </Button>
            <Button variant="secondary" size="lg" fullWidth onClick={() => setLogPastOpen(true)}>
              <HistoryIcon size={17} /> Log a Past Workout
            </Button>
          </div>
        </>
      ) : (
        <>
          <div className="log-card log-card--padded">
            <div className="log-card__top">
              <div className="log-card__top-text">
                <div className="log-card__name">{workoutName ?? "Today's Workout"}</div>
                <div className="log-card__meta">{metaParts.join(' · ')}</div>
              </div>
              <button
                className="icon-btn icon-btn--round"
                aria-label="Manage today"
                onClick={() => setManageOpen(true)}
              >
                <EllipsisIcon size={20} />
              </button>
            </div>
            <div className="log-card__divider" />
            <div className="log-card__exercises">
              {visibleExercises.map((ex, idx) => (
                <div key={ex.exerciseId} className="log-exercise">
                  <span className="log-exercise__num">{idx + 1}</span>
                  <div className="log-exercise__body">
                    <div className="log-exercise__name">{ex.name}</div>
                    <div className="log-exercise__meta">
                      {ex.sets} sets · {ex.repsMin}–{ex.repsMax} reps
                    </div>
                  </div>
                  <ChevronRightIcon size={18} />
                </div>
              ))}
              {hiddenCount > 0 && (
                <div className="log-more">+ {hiddenCount} more exercise{hiddenCount === 1 ? '' : 's'}</div>
              )}
            </div>
          </div>
          <div className="log-actions">
            <Button
              variant="primary"
              size="lg"
              fullWidth
              disabled={!canStart}
              onClick={() => onStartWorkout?.()}
            >
              <PlayIcon size={18} /> Start Workout
            </Button>
            <div className="log-actions__row">
              <Button variant="secondary" size="md" fullWidth onClick={() => setLogPastOpen(true)}>
                <HistoryIcon size={17} /> Log past
              </Button>
              <Button variant="secondary" size="md" fullWidth onClick={() => setSourcePickerOpen(true)}>
                Switch
              </Button>
            </div>
          </div>
        </>
      )}

      <SourcePickerSheet
        open={sourcePickerOpen}
        onClose={() => setSourcePickerOpen(false)}
        onFromProgram={() => { setSourcePickerOpen(false); setSheetOpen(true); }}
        onSavedWorkout={() => { setSourcePickerOpen(false); setSheetOpen(true); }}
        onBuildFromLibrary={() => { setSourcePickerOpen(false); setSheetOpen(true); }}
        onEmpty={() => { setSourcePickerOpen(false); setSheetOpen(true); }}
      />
      <ManageTodaySheet
        open={manageOpen}
        onClose={() => setManageOpen(false)}
        onSwitch={() => { setManageOpen(false); setSourcePickerOpen(true); }}
        onMakeRestDay={() => { setManageOpen(false); onSetRestDay?.(); }}
        onRemove={() => { setManageOpen(false); onSetRestDay?.(); }}
      />
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
      <LogPastWorkoutSheet
        open={logPastOpen}
        date={activeDate}
        onClose={() => setLogPastOpen(false)}
      />
    </div>
  );
}
