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
      <div className="stats-tab__head-row">
        <h2 className="stats-tab__title">Consistency</h2>
      </div>
      <ConsistencyHeatmap completedDates={completedWorkoutDates} />
      <div className="sec-label">This week · muscle focus</div>
      <WeeklyVolumeChart sessions={completedSessions} />
      <div className="sec-label">Lifetime</div>
      <LifetimeStatsCards stats={lifetimeStats} />
      <div className="sec-label">Personal Records</div>
      <PersonalRecords sessions={completedSessions} />
    </div>
  );
}
