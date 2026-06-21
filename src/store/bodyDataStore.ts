import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { BodyMeasurement } from '../types/body';
import { capacitorStorage } from './capacitorStorage';

interface BodyDataState {
  logs: BodyMeasurement[];
  addLog: (log: Omit<BodyMeasurement, 'id'>) => void;
  deleteLog: (id: string) => void;
  updateLog: (id: string, log: Partial<BodyMeasurement>) => void;
}

export const useBodyDataStore = create<BodyDataState>()(
  persist(
    immer((set) => ({
      logs: [],

      addLog: (log) =>
        set((state) => {
          const id = `body-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
          state.logs.push({ id, ...log });
        }),

      deleteLog: (id) =>
        set((state) => {
          state.logs = state.logs.filter((l) => l.id !== id);
        }),

      updateLog: (id, log) =>
        set((state) => {
          const entry = state.logs.find((l) => l.id === id);
          if (!entry) return;
          Object.assign(entry, log);
        }),
    })),
    {
      name: 'aura-body-data',
      storage: createJSONStorage(() => capacitorStorage),
      partialize: (state) => ({ logs: state.logs }),
    }
  )
);
