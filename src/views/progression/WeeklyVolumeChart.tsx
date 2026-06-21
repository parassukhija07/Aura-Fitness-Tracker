import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import type { CompletedSession } from '../../store/statsDataStore';
import { getWeeklyMuscleVolume } from './statsDerivations';

interface Props {
  sessions: CompletedSession[];
}

export default function WeeklyVolumeChart({ sessions }: Props) {
  const data = getWeeklyMuscleVolume(sessions);

  if (data.every((d) => d.volume === 0)) {
    return <p className="stats-empty">No volume logged this week yet.</p>;
  }

  return (
    <div className="stats-chart">
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
          <XAxis
            dataKey="muscleGroup"
            tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }}
            axisLine={false}
            tickLine={false}
            width={40}
          />
          <Tooltip cursor={{ fill: 'var(--color-border)' }} />
          <Bar dataKey="volume" radius={[4, 4, 0, 0]}>
            {data.map((d) => (
              <Cell key={d.muscleGroup} fill="var(--color-primary)" />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
