import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

export type TabKey = 'log' | 'plan' | 'progression' | 'profile';

interface NavState {
  activeTab: TabKey;
  setActiveTab: (tab: TabKey) => void;
}

// NOTE: This store tracks the active tab for persistence/highlighting.
// Actual navigation is driven by the URL via react-router (see BottomNav).
// The store and the URL are kept consistent: BottomNav calls setActiveTab on
// click, and RootLayout syncs the store from the current pathname on mount/
// route change. The URL is the source of truth; the store mirrors it.
export const useNavStore = create<NavState>()(
  persist(
    immer((set) => ({
      activeTab: 'log' as TabKey,
      setActiveTab: (tab: TabKey) =>
        set((state) => {
          state.activeTab = tab;
        }),
    })),
    {
      name: 'aura-nav',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
