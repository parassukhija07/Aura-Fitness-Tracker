import { useWorkoutDataStore } from '../../store/workoutDataStore';
import './plan.css';

export default function WorkoutsTab() {
  const getActiveProgram = useWorkoutDataStore((s) => s.getActiveProgram);
  const getExerciseById = useWorkoutDataStore((s) => s.getExerciseById);
  const activeProgram = getActiveProgram();

  if (activeProgram == null || activeProgram.exercises.length === 0) {
    return <div className="plan-empty">No active workout. Select a program first.</div>;
  }

  return (
    <>
      <p className="plan-card__name">{activeProgram.name} — Session</p>
      <div className="plan-list">
        {activeProgram.exercises.map((progEx) => {
          const ex = getExerciseById(progEx.exerciseId);
          return (
            <div key={progEx.exerciseId} className="plan-card">
              <p className="plan-card__name">{ex ? ex.name : progEx.exerciseId}</p>
              <p className="plan-card__sub">{progEx.sets} sets &times; {progEx.repsMin}–{progEx.repsMax} reps</p>
            </div>
          );
        })}
      </div>
    </>
  );
}
