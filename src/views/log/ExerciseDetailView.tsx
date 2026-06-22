import { useEffect, useRef, useState } from 'react';
import { useWorkoutDataStore } from '../../store/workoutDataStore';
import { useUserPreferencesStore } from '../../store/userPreferencesStore';
import type { SessionExercise } from '../../types/workout';
import { triggerSuccess } from '../../utils/haptics';
import { getEquipment, getTip } from './exerciseMeta';
import { evaluateCelebration } from './pr';
import * as restTimerBus from './restTimerBus';
import SetRow from './SetRow';
import ExerciseVideoCard from './ExerciseVideoCard';
import LastPrCard from './LastPrCard';
import TargetCard from './TargetCard';
import WarmupCard from './WarmupCard';
import CablePulleySelector from './CablePulleySelector';
import SupersetButton from './SupersetButton';
import Celebration from './Celebration';

interface ExerciseDetailViewProps {
  exerciseIndex: number;
  exercise: SessionExercise;
  onComplete: () => void;
}

export default function ExerciseDetailView({
  exerciseIndex,
  exercise,
  onComplete,
}: ExerciseDetailViewProps) {
  const addSet = useWorkoutDataStore((s) => s.addSet);
  const deleteSet = useWorkoutDataStore((s) => s.deleteSet);
  const updateSetNote = useWorkoutDataStore((s) => s.updateSetNote);
  const stripEmptySets = useWorkoutDataStore((s) => s.stripEmptySets);
  const startInterExerciseRest = useWorkoutDataStore((s) => s.startInterExerciseRest);
  const showPrsDuringWorkout = useUserPreferencesStore((s) => s.showPrsDuringWorkout);

  const [celebration, setCelebration] = useState<ReturnType<typeof evaluateCelebration> | null>(null);
  const [expandedNotes, setExpandedNotes] = useState<Record<number, boolean>>({});

  // Track completed count to detect increments (for rest timer trigger)
  const prevCompletedRef = useRef<number>(
    exercise.sets.filter((s) => s.completed).length
  );

  const completedCount = exercise.sets.filter((s) => s.completed).length;

  useEffect(() => {
    const prev = prevCompletedRef.current;
    if (completedCount > prev) {
      // A set was just completed — start rest timer only for non-final planned sets
      const isLastPlannedSet = completedCount === exercise.defaultSets && completedCount === exercise.sets.length;
      if (!isLastPlannedSet) {
        restTimerBus.start(90);
      }
    }
    prevCompletedRef.current = completedCount;
  }, [completedCount, exercise.defaultSets, exercise.sets.length]);

  const handleAddSet = () => {
    addSet(exerciseIndex);
    // After adding: if new count exceeds defaultSets, start rest timer (extra set)
    const newCount = exercise.sets.length + 1;
    if (newCount > exercise.defaultSets) {
      restTimerBus.start(90);
    }
  };

  const handleCompleteExercise = () => {
    stripEmptySets(exerciseIndex);
    const outcome = evaluateCelebration(exercise);
    if (outcome.kind === 'pr') {
      triggerSuccess();
    }
    setCelebration(outcome);
    startInterExerciseRest();
    // onComplete is called after celebration dismisses
  };

  const handleCelebrationDone = () => {
    setCelebration(null);
    onComplete();
  };

  const equipment = getEquipment(exercise.exerciseId);
  const isCable = equipment === 'Cable';
  const tip = getTip(exercise.muscleGroup);

  const totalSets = exercise.sets.length;

  return (
    <div className="awd-detail">
      {/* Header */}
      <div className="awd-detail__header">
        <div className="awd-detail__name">{exercise.exerciseName}</div>
        <span className="log-badge">{exercise.muscleGroup}</span>
      </div>

      {/* Video card */}
      <ExerciseVideoCard exerciseName={exercise.exerciseName} />

      {/* Info cards */}
      <div className="awd-detail__cards">
        {showPrsDuringWorkout && <LastPrCard exercise={exercise} />}
        <TargetCard exercise={exercise} />
      </div>

      <WarmupCard exerciseIndex={exerciseIndex} />

      {/* Tip card */}
      <div className="awd-card awd-card--tip">
        <div className="awd-card__label">Coach Tip</div>
        <div className="awd-card__tip-text">{tip}</div>
      </div>

      {/* Cable pulley selector (only for cable exercises) */}
      {isCable && <CablePulleySelector exerciseIndex={exerciseIndex} />}

      {/* Progress bar */}
      <div className="awd-progress">
        <div className="awd-progress__label">
          {completedCount}/{totalSets} sets completed
        </div>
        <div className="awd-progress__track">
          <div
            className="awd-progress__fill"
            style={{ width: totalSets > 0 ? `${(completedCount / totalSets) * 100}%` : '0%' }}
          />
        </div>
      </div>

      {/* Set table */}
      <div className="aw-logger">
        <div className="aw-logger__head">
          <span>#</span>
          <span>Type</span>
          <span>Prev</span>
          <span>Weight</span>
          <span>Reps</span>
          <span></span>
          <span></span>
        </div>

        {exercise.sets.map((set, setIndex) => (
          <div key={setIndex}>
            <SetRow
              exerciseIndex={exerciseIndex}
              setIndex={setIndex}
              set={set}
              onDelete={() => deleteSet(exerciseIndex, setIndex)}
            />
            {/* Per-set note button + collapsible textarea */}
            <div className="awd-set-note">
              <button
                type="button"
                className="awd-set-note__toggle"
                onClick={() =>
                  setExpandedNotes((prev) => ({ ...prev, [setIndex]: !prev[setIndex] }))
                }
              >
                {expandedNotes[setIndex] ? 'Hide note' : set.note ? 'Edit note' : '+ Note'}
              </button>
              {expandedNotes[setIndex] && (
                <textarea
                  className="awd-set-note__input"
                  placeholder="Add a note for this set…"
                  value={set.note ?? ''}
                  onChange={(e) => updateSetNote(exerciseIndex, setIndex, e.target.value)}
                  rows={2}
                />
              )}
            </div>
          </div>
        ))}

        <button type="button" className="aw-logger__add" onClick={handleAddSet}>
          + Add Set
        </button>
      </div>

      {/* Superset */}
      <SupersetButton currentIndex={exerciseIndex} />

      {/* Complete Exercise button */}
      <button
        type="button"
        className="awd-complete-btn"
        onClick={handleCompleteExercise}
      >
        Complete Exercise
      </button>

      {/* Celebration overlay */}
      {celebration && (
        <Celebration outcome={celebration} onDone={handleCelebrationDone} />
      )}
    </div>
  );
}
