import { useState } from 'react';
import { motion } from 'framer-motion';
import { overlayTransition, panelTransition } from '../../utils/motion';
import { useBodyDataStore } from '../../store/bodyDataStore';
import { triggerSuccess } from '../../utils/haptics';
import type { BodyMeasurement } from '../../types/body';

interface BodyLogModalProps {
  onClose: () => void;
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

export default function BodyLogModal({ onClose }: BodyLogModalProps) {
  const addLog = useBodyDataStore((s) => s.addLog);
  const [date, setDate] = useState(todayISO());
  const [weight, setWeight] = useState('');
  const [bodyFat, setBodyFat] = useState('');
  const [showMeasurements, setShowMeasurements] = useState(false);
  const [neck, setNeck] = useState('');
  const [shoulders, setShoulders] = useState('');
  const [chest, setChest] = useState('');
  const [waist, setWaist] = useState('');
  const [hips, setHips] = useState('');
  const [arms, setArms] = useState('');
  const [thighs, setThighs] = useState('');

  const weightNum = parseFloat(weight);
  const canSave = date.length > 0 && !Number.isNaN(weightNum) && weightNum > 0;

  function handleSave() {
    if (!canSave) return;
    const num = (v: string) => {
      const n = parseFloat(v);
      return Number.isNaN(n) ? undefined : n;
    };
    const measurements: NonNullable<BodyMeasurement['measurements']> = {};
    if (num(neck) !== undefined) measurements.neck = num(neck);
    if (num(shoulders) !== undefined) measurements.shoulders = num(shoulders);
    if (num(chest) !== undefined) measurements.chest = num(chest);
    if (num(waist) !== undefined) measurements.waist = num(waist);
    if (num(hips) !== undefined) measurements.hips = num(hips);
    if (num(arms) !== undefined) measurements.arms = num(arms);
    if (num(thighs) !== undefined) measurements.thighs = num(thighs);

    const log: Omit<BodyMeasurement, 'id'> = {
      date,
      weightKg: weightNum,
      ...(num(bodyFat) !== undefined ? { bodyFatPercentage: num(bodyFat) } : {}),
      ...(Object.keys(measurements).length > 0 ? { measurements } : {}),
    };
    addLog(log);
    triggerSuccess();
    onClose();
  }

  return (
    <motion.div className="body-modal__backdrop" role="presentation"
         onClick={(e) => { if (e.target === e.currentTarget) onClose(); }} {...overlayTransition}>
      <motion.div className="body-modal__panel" role="dialog" aria-modal="true" aria-label="Log Measurement" {...panelTransition}>
        <header className="body-modal__header">
          <h2 className="body-modal__title">Log Measurement</h2>
          <button type="button" className="body-modal__close" aria-label="Close" onClick={onClose}>×</button>
        </header>

        <div className="body-modal__body">
          <label className="body-modal__field">
            <span className="body-modal__label">Date</span>
            <input type="date" className="body-modal__input" value={date} onChange={(e) => setDate(e.target.value)} />
          </label>

          <label className="body-modal__field">
            <span className="body-modal__label">Weight (kg)</span>
            <input type="number" inputMode="decimal" className="body-modal__input"
                   value={weight} onChange={(e) => setWeight(e.target.value)} />
          </label>

          <label className="body-modal__field">
            <span className="body-modal__label">Body Fat % (optional)</span>
            <input type="number" inputMode="decimal" className="body-modal__input"
                   value={bodyFat} onChange={(e) => setBodyFat(e.target.value)} />
          </label>

          <button type="button" className="body-modal__collapse-toggle"
                  aria-expanded={showMeasurements}
                  onClick={() => setShowMeasurements((v) => !v)}>
            {showMeasurements ? '▾ Measurements' : '▸ Measurements'}
          </button>

          {showMeasurements && (
            <div className="body-modal__collapse">
              <label className="body-modal__field">
                <span className="body-modal__label">Neck (cm)</span>
                <input type="number" inputMode="decimal" className="body-modal__input" value={neck} onChange={(e) => setNeck(e.target.value)} />
              </label>
              <label className="body-modal__field">
                <span className="body-modal__label">Shoulders (cm)</span>
                <input type="number" inputMode="decimal" className="body-modal__input" value={shoulders} onChange={(e) => setShoulders(e.target.value)} />
              </label>
              <label className="body-modal__field">
                <span className="body-modal__label">Chest (cm)</span>
                <input type="number" inputMode="decimal" className="body-modal__input" value={chest} onChange={(e) => setChest(e.target.value)} />
              </label>
              <label className="body-modal__field">
                <span className="body-modal__label">Waist (cm)</span>
                <input type="number" inputMode="decimal" className="body-modal__input" value={waist} onChange={(e) => setWaist(e.target.value)} />
              </label>
              <label className="body-modal__field">
                <span className="body-modal__label">Hips (cm)</span>
                <input type="number" inputMode="decimal" className="body-modal__input" value={hips} onChange={(e) => setHips(e.target.value)} />
              </label>
              <label className="body-modal__field">
                <span className="body-modal__label">Arms (cm)</span>
                <input type="number" inputMode="decimal" className="body-modal__input" value={arms} onChange={(e) => setArms(e.target.value)} />
              </label>
              <label className="body-modal__field">
                <span className="body-modal__label">Thighs (cm)</span>
                <input type="number" inputMode="decimal" className="body-modal__input" value={thighs} onChange={(e) => setThighs(e.target.value)} />
              </label>
            </div>
          )}
        </div>

        <footer className="body-modal__footer">
          <button type="button" className="body-modal__save" disabled={!canSave} onClick={handleSave}>Save</button>
        </footer>
      </motion.div>
    </motion.div>
  );
}
