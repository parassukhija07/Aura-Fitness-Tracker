import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { pageTransition } from '../../utils/motion';
import { useWorkoutDataStore } from '../../store/workoutDataStore';
import ProgramBuilderView from './ProgramBuilderView';
import ProgramDetailView from './ProgramDetailView';
import { SEED_CATALOG_PROGRAMS } from '../../data/seedPrograms';
import type { CatalogProgram } from '../../types/workout';
import './plan.css';

const GOAL_FILTERS = ['All', 'Strength', 'Hypertrophy', 'Endurance', 'Fat Loss'] as const;
type GoalFilter = typeof GOAL_FILTERS[number];

export default function ProgramsTab() {
  const userPrograms = useWorkoutDataStore((s) => s.userPrograms);
  const [isBuilding, setIsBuilding] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<CatalogProgram | null>(null);
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<GoalFilter>('All');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return SEED_CATALOG_PROGRAMS.filter((p) => {
      const goalOk = activeFilter === 'All' || p.goal === activeFilter;
      const nameOk = q === '' || p.name.toLowerCase().includes(q);
      return goalOk && nameOk;
    });
  }, [query, activeFilter]);

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
      <button type="button" className="workout-builder-fab" onClick={() => setIsBuilding(true)}>
        Create New Program
      </button>

      <div className="exercises-tab__search">
        <input
          type="text"
          className="exercises-tab__search-input"
          placeholder="Search programs"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search programs"
        />
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
        <div className="plan-grid">
          {filtered.map((p) => (
            <div key={p.id} className="plan-card" onClick={() => setSelectedProgram(p)} style={{ cursor: 'pointer' }}>
              <p className="plan-card__name">{p.name}</p>
              <p className="plan-card__sub">{p.description}</p>
              <span className="plan-badge">{p.goal}</span>
              <span className="plan-badge" style={{ marginLeft: 4 }}>{p.workouts.length} workouts</span>
            </div>
          ))}
        </div>
      )}

      {userPrograms.length > 0 && (
        <>
          <p className="plan-card__name" style={{ marginTop: 16 }}>My Plans</p>
          <div className="plan-grid">
            {userPrograms.map((program) => (
              <div key={program.id} className="plan-card">
                <p className="plan-card__name">{program.name}</p>
                <p className="plan-card__sub">{program.description}</p>
                <span className="plan-badge">{program.exercises.length} exercises</span>
              </div>
            ))}
          </div>
        </>
      )}
    </motion.div>
  );
}
