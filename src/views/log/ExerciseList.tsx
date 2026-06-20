import type { SessionExercise } from '../../types/workout';

interface ExerciseListProps {
  exercises: SessionExercise[];
  onSelect: (index: number) => void;
}

export default function ExerciseList({ exercises, onSelect }: ExerciseListProps) {
  return (
    <div className="aw-list">
      {exercises.map((ex, index) => {
        const completedCount = ex.sets.filter((s) => s.completed).length;
        return (
          <div
            key={ex.exerciseId + '-' + index}
            className="aw-list__row"
            onClick={() => onSelect(index)}
          >
            <div className="log-exercise__info">
              <span className="log-exercise__name">{ex.exerciseName}</span>
              <span className="log-exercise__meta">
                {completedCount}/{ex.sets.length} sets done
              </span>
            </div>
            <span className="log-badge">{ex.muscleGroup}</span>
          </div>
        );
      })}
    </div>
  );
}
