import { NavLink } from 'react-router-dom';
import { useNavStore, type TabKey } from '../store/navStore';
import {
  LogIcon,
  PlanIcon,
  ProgressionIcon,
  ProfileIcon,
} from './icons/TabIcons';
import './BottomNav.css';

interface TabConfig {
  key: TabKey;
  label: string;
  path: string;
}

const TABS: TabConfig[] = [
  { key: 'log', label: 'Log', path: '/log' },
  { key: 'plan', label: 'Plan', path: '/plan' },
  { key: 'progression', label: 'Progression', path: '/progression' },
  { key: 'profile', label: 'Profile', path: '/profile' },
];

const ICONS: Record<TabKey, (props: { size?: number }) => JSX.Element> = {
  log: LogIcon,
  plan: PlanIcon,
  progression: ProgressionIcon,
  profile: ProfileIcon,
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
