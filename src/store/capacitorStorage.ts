import { Preferences } from '@capacitor/preferences';
import type { StateStorage } from 'zustand/middleware';

export const capacitorStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    const { value } = await Preferences.get({ key: name });
    return value ?? null;
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await Preferences.set({ key: name, value });
  },
  removeItem: async (name: string): Promise<void> => {
    await Preferences.remove({ key: name });
  },
};
