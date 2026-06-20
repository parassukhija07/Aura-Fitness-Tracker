import { useStatsDataStore } from '../../store/statsDataStore';
import ConsistencyHeatmap from './ConsistencyHeatmap';
import LifetimeStatsCards from './LifetimeStatsCards';

export default function StatsTab() {
  const completedWorkoutDates = useStatsDataStore((s) => s.completedWorkoutDates);
  const lifetimeStats = useStatsDataStore((s) => s.lifetimeStats);

  return (
    <div className="stats-tab">
      <h2 className="stats-tab__heading">Consistency</h2>
      <ConsistencyHeatmap completedDates={completedWorkoutDates} />
      <h2 className="stats-tab__heading">Lifetime</h2>
      <LifetimeStatsCards stats={lifetimeStats} />
    </div>
  );
}
