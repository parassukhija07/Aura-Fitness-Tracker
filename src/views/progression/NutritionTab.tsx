import { useState } from 'react';
import { useUserPreferencesStore } from '../../store/userPreferencesStore';
import {
  calculateBMR,
  calculateTDEE,
  calculateMacros,
  Goal,
  Split,
} from '../../services/nutritionCalculator';

export default function NutritionTab() {
  const [goal, setGoal] = useState<Goal>('maintenance');
  const [split, setSplit] = useState<Split>('balanced');

  const ageYears      = useUserPreferencesStore((s) => s.ageYears);
  const weightKg      = useUserPreferencesStore((s) => s.weightKg);
  const heightCm      = useUserPreferencesStore((s) => s.heightCm);
  const sex           = useUserPreferencesStore((s) => s.sex);
  const activityLevel = useUserPreferencesStore((s) => s.activityLevel);
  const setBiometrics = useUserPreferencesStore((s) => s.setBiometrics);

  const ready =
    ageYears != null && weightKg != null && heightCm != null && sex != null &&
    ageYears > 0 && weightKg > 0 && heightCm > 0;

  let macros = null;
  if (ready) {
    const bmr  = calculateBMR({ sex: sex!, weightKg: weightKg!, heightCm: heightCm!, ageYears: ageYears! });
    const tdee = calculateTDEE(bmr, activityLevel);
    macros = calculateMacros(tdee, goal, split);
  }

  function handleNumberInput(
    field: 'ageYears' | 'weightKg' | 'heightCm',
    rawValue: string
  ) {
    const n = Number(rawValue);
    if (rawValue === '' || Number.isNaN(n) || n <= 0) {
      setBiometrics({ [field]: null });
    } else {
      setBiometrics({ [field]: n });
    }
  }

  return (
    <div className="nutri-tab">
      {/* ── Biometric Inputs ── */}
      <div className="nutri-field">
        <label className="nutri-label" htmlFor="nutri-age">Age (years)</label>
        <input
          id="nutri-age"
          className="nutri-input"
          type="number"
          inputMode="decimal"
          placeholder="e.g. 28"
          defaultValue={ageYears ?? ''}
          onChange={(e) => handleNumberInput('ageYears', e.target.value)}
        />
      </div>

      <div className="nutri-field">
        <label className="nutri-label" htmlFor="nutri-weight">Weight (kg)</label>
        <input
          id="nutri-weight"
          className="nutri-input"
          type="number"
          inputMode="decimal"
          placeholder="e.g. 75"
          defaultValue={weightKg ?? ''}
          onChange={(e) => handleNumberInput('weightKg', e.target.value)}
        />
      </div>

      <div className="nutri-field">
        <label className="nutri-label" htmlFor="nutri-height">Height (cm)</label>
        <input
          id="nutri-height"
          className="nutri-input"
          type="number"
          inputMode="decimal"
          placeholder="e.g. 170"
          defaultValue={heightCm ?? ''}
          onChange={(e) => handleNumberInput('heightCm', e.target.value)}
        />
      </div>

      <div className="nutri-field">
        <label className="nutri-label" htmlFor="nutri-sex">Sex</label>
        <select
          id="nutri-sex"
          className="nutri-select"
          value={sex ?? ''}
          onChange={(e) => {
            const v = e.target.value;
            setBiometrics({ sex: v === 'male' || v === 'female' ? v : null });
          }}
        >
          <option value="">Select…</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
        </select>
      </div>

      <div className="nutri-field">
        <label className="nutri-label" htmlFor="nutri-activity">Activity Level</label>
        <select
          id="nutri-activity"
          className="nutri-select"
          value={activityLevel}
          onChange={(e) =>
            setBiometrics({ activityLevel: e.target.value as typeof activityLevel })
          }
        >
          <option value="sedentary">Sedentary</option>
          <option value="light">Light</option>
          <option value="moderate">Moderate</option>
          <option value="active">Active</option>
          <option value="very_active">Very Active</option>
        </select>
      </div>

      {/* ── Goal Selector ── */}
      <div className="nutri-segmented" role="group" aria-label="Goal">
        {(['fat_loss', 'maintenance', 'muscle_gain'] as Goal[]).map((g) => {
          const labels: Record<Goal, string> = {
            fat_loss: 'Fat Loss',
            maintenance: 'Maintenance',
            muscle_gain: 'Muscle Gain',
          };
          return (
            <button
              key={g}
              type="button"
              className={`nutri-segmented__btn${goal === g ? ' nutri-segmented__btn--active' : ''}`}
              onClick={() => setGoal(g)}
            >
              {labels[g]}
            </button>
          );
        })}
      </div>

      {/* ── Split Selector ── */}
      <div className="nutri-segmented" role="group" aria-label="Macro Split">
        {(['balanced', 'high_protein', 'low_carb', 'keto'] as Split[]).map((s) => {
          const labels: Record<Split, string> = {
            balanced: 'Balanced',
            high_protein: 'High Protein',
            low_carb: 'Low Carb',
            keto: 'Keto',
          };
          return (
            <button
              key={s}
              type="button"
              className={`nutri-segmented__btn${split === s ? ' nutri-segmented__btn--active' : ''}`}
              onClick={() => setSplit(s)}
            >
              {labels[s]}
            </button>
          );
        })}
      </div>

      {/* ── Daily Target Card or Warning ── */}
      {ready && macros ? (
        <div className="target-card">
          <div className="target-card__calories">
            <span className="macro-cell__value">{macros.calories}</span>
            <span className="macro-cell__label">kcal / day</span>
          </div>
          <div className="target-card__macros">
            <div className="macro-cell">
              <span className="macro-cell__value">{macros.protein}g</span>
              <span className="macro-cell__label">Protein</span>
            </div>
            <div className="macro-cell">
              <span className="macro-cell__value">{macros.carbs}g</span>
              <span className="macro-cell__label">Carbs</span>
            </div>
            <div className="macro-cell">
              <span className="macro-cell__value">{macros.fats}g</span>
              <span className="macro-cell__label">Fats</span>
            </div>
            <div className="macro-cell">
              <span className="macro-cell__value">{macros.fiber}g</span>
              <span className="macro-cell__label">Fiber</span>
            </div>
          </div>
        </div>
      ) : (
        <p className="nutri-warning">
          Enter your age, weight, height, and sex to see daily targets.
        </p>
      )}
    </div>
  );
}
