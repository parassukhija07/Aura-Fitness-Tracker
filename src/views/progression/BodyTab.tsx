import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { ResponsiveContainer, AreaChart, Area, XAxis, Tooltip } from 'recharts';
import { useBodyDataStore } from '../../store/bodyDataStore';
import BodyLogModal from './BodyLogModal';
import MeasureHelpModal from './MeasureHelpModal';
import PhotoLibrary from './PhotoLibrary';
import { Button } from '../../design';
import {
  PlusIcon,
  HistoryIcon,
  PhotoIcon,
  InfoIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ChevronLeftIcon,
} from '../../components/icons/AuraIcons';
import type { BodyMeasurement } from '../../types/body';
import { useUnits } from '../../utils/units';

const MEASUREMENT_ROWS: { key: keyof NonNullable<BodyMeasurement['measurements']>; label: string }[] = [
  { key: 'neck', label: 'Neck' },
  { key: 'shoulders', label: 'Shoulders' },
  { key: 'chest', label: 'Chest' },
  { key: 'waist', label: 'Waist' },
  { key: 'hips', label: 'Hips' },
  { key: 'arms', label: 'Arms' },
  { key: 'thighs', label: 'Thighs' },
];

type MeasureKey = keyof NonNullable<BodyMeasurement['measurements']>;

