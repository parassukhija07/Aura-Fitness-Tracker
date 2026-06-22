import { useState } from 'react';
import { useUserPreferencesStore } from '../../store/userPreferencesStore';
import { Chip } from '../../design';
import { useUnits } from '../../utils/units';
import {
  calculateBMR,
  calculateTDEE,
  calculateMacros,
  type Goal,
  type Split,
} from '../../services/nutritionCalculator';

const ACTIVITY_LABELS: Record<string, string> = {
  sedentary: 'Sedentary',
  light: 'Light',
  moderate: 'Moderate',
  active: 'Active',
  very_active: 'Very Active',
};

const GOAL_LABELS: Record<Goal, string> = {
  fat_loss: 'Lose fat',
  maintenance: 'Maintain',
  lean_gain: 'Lean gain',
  muscle_gain: 'Gain muscle',
};

const SPLIT_LABELS: Record<Split, string> = {
  balanced: 'Balanced',
  high_protein: 'High protein',
  high_carb: 'High carb',
  keto: 'Keto',
};

function bmiBand(bmi: number): { label: string; tone: 'green' | 'amber' | 'red' } {
  if (bmi < 18.5) return { label: 'Underweight', tone: 'amber' };
  if (bmi < 25) return { label: 'Healthy', tone: 'green' };
  if (bmi < 30) return { label: 'Overweight', tone: 'amber' };
  return { label: 'High', tone: 'red' };
}

