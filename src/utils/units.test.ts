import {
  kgToDisplay, displayToKg, cmToDisplay, displayToCm,
  formatWeight, formatLength, weightInputValue, lengthInputValue,
} from './units';

describe('units conversion', () => {
  test('kg ↔ lbs round-trips', () => {
    expect(kgToDisplay(100, 'kg')).toBe(100);
    expect(kgToDisplay(100, 'lbs')).toBeCloseTo(220.462, 2);
    expect(displayToKg(220.462, 'lbs')).toBeCloseTo(100, 2);
    expect(displayToKg(100, 'kg')).toBe(100);
  });

  test('cm ↔ in round-trips', () => {
    expect(cmToDisplay(180, 'cm')).toBe(180);
    expect(cmToDisplay(2.54, 'in')).toBeCloseTo(1, 5);
    expect(displayToCm(1, 'in')).toBeCloseTo(2.54, 5);
    expect(displayToCm(180, 'cm')).toBe(180);
  });

  test('formatWeight rounds to 0.5 and appends unit', () => {
    expect(formatWeight(100, 'kg')).toBe('100 kg');
    expect(formatWeight(100, 'lbs')).toBe('220.5 lbs');
    expect(formatWeight(100, 'lbs', { withUnit: false })).toBe('220.5');
    expect(formatWeight(null, 'kg')).toBe('—');
  });

  test('formatLength rounds to 1 decimal and appends unit', () => {
    expect(formatLength(180, 'cm')).toBe('180 cm');
    expect(formatLength(180, 'in')).toBe('70.9 in');
    expect(formatLength(undefined, 'in')).toBe('—');
  });

  test('input value helpers omit unit suffix', () => {
    expect(weightInputValue(100, 'kg')).toBe('100');
    expect(weightInputValue(100, 'lbs')).toBe('220.5');
    expect(weightInputValue(null, 'kg')).toBe('');
    expect(lengthInputValue(180, 'cm')).toBe('180');
    expect(lengthInputValue(null, 'in')).toBe('');
  });
});
