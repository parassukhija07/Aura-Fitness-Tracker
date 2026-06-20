import type { DayExercise } from './logDates';
import type { WorkoutProgram, SessionExercise, MuscleGroup } from '../../types/workout';
import { useWorkoutDataStore } from '../../store/workoutDataStore';

interface LogActionsProps {
  isRestDay: boolean;
  hasPlan: boolean;
  dayExercises: DayExercise[];
  activeProgram: WorkoutProgram | undefined;
}

export default function LogActions({ isRestDay, hasPlan, dayExercises, activeProgram }: LogActionsProps) {
  const startSession = useWorkoutDataStore((s) => s.startSession);

  const handleStart = () => {
    if (!activeProgram) return;
    const sessionExercises: SessionExercise[] = dayExercises.map((ex) => ({
      exerciseId: ex.exerciseId,
      exerciseName: ex.name,
      muscleGroup: ex.muscleGroup as MuscleGroup,
      defaultSets: ex.sets,
      sets: [{ reps: 0, weight: 0, setType: 'Normal', completed: false }],
    }));
    startSession(activeProgram, sessionExercises);
  };

  return (
    <div className="log-actions">
      <button
        type="button"
        className="log-actions__btn log-actions__btn--primary"
        disabled={isRestDay || !hasPlan}
        onClick={handleStart}
      >
        Start Workout
      </button>
      <button
        type="button"
        className="log-actions__btn"
        onClick={() => console.log('[Log] Log Past Workout')}
      >
        Log Past Workout
      </button>
      <button
        type="button"
        className="log-actions__btn"
        onClick={() => console.log('[Log] Rest Day')}
      >
        Rest Day
      </button>
    </div>
  );
}
