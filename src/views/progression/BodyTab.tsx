import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { useBodyDataStore } from '../../store/bodyDataStore';
import BodyLogModal from './BodyLogModal';

export default function BodyTab() {
  const [modalOpen, setModalOpen] = useState(false);
  const logs = useBodyDataStore((s) => s.logs);
  const sorted = [...logs].sort((a, b) => b.date.localeCompare(a.date));
  // Chart needs chronological (ascending) order; `sorted` is descending for the list.
  const chartData = [...logs]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((log) => ({ date: log.date, weightKg: log.weightKg }));

  return (
    <div className="body-tab">
      <button type="button" className="body-tab__add" onClick={() => setModalOpen(true)}>
        Log Measurement
      </button>

      {logs.length >= 2 && (
        <div className="body-tab__chart">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData} margin={{ top: 8, right: 16, bottom: 8, left: -8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border, #333)" />
              <XAxis
                dataKey="date"
                tickFormatter={(value: string) =>
                  new Date(value + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                }
              />
              <YAxis dataKey="weightKg" />
              <Tooltip
                labelFormatter={(value: unknown) =>
                  new Date(String(value) + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                }
              />
              <Line type="monotone" dataKey="weightKg" stroke="var(--color-primary)" strokeWidth={2} dot />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {sorted.length === 0 ? (
        <p className="prog-empty">No measurements yet.</p>
      ) : (
        <ul className="body-log-list">
          {sorted.map((log) => (
            <li className="body-log-item" key={log.id}>
              <span>{new Date(log.date + 'T00:00:00').toLocaleDateString()}</span>
              <span>{log.weightKg} kg</span>
              {log.bodyFatPercentage != null && <span>{log.bodyFatPercentage}%</span>}
            </li>
          ))}
        </ul>
      )}

      <AnimatePresence>
        {modalOpen && <BodyLogModal onClose={() => setModalOpen(false)} />}
      </AnimatePresence>
    </div>
  );
}
