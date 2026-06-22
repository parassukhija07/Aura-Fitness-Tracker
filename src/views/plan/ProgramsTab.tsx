import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { pageTransition } from '../../utils/motion';
import { useWorkoutDataStore } from '../../store/workoutDataStore';
import ProgramBuilderView from './ProgramBuilderView';
import ProgramDetailView from './ProgramDetailView';
import { SEED_CATALOG_PROGRAMS } from '../../data/seedPrograms';
import type { CatalogProgram } from '../../types/workout';
import { SearchIcon, ChevronRightIcon, CheckIcon } from '../../components/icons/AuraIcons';
import './plan.css';

const GOAL_FILTERS = ['All', 'Strength', 'Hypertrophy', 'Endurance', 'Fat Loss'] as const;
type GoalFilter = typeof GOAL_FILTERS[number];

interface ProgramsTabProps {
  createSignal?: number;
}

export default function ProgramsTab({ createSignal }: ProgramsTabProps) {
  const userPrograms = useWorkoutDataStore((s) => s.userPrograms);
  const [isBuilding, setIsBuilding] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<CatalogProgram | null>(null);
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<GoalFilter>('All');

  useEffect(() => {
    if (createSignal == null || createSignal === 0) return;
    setIsBuilding(true);
  }, [createSignal]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return SEED_CATALOG_PROGRAMS.filter((p) => {
      const goalOk = activeFilter === 'All' || p.goal === activeFilter;
      const nameOk = q === '' || p.name.toLowerCase().includes(q);
      return goalOk && nameOk;
    });
  }, [query, activeFilter]);

  const addedIds = new Set(userPrograms.map((p) => p.id));

  if (isBuilding) return <ProgramBuilderView onClose={() => setIsBuilding(false)} />;
  if (selectedProgram != null) {
    return (
      <ProgramDetailView
        program={selectedProgram}
        onClose={() => setSelectedProgram(null)}
      />
    );
  }

  return (
    <motion.div className="exercises-tab" {...pageTransition}>
      <div className="exercises-tab__search">
        <div className="exercises-tab__search-wrap">
          <span className="exercises-tab__search-icon"><SearchIcon size={16} /></span>
          <input
            type="text"
            className="exercises-tab__search-input"
            placeholder="Search programs"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search programs"
          />
        </div>
      </div>

      <div className="exercises-tab__chips" role="tablist">
        {GOAL_FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            className={
              f === activeFilter
                ? 'exercises-tab__chip exercises-tab__chip--active'
                : 'exercises-tab__chip'
            }
            onClick={() => setActiveFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="plan-empty">No programs match your search.</div>
      ) : (
        <div className="lib-list">
          {filtered.map((p) => (
            <button key={p.id} type="button" className="lib-card" onClick={() => setSelectedProgram(p)}>
              <span className="lib-thumb" aria-hidden="true" />
              <span className="lib-card__body">
                <span className="lib-title">{p.name}</span>
                <span className="lib-meta">{p.workouts.length} workouts · {p.goal}</span>
              </span>
              {addedIds.has(p.id) ? (
                <span className="lib-card__added"><CheckIcon size={12} /> Added</span>
              ) : (
                <ChevronRightIcon size={18} />
              )}
            </button>
          ))}
        </div>
      )}
    </motion.div>
  );
}
