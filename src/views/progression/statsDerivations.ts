import type { MuscleGroup } from '../../types/workout';
import type { CompletedSession } from '../../store/statsDataStore';

export const MUSCLE_GROUPS: MuscleGroup[] = ['Chest', 'Back', 'Shoulders', 'Arms', 'Legs', 'Core'];

export interface MuscleVolumeDatum {
  muscleGroup: MuscleGroup;
  volume: number;
}

export interface PersonalRecord {
  exerciseId: string;
  exerciseName: string;
  muscleGroup: MuscleGroup;
  bestWeight: number;
  bestReps: number;
}

export interface PersonalRecordGroup {
  muscleGroup: MuscleGroup;
  records: PersonalRecord[];
}

export function getWeeklyMuscleVolume(sessions: CompletedSession[], now?: Date): MuscleVolumeDatum[] {
  const ref = now ?? new Date();
  const dayOfWeek = ref.getDay();
  const mondayOffset = (dayOfWeek + 6) % 7;
  const monday = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate() - mondayOffset);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  const volumeMap: Record<string, number> = {};
  for (const mg of MUSCLE_GROUPS) {
    volumeMap[mg] = 0;
  }

  for (const session of sessions) {
    const parts = session.date.split('-');
    const sessionDate = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    if (sessionDate < monday || sessionDate > sunday) continue;

    for (const exercise of session.exercises) {
      for (const set of exercise.sets) {
        if (set.completed) {
          volumeMap[exercise.muscleGroup] = (volumeMap[exercise.muscleGroup] ?? 0) + set.reps * set.weight;
        }
      }
    }
  }

  return MUSCLE_GROUPS.map((mg) => ({ muscleGroup: mg, volume: volumeMap[mg] }));
}

export function getPersonalRecords(sessions: CompletedSession[]): PersonalRecord[] {
  const recordMap = new Map<string, { exerciseName: string; muscleGroup: MuscleGroup; bestWeight: number; bestReps: number }>();

  for (const session of sessions) {
    for (const exercise of session.exercises) {
      for (const set of exercise.sets) {
        if (!set.completed || set.weight === 0) continue;

        const existing = recordMap.get(exercise.exerciseId);
        if (!existing) {
          recordMap.set(exercise.exerciseId, {
            exerciseName: exercise.exerciseName,
            muscleGroup: exercise.muscleGroup,
            bestWeight: set.weight,
            bestReps: set.reps,
          });
        } else {
          if (
            set.weight > existing.bestWeight ||
            (set.weight === existing.bestWeight && set.reps > existing.bestReps)
          ) {
            existing.bestWeight = set.weight;
            existing.bestReps = set.reps;
          }
        }
      }
    }
  }

  return Array.from(recordMap.entries()).map(([exerciseId, data]) => ({
    exerciseId,
    exerciseName: data.exerciseName,
    muscleGroup: data.muscleGroup,
    bestWeight: data.bestWeight,
    bestReps: data.bestReps,
  }));
}

export function groupPersonalRecords(records: PersonalRecord[]): PersonalRecordGroup[] {
  const groupMap = new Map<MuscleGroup, PersonalRecord[]>();

  for (const mg of MUSCLE_GROUPS) {
    groupMap.set(mg, []);
  }

  for (const record of records) {
    const arr = groupMap.get(record.muscleGroup);
    if (arr) arr.push(record);
  }

  return MUSCLE_GROUPS.filter((mg) => (groupMap.get(mg)?.length ?? 0) > 0).map((mg) => ({
    muscleGroup: mg,
    records: groupMap.get(mg)!,
  }));
}
