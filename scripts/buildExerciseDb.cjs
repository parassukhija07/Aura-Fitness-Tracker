/* Builds src/data/exercises.json from the gym exercise library.
 *
 * - Reads the curated named exercises from src/data/gym_exercise_library.json
 * - Regenerates the 125 "Variant N" entries that follow the source's strict
 *   procedural pattern (so the full 136-entry library is reproduced exactly)
 * - Maps every entry to the app's Exercise shape (slug id, MuscleGroup,
 *   Equipment) and PRESERVES the ids referenced by seed programs/workouts
 * - Merges with the existing exercises.json so no referenced id is dropped
 *
 * Run: node scripts/buildExerciseDb.cjs
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const LIB = path.join(ROOT, 'src/data/gym_exercise_library.json');
const OUT = path.join(ROOT, 'src/data/exercises.json');

// ── Procedural variant generator (mirrors the source data exactly) ──────────
const EQUIPMENTS = ['Barbell', 'Dumbbell', 'Cable', 'Machine', 'Smith Machine', 'Bodyweight'];
// [movement label, category, muscle]
const SLOTS = [
  ['Incline', 'Chest', 'Upper Pectoralis Major'],
  ['Flat', 'Chest', 'Sternal Pectoralis Major'],
  ['Decline', 'Chest', 'Lower Pectoralis Major'],
  ['Flye', 'Chest', 'Pectoralis Minor'],
  ['Rows', 'Back', 'Latissimus Dorsi'],
  ['Pulldowns', 'Back', 'Teres Major'],
  ['Extensions', 'Back', 'Erector Spinae'],
  ['Shrugs', 'Back', 'Trapezius'],
  ['Press', 'Legs', 'Quadriceps'],
  ['Deadlifts', 'Legs', 'Hamstrings'],
  ['Squats', 'Legs', 'Gluteus Maximus'],
  ['Raises', 'Legs', 'Gastrocnemius'],
  ['Press', 'Shoulders', 'Anterior Deltoid'],
  ['Lateral Raise', 'Shoulders', 'Lateral Deltoid'],
  ['Rear Flye', 'Shoulders', 'Posterior Deltoid'],
  ['Curls', 'Arms', 'Biceps Brachii'],
  ['Extensions', 'Arms', 'Triceps Brachii'],
  ['Hammer Curls', 'Arms', 'Brachioradialis'],
  ['Crunches', 'Core', 'Rectus Abdominis'],
  ['Twists', 'Core', 'Obliques'],
  ['Planks', 'Core', 'Transverse Abdominis'],
];

function generateVariants() {
  const out = [];
  let n = 11; // variants start at "Variant 11"
  for (const equip of EQUIPMENTS) {
    const equipLabel = equip === 'Smith Machine' ? 'Smith Machine' : equip;
    for (const [movement, category, muscle] of SLOTS) {
      const name = `${equipLabel} ${movement} Variant ${n}`;
      const isMachine = equip === 'Cable' || equip === 'Machine' || equip === 'Smith Machine';
      out.push({
        name,
        category,
        equipment: equip,
        muscles_targeted: [muscle, 'Stabilizer Matrix'],
        type: isMachine ? 'Machine' : 'Compound',
        youtube_url: `https://www.youtube.com/results?search_query=${name.replace(/ /g, '+')}`,
        image_url: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd',
        pro_tips: [
          `Keep structural alignment and focus directly on loading the ${muscle}.`,
          'Maintain tight control during the eccentric phase to ensure full physical adaptation.',
        ],
        warmup_protocol: {
          type: 'Standard Automated Ramp',
          steps: [
            { set: 1, intensity: '45% Target Weight', reps: 12, description: `Targeting metabolic preparation in ${muscle}.` },
            { set: 2, intensity: '75% Target Weight', reps: 6, description: 'Prepare neural pathing for optimal weight load.' },
          ],
        },
      });
      n++;
    }
  }
  return out;
}

// ── Field mapping helpers ───────────────────────────────────────────────────
const EQUIPMENT_MAP = {
  Barbell: 'Barbell',
  Dumbbell: 'Dumbbell',
  Cable: 'Cable',
  Machine: 'Machine',
  'Smith Machine': 'Smith',
  Bodyweight: 'Bodyweight',
};
const VALID_MUSCLE = new Set(['Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core']);

function slug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

// Map ids whose names differ from the slug the app already references.
// Keeps seed programs/workouts valid by aliasing the canonical library entry.
const NAME_TO_EXISTING_ID = {
  'Barbell Bench Press': 'barbell-bench-press',
  'Cable Crossover': 'cable-crossover',
  'Barbell Conventional Deadlift': 'deadlift',
  'Lat Pulldown': 'lat-pulldown',
  'Barbell Back Squat': 'barbell-back-squat',
  'Dumbbell Incline Bench Press': 'incline-dumbbell-press',
  'Dumbbell Bicep Curl': 'dumbbell-bicep-curl',
  'Dumbbell Overhead Press': 'dumbbell-shoulder-press',
};

function defaultsFor(type, category) {
  if (type === 'Warm Up') return { sets: 1, repsMin: 10, repsMax: 15, difficulty: 'Beginner' };
  if (category === 'Core') return { sets: 3, repsMin: 12, repsMax: 20, difficulty: 'Beginner' };
  if (type === 'Compound') return { sets: 4, repsMin: 6, repsMax: 10, difficulty: 'Advanced' };
  return { sets: 3, repsMin: 8, repsMax: 12, difficulty: 'Intermediate' };
}

function mapEntry(e) {
  const equipment = EQUIPMENT_MAP[e.equipment] ?? 'Barbell';
  // "Warm-up" category isn't a training MuscleGroup — bucket into Core so the
  // record stays valid while remaining filterable; flag via `type`.
  const muscleGroup = VALID_MUSCLE.has(e.category) ? e.category : 'Core';
  const d = defaultsFor(e.type, e.category);
  const id = NAME_TO_EXISTING_ID[e.name] ?? slug(e.name);
  return {
    id,
    name: e.name,
    muscleGroup,
    equipment,
    defaultSets: d.sets,
    defaultRepsMin: d.repsMin,
    defaultRepsMax: d.repsMax,
    difficulty: d.difficulty,
    category: e.category,
    type: e.type,
    musclesTargeted: e.muscles_targeted,
    proTips: e.pro_tips,
    videoUrl: e.youtube_url,
    imageUrl: e.image_url,
    warmupType: e.warmup_protocol && e.warmup_protocol.type,
  };
}

// ── Build ───────────────────────────────────────────────────────────────────
const named = JSON.parse(fs.readFileSync(LIB, 'utf8'));
const variants = generateVariants();
const fullLibrary = [...named, ...variants];

// Persist the complete library source (named + generated variants).
fs.writeFileSync(LIB, JSON.stringify(fullLibrary, null, 2) + '\n');

const existing = JSON.parse(fs.readFileSync(OUT, 'utf8'));
const byId = new Map(existing.map((x) => [x.id, x]));

// Enrich / add from the library.
for (const e of fullLibrary) {
  const mapped = mapEntry(e);
  const prev = byId.get(mapped.id);
  if (prev) {
    // keep the existing training defaults; layer in the richer metadata
    byId.set(mapped.id, {
      ...prev,
      difficulty: prev.difficulty ?? mapped.difficulty,
      category: mapped.category,
      type: mapped.type,
      musclesTargeted: mapped.musclesTargeted,
      proTips: mapped.proTips,
      videoUrl: mapped.videoUrl,
      imageUrl: mapped.imageUrl,
      warmupType: mapped.warmupType,
    });
  } else {
    byId.set(mapped.id, mapped);
  }
}

const result = [...byId.values()];
fs.writeFileSync(OUT, JSON.stringify(result, null, 2) + '\n');

console.log(`library entries: ${fullLibrary.length}`);
console.log(`exercises.json entries: ${result.length} (was ${existing.length})`);
