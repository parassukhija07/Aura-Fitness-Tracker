jest.mock('@capacitor/preferences', () => ({
  Preferences: {
    get: jest.fn(),
    set: jest.fn().mockResolvedValue(undefined),
    remove: jest.fn().mockResolvedValue(undefined),
  },
}));

import { useBodyDataStore } from './bodyDataStore';

beforeEach(() => {
  useBodyDataStore.setState({ logs: [] });
});

describe('bodyDataStore', () => {
  test('addLog appends without mutating', () => {
    const { addLog } = useBodyDataStore.getState();

    addLog({ date: '2026-06-20', weightKg: 80 });

    const logs = useBodyDataStore.getState().logs;
    expect(logs.length).toBe(1);
    expect(logs[0].weightKg).toBe(80);
    expect(logs[0].date).toBe('2026-06-20');
    expect(logs[0].id.startsWith('body-')).toBe(true);

    // Capture array reference before second add
    const refBefore = useBodyDataStore.getState().logs;
    addLog({ date: '2026-06-21', weightKg: 82 });
    const refAfter = useBodyDataStore.getState().logs;

    expect(refAfter).not.toBe(refBefore);
    expect(refAfter.length).toBe(2);
  });

  test('deleteLog removes the correct entry', () => {
    const { addLog, deleteLog } = useBodyDataStore.getState();

    addLog({ date: '2026-06-20', weightKg: 80 });
    addLog({ date: '2026-06-21', weightKg: 82 });

    const logs = useBodyDataStore.getState().logs;
    const targetId = logs[0].id;
    const keepId = logs[1].id;

    deleteLog(targetId);

    const after = useBodyDataStore.getState().logs;
    expect(after.length).toBe(1);
    expect(after[0].id).toBe(keepId);

    // no-op on nonexistent id
    deleteLog('nonexistent');
    expect(useBodyDataStore.getState().logs.length).toBe(1);
  });

  test('updateLog merges partial without touching others', () => {
    const { addLog, updateLog } = useBodyDataStore.getState();

    addLog({ date: '2026-06-20', weightKg: 80 });
    addLog({ date: '2026-06-21', weightKg: 82 });

    const logs = useBodyDataStore.getState().logs;
    const id0 = logs[0].id;
    const originalDate = logs[0].date;
    const log1Before = { ...logs[1] };

    updateLog(id0, { weightKg: 99 });

    const updated = useBodyDataStore.getState().logs;
    expect(updated[0].weightKg).toBe(99);
    expect(updated[0].date).toBe(originalDate);
    expect(updated[0].id).toBe(id0);

    // logs[1] is completely unchanged
    expect(updated[1].weightKg).toBe(log1Before.weightKg);
    expect(updated[1].date).toBe(log1Before.date);
    expect(updated[1].id).toBe(log1Before.id);

    // no-op on nonexistent id
    updateLog('nonexistent', { weightKg: 1 });
    expect(useBodyDataStore.getState().logs.length).toBe(2);
  });
});
