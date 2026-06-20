import { useState } from 'react';
import './PlanView.css';
import MyPlansTab from './plan/MyPlansTab';
import ProgramsTab from './plan/ProgramsTab';
import WorkoutsTab from './plan/WorkoutsTab';
import ExercisesTab from './plan/ExercisesTab';

const SUB_TABS = ['My Plans', 'Programs', 'Workouts', 'Exercises'] as const;
type SubTab = typeof SUB_TABS[number];

export default function PlanView() {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('My Plans');

  return (
    <section className="view plan-view">
      <h1 className="plan-view__title">Plan</h1>
      <nav className="plan-tabs" role="tablist">
        {SUB_TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            role="tab"
            className={tab === activeSubTab ? 'plan-tabs__tab plan-tabs__tab--active' : 'plan-tabs__tab'}
            onClick={() => setActiveSubTab(tab)}
          >{tab}</button>
        ))}
      </nav>
      <div className="plan-view__content">
        {activeSubTab === 'My Plans' && <MyPlansTab />}
        {activeSubTab === 'Programs' && <ProgramsTab />}
        {activeSubTab === 'Workouts' && <WorkoutsTab />}
        {activeSubTab === 'Exercises' && <ExercisesTab />}
      </div>
    </section>
  );
}
