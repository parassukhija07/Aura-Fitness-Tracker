import { NavLink } from 'react-router-dom';
import { useNavStore, type TabKey } from '../store/navStore';
import {
  CalendarIcon,
  DumbbellIcon,
  ChartBarIcon,
  PersonIcon,
} from './icons/AuraIcons';
import './BottomNav.css';

interface TabConfig {
  key: TabKey;
  label: string;
  path: string;
}

const TABS: TabConfig[] = [
  { key: 'log', label: 'Log', path: '/log' },
  { key: 'plan', label: 'Plan', path: '/plan' },
  { key: 'progression', label: 'Progress', path: '/progression' },
  { key: 'profile', label: 'Profile', path: '/profile' },
];

const ICONS: Record<TabKey, (props: { size?: number }) => JSX.Element> = {
  log: CalendarIcon,
  plan: DumbbellIcon,
  progression: ChartBarIcon,
  profile: PersonIcon,
};

export default function BottomNav() {
  const setActiveTab = useNavStore((s) => s.setActiveTab);

  return (
    <nav className="bottom-nav">
      {TABS.map((tab) => {
        const Icon = ICONS[tab.key];
        return (
          <NavLink
            key={tab.key}
            to={tab.path}
            className={({ isActive }) =>
              isActive
                ? 'bottom-nav__item bottom-nav__item--active'
                : 'bottom-nav__item'
            }
            onClick={() => setActiveTab(tab.key)}
          >
            <Icon size={22} />
            {tab.label}
          </NavLink>
        );
      })}
    </nav>
  );
}
