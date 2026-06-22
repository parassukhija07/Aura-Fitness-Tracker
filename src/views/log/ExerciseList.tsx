import { useState } from 'react';
import type { SessionExercise } from '../../types/workout';
import { useWorkoutDataStore } from '../../store/workoutDataStore';
import { Button } from '../../design';
import {
  GripIcon,
  CheckIcon,
  PlusIcon,
} from '../../components/icons/AuraIcons';

interface ExerciseListProps {
  exercises: SessionExercise[];
  programName?: string;
  onSelect: (index: number) => void;
  onExerciseActions?: (index: number) => void;
  onFinish?: () => void;
  onAddExercise?: () => void;
}

export default function ExerciseList({
  exercises,
  programName,
  onSelect,
  onExerciseActions,
  onFinish,
  onAddExercise,
}: ExerciseListProps) {
  const getExerciseById = useWorkoutDataStore((s) => s.getExerciseById);
  const reorderSessionExercise = useWorkoutDataStore((s) => s.reorderSessionExercise);

  // Drag-to-reorder state
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const [didDrag, setDidDrag] = useState(false);

  const totalSets = exercises.reduce((a, e) => a + e.sets.length, 0);
  const doneSets = exercises.reduce((a, e) => a + e.sets.filter((s) => s.completed).length, 0);
  const overallPct = totalSets ? (doneSets / totalSets) * 100 : 0;

  return (
    <>
      {/* Progress bar */}
      <div className="aw-progress">
        <div className="aw-progress__row">
          <span className="aw-progress__count">{doneSets}/{totalSets} sets</span>
          {programName && <span className="aw-progress__program">{programName}</span>}
        </div>
        <div className="aw-progress__track">
          <span className="aw-progress__fill" style={{ width: `${overallPct}%` }} />
        </div>
      </div>

      {/* Exercise cards */}
      <div className="aw-cards">
        {exercises.map((ex, index) => {
          const completedCount = ex.sets.filter((s) => s.completed).length;
          const allDone = ex.sets.length > 0 && completedCount === ex.sets.length;
          const meta = getExerciseById(ex.exerciseId);
          const repRange =
            meta != null ? `${meta.defaultRepsMin}–${meta.defaultRepsMax} reps` : `${ex.muscleGroup}`;
          const equipment = meta?.equipment ?? ex.muscleGroup;
          const pct = ex.sets.length ? (completedCount / ex.sets.length) * 100 : 0;

          let cardClass = 'aw-card';
          if (allDone) cardClass += ' aw-card--done';
          if (dragIndex === index) cardClass += ' aw-card--dragging';
          if (overIndex === index && dragIndex !== null && dragIndex !== index) cardClass += ' aw-card--drop-target';

          return (
            <button
              key={ex.exerciseId + '-' + index}
              type="button"
              className={cardClass}
              draggable
              onClick={() => {
                if (didDrag) { setDidDrag(false); return; }
                onSelect(index);
              }}
              onDragStart={(e) => {
                setDragIndex(index);
                setDidDrag(true);
                e.dataTransfer.effectAllowed = 'move';
              }}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                if (overIndex !== index) setOverIndex(index);
              }}
              onDrop={(e) => {
                e.preventDefault();
                if (dragIndex !== null && dragIndex !== index) {
                  reorderSessionExercise(dragIndex, index);
                }
                setDragIndex(null);
                setOverIndex(null);
              }}
              onDragEnd={() => {
                setDragIndex(null);
                setOverIndex(null);
              }}
            >
              <span className="aw-card__grip" aria-hidden="true"><GripIcon size={18} /></span>
              <span className="aw-card__body">
                <span className="aw-card__top">
                  <span className="aw-card__name">{ex.exerciseName}</span>
                  {allDone && (
                    <span className="aw-card__check"><CheckIcon size={16} /></span>
                  )}
                </span>
                <span className="aw-card__meta">
                  {ex.sets.length} sets · {repRange} · {equipment}
                  {ex.supersetGroupId && <span className="aw-list__ss-badge">Superset</span>}
                </span>
                <span className="aw-card__bar">
                  <span className="aw-card__bar-fill" style={{ width: `${pct}%` }} />
                </span>
              </span>
              <button
                type="button"
                className="aw-card__menu"
                aria-label={`More options for ${ex.exerciseName}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onExerciseActions?.(index);
                }}
              >
                ⋯
              </button>
            </button>
          );
        })}
      </div>

      <div className="aw-overview-actions">
        <Button variant="tinted" size="lg" fullWidth onClick={() => onAddExercise?.()}>
          <PlusIcon size={18} /> Add Exercise
        </Button>
        {onFinish && (
          <Button variant="primary" size="lg" fullWidth onClick={onFinish}>
            <CheckIcon size={18} /> Finish Workout
          </Button>
        )}
      </div>
    </>
  );
}
