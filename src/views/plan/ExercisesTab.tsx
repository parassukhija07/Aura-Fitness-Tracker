import { useWorkoutDataStore } from '../../store/workoutDataStore';
import './plan.css';

export default function ExercisesTab() {
  const exercises = useWorkoutDataStore((s) => s.exercises);

  if (exercises.length === 0) {
    return <div className="plan-empty">No exercises in catalog.</div>;
  }

  return (
    <div className="plan-grid">
      {exercises.map((ex) => (
        <div key={ex.id} className="plan-card">
          <p className="plan-card__name">{ex.name}</p>
          <p className="plan-card__sub">{ex.muscleGroup}</p>
          <span className="plan-badge">{ex.defaultSets} &times; {ex.defaultRepsMin}–{ex.defaultRepsMax}</span>
        </div>
      ))}
    </div>
  );
}
