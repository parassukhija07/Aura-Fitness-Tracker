import exercisesData from '../../data/exercises.json';
import type { MuscleGroup } from '../../types/workout';

export type Equipment = 'Barbell' | 'Dumbbell' | 'Machine' | 'Cable' | 'Bodyweight';

interface RawExercise {
  id: string;
  equipment?: string;
}

const rawList = exercisesData as RawExercise[];

export function getEquipment(exerciseId: string): Equipment | undefined {
  const found = rawList.find((e) => e.id === exerciseId);
  if (!found || !found.equipment) return undefined;
  return found.equipment as Equipment;
}

export function getVideoUrl(exerciseName: string): string {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(exerciseName + ' proper form')}`;
}

const TIPS: Record<MuscleGroup, string> = {
  Chest: 'Keep your shoulder blades retracted and drive your feet into the floor for a stable pressing base.',
  Back: 'Initiate every pull with your elbows, not your hands — think of your hands as hooks.',
  Legs: 'Brace your core like you are about to take a punch before each rep.',
  Shoulders: 'Control the eccentric on every press; lowering slowly builds more muscle than lifting fast.',
  Arms: 'Avoid swinging; isolate the target muscle by keeping your upper arm stationary.',
  Core: 'Exhale forcefully at peak contraction to maximise intra-abdominal pressure.',
};

export function getTip(muscleGroup: MuscleGroup): string {
  return TIPS[muscleGroup] ?? 'Focus on controlled reps and full range of motion.';
}
