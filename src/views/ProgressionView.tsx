import { useState } from 'react';
import './progression/progression.css';
import StatsTab from './progression/StatsTab';
import BodyTab from './progression/BodyTab';

const SUB_TABS = ['Stats', 'Body'] as const;
type SubTab = typeof SUB_TABS[number];

export default function ProgressionView() {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('Stats');

  return (
    <section className="view progression-view">
      <h1 className="progression-view__title">Progression</h1>
      <nav className="prog-tabs" role="tablist">
        {SUB_TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            role="tab"
            className={tab === activeSubTab ? 'prog-tabs__tab prog-tabs__tab--active' : 'prog-tabs__tab'}
            onClick={() => setActiveSubTab(tab)}
          >{tab}</button>
        ))}
      </nav>
      <div className="progression-view__content">
        {activeSubTab === 'Stats' && <StatsTab />}
        {activeSubTab === 'Body' && <BodyTab />}
      </div>
    </section>
  );
}
