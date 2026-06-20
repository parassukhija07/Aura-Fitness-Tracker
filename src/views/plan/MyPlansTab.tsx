import { useWorkoutDataStore } from '../../store/workoutDataStore';
import './plan.css';

function formatStartDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function MyPlansTab() {
  const userPlan = useWorkoutDataStore((s) => s.userPlan);
  const getActiveProgram = useWorkoutDataStore((s) => s.getActiveProgram);
  const activeProgram = getActiveProgram();

  if (userPlan == null || activeProgram == null) {
    return <div className="plan-empty">No active plan. Pick a program to get started.</div>;
  }

  return (
    <div className="plan-card">
      <p className="plan-card__name">{activeProgram.name}</p>
      <p className="plan-card__sub">{activeProgram.description}</p>
      <div className="plan-progress">
        <span>Week {userPlan.currentWeek} · Day {userPlan.currentDay} of 7</span>
        <br />
        <span>Started {formatStartDate(userPlan.startDate)}</span>
        <div className="plan-progress__bar">
          <div
            className="plan-progress__fill"
            style={{ width: `${(userPlan.currentDay / 7) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
