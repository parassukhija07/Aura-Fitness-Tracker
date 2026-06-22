// Display-only unit conversion.
//
// All data is stored canonically in METRIC (weights in kg, lengths in cm).
// These helpers convert ONLY at the display edge and when reading user input
// back into canonical units. Nothing here mutates persisted state.
import { useUserPreferencesStore } from '../store/userPreferencesStore';

export type WeightUnit = 'kg' | 'lbs';
export type LengthUnit = 'cm' | 'in';

const KG_PER_LB = 0.45359237;
const CM_PER_IN = 2.54;

// ── Weight ────────────────────────────────────────────────────────────────────
export function kgToDisplay(kg: number, unit: WeightUnit): number {
  return unit === 'lbs' ? kg / KG_PER_LB : kg;
}

export function displayToKg(value: number, unit: WeightUnit): number {
  return unit === 'lbs' ? value * KG_PER_LB : value;
}

// ── Length ──────────────────────────────────────────────────────────────────--
export function cmToDisplay(cm: number, unit: LengthUnit): number {
  return unit === 'in' ? cm / CM_PER_IN : cm;
}

export function displayToCm(value: number, unit: LengthUnit): number {
  return unit === 'in' ? value * CM_PER_IN : value;
}

// ── Rounding helpers ──────────────────────────────────────────────────────────
// Weights round to 0.5 in their display unit (lifting plates are coarse); body
// measurements/heights round to 1 decimal.
function roundHalf(n: number): number {
  return Math.round(n * 2) / 2;
}
function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

/** Format a canonical kg value for display in the user's chosen weight unit. */
export function formatWeight(kg: number | null | undefined, unit: WeightUnit, opts?: { withUnit?: boolean }): string {
  if (kg == null || Number.isNaN(kg)) return '—';
  const v = roundHalf(kgToDisplay(kg, unit));
  const num = Number.isInteger(v) ? String(v) : String(v);
  return opts?.withUnit === false ? num : `${num} ${unit}`;
}

/** Format a canonical cm value for display in the user's chosen length unit. */
export function formatLength(cm: number | null | undefined, unit: LengthUnit, opts?: { withUnit?: boolean }): string {
  if (cm == null || Number.isNaN(cm)) return '—';
  const v = round1(cmToDisplay(cm, unit));
  const num = Number.isInteger(v) ? String(v) : String(v);
  return opts?.withUnit === false ? num : `${num} ${unit === 'in' ? 'in' : 'cm'}`;
}

/** Numeric display value (no unit suffix) for prefilling input fields. */
export function weightInputValue(kg: number | null | undefined, unit: WeightUnit): string {
  if (kg == null || Number.isNaN(kg)) return '';
  return String(roundHalf(kgToDisplay(kg, unit)));
}
export function lengthInputValue(cm: number | null | undefined, unit: LengthUnit): string {
  if (cm == null || Number.isNaN(cm)) return '';
  return String(round1(cmToDisplay(cm, unit)));
}

// ── React hook ────────────────────────────────────────────────────────────────
/**
 * Subscribe to the active units and get bound formatters/parsers. Components
 * re-render automatically when the user changes units in Profile.
 */
export function useUnits() {
  const weightUnit = useUserPreferencesStore((s) => s.weightUnit);
  const lengthUnit = useUserPreferencesStore((s) => s.lengthUnit);
  return {
    weightUnit,
    lengthUnit,
    // weights
    fmtWeight: (kg: number | null | undefined, withUnit = true) => formatWeight(kg, weightUnit, { withUnit }),
    weightToKg: (value: number) => displayToKg(value, weightUnit),
    weightFromKg: (kg: number) => kgToDisplay(kg, weightUnit),
    weightInput: (kg: number | null | undefined) => weightInputValue(kg, weightUnit),
    weightSuffix: weightUnit,
    // lengths
    fmtLength: (cm: number | null | undefined, withUnit = true) => formatLength(cm, lengthUnit, { withUnit }),
    lengthToCm: (value: number) => displayToCm(value, lengthUnit),
    lengthFromCm: (cm: number) => cmToDisplay(cm, lengthUnit),
    lengthInput: (cm: number | null | undefined) => lengthInputValue(cm, lengthUnit),
    lengthSuffix: lengthUnit === 'in' ? 'in' : 'cm',
  };
}
