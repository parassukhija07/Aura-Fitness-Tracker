import { useEffect, useState } from 'react';
import { useWorkoutDataStore } from '../../store/workoutDataStore';
import DayAssignmentModal from './DayAssignmentModal';
import WorkoutEditorView from './WorkoutEditorView';
import { Button } from '../../design';
import {
  PlusIcon,
  CheckIcon,
  ChevronRightIcon,
} from '../../components/icons/AuraIcons';
import './plan.css';

const DAY_SHORT = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

interface MyPlansTabProps {
  createSignal?: number;
}

export default function MyPlansTab({ createSignal }: MyPlansTabProps) {
  const programs = useWorkoutDataStore((s) => s.programs);
  const userPrograms = useWorkoutDataStore((s) => s.userPrograms);
  const userWorkouts = useWorkoutDataStore((s) => s.userWorkouts);
  const userPlan = useWorkoutDataStore((s) => s.userPlan);
  const getActiveProgram = useWorkoutDataStore((s) => s.getActiveProgram);
  const getExerciseById = useWorkoutDataStore((s) => s.getExerciseById);
  const setActiveProgram = useWorkoutDataStore((s) => s.setActiveProgram);
  const [editingDay, setEditingDay] = useState<number | null>(null);
  const [editingWorkout, setEditingWorkout] = useState<{ id: string; name: string } | null>(null);

  const activeProgram = getActiveProgram();
  const activeProgramId = userPlan?.activeProgramId ?? '';

  // My Plans = all userPrograms (myplan- prefixed ones are catalog-adds; user-created ones are also shown)
  const MAX_PLANS = 3;
  const myPlans = userPrograms.slice(0, MAX_PLANS);
  const atLimit = userPrograms.length >= MAX_PLANS;

  // The header "+" opens the day assignment for the first unassigned day (or Sunday).
  useEffect(() => {
    if (createSignal == null || createSignal === 0) return;
    const schedule = userPlan?.schedule ?? [];
    const firstEmpty = schedule.findIndex((s) => s == null);
    setEditingDay(firstEmpty >= 0 ? firstEmpty : 0);
  }, [createSignal]); // eslint-disable-line react-hooks/exhaustive-deps

  function resolveWorkout(id: string | null): { name: string; meta: string | null } | null {
    if (id == null) return null;
    const prog = programs.find((p) => p.id === id) ?? userPrograms.find((p) => p.id === id);
    if (prog) {
      const muscles = Array.from(
        new Set(
          prog.exercises
            .map((pe) => getExerciseById(pe.exerciseId)?.muscleGroup)
            .filter((m): m is NonNullable<typeof m> => Boolean(m)),
        ),
      ).slice(0, 2);
      const n = prog.exercises.length;
      return {
        name: prog.name,
        meta: `${n} exercise${n === 1 ? '' : 's'}${muscles.length ? ` · ${muscles.join(', ')}` : ''}`,
      };
    }
    const custom = userWorkouts.find((w) => w.id === id);
    if (custom) {
      const n = custom.exercises.length;
      return { name: custom.name, meta: `${n} exercise${n === 1 ? '' : 's'}` };
    }
    return null;
  }

  if (editingWorkout !== null) {
    return (
      <WorkoutEditorView
        workoutId={editingWorkout.id}
        workoutName={editingWorkout.name}
        sourceKind={editingWorkout.id.startsWith('myplan-') ? 'userProgram' : 'userWorkout'}
        isPlanDerived={editingWorkout.id.startsWith('myplan-')}
        onClose={() => setEditingWorkout(null)}
      />
    );
  }

  if (userPlan == null) {
    return <div className="plan-empty">No active plan. Pick a program to get started.</div>;
  }

  const schedule = userPlan.schedule ?? [null, null, null, null, null, null, null];

  return (
    <>
      {/* Horizontal plan cards — up to 3 */}
      <div className="my-plans-scroll">
        {myPlans.map((plan) => {
          const isDefault = plan.id === activeProgramId;
          return (
            <div key={plan.id} className={`my-plan-card${isDefault ? ' my-plan-card--active' : ''}`}>
              {isDefault && (
                <span className="my-plan-card__default-badge">
                  <CheckIcon size={11} /> Default
                </span>
              )}
              <div className="my-plan-card__name">{plan.name}</div>
              <div className="my-plan-card__sub">{plan.exercises.length} exercises</div>
              {!isDefault && (
                <button
                  type="button"
                  className="my-plan-card__set-default"
                  onClick={() => setActiveProgram(plan.id)}
                >
                  Set as Default
                </button>
              )}
            </div>
          );
        })}
        <button
          type="button"
          className="my-plan-card my-plan-card--dashed"
          onClick={() => !atLimit && setEditingDay(0)}
          disabled={atLimit}
          title={atLimit ? 'Maximum 3 plans reached' : 'Add a plan'}
        >
          <PlusIcon size={22} />
          <span className="my-plan-card__add-label">{atLimit ? 'Max 3 plans' : 'Add plan'}</span>
        </button>
      </div>

      {/* This week schedule */}
      <div className="sec-label plan-sec-label">
        This week{activeProgram ? ` · ${activeProgram.name}` : ''}
      </div>
      <div className="wday-list">
        {DAY_SHORT.map((label, i) => {
          const fullLabel = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][i];
          const workoutId = schedule[i] ?? null;
          const resolved = resolveWorkout(workoutId);
          return (
            <div key={i} className="wday-wrapper">
              <button
                type="button"
                className="wday"
                onClick={() => setEditingDay(i)}
                aria-label={`Edit ${fullLabel}`}
              >
                <div className={`wday-d${resolved ? ' wday-d--has' : ''}`}>
                  <span>{label}</span>
                </div>
                {resolved ? (
                  <span className="wday__body">
                    <span className="wday__name">{resolved.name}</span>
                    {resolved.meta && <span className="wday__meta">{resolved.meta}</span>}
                  </span>
                ) : (
                  <span className="wday__body">
                    <span className="wday__name wday__name--rest">Rest Day</span>
                  </span>
                )}
                {resolved ? (
                  <span className="wday__chev"><ChevronRightIcon size={18} /></span>
                ) : (
                  <span className="wday__assign">Assign</span>
                )}
              </button>
              {resolved && workoutId && (
                <button
                  type="button"
                  className="wday__edit-btn"
                  onClick={() => setEditingWorkout({ id: workoutId, name: resolved.name })}
                  aria-label={`Edit ${resolved.name} workout`}
                >
                  Edit
                </button>
              )}
            </div>
          );
        })}
      </div>

      <Button variant="tinted" size="lg" fullWidth onClick={() => setEditingDay(0)}>
        <PlusIcon size={18} /> Create Custom Plan
      </Button>

      {editingDay != null && (
        <DayAssignmentModal
          dayIndex={editingDay}
          dayLabel={['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][editingDay]}
          onClose={() => setEditingDay(null)}
        />
      )}
    </>
  );
}
