import type { SessionExercise } from '../../types/workout';
import { useWorkoutDataStore } from '../../store/workoutDataStore';
import SetRow from './SetRow';
import { useUnits } from '../../utils/units';
import { useUserPreferencesStore } from '../../store/userPreferencesStore';

interface ExerciseLoggerProps {
  exerciseIndex: number;
  exercise: SessionExercise;
}

export default function ExerciseLogger({ exerciseIndex, exercise }: ExerciseLoggerProps) {
  const addSet = useWorkoutDataStore((s) => s.addSet);
  const deleteSet = useWorkoutDataStore((s) => s.deleteSet);
  const { weightSuffix } = useUnits();
  const repsFirst = useUserPreferencesStore((s) => s.showRepsTimeFirst);

  return (
    <div className="aw-logger">
      <h2 className="aw-logger__title">{exercise.exerciseName}</h2>
      <div className="aw-logger__head">
        <span>Set</span>
        <span>Type</span>
        <span>Prev</span>
        {repsFirst ? (
          <>
            <span>Reps</span>
            <span>{weightSuffix}</span>
          </>
        ) : (
          <>
            <span>{weightSuffix}</span>
            <span>Reps</span>
          </>
        )}
        <span>✓</span>
        <span></span>
      </div>
      {exercise.sets.map((set, index) => (
        <SetRow
          key={index}
          exerciseIndex={exerciseIndex}
          setIndex={index}
          set={set}
          onDelete={() => deleteSet(exerciseIndex, index)}
        />
      ))}
      <button
        type="button"
        className="aw-logger__add"
        onClick={() => addSet(exerciseIndex)}
      >
        Add Set
      </button>
    </div>
  );
}
