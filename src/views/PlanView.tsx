import { useState } from 'react';
import './PlanView.css';
import MyPlansTab from './plan/MyPlansTab';
import ProgramsTab from './plan/ProgramsTab';
import WorkoutsTab from './plan/WorkoutsTab';
import ExercisesTab from './plan/ExercisesTab';
import { PlusIcon } from '../components/icons/AuraIcons';
import { motion } from 'framer-motion';
import { pageTransition } from '../utils/motion';

const SUB_TABS = ['My Plans', 'Programs', 'Workouts', 'Exercises'] as const;
type SubTab = typeof SUB_TABS[number];

export default function PlanView() {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('My Plans');
  // Bumped to signal the active tab to open its create flow.
  const [createSignal, setCreateSignal] = useState(0);

  return (
    <motion.section className="view plan-view" {...pageTransition}>
      <div className="plan-view__header">
        <h1 className="plan-view__title">Plan</h1>
        <button
          type="button"
          className="plan-view__add"
          aria-label="Create"
          onClick={() => setCreateSignal((n) => n + 1)}
        >
          <PlusIcon size={20} />
        </button>
      </div>
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
        {activeSubTab === 'My Plans' && <MyPlansTab createSignal={createSignal} />}
        {activeSubTab === 'Programs' && <ProgramsTab createSignal={createSignal} />}
        {activeSubTab === 'Workouts' && <WorkoutsTab createSignal={createSignal} />}
        {activeSubTab === 'Exercises' && <ExercisesTab createSignal={createSignal} />}
      </div>
    </motion.section>
  );
}
