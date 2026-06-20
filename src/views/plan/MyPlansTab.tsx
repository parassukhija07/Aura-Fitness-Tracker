import { useState } from 'react';
import { useWorkoutDataStore } from '../../store/workoutDataStore';
import DayAssignmentModal from './DayAssignmentModal';
import './plan.css';

const DAY_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function MyPlansTab() {
  const programs = useWorkoutDataStore((s) => s.programs);
  const userWorkouts = useWorkoutDataStore((s) => s.userWorkouts);
  const userPlan = useWorkoutDataStore((s) => s.userPlan);
  const [editingDay, setEditingDay] = useState<number | null>(null);

  function nameForWorkoutId(id: string | null): string {
    if (id == null) return 'Rest Day';
    const prog = programs.find((p) => p.id === id);
    if (prog) return prog.name;
    const custom = userWorkouts.find((w) => w.id === id);
    if (custom) return custom.name;
    return 'Rest Day';
  }

  if (userPlan == null) {
    return <div className="plan-empty">No active plan. Pick a program to get started.</div>;
  }

  const schedule = userPlan.schedule ?? [null, null, null, null, null, null, null];

  return (
    <>
      <div className="schedule-list">
        {DAY_LABELS.map((label, i) => {
          const workoutId = schedule[i] ?? null;
          const isRest = workoutId == null;
          return (
            <button
              key={i}
              type="button"
              className="schedule-day"
              onClick={() => setEditingDay(i)}
              aria-label={`Edit ${label}`}
            >
              <span className="schedule-day__label">{label}</span>
              <span className={isRest ? 'schedule-day__rest' : 'schedule-day__workout'}>
                {nameForWorkoutId(workoutId)}
              </span>
            </button>
          );
        })}
      </div>

      {editingDay != null && (
        <DayAssignmentModal
          dayIndex={editingDay}
          dayLabel={DAY_LABELS[editingDay]}
          onClose={() => setEditingDay(null)}
        />
      )}
    </>
  );
}
