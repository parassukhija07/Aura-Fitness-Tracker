import { useWorkoutDataStore } from '../../store/workoutDataStore';
import './plan.css';

export default function ProgramsTab() {
  const programs = useWorkoutDataStore((s) => s.programs);

  if (programs.length === 0) {
    return <div className="plan-empty">No programs yet.</div>;
  }

  return (
    <div className="plan-grid">
      {programs.map((program) => (
        <div key={program.id} className="plan-card">
          <p className="plan-card__name">{program.name}</p>
          <p className="plan-card__sub">{program.description}</p>
          <span className="plan-badge">{program.exercises.length} exercises</span>
        </div>
      ))}
    </div>
  );
}
