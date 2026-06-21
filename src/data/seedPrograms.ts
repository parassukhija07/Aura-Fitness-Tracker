import type { CatalogProgram } from '../types/workout';

export const SEED_CATALOG_PROGRAMS: CatalogProgram[] = [
  {
    id: 'lib-ppl',
    name: 'Push Pull Legs',
    description: 'Classic 3-day split for muscle growth targeting push, pull, and leg movements.',
    goal: 'Hypertrophy',
    workouts: [
      {
        name: 'Push',
        exercises: [
          { exerciseId: 'barbell-bench-press',    sets: 3, repsMin: 6,  repsMax: 10 },
          { exerciseId: 'incline-dumbbell-press', sets: 3, repsMin: 8,  repsMax: 12 },
          { exerciseId: 'overhead-press',         sets: 3, repsMin: 8,  repsMax: 12 },
          { exerciseId: 'dumbbell-lateral-raise', sets: 3, repsMin: 12, repsMax: 15 },
          { exerciseId: 'cable-tricep-pushdown',  sets: 3, repsMin: 10, repsMax: 15 },
          { exerciseId: 'cable-crossover',        sets: 3, repsMin: 10, repsMax: 15 },
        ],
      },
      {
        name: 'Pull',
        exercises: [
          { exerciseId: 'deadlift',              sets: 3, repsMin: 3,  repsMax: 6  },
          { exerciseId: 'pull-up',               sets: 3, repsMin: 6,  repsMax: 12 },
          { exerciseId: 'barbell-bent-over-row', sets: 3, repsMin: 6,  repsMax: 10 },
          { exerciseId: 'lat-pulldown',          sets: 3, repsMin: 8,  repsMax: 12 },
          { exerciseId: 'dumbbell-bicep-curl',   sets: 3, repsMin: 10, repsMax: 15 },
          { exerciseId: 'cable-face-pull',       sets: 3, repsMin: 12, repsMax: 20 },
        ],
      },
      {
        name: 'Legs',
        exercises: [
          { exerciseId: 'barbell-back-squat', sets: 3, repsMin: 5,  repsMax: 8  },
          { exerciseId: 'romanian-deadlift',  sets: 3, repsMin: 8,  repsMax: 12 },
          { exerciseId: 'leg-press',          sets: 3, repsMin: 10, repsMax: 15 },
          { exerciseId: 'lying-leg-curl',     sets: 3, repsMin: 10, repsMax: 15 },
          { exerciseId: 'leg-extension',      sets: 3, repsMin: 12, repsMax: 15 },
          { exerciseId: 'hanging-leg-raise',  sets: 3, repsMin: 10, repsMax: 20 },
        ],
      },
    ],
  },
  {
    id: 'lib-upper-lower',
    name: 'Upper / Lower Split',
    description: '4-day strength-focused split alternating upper and lower body sessions.',
    goal: 'Strength',
    workouts: [
      {
        name: 'Upper A',
        exercises: [
          { exerciseId: 'barbell-bench-press',    sets: 3, repsMin: 6,  repsMax: 10 },
          { exerciseId: 'barbell-bent-over-row',  sets: 3, repsMin: 6,  repsMax: 10 },
          { exerciseId: 'overhead-press',         sets: 3, repsMin: 8,  repsMax: 12 },
          { exerciseId: 'pull-up',                sets: 3, repsMin: 6,  repsMax: 12 },
          { exerciseId: 'barbell-curl',           sets: 3, repsMin: 8,  repsMax: 12 },
          { exerciseId: 'close-grip-bench-press', sets: 3, repsMin: 6,  repsMax: 10 },
        ],
      },
      {
        name: 'Lower A',
        exercises: [
          { exerciseId: 'barbell-back-squat', sets: 3, repsMin: 5,  repsMax: 8  },
          { exerciseId: 'romanian-deadlift',  sets: 3, repsMin: 8,  repsMax: 12 },
          { exerciseId: 'leg-press',          sets: 3, repsMin: 10, repsMax: 15 },
          { exerciseId: 'lying-leg-curl',     sets: 3, repsMin: 10, repsMax: 15 },
          { exerciseId: 'plank',              sets: 3, repsMin: 30, repsMax: 60 },
        ],
      },
      {
        name: 'Upper B',
        exercises: [
          { exerciseId: 'incline-barbell-press',    sets: 3, repsMin: 6,  repsMax: 10 },
          { exerciseId: 'seated-cable-row',         sets: 3, repsMin: 8,  repsMax: 12 },
          { exerciseId: 'dumbbell-shoulder-press',  sets: 3, repsMin: 8,  repsMax: 12 },
          { exerciseId: 'lat-pulldown',             sets: 3, repsMin: 8,  repsMax: 12 },
          { exerciseId: 'dumbbell-hammer-curl',     sets: 3, repsMin: 10, repsMax: 15 },
          { exerciseId: 'cable-tricep-pushdown',    sets: 3, repsMin: 10, repsMax: 15 },
        ],
      },
      {
        name: 'Lower B',
        exercises: [
          { exerciseId: 'deadlift',           sets: 3, repsMin: 3,  repsMax: 6  },
          { exerciseId: 'barbell-front-squat',sets: 3, repsMin: 6,  repsMax: 10 },
          { exerciseId: 'dumbbell-lunge',     sets: 3, repsMin: 10, repsMax: 12 },
          { exerciseId: 'leg-extension',      sets: 3, repsMin: 12, repsMax: 15 },
          { exerciseId: 'cable-crunch',       sets: 3, repsMin: 12, repsMax: 20 },
        ],
      },
    ],
  },
  {
    id: 'lib-arnold-split',
    name: 'Arnold Split',
    description: '6-day hypertrophy split popularised by Arnold Schwarzenegger — chest/back, shoulders/arms, and legs twice per week.',
    goal: 'Hypertrophy',
    workouts: [
      {
        name: 'Chest & Back A',
        exercises: [
          { exerciseId: 'barbell-bench-press',    sets: 3, repsMin: 6,  repsMax: 10 },
          { exerciseId: 'incline-dumbbell-press', sets: 3, repsMin: 8,  repsMax: 12 },
          { exerciseId: 'dumbbell-fly',           sets: 3, repsMin: 10, repsMax: 15 },
          { exerciseId: 'pull-up',                sets: 3, repsMin: 6,  repsMax: 12 },
          { exerciseId: 'barbell-bent-over-row',  sets: 3, repsMin: 6,  repsMax: 10 },
          { exerciseId: 'lat-pulldown',           sets: 3, repsMin: 8,  repsMax: 12 },
        ],
      },
      {
        name: 'Shoulders & Arms A',
        exercises: [
          { exerciseId: 'overhead-press',          sets: 3, repsMin: 8,  repsMax: 12 },
          { exerciseId: 'dumbbell-lateral-raise',  sets: 3, repsMin: 12, repsMax: 15 },
          { exerciseId: 'barbell-curl',            sets: 3, repsMin: 8,  repsMax: 12 },
          { exerciseId: 'cable-tricep-pushdown',   sets: 3, repsMin: 10, repsMax: 15 },
          { exerciseId: 'dumbbell-hammer-curl',    sets: 3, repsMin: 10, repsMax: 15 },
          { exerciseId: 'tricep-dip',              sets: 3, repsMin: 8,  repsMax: 15 },
        ],
      },
      {
        name: 'Legs A',
        exercises: [
          { exerciseId: 'barbell-back-squat', sets: 3, repsMin: 5,  repsMax: 8  },
          { exerciseId: 'romanian-deadlift',  sets: 3, repsMin: 8,  repsMax: 12 },
          { exerciseId: 'leg-press',          sets: 3, repsMin: 10, repsMax: 15 },
          { exerciseId: 'lying-leg-curl',     sets: 3, repsMin: 10, repsMax: 15 },
          { exerciseId: 'leg-extension',      sets: 3, repsMin: 12, repsMax: 15 },
        ],
      },
      {
        name: 'Chest & Back B',
        exercises: [
          { exerciseId: 'incline-barbell-press',   sets: 3, repsMin: 6,  repsMax: 10 },
          { exerciseId: 'machine-chest-press',     sets: 3, repsMin: 8,  repsMax: 12 },
          { exerciseId: 'cable-crossover',         sets: 3, repsMin: 10, repsMax: 15 },
          { exerciseId: 'seated-cable-row',        sets: 3, repsMin: 8,  repsMax: 12 },
          { exerciseId: 'dumbbell-row',            sets: 3, repsMin: 8,  repsMax: 12 },
          { exerciseId: 'straight-arm-pulldown',   sets: 3, repsMin: 10, repsMax: 15 },
        ],
      },
      {
        name: 'Shoulders & Arms B',
        exercises: [
          { exerciseId: 'dumbbell-shoulder-press',    sets: 3, repsMin: 8,  repsMax: 12 },
          { exerciseId: 'cable-lateral-raise',        sets: 3, repsMin: 12, repsMax: 15 },
          { exerciseId: 'cable-face-pull',            sets: 3, repsMin: 12, repsMax: 20 },
          { exerciseId: 'dumbbell-bicep-curl',        sets: 3, repsMin: 10, repsMax: 15 },
          { exerciseId: 'dumbbell-tricep-extension',  sets: 3, repsMin: 10, repsMax: 15 },
          { exerciseId: 'cable-bicep-curl',           sets: 3, repsMin: 10, repsMax: 15 },
        ],
      },
      {
        name: 'Legs B',
        exercises: [
          { exerciseId: 'barbell-front-squat', sets: 3, repsMin: 6,  repsMax: 10 },
          { exerciseId: 'goblet-squat',        sets: 3, repsMin: 10, repsMax: 15 },
          { exerciseId: 'dumbbell-lunge',      sets: 3, repsMin: 10, repsMax: 12 },
          { exerciseId: 'cable-pull-through',  sets: 3, repsMin: 12, repsMax: 15 },
          { exerciseId: 'lying-leg-curl',      sets: 3, repsMin: 10, repsMax: 15 },
        ],
      },
    ],
  },
  {
    id: 'lib-full-body-3day',
    name: 'Full Body 3-Day',
    description: 'Three full-body sessions per week hitting every major muscle group each session.',
    goal: 'Strength',
    workouts: [
      {
        name: 'Day 1',
        exercises: [
          { exerciseId: 'barbell-back-squat',    sets: 3, repsMin: 5,  repsMax: 8  },
          { exerciseId: 'barbell-bench-press',   sets: 3, repsMin: 6,  repsMax: 10 },
          { exerciseId: 'barbell-bent-over-row', sets: 3, repsMin: 6,  repsMax: 10 },
          { exerciseId: 'overhead-press',        sets: 3, repsMin: 8,  repsMax: 12 },
          { exerciseId: 'plank',                 sets: 3, repsMin: 30, repsMax: 60 },
        ],
      },
      {
        name: 'Day 2',
        exercises: [
          { exerciseId: 'deadlift',              sets: 3, repsMin: 3,  repsMax: 6  },
          { exerciseId: 'incline-dumbbell-press',sets: 3, repsMin: 8,  repsMax: 12 },
          { exerciseId: 'pull-up',               sets: 3, repsMin: 6,  repsMax: 12 },
          { exerciseId: 'dumbbell-lateral-raise',sets: 3, repsMin: 12, repsMax: 15 },
          { exerciseId: 'hanging-leg-raise',     sets: 3, repsMin: 10, repsMax: 20 },
        ],
      },
      {
        name: 'Day 3',
        exercises: [
          { exerciseId: 'barbell-front-squat',  sets: 3, repsMin: 6,  repsMax: 10 },
          { exerciseId: 'dumbbell-bench-press', sets: 3, repsMin: 8,  repsMax: 12 },
          { exerciseId: 'seated-cable-row',     sets: 3, repsMin: 8,  repsMax: 12 },
          { exerciseId: 'barbell-curl',         sets: 3, repsMin: 8,  repsMax: 12 },
          { exerciseId: 'cable-tricep-pushdown',sets: 3, repsMin: 10, repsMax: 15 },
        ],
      },
    ],
  },
  {
    id: 'lib-push-pull',
    name: 'Push / Pull',
    description: '4-day push-pull split for balanced hypertrophy with two push and two pull sessions.',
    goal: 'Hypertrophy',
    workouts: [
      {
        name: 'Push A',
        exercises: [
          { exerciseId: 'barbell-bench-press',    sets: 3, repsMin: 6,  repsMax: 10 },
          { exerciseId: 'overhead-press',         sets: 3, repsMin: 8,  repsMax: 12 },
          { exerciseId: 'incline-dumbbell-press', sets: 3, repsMin: 8,  repsMax: 12 },
          { exerciseId: 'dumbbell-lateral-raise', sets: 3, repsMin: 12, repsMax: 15 },
          { exerciseId: 'cable-tricep-pushdown',  sets: 3, repsMin: 10, repsMax: 15 },
        ],
      },
      {
        name: 'Pull A',
        exercises: [
          { exerciseId: 'deadlift',              sets: 3, repsMin: 3,  repsMax: 6  },
          { exerciseId: 'pull-up',               sets: 3, repsMin: 6,  repsMax: 12 },
          { exerciseId: 'barbell-bent-over-row', sets: 3, repsMin: 6,  repsMax: 10 },
          { exerciseId: 'barbell-curl',          sets: 3, repsMin: 8,  repsMax: 12 },
          { exerciseId: 'cable-face-pull',       sets: 3, repsMin: 12, repsMax: 20 },
        ],
      },
      {
        name: 'Push B',
        exercises: [
          { exerciseId: 'machine-chest-press',    sets: 3, repsMin: 8,  repsMax: 12 },
          { exerciseId: 'dumbbell-shoulder-press',sets: 3, repsMin: 8,  repsMax: 12 },
          { exerciseId: 'cable-crossover',        sets: 3, repsMin: 10, repsMax: 15 },
          { exerciseId: 'reverse-pec-deck',       sets: 3, repsMin: 12, repsMax: 15 },
          { exerciseId: 'tricep-dip',             sets: 3, repsMin: 8,  repsMax: 15 },
        ],
      },
      {
        name: 'Pull B',
        exercises: [
          { exerciseId: 'lat-pulldown',        sets: 3, repsMin: 8,  repsMax: 12 },
          { exerciseId: 'seated-cable-row',    sets: 3, repsMin: 8,  repsMax: 12 },
          { exerciseId: 'dumbbell-row',        sets: 3, repsMin: 8,  repsMax: 12 },
          { exerciseId: 'dumbbell-hammer-curl',sets: 3, repsMin: 10, repsMax: 15 },
          { exerciseId: 'cable-bicep-curl',    sets: 3, repsMin: 10, repsMax: 15 },
        ],
      },
    ],
  },
  {
    id: 'lib-bro-split',
    name: 'Bro Split (5-Day)',
    description: '5-day classic bodybuilder split dedicating each session to one muscle group for maximum volume.',
    goal: 'Hypertrophy',
    workouts: [
      {
        name: 'Chest Day',
        exercises: [
          { exerciseId: 'barbell-bench-press',  sets: 3, repsMin: 6,  repsMax: 10 },
          { exerciseId: 'incline-barbell-press',sets: 3, repsMin: 6,  repsMax: 10 },
          { exerciseId: 'dumbbell-fly',         sets: 3, repsMin: 10, repsMax: 15 },
          { exerciseId: 'machine-chest-press',  sets: 3, repsMin: 8,  repsMax: 12 },
          { exerciseId: 'cable-crossover',      sets: 3, repsMin: 10, repsMax: 15 },
          { exerciseId: 'push-up',              sets: 3, repsMin: 10, repsMax: 20 },
        ],
      },
      {
        name: 'Back Day',
        exercises: [
          { exerciseId: 'deadlift',              sets: 3, repsMin: 3,  repsMax: 6  },
          { exerciseId: 'pull-up',               sets: 3, repsMin: 6,  repsMax: 12 },
          { exerciseId: 'barbell-bent-over-row', sets: 3, repsMin: 6,  repsMax: 10 },
          { exerciseId: 'lat-pulldown',          sets: 3, repsMin: 8,  repsMax: 12 },
          { exerciseId: 'seated-cable-row',      sets: 3, repsMin: 8,  repsMax: 12 },
          { exerciseId: 'straight-arm-pulldown', sets: 3, repsMin: 10, repsMax: 15 },
        ],
      },
      {
        name: 'Shoulder Day',
        exercises: [
          { exerciseId: 'overhead-press',         sets: 3, repsMin: 8,  repsMax: 12 },
          { exerciseId: 'dumbbell-shoulder-press',sets: 3, repsMin: 8,  repsMax: 12 },
          { exerciseId: 'dumbbell-lateral-raise', sets: 3, repsMin: 12, repsMax: 15 },
          { exerciseId: 'dumbbell-front-raise',   sets: 3, repsMin: 12, repsMax: 15 },
          { exerciseId: 'cable-face-pull',        sets: 3, repsMin: 12, repsMax: 20 },
          { exerciseId: 'reverse-pec-deck',       sets: 3, repsMin: 12, repsMax: 15 },
        ],
      },
      {
        name: 'Arm Day',
        exercises: [
          { exerciseId: 'barbell-curl',             sets: 3, repsMin: 8,  repsMax: 12 },
          { exerciseId: 'dumbbell-bicep-curl',      sets: 3, repsMin: 10, repsMax: 15 },
          { exerciseId: 'dumbbell-hammer-curl',     sets: 3, repsMin: 10, repsMax: 15 },
          { exerciseId: 'close-grip-bench-press',   sets: 3, repsMin: 6,  repsMax: 10 },
          { exerciseId: 'cable-tricep-pushdown',    sets: 3, repsMin: 10, repsMax: 15 },
          { exerciseId: 'dumbbell-tricep-extension',sets: 3, repsMin: 10, repsMax: 15 },
        ],
      },
      {
        name: 'Leg Day',
        exercises: [
          { exerciseId: 'barbell-back-squat', sets: 3, repsMin: 5,  repsMax: 8  },
          { exerciseId: 'romanian-deadlift',  sets: 3, repsMin: 8,  repsMax: 12 },
          { exerciseId: 'leg-press',          sets: 3, repsMin: 10, repsMax: 15 },
          { exerciseId: 'leg-extension',      sets: 3, repsMin: 12, repsMax: 15 },
          { exerciseId: 'lying-leg-curl',     sets: 3, repsMin: 10, repsMax: 15 },
          { exerciseId: 'dumbbell-lunge',     sets: 3, repsMin: 10, repsMax: 12 },
        ],
      },
    ],
  },
];
