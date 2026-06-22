import {
  calculateBMR,
  calculateTDEE,
  calculateMacros,
  SPLIT_RATIOS,
  Split,
} from './nutritionCalculator';

describe('calculateBMR', () => {
  it('male 80kg 180cm 30y → 1780', () => {
    expect(calculateBMR({ sex: 'male', weightKg: 80, heightCm: 180, ageYears: 30 })).toBe(1780);
  });

  it('female 60kg 165cm 25y → 1345.25', () => {
    expect(calculateBMR({ sex: 'female', weightKg: 60, heightCm: 165, ageYears: 25 })).toBe(1345.25);
  });
});

describe('calculateTDEE', () => {
  it('1780 at moderate → 2759', () => {
    expect(calculateTDEE(1780, 'moderate')).toBeCloseTo(2759, 0);
  });
});

describe('calculateMacros', () => {
  it('maintenance balanced 2759 → full result', () => {
    expect(calculateMacros(2759, 'maintenance', 'balanced')).toEqual({
      calories: 2759,
      protein: 207,
      carbs: 276,
      fats: 92,
      fiber: 39,
    });
  });

  it('fat_loss 2000 balanced → 1500 kcal', () => {
    expect(calculateMacros(2000, 'fat_loss', 'balanced').calories).toBe(1500);
  });

  it('muscle_gain 2000 balanced → 2400 kcal', () => {
    expect(calculateMacros(2000, 'muscle_gain', 'balanced').calories).toBe(2400);
  });

  it('lean_gain 2000 balanced → 2250 kcal (surplus between maintenance and muscle_gain)', () => {
    const result = calculateMacros(2000, 'lean_gain', 'balanced');
    expect(result.calories).toBe(2250);
    // Must be strictly between maintenance (0 delta) and muscle_gain (+400)
    expect(result.calories).toBeGreaterThan(2000);
    expect(result.calories).toBeLessThan(2400);
  });

  it('high_carb split: carbs ratio > protein ratio > fats ratio', () => {
    const { protein, carbs, fats } = SPLIT_RATIOS['high_carb'];
    expect(carbs).toBeGreaterThan(protein);
    expect(protein).toBeGreaterThan(fats);
  });

  it('floor: fat_loss 1500 balanced → 1200 kcal (raw 1000 clamped)', () => {
    expect(calculateMacros(1500, 'fat_loss', 'balanced').calories).toBe(1200);
  });

  it('keto maintenance 2000 → carbs 25g', () => {
    expect(calculateMacros(2000, 'maintenance', 'keto').carbs).toBe(25);
  });
});

describe('SPLIT_RATIOS', () => {
  const splits = Object.keys(SPLIT_RATIOS) as Split[];
  splits.forEach((split) => {
    it(`${split} ratios sum to 1`, () => {
      const { protein, carbs, fats } = SPLIT_RATIOS[split];
      expect(protein + carbs + fats).toBeCloseTo(1, 5);
    });
  });
});
