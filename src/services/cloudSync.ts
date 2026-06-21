import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useWorkoutDataStore } from '../store/workoutDataStore';
import { useStatsDataStore } from '../store/statsDataStore';

/**
 * Shape of the document persisted to Firestore at users/{uid}.
 * Both payloads are plain JSON-safe snapshots of the live Zustand state.
 */
interface CloudBackup {
  workoutData: Record<string, unknown>;
  statsData: Record<string, unknown>;
  updatedAt: string;
}

/**
 * Strip non-serializable values (functions, undefined, Dates -> ISO) from a
 * Zustand state snapshot. getState() on the workout store returns selector
 * functions (getActiveProgram, etc.) which Firestore cannot persist; the
 * JSON roundtrip removes them and normalizes any Date objects to ISO strings.
 */
function toSerializable<T>(state: T): Record<string, unknown> {
  return JSON.parse(JSON.stringify(state)) as Record<string, unknown>;
}

/**
 * Reads both stores and writes a single backup document to users/{uid}.
 * Uses setDoc (full overwrite) so the cloud copy always mirrors local state.
 */
export async function backupToCloud(uid: string): Promise<void> {
  const workoutData = toSerializable(useWorkoutDataStore.getState());
  const statsData = toSerializable(useStatsDataStore.getState());

  // An in-progress session is local/ephemeral and must never be backed up.
  workoutData.activeSession = null;

  const payload: CloudBackup = {
    workoutData,
    statsData,
    updatedAt: new Date().toISOString(),
  };

  await setDoc(doc(db, 'users', uid), payload);
}

/**
 * Fetches users/{uid}. If the document exists, applies the backed-up data to
 * both stores via setState. No-op (returns false) if no backup is found.
 * Returns true when a restore was applied.
 */
export async function restoreFromCloud(uid: string): Promise<boolean> {
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return false;

  const data = snap.data() as Partial<CloudBackup> | undefined;
  if (!data) return false;

  const exercises = (data.workoutData as Record<string, unknown> | undefined)?.exercises;
  const completedWorkoutDates = (data.statsData as Record<string, unknown> | undefined)?.completedWorkoutDates;

  if (!Array.isArray(exercises) || !Array.isArray(completedWorkoutDates)) {
    throw new Error('Invalid backup shape');
  }

  if (data.workoutData) {
    useWorkoutDataStore.setState(data.workoutData as Partial<ReturnType<typeof useWorkoutDataStore.getState>>);
  }
  if (data.statsData) {
    useStatsDataStore.setState(data.statsData as Partial<ReturnType<typeof useStatsDataStore.getState>>);
  }

  return true;
}
