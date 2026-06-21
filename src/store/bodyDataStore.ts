import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { BodyMeasurement, ProgressPhoto } from '../types/body';
import { capacitorStorage } from './capacitorStorage';

interface BodyDataState {
  logs: BodyMeasurement[];
  photos: ProgressPhoto[];
  addLog: (log: Omit<BodyMeasurement, 'id'>) => void;
  deleteLog: (id: string) => void;
  updateLog: (id: string, log: Partial<BodyMeasurement>) => void;
  addPhoto: (photo: Omit<ProgressPhoto, 'id'>) => void;
  deletePhoto: (id: string) => void;
}

export const useBodyDataStore = create<BodyDataState>()(
  persist(
    immer((set) => ({
      logs: [],
      photos: [],

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

      addPhoto: (photo) =>
        set((state) => {
          const id = `photo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
          state.photos.push({ id, ...photo });
        }),

      deletePhoto: (id) =>
        set((state) => {
          state.photos = state.photos.filter((p) => p.id !== id);
        }),
    })),
    {
      name: 'aura-body-data',
      storage: createJSONStorage(() => capacitorStorage),
      version: 1,
      migrate: (state: unknown) => {
        const s = (state ?? {}) as Record<string, unknown>;
        if (!Array.isArray(s.photos)) s.photos = [];
        if (!Array.isArray(s.logs)) s.logs = [];
        return s as unknown as BodyDataState;
      },
      partialize: (state) => ({ logs: state.logs, photos: state.photos }),
    }
  )
);
