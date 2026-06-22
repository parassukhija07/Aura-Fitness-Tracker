// Mock @capacitor/preferences so the Zustand persist middleware does not hit
// window.localStorage in the node test environment.
jest.mock('@capacitor/preferences', () => ({
  Preferences: {
    get: jest.fn().mockResolvedValue({ value: null }),
    set: jest.fn().mockResolvedValue(undefined),
    remove: jest.fn().mockResolvedValue(undefined),
  },
}));

// Mock firebase/firestore BEFORE importing the service.
jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(() => ({})),
  doc: jest.fn((_db, ...path: string[]) => ({ path: path.join('/') })),
  setDoc: jest.fn(() => Promise.resolve()),
  getDoc: jest.fn(),
  deleteDoc: jest.fn(() => Promise.resolve()),
}));

// Mock the firebase lib so importing ../lib/firebase does not init the real app.
jest.mock('../lib/firebase', () => ({
  db: {},
}));

import { setDoc, getDoc, doc, deleteDoc } from 'firebase/firestore';
import { backupToCloud, restoreFromCloud, deleteCloudBackup } from './cloudSync';
import { useWorkoutDataStore } from '../store/workoutDataStore';
import { useStatsDataStore } from '../store/statsDataStore';
import { useBodyDataStore } from '../store/bodyDataStore';

