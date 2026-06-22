export type Sex = 'male' | 'female';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
export type Goal = 'fat_loss' | 'maintenance' | 'lean_gain' | 'muscle_gain';
export type Split = 'balanced' | 'high_protein' | 'high_carb' | 'keto';

export interface BmrInput {
  sex: Sex;
  weightKg: number;
  heightCm: number;
  ageYears: number;
}

export interface MacroResult {
  calories: number; // kcal, integer
  protein: number;  // grams, integer
  carbs: number;    // grams, integer
  fats: number;     // grams, integer
  fiber: number;    // grams, integer
}

export const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

export const GOAL_CALORIE_DELTA: Record<Goal, number> = {
  fat_loss: -500,
  maintenance: 0,
  lean_gain: 250,
  muscle_gain: 400,
};

// [protein, carbs, fats] as fraction of total calories. EACH ROW MUST SUM TO 1.0.
// Ratios are FIXED per split; goal only shifts total calories.
export const SPLIT_RATIOS: Record<Split, { protein: number; carbs: number; fats: number }> = {
  balanced:     { protein: 0.30, carbs: 0.40, fats: 0.30 },
  high_protein: { protein: 0.40, carbs: 0.35, fats: 0.25 },
  high_carb:    { protein: 0.25, carbs: 0.55, fats: 0.20 },
  keto:         { protein: 0.25, carbs: 0.05, fats: 0.70 },
};

export function calculateBMR(input: BmrInput): number {
  const { sex, weightKg, heightCm, ageYears } = input;
  return 10 * weightKg + 6.25 * heightCm - 5 * ageYears + (sex === 'male' ? 5 : -161);
}

export function calculateTDEE(bmr: number, activity: ActivityLevel): number {
  return bmr * ACTIVITY_MULTIPLIERS[activity];
}

export function calculateMacros(tdee: number, goal: Goal, split: Split): MacroResult {
  let calories = tdee + GOAL_CALORIE_DELTA[goal];
  if (calories < 1200) {
    calories = 1200;
  }
  const r = SPLIT_RATIOS[split];
  const protein = (calories * r.protein) / 4;
  const carbs   = (calories * r.carbs)   / 4;
  const fats    = (calories * r.fats)    / 9;
  const fiber   = (calories / 1000) * 14;
  return {
    calories: Math.round(calories),
    protein:  Math.round(protein),
    carbs:    Math.round(carbs),
    fats:     Math.round(fats),
    fiber:    Math.round(fiber),
  };
}
