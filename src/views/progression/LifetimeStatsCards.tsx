import type { LifetimeStats } from '../../store/statsDataStore';
import { useUnits } from '../../utils/units';

interface Props {
  stats: LifetimeStats;
}

export default function LifetimeStatsCards({ stats }: Props) {
  const { weightFromKg, weightSuffix } = useUnits();
  const volumeDisplay = Math.round(weightFromKg(stats.totalVolumeKg)).toLocaleString('en-US');
  const cards = [
    { label: 'Total Sessions', value: stats.totalSessions.toLocaleString('en-US') },
    { label: 'Total Sets', value: stats.totalSets.toLocaleString('en-US') },
    { label: 'Total Volume', value: `${volumeDisplay} ${weightSuffix}` },
    { label: 'Total PRs', value: stats.totalPRs.toLocaleString('en-US') },
  ];

  return (
    <div className="stat-grid">
      {cards.map((c) => (
        <div key={c.label} className="stat-card">
          <span className="stat-card__value">{c.value}</span>
          <span className="stat-card__label">{c.label}</span>
        </div>
      ))}
    </div>
  );
}