describe('cloudSync', () => {
  beforeEach(() => jest.clearAllMocks());

  test('deleteCloudBackup deletes the users/{uid} document', async () => {
    await deleteCloudBackup('user-123');
    expect(doc).toHaveBeenCalledWith({}, 'users', 'user-123');
    expect(deleteDoc).toHaveBeenCalledTimes(1);
  });

  test('backupToCloud writes a JSON-safe doc to users/{uid}', async () => {
    await backupToCloud('user-123');
    expect(doc).toHaveBeenCalledWith({}, 'users', 'user-123');
    expect(setDoc).toHaveBeenCalledTimes(1);
    const payload = (setDoc as jest.Mock).mock.calls[0][1];
    // Roundtrip must have stripped the store's selector functions.
    expect(typeof (payload.workoutData as any).getActiveProgram).toBe('undefined');
    expect(payload.workoutData.exercises).toBeDefined();
    expect(payload.statsData.lifetimeStats).toBeDefined();
    expect(typeof payload.updatedAt).toBe('string');
  });

  test('restoreFromCloud applies state when doc exists', async () => {
    (getDoc as jest.Mock).mockResolvedValue({
      exists: () => true,
      data: () => ({
        workoutData: { exercises: [], programs: [], userPlan: null, activeSession: null, userWorkouts: [] },
        statsData: { completedWorkoutDates: ['2026-01-01'], lifetimeStats: { totalSessions: 1, totalSets: 1, totalVolumeKg: 1, totalPRs: 1 } },
      }),
    });
    const ok = await restoreFromCloud('user-123');
    expect(ok).toBe(true);
    expect(useStatsDataStore.getState().completedWorkoutDates).toEqual(['2026-01-01']);
    // Action functions survive the merge-mode setState.
    expect(typeof useWorkoutDataStore.getState().resetToSeed).toBe('function');
  });

  test('restoreFromCloud strips unknown top-level keys and still restores both stores', async () => {
    (getDoc as jest.Mock).mockResolvedValue({
      exists: () => true,
      data: () => ({
        // Extraneous top-level field that is NOT in BackupPayloadSchema.
        // Zod's default z.object() must strip this, not reject the payload.
        updatedAt: '2026-06-21T16:40:00.000Z',
        workoutData: { exercises: [], programs: [], userPlan: null, activeSession: null, userWorkouts: [] },
        statsData: { completedWorkoutDates: ['2026-02-02'], lifetimeStats: { totalSessions: 2, totalSets: 2, totalVolumeKg: 2, totalPRs: 2 } },
      }),
    });

    // Must NOT throw despite the extra key.
    const ok = await restoreFromCloud('user-123');

    expect(ok).toBe(true);
    // Both stores received the restored, schema-validated data.
    expect(useStatsDataStore.getState().completedWorkoutDates).toEqual(['2026-02-02']);
    expect(useStatsDataStore.getState().lifetimeStats.totalSessions).toBe(2);
    expect(useWorkoutDataStore.getState().exercises).toEqual([]);
    // Action functions survive the merge-mode setState.
    expect(typeof useWorkoutDataStore.getState().resetToSeed).toBe('function');
  });

  test('restoreFromCloud is a no-op when doc is missing', async () => {
    (getDoc as jest.Mock).mockResolvedValue({ exists: () => false });
    const ok = await restoreFromCloud('user-123');
    expect(ok).toBe(false);
  });

  test('restoreFromCloud throws when the cloud doc has a corrupted shape', async () => {
    (getDoc as jest.Mock).mockResolvedValue({
      exists: () => true,
      data: () => ({
        // exercises is a non-array object -> invalid shape
        workoutData: { exercises: { bad: 'shape' }, programs: [], userPlan: null, activeSession: null, userWorkouts: [] },
        statsData: { completedWorkoutDates: ['2026-01-01'], lifetimeStats: { totalSessions: 1, totalSets: 1, totalVolumeKg: 1, totalPRs: 1 } },
      }),
    });
    await expect(restoreFromCloud('user-123')).rejects.toThrow('Invalid backup schema');
  });

  test('restoreFromCloud throws when a program exercise has sets as a string', async () => {
    (getDoc as jest.Mock).mockResolvedValue({
      exists: () => true,
      data: () => ({
        workoutData: {
          exercises: [],
          programs: [
            {
              id: 'p1',
              name: 'Push',
              description: 'Push day',
              exercises: [
                // CORRUPTION POINT: sets must be a number, not a string.
                { exerciseId: 'bench', sets: '3', repsMin: 8, repsMax: 12 },
              ],
            },
          ],
          userPlan: null,
          activeSession: null,
          userWorkouts: [],
        },
        statsData: {
          completedWorkoutDates: ['2026-01-01'],
          lifetimeStats: { totalSessions: 1, totalSets: 1, totalVolumeKg: 1, totalPRs: 1 },
        },
      }),
    });
    await expect(restoreFromCloud('user-123')).rejects.toThrow('Invalid backup schema');
  });

  test('restoreFromCloud throws when lifetimeStats.totalVolumeKg is missing', async () => {
    (getDoc as jest.Mock).mockResolvedValue({
      exists: () => true,
      data: () => ({
        workoutData: { exercises: [], programs: [], userPlan: null, activeSession: null, userWorkouts: [] },
        statsData: {
          completedWorkoutDates: ['2026-01-01'],
          // CORRUPTION POINT: totalVolumeKg is omitted (undefined).
          lifetimeStats: { totalSessions: 1, totalSets: 1, totalPRs: 1 },
        },
      }),
    });
    await expect(restoreFromCloud('user-123')).rejects.toThrow('Invalid backup schema');
  });

  test('round-trips bodyData: backup includes it and restore applies it', async () => {
    // Seed the body store, then back up.
    useBodyDataStore.setState({
      logs: [{ id: 'body-1', date: '2026-01-12', weightKg: 80.5 }],
    });

    await backupToCloud('user-123');
    const payload = (setDoc as jest.Mock).mock.calls[0][1];
    expect(payload.bodyData).toBeDefined();
    expect(payload.bodyData.logs).toEqual([
      { id: 'body-1', date: '2026-01-12', weightKg: 80.5 },
    ]);

    // Clear local state, then restore from a doc that contains bodyData.
    useBodyDataStore.setState({ logs: [] });
    (getDoc as jest.Mock).mockResolvedValue({
      exists: () => true,
      data: () => ({
        workoutData: { exercises: [], programs: [], userPlan: null, activeSession: null, userWorkouts: [] },
        statsData: { completedWorkoutDates: ['2026-01-01'], lifetimeStats: { totalSessions: 1, totalSets: 1, totalVolumeKg: 1, totalPRs: 1 } },
        bodyData: { logs: [{ id: 'body-2', date: '2026-02-02', weightKg: 79.0 }] },
      }),
    });

    const ok = await restoreFromCloud('user-123');
    expect(ok).toBe(true);
    expect(useBodyDataStore.getState().logs).toEqual([
      { id: 'body-2', date: '2026-02-02', weightKg: 79.0 },
    ]);
  });

  test('restoreFromCloud succeeds and skips bodyData when it is absent (legacy backup)', async () => {
    useBodyDataStore.setState({ logs: [{ id: 'keep', date: '2026-03-03', weightKg: 70 }] });
    (getDoc as jest.Mock).mockResolvedValue({
      exists: () => true,
      data: () => ({
        workoutData: { exercises: [], programs: [], userPlan: null, activeSession: null, userWorkouts: [] },
        statsData: { completedWorkoutDates: ['2026-01-01'], lifetimeStats: { totalSessions: 1, totalSets: 1, totalVolumeKg: 1, totalPRs: 1 } },
        // NO bodyData field.
      }),
    });
    const ok = await restoreFromCloud('user-123');
    expect(ok).toBe(true);
    // Body store must be untouched (not cleared) when backup omits bodyData.
    expect(useBodyDataStore.getState().logs).toEqual([{ id: 'keep', date: '2026-03-03', weightKg: 70 }]);
  });
});