export default function BodyTab() {
  const [modalOpen, setModalOpen] = useState(false);
  const [howToOpen, setHowToOpen] = useState(false);
  const [view, setView] = useState<'main' | 'history' | 'photos' | 'measure'>('main');
  const [measureKey, setMeasureKey] = useState<MeasureKey | 'weight'>('weight');

  const { fmtWeight, fmtLength, weightFromKg, lengthFromCm, weightSuffix, lengthSuffix } = useUnits();
  const logs = useBodyDataStore((s) => s.logs);
  const sortedDesc = [...logs].sort((a, b) => b.date.localeCompare(a.date));
  const sortedAsc = [...logs].sort((a, b) => a.date.localeCompare(b.date));

  const latest = sortedDesc[0];
  const latestWeight = latest?.weightKg;

  // 30-day weight delta
  function weightAround(daysAgo: number): number | undefined {
    if (!latest) return undefined;
    const target = new Date(latest.date + 'T00:00:00');
    target.setDate(target.getDate() - daysAgo);
    // closest log on/before target
    const candidate = sortedDesc.find((l) => new Date(l.date + 'T00:00:00') <= target);
    return candidate?.weightKg;
  }
  const prior = weightAround(30);
  const weightDelta = latestWeight != null && prior != null ? +(latestWeight - prior).toFixed(1) : null;

  const latestBF = sortedDesc.find((l) => l.bodyFatPercentage != null)?.bodyFatPercentage;
  const leanMass =
    latestWeight != null && latestBF != null
      ? +(latestWeight * (1 - latestBF / 100)).toFixed(1)
      : null;

  const chartData = sortedAsc
    .map((log) => ({ date: log.date, value: log.weightKg == null ? null : +weightFromKg(log.weightKg).toFixed(1) }))
    .filter((d): d is { date: string; value: number } => d.value != null);

  // Per-measurement trend data (M1): build a date→value series for any measurement
  // key (or weight), converted to the active display unit.
  function buildMeasureSeries(key: MeasureKey | 'weight') {
    return sortedAsc
      .map((log) => {
        const raw = key === 'weight' ? log.weightKg : log.measurements?.[key];
        if (raw == null) return null;
        const value = key === 'weight' ? +weightFromKg(raw).toFixed(1) : +lengthFromCm(raw).toFixed(1);
        return { date: log.date, value };
      })
      .filter((d): d is { date: string; value: number } => d != null);
  }
  const MEASURE_LABELS: Record<MeasureKey | 'weight', string> = {
    weight: 'Weight', neck: 'Neck', shoulders: 'Shoulders', chest: 'Chest',
    waist: 'Waist', hips: 'Hips', arms: 'Arms', thighs: 'Thighs',
  };

  function latestMeasure(key: keyof NonNullable<BodyMeasurement['measurements']>): number | undefined {
    for (const log of sortedDesc) {
      const v = log.measurements?.[key];
      if (v !== undefined) return v;
    }
    return undefined;
  }

  if (view === 'photos') {
    return (
      <div className="body-tab">
        <button type="button" className="body-subnav" onClick={() => setView('main')}>
          <ChevronLeftIcon size={18} /> Body
        </button>
        <div className="sec-label">Progress Photos</div>
        <PhotoLibrary />
      </div>
    );
  }

  if (view === 'measure') {
    const series = buildMeasureSeries(measureKey);
    const unit = measureKey === 'weight' ? weightSuffix : lengthSuffix;
    const first = series[0]?.value;
    const last = series[series.length - 1]?.value;
    const delta = first != null && last != null ? +(last - first).toFixed(1) : null;
    return (
      <div className="body-tab">
        <button type="button" className="body-subnav" onClick={() => setView('main')}>
          <ChevronLeftIcon size={18} /> Body
        </button>
        <div className="sec-label">{MEASURE_LABELS[measureKey]} Trend</div>
        <div className="card card-pad">
          <div className="body-weight__head">
            <div>
              <div className="body-weight__label">{MEASURE_LABELS[measureKey].toUpperCase()}</div>
              <div className="body-weight__value">
                {last != null ? last : '—'} <span>{unit}</span>
              </div>
            </div>
            {delta != null && delta !== 0 && (
              <span className={`badge ${delta < 0 ? 'badge-green' : 'badge-accent'}`}>
                {delta < 0 ? <ArrowDownIcon size={12} /> : <ArrowUpIcon size={12} />}
                {Math.abs(delta)} {unit} total
              </span>
            )}
          </div>
          {series.length >= 2 ? (
            <div className="body-weight__chart">
              <ResponsiveContainer width="100%" height={140}>
                <AreaChart data={series} margin={{ top: 6, right: 4, bottom: 0, left: 4 }}>
                  <defs>
                    <linearGradient id="measureFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.22} />
                      <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" hide />
                  <Tooltip
                    labelFormatter={(v: unknown) =>
                      new Date(String(v) + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                    }
                    formatter={(v) => [`${v} ${unit}`, MEASURE_LABELS[measureKey]]}
                  />
                  <Area type="monotone" dataKey="value" stroke="var(--accent)" strokeWidth={2.5} fill="url(#measureFill)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="body-weight__hint">Log at least two measurements to see this trend.</p>
          )}
        </div>
      </div>
    );
  }

  if (view === 'history') {
    return (
      <div className="body-tab">
        <button type="button" className="body-subnav" onClick={() => setView('main')}>
          <ChevronLeftIcon size={18} /> Body
        </button>
        <div className="sec-label">Measurement History</div>
        {sortedDesc.length === 0 ? (
          <p className="nutri-warning">No measurements logged yet.</p>
        ) : (
          <div className="list body-history">
            {sortedDesc.map((log) => (
              <div className="row" key={log.id}>
                <div className="row-main">
                  <div className="row-title">
                    {new Date(log.date + 'T00:00:00').toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric', year: 'numeric',
                    })}
                  </div>
                </div>
                <div className="row-val">
                  {log.weightKg != null ? fmtWeight(log.weightKg) : '—'}{log.bodyFatPercentage != null ? ` · ${log.bodyFatPercentage}%` : ''}
                </div>
              </div>
            ))}
          </div>
        )}
        <AnimatePresence>
          {modalOpen && <BodyLogModal onClose={() => setModalOpen(false)} />}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="body-tab">
      {/* Weight card with trend */}
      <div className="card card-pad">
        <div className="body-weight__head">
          <div>
            <button
              type="button"
              className="body-weight__label body-weight__label--btn"
              onClick={() => { setMeasureKey('weight'); setView('measure'); }}
            >WEIGHT ›</button>
            <div className="body-weight__value">
              {latestWeight != null ? fmtWeight(latestWeight, false) : '—'} <span>{weightSuffix}</span>
            </div>
          </div>
          {weightDelta != null && weightDelta !== 0 && (
            <span className={`badge ${weightDelta < 0 ? 'badge-green' : 'badge-accent'}`}>
              {weightDelta < 0 ? <ArrowDownIcon size={12} /> : <ArrowUpIcon size={12} />}
              {fmtWeight(Math.abs(weightDelta))} / 30d
            </span>
          )}
        </div>
        {chartData.length >= 2 ? (
          <div className="body-weight__chart">
            <ResponsiveContainer width="100%" height={90}>
              <AreaChart data={chartData} margin={{ top: 6, right: 4, bottom: 0, left: 4 }}>
                <defs>
                  <linearGradient id="bodyWeightFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.22} />
                    <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" hide />
                <Tooltip
                  labelFormatter={(v: unknown) =>
                    new Date(String(v) + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                  }
                  formatter={(v) => [`${v} ${weightSuffix}`, 'Weight']}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="var(--accent)"
                  strokeWidth={2.5}
                  fill="url(#bodyWeightFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="body-weight__hint">Log a few measurements to see your trend.</p>
        )}
      </div>

      {/* BF / Lean mass tiles */}
      <div className="nutri-tiles" style={{ marginTop: 12 }}>
        <div className="nutri-tile">
          <div className="nutri-tile__label">BODY FAT</div>
          <div className="nutri-tile__value">{latestBF != null ? latestBF : '—'}<span>%</span></div>
        </div>
        <div className="nutri-tile">
          <div className="nutri-tile__label">LEAN MASS</div>
          <div className="nutri-tile__value">{leanMass != null ? fmtWeight(leanMass, false) : '—'}<span>{weightSuffix}</span></div>
        </div>
      </div>

      {/* Measurements list */}
      <div className="body-section-head">
        <h2 className="body-section-head__title">Measurements</h2>
        <button
          type="button"
          className="body-howto-btn"
          aria-label="How to measure"
          onClick={() => setHowToOpen(true)}
        >
          <InfoIcon size={16} />
        </button>
      </div>
      <div className="list">
        {MEASUREMENT_ROWS.map((m) => {
          const val = latestMeasure(m.key);
          const hasTrend = buildMeasureSeries(m.key).length >= 2;
          return (
            <button
              type="button"
              className="row body-measure-row"
              key={m.key}
              disabled={!hasTrend}
              onClick={() => { setMeasureKey(m.key); setView('measure'); }}
              aria-label={hasTrend ? `View ${m.label} trend` : `${m.label} — log more to see trend`}
            >
              <div className="row-main"><div className="row-title">{m.label}</div></div>
              <div className="row-val">
                {val !== undefined ? fmtLength(val) : '—'}
                {hasTrend && <span style={{ marginLeft: 6, opacity: 0.5, color: 'var(--text-2)' }} aria-hidden="true">›</span>}
              </div>
            </button>
          );
        })}
      </div>

      {/* Actions */}
      <div className="body-actions">
        <Button variant="primary" size="md" fullWidth onClick={() => setModalOpen(true)}>
          <PlusIcon size={18} /> Log
        </Button>
        <Button variant="secondary" size="md" fullWidth onClick={() => setView('history')}>
          <HistoryIcon size={17} /> History
        </Button>
      </div>
      <Button variant="tinted" size="lg" fullWidth onClick={() => setView('photos')}>
        <PhotoIcon size={18} /> Progress Photos
      </Button>

      <AnimatePresence>
        {modalOpen && <BodyLogModal onClose={() => setModalOpen(false)} />}
      </AnimatePresence>
      <AnimatePresence>
        {howToOpen && <MeasureHelpModal onClose={() => setHowToOpen(false)} />}
      </AnimatePresence>
    </div>
  );
}
