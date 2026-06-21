import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { useBodyDataStore } from '../../store/bodyDataStore';
import BodyLogModal from './BodyLogModal';
import MeasureHelpModal from './MeasureHelpModal';
import PhotoLibrary from './PhotoLibrary';
import type { BodyMeasurement } from '../../types/body';

type MetricKey = 'weightKg' | 'bodyFatPercentage' | 'neck' | 'shoulders' | 'chest' | 'waist' | 'hips' | 'arms' | 'thighs';

const METRICS: { key: MetricKey; label: string; unit: string }[] = [
  { key: 'weightKg', label: 'Weight', unit: 'kg' },
  { key: 'bodyFatPercentage', label: 'Body Fat', unit: '%' },
  { key: 'neck', label: 'Neck', unit: 'cm' },
  { key: 'shoulders', label: 'Shoulders', unit: 'cm' },
  { key: 'chest', label: 'Chest', unit: 'cm' },
  { key: 'waist', label: 'Waist', unit: 'cm' },
  { key: 'hips', label: 'Hips', unit: 'cm' },
  { key: 'arms', label: 'Arms', unit: 'cm' },
  { key: 'thighs', label: 'Thighs', unit: 'cm' },
];

function getMetricValue(log: BodyMeasurement, key: MetricKey): number | undefined {
  if (key === 'weightKg') return log.weightKg;
  if (key === 'bodyFatPercentage') return log.bodyFatPercentage;
  return log.measurements?.[key as keyof NonNullable<BodyMeasurement['measurements']>];
}

export default function BodyTab() {
  const [modalOpen, setModalOpen] = useState(false);
  const [howToOpen, setHowToOpen] = useState(false);
  const [view, setView] = useState<'graph' | 'history'>('graph');
  const [metric, setMetric] = useState<MetricKey>('weightKg');

  const logs = useBodyDataStore((s) => s.logs);
  const sortedDesc = [...logs].sort((a, b) => b.date.localeCompare(a.date));
  const sortedAsc = [...logs].sort((a, b) => a.date.localeCompare(b.date));

  const currentMetricMeta = METRICS.find((m) => m.key === metric)!;

  // Build chart data — filter out entries where value is undefined
  const chartData = sortedAsc
    .map((log) => ({ date: log.date, value: getMetricValue(log, metric) }))
    .filter((d): d is { date: string; value: number } => d.value !== undefined);

  // Latest body fat percentage
  const latestBF = sortedDesc.find((l) => l.bodyFatPercentage != null)?.bodyFatPercentage;

  // Latest value per measurement metric (exclude bodyFatPercentage — has its own card)
  const measurementMetrics = METRICS.filter((m) => m.key !== 'bodyFatPercentage');

  function getLatestValue(key: MetricKey): number | undefined {
    for (const log of sortedDesc) {
      const v = getMetricValue(log, key);
      if (v !== undefined) return v;
    }
    return undefined;
  }

  return (
    <div className="body-tab">
      <button type="button" className="body-tab__add" onClick={() => setModalOpen(true)}>
        Log Measurement
      </button>

      {/* View switcher */}
      <div className="prog-tabs">
        <button
          type="button"
          className={`prog-tabs__tab${view === 'graph' ? ' prog-tabs__tab--active' : ''}`}
          onClick={() => setView('graph')}
        >
          Graph
        </button>
        <button
          type="button"
          className={`prog-tabs__tab${view === 'history' ? ' prog-tabs__tab--active' : ''}`}
          onClick={() => setView('history')}
        >
          History
        </button>
      </div>

      {view === 'graph' && (
        <>
          {/* Metric selector */}
          <div className="body-metric-select">
            <select
              className="nutri-select"
              value={metric}
              onChange={(e) => setMetric(e.target.value as MetricKey)}
            >
              {METRICS.map((m) => (
                <option key={m.key} value={m.key}>
                  {m.label} ({m.unit})
                </option>
              ))}
            </select>
          </div>

          {/* Chart */}
          {chartData.length >= 2 ? (
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
                  <YAxis />
                  <Tooltip
                    labelFormatter={(value: unknown) =>
                      new Date(String(value) + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                    }
                  />
                  <Line type="monotone" dataKey="value" stroke="var(--color-primary)" strokeWidth={2} dot />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="prog-empty">Not enough data to graph {currentMetricMeta.label}.</p>
          )}

          {/* Body Fat card */}
          <div className="body-bf-card">
            <span className="body-bf-card__value">
              {latestBF != null ? `${latestBF}%` : '—'}
            </span>
            <span className="body-bf-card__label">Body Fat %</span>
          </div>

          {/* Current Measurements */}
          <div className="body-section-head">
            <h2 className="stats-tab__heading">Current Measurements</h2>
            <button
              type="button"
              className="body-howto-btn"
              aria-label="How to measure"
              onClick={() => setHowToOpen(true)}
            >
              ?
            </button>
          </div>

          <div className="stat-grid">
            {measurementMetrics.map((m) => {
              const val = getLatestValue(m.key);
              return (
                <div className="stat-card" key={m.key}>
                  <span className="stat-card__value">
                    {val !== undefined ? `${val}${m.unit}` : '—'}
                  </span>
                  <span className="stat-card__label">{m.label}</span>
                </div>
              );
            })}
          </div>

          {/* Progress Photos */}
          <h2 className="stats-tab__heading">Progress Photos</h2>
          <PhotoLibrary />
        </>
      )}

      {view === 'history' && (
        sortedDesc.length === 0 ? (
          <p className="prog-empty">No measurements yet.</p>
        ) : (
          <ul className="body-log-list">
            {sortedDesc.map((log) => (
              <li className="body-log-item" key={log.id}>
                <span>{new Date(log.date + 'T00:00:00').toLocaleDateString()}</span>
                <span>{log.weightKg} kg</span>
                {log.bodyFatPercentage != null && <span>{log.bodyFatPercentage}%</span>}
              </li>
            ))}
          </ul>
        )
      )}

      <AnimatePresence>
        {modalOpen && <BodyLogModal onClose={() => setModalOpen(false)} />}
      </AnimatePresence>

      <AnimatePresence>
        {howToOpen && <MeasureHelpModal onClose={() => setHowToOpen(false)} />}
      </AnimatePresence>
    </div>
  );
}
