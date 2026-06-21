import { useState } from 'react';
import { useWorkoutDataStore } from '../../store/workoutDataStore';
import ProgramBuilderView from './ProgramBuilderView';
import './plan.css';

export default function ProgramsTab() {
  const programs = useWorkoutDataStore((s) => s.programs);
  const userPrograms = useWorkoutDataStore((s) => s.userPrograms);
  const [isBuilding, setIsBuilding] = useState(false);

  if (isBuilding) return <ProgramBuilderView onClose={() => setIsBuilding(false)} />;

  return (
    <>
      <button type="button" className="workout-builder-fab" onClick={() => setIsBuilding(true)}>Create New Program</button>

      {programs.length === 0 && userPrograms.length === 0 ? (
        <div className="plan-empty">No programs yet.</div>
      ) : (
        <div className="plan-grid">
          {programs.map((program) => (
            <div key={program.id} className="plan-card">
              <p className="plan-card__name">{program.name}</p>
              <p className="plan-card__sub">{program.description}</p>
              <span className="plan-badge">{program.exercises.length} exercises</span>
            </div>
          ))}
          {userPrograms.map((program) => (
            <div key={program.id} className="plan-card">
              <p className="plan-card__name">{program.name}</p>
              <p className="plan-card__sub">{program.description}</p>
              <span className="plan-badge">{program.exercises.length} exercises</span>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
