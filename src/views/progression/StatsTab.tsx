import { useStatsDataStore } from '../../store/statsDataStore';
import ConsistencyHeatmap from './ConsistencyHeatmap';
import LifetimeStatsCards from './LifetimeStatsCards';
import WeeklyVolumeChart from './WeeklyVolumeChart';
import PersonalRecords from './PersonalRecords';

export default function StatsTab() {
  const completedWorkoutDates = useStatsDataStore((s) => s.completedWorkoutDates);
  const lifetimeStats = useStatsDataStore((s) => s.lifetimeStats);
  const completedSessions = useStatsDataStore((s) => s.completedSessions);

  return (
    <div className="stats-tab">
      <h2 className="stats-tab__heading">Consistency</h2>
      <ConsistencyHeatmap completedDates={completedWorkoutDates} />
      <h2 className="stats-tab__heading">This Week</h2>
      <WeeklyVolumeChart sessions={completedSessions} />
      <h2 className="stats-tab__heading">Lifetime</h2>
      <LifetimeStatsCards stats={lifetimeStats} />
      <h2 className="stats-tab__heading">Personal Records</h2>
      <PersonalRecords sessions={completedSessions} />
    </div>
  );
}
