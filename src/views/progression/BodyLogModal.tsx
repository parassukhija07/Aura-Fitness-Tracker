import { useState } from 'react';
import { motion } from 'framer-motion';
import { overlayTransition, panelTransition } from '../../utils/motion';
import { useBodyDataStore } from '../../store/bodyDataStore';
import { triggerSuccess } from '../../utils/haptics';
import type { BodyMeasurement } from '../../types/body';
import { useUnits } from '../../utils/units';

interface BodyLogModalProps {
  onClose: () => void;
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

export default function BodyLogModal({ onClose }: BodyLogModalProps) {
  const addLog = useBodyDataStore((s) => s.addLog);
  const { weightToKg, lengthToCm, weightSuffix, lengthSuffix } = useUnits();
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
    // Inputs are in the user's display unit; convert lengths to cm and weight to kg.
    const len = (v: string) => {
      const n = parseFloat(v);
      return Number.isNaN(n) ? undefined : +lengthToCm(n).toFixed(2);
    };
    const measurements: NonNullable<BodyMeasurement['measurements']> = {};
    if (len(neck) !== undefined) measurements.neck = len(neck);
    if (len(shoulders) !== undefined) measurements.shoulders = len(shoulders);
    if (len(chest) !== undefined) measurements.chest = len(chest);
    if (len(waist) !== undefined) measurements.waist = len(waist);
    if (len(hips) !== undefined) measurements.hips = len(hips);
    if (len(arms) !== undefined) measurements.arms = len(arms);
    if (len(thighs) !== undefined) measurements.thighs = len(thighs);

    const bfNum = parseFloat(bodyFat);
    const log: Omit<BodyMeasurement, 'id'> = {
      date,
      weightKg: +weightToKg(weightNum).toFixed(2),
      ...(!Number.isNaN(bfNum) ? { bodyFatPercentage: bfNum } : {}),
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
            <span className="body-modal__label">Weight ({weightSuffix})</span>
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
                <span className="body-modal__label">Neck ({lengthSuffix})</span>
                <input type="number" inputMode="decimal" className="body-modal__input" value={neck} onChange={(e) => setNeck(e.target.value)} />
              </label>
              <label className="body-modal__field">
                <span className="body-modal__label">Shoulders ({lengthSuffix})</span>
                <input type="number" inputMode="decimal" className="body-modal__input" value={shoulders} onChange={(e) => setShoulders(e.target.value)} />
              </label>
              <label className="body-modal__field">
                <span className="body-modal__label">Chest ({lengthSuffix})</span>
                <input type="number" inputMode="decimal" className="body-modal__input" value={chest} onChange={(e) => setChest(e.target.value)} />
              </label>
              <label className="body-modal__field">
                <span className="body-modal__label">Waist ({lengthSuffix})</span>
                <input type="number" inputMode="decimal" className="body-modal__input" value={waist} onChange={(e) => setWaist(e.target.value)} />
              </label>
              <label className="body-modal__field">
                <span className="body-modal__label">Hips ({lengthSuffix})</span>
                <input type="number" inputMode="decimal" className="body-modal__input" value={hips} onChange={(e) => setHips(e.target.value)} />
              </label>
              <label className="body-modal__field">
                <span className="body-modal__label">Arms ({lengthSuffix})</span>
                <input type="number" inputMode="decimal" className="body-modal__input" value={arms} onChange={(e) => setArms(e.target.value)} />
              </label>
              <label className="body-modal__field">
                <span className="body-modal__label">Thighs ({lengthSuffix})</span>
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
