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
}));

// Mock the firebase lib so importing ../lib/firebase does not init the real app.
jest.mock('../lib/firebase', () => ({
  db: {},
}));

import { setDoc, getDoc, doc } from 'firebase/firestore';
import { backupToCloud, restoreFromCloud } from './cloudSync';
import { useWorkoutDataStore } from '../store/workoutDataStore';
import { useStatsDataStore } from '../store/statsDataStore';

describe('cloudSync', () => {
  beforeEach(() => jest.clearAllMocks());

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
    await expect(restoreFromCloud('user-123')).rejects.toThrow('Invalid backup shape');
  });
});
