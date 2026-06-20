import { useState } from 'react';
import { useWorkoutDataStore } from '../../store/workoutDataStore';
import WorkoutBuilderView from './WorkoutBuilderView';
import './plan.css';

export default function WorkoutsTab() {
  const [isBuilding, setIsBuilding] = useState(false);
  const getActiveProgram = useWorkoutDataStore((s) => s.getActiveProgram);
  const getExerciseById = useWorkoutDataStore((s) => s.getExerciseById);
  const userWorkouts = useWorkoutDataStore((s) => s.userWorkouts);
  const activeProgram = getActiveProgram();

  if (isBuilding) {
    return <WorkoutBuilderView onClose={() => setIsBuilding(false)} />;
  }

  return (
    <>
      <button type="button" className="workout-builder-fab" onClick={() => setIsBuilding(true)}>Create Workout</button>

      {userWorkouts.length > 0 && (
        <div className="plan-list">
          {userWorkouts.map((w) => (
            <div key={w.id} className="plan-card">
              <p className="plan-card__name">{w.name}</p>
              <p className="plan-card__sub">{w.exercises.length} exercise{w.exercises.length !== 1 ? 's' : ''}</p>
            </div>
          ))}
        </div>
      )}

      {activeProgram != null && activeProgram.exercises.length > 0 && (
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
      )}
    </>
  );
}
