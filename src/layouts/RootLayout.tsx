import '../store/authStore';
import { useEffect, useLayoutEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useNavStore, type TabKey } from '../store/navStore';
import { useUserPreferencesStore } from '../store/userPreferencesStore';
import BottomNav from '../components/BottomNav';

// Map URL pathnames to TabKey values.
// The URL is the source of truth; the store mirrors it.
function pathnameToTab(pathname: string): TabKey | null {
  if (pathname.startsWith('/log')) return 'log';
  if (pathname.startsWith('/plan')) return 'plan';
  if (pathname.startsWith('/progression')) return 'progression';
  if (pathname.startsWith('/profile')) return 'profile';
  return null;
}

export default function RootLayout() {
  const location = useLocation();
  const setActiveTab = useNavStore((s) => s.setActiveTab);
  const darkMode = useUserPreferencesStore((s) => s.darkMode);

  // Sync the store from the current pathname on every route change so that
  // browser back/forward navigation keeps the tab highlight accurate.
  useEffect(() => {
    const tab = pathnameToTab(location.pathname);
    if (tab) setActiveTab(tab);
  }, [location.pathname, setActiveTab]);

  useLayoutEffect(() => {
    const root = document.documentElement;
    if (darkMode) root.classList.add('dark-theme');
    else root.classList.remove('dark-theme');
  }, [darkMode]);

  return (
    <div className="app-shell">
      <main className="app-content">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