export default function NutritionTab() {
  const [goal, setGoal] = useState<Goal>('maintenance');
  const [split, setSplit] = useState<Split>('balanced');
  const [editing, setEditing] = useState(false);

  const ageYears = useUserPreferencesStore((s) => s.ageYears);
  const weightKg = useUserPreferencesStore((s) => s.weightKg);
  const heightCm = useUserPreferencesStore((s) => s.heightCm);
  const sex = useUserPreferencesStore((s) => s.sex);
  const activityLevel = useUserPreferencesStore((s) => s.activityLevel);
  const setBiometrics = useUserPreferencesStore((s) => s.setBiometrics);
  const targetWeightKg = useUserPreferencesStore((s) => s.targetWeightKg);
  const setTargetWeight = useUserPreferencesStore((s) => s.setTargetWeight);

  const {
    fmtWeight, fmtLength, weightSuffix, lengthSuffix,
    weightToKg, lengthToCm, weightInput, lengthInput,
  } = useUnits();

  const ready =
    ageYears != null && weightKg != null && heightCm != null && sex != null &&
    ageYears > 0 && weightKg > 0 && heightCm > 0;

  let macros = null;
  let tdee = 0;
  let bmi = 0;
  if (ready) {
    const bmr = calculateBMR({ sex: sex!, weightKg: weightKg!, heightCm: heightCm!, ageYears: ageYears! });
    tdee = calculateTDEE(bmr, activityLevel);
    macros = calculateMacros(tdee, goal, split);
    const hM = heightCm! / 100;
    bmi = weightKg! / (hM * hM);
  }

  const surplus = macros ? macros.calories - Math.round(tdee) : 0;

  function handleNumberInput(field: 'ageYears' | 'weightKg' | 'heightCm', rawValue: string) {
    const n = Number(rawValue);
    if (rawValue === '' || Number.isNaN(n) || n <= 0) {
      setBiometrics({ [field]: null });
      return;
    }
    // Weight/height inputs are entered in the user's chosen unit — convert to canonical.
    const canonical = field === 'weightKg' ? weightToKg(n) : field === 'heightCm' ? lengthToCm(n) : n;
    setBiometrics({ [field]: canonical });
  }

  const profileLine = ready
    ? `${fmtLength(heightCm)} · ${fmtWeight(weightKg)} · ${ageYears}y · ${sex === 'male' ? 'Male' : 'Female'} · ${ACTIVITY_LABELS[activityLevel]}`
    : 'Add your details to see targets';

  // Macro bar widths (relative to the largest gram value for a clean visual)
  const macroMax = macros ? Math.max(macros.protein, macros.carbs, macros.fats, macros.fiber) : 1;
  const w = (g: number) => `${Math.max(8, (g / macroMax) * 100)}%`;
  const band = ready ? bmiBand(bmi) : null;

  return (
    <div className="nutri-tab">
      {/* Profile card */}
      <div className="card card-pad">
        <div className="nutri-profile">
          <div className="nutri-profile__avatar" aria-hidden="true">
            {sex === 'female' ? '♀' : sex === 'male' ? '♂' : '•'}
          </div>
          <div className="nutri-profile__text">
            <div className="nutri-profile__title">Profile</div>
            <div className="nutri-profile__line">{profileLine}</div>
          </div>
          <button
            type="button"
            className="nutri-profile__edit"
            onClick={() => setEditing((v) => !v)}
          >
            {editing ? 'Done' : 'Edit'}
          </button>
        </div>

        {editing && (
          <div className="nutri-edit-grid">
            <label className="nutri-edit-field">
              <span>Height ({lengthSuffix})</span>
              <input
                className="nutri-input"
                type="number"
                inputMode="decimal"
                defaultValue={lengthInput(heightCm)}
                onChange={(e) => handleNumberInput('heightCm', e.target.value)}
              />
            </label>
            <label className="nutri-edit-field">
              <span>Weight ({weightSuffix})</span>
              <input
                className="nutri-input"
                type="number"
                inputMode="decimal"
                defaultValue={weightInput(weightKg)}
                onChange={(e) => handleNumberInput('weightKg', e.target.value)}
              />
            </label>
            <label className="nutri-edit-field">
              <span>Age</span>
              <input
                className="nutri-input"
                type="number"
                inputMode="decimal"
                defaultValue={ageYears ?? ''}
                onChange={(e) => handleNumberInput('ageYears', e.target.value)}
              />
            </label>
            <label className="nutri-edit-field">
              <span>Sex</span>
              <select
                className="nutri-input"
                value={sex ?? ''}
                onChange={(e) => {
                  const v = e.target.value;
                  setBiometrics({ sex: v === 'male' || v === 'female' ? v : null });
                }}
              >
                <option value="">—</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </label>
            <label className="nutri-edit-field nutri-edit-field--full">
              <span>Activity level</span>
              <select
                className="nutri-input"
                value={activityLevel}
                onChange={(e) => setBiometrics({ activityLevel: e.target.value as typeof activityLevel })}
              >
                {Object.entries(ACTIVITY_LABELS).map(([v, label]) => (
                  <option key={v} value={v}>{label}</option>
                ))}
              </select>
            </label>
            <label className="nutri-edit-field">
              <span>Target weight ({weightSuffix})</span>
              <input
                className="nutri-input"
                type="number"
                inputMode="decimal"
                defaultValue={weightInput(targetWeightKg)}
                onChange={(e) => {
                  const n = Number(e.target.value);
                  setTargetWeight(e.target.value === '' || Number.isNaN(n) || n <= 0 ? null : weightToKg(n));
                }}
              />
            </label>
          </div>
        )}
        {ready && targetWeightKg != null && weightKg != null && (
          <div className="nutri-target-delta" style={{ marginTop: 'var(--s2)', fontSize: 13, color: 'var(--text-2)' }}>
            Target: <strong style={{ color: 'var(--text)' }}>{fmtWeight(targetWeightKg)}</strong>
            {' '}
            <span style={{ color: targetWeightKg >= weightKg ? 'var(--accent)' : 'var(--green)' }}>
              ({targetWeightKg >= weightKg ? '+' : '−'}{fmtWeight(Math.abs(targetWeightKg - weightKg))} from current)
            </span>
          </div>
        )}

        {ready && (
          <div className="nutri-tiles">
            <div className="nutri-tile">
              <div className="nutri-tile__label">BMI</div>
              <div className="nutri-tile__value">{bmi.toFixed(1)}</div>
              <div className={`nutri-tile__sub nutri-tile__sub--${band!.tone}`}>{band!.label}</div>
            </div>
            <div className="nutri-tile">
              <div className="nutri-tile__label">TDEE</div>
              <div className="nutri-tile__value">{Math.round(tdee).toLocaleString('en-US')}</div>
              <div className="nutri-tile__sub">kcal/day</div>
            </div>
          </div>
        )}
      </div>

      {/* Goal */}
      <div className="sec-label">Goal</div>
      <div className="nutri-chips">
        {(Object.keys(GOAL_LABELS) as Goal[]).map((g) => (
          <Chip key={g} label={GOAL_LABELS[g]} selected={goal === g} onClick={() => setGoal(g)} />
        ))}
      </div>

      {/* Macro split */}
      <div className="sec-label">Macro split</div>
      <div className="nutri-chips">
        {(Object.keys(SPLIT_LABELS) as Split[]).map((s) => (
          <Chip key={s} label={SPLIT_LABELS[s]} selected={split === s} onClick={() => setSplit(s)} />
        ))}
      </div>

      {/* Daily targets */}
      <div className="sec-label">Daily targets</div>
      {ready && macros ? (
        <div className="card card-pad">
          <div className="nutri-targets__head">
            <div className="nutri-targets__cal">
              {macros.calories.toLocaleString('en-US')} <span>kcal</span>
            </div>
            {surplus !== 0 && (
              <span className={`badge ${surplus > 0 ? 'badge-accent' : 'badge-green'}`}>
                {surplus > 0 ? `+${surplus} surplus` : `${surplus} deficit`}
              </span>
            )}
          </div>
          <div className="mbar-row">
            <div className="mbar-lab nutri-macro--protein">Protein</div>
            <div className="mbar"><i style={{ width: w(macros.protein), background: 'var(--accent)' }} /></div>
            <div className="mbar-pct">{macros.protein}g</div>
          </div>
          <div className="mbar-row">
            <div className="mbar-lab nutri-macro--carbs">Carbs</div>
            <div className="mbar"><i style={{ width: w(macros.carbs), background: 'var(--blue)' }} /></div>
            <div className="mbar-pct">{macros.carbs}g</div>
          </div>
          <div className="mbar-row">
            <div className="mbar-lab nutri-macro--fats">Fats</div>
            <div className="mbar"><i style={{ width: w(macros.fats), background: 'var(--purple)' }} /></div>
            <div className="mbar-pct">{macros.fats}g</div>
          </div>
          <div className="mbar-row" style={{ marginBottom: 0 }}>
            <div className="mbar-lab nutri-macro--fiber">Fiber</div>
            <div className="mbar"><i style={{ width: w(macros.fiber), background: 'var(--green)' }} /></div>
            <div className="mbar-pct">{macros.fiber}g</div>
          </div>
        </div>
      ) : (
        <p className="nutri-warning">
          Tap <strong>Edit</strong> on your profile and add height, weight, age & sex to see daily targets.
        </p>
      )}
    </div>
  );
}
