import { useState } from 'react';
import './progression/progression.css';
import StatsTab from './progression/StatsTab';
import BodyTab from './progression/BodyTab';
import NutritionTab from './progression/NutritionTab';
import { motion } from 'framer-motion';
import { pageTransition } from '../utils/motion';
import { SegmentedControl } from '../design';

type TopTab = 'Stats' | 'Body';
type BodyTab = 'Measurements' | 'Nutrition';

export default function ProgressionView() {
  const [topTab, setTopTab] = useState<TopTab>('Stats');
  const [bodyTab, setBodyTab] = useState<BodyTab>('Measurements');

  return (
    <motion.section className="view progression-view" {...pageTransition}>
      <h1 className="progression-view__title t-large-title">Progress</h1>
      <SegmentedControl
        options={[
          { value: 'Stats', label: 'Stats' },
          { value: 'Body', label: 'Body' },
        ]}
        value={topTab}
        onChange={(v) => setTopTab(v as TopTab)}
      />
      {topTab === 'Body' && (
        <div className="prog-body-seg">
          <SegmentedControl
            options={[
              { value: 'Measurements', label: 'Measurements' },
              { value: 'Nutrition', label: 'Nutrition' },
            ]}
            value={bodyTab}
            onChange={(v) => setBodyTab(v as BodyTab)}
          />
        </div>
      )}
      <div className="progression-view__content">
        {topTab === 'Stats' && <StatsTab />}
        {topTab === 'Body' && bodyTab === 'Measurements' && <BodyTab />}
        {topTab === 'Body' && bodyTab === 'Nutrition' && <NutritionTab />}
      </div>
    </motion.section>
  );
}
