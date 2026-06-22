import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { pageTransition } from '../../utils/motion';
import { useWorkoutDataStore } from '../../store/workoutDataStore';
import WorkoutBuilderView from './WorkoutBuilderView';
import WorkoutDetailView from './WorkoutDetailView';
import { SEED_CATALOG_WORKOUTS } from '../../data/seedWorkouts';
import type { CatalogWorkout } from '../../types/workout';
import { SearchIcon, ChevronRightIcon } from '../../components/icons/AuraIcons';
import './plan.css';

const WORKOUT_FILTERS = [
  'All', 'Push', 'Pull', 'Legs', 'Upper', 'Lower', 'Full Body',
  'Chest', 'Back', 'Shoulders', 'Arms', 'Core',
] as const;
type WorkoutFilter = typeof WORKOUT_FILTERS[number];

interface WorkoutsTabProps {
  createSignal?: number;
}

export default function WorkoutsTab({ createSignal }: WorkoutsTabProps) {
  const [isBuilding, setIsBuilding] = useState(false);
  const [selectedWorkout, setSelectedWorkout] = useState<CatalogWorkout | null>(null);
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<WorkoutFilter>('All');

  const userWorkouts = useWorkoutDataStore((s) => s.userWorkouts);

  useEffect(() => {
    if (createSignal == null || createSignal === 0) return;
    setIsBuilding(true);
  }, [createSignal]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return SEED_CATALOG_WORKOUTS.filter((w) => {
      const tagOk = activeFilter === 'All' || w.category === activeFilter || w.muscleGroup === activeFilter;
      const nameOk = q === '' || w.name.toLowerCase().includes(q);
      return tagOk && nameOk;
    });
  }, [query, activeFilter]);

  if (isBuilding) {
    return <WorkoutBuilderView onClose={() => setIsBuilding(false)} />;
  }
  if (selectedWorkout != null) {
    return (
      <WorkoutDetailView
        workout={selectedWorkout}
        onClose={() => setSelectedWorkout(null)}
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
            placeholder="Search workouts"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search workouts"
          />
        </div>
      </div>

      <div className="exercises-tab__chips" role="tablist">
        {WORKOUT_FILTERS.map((f) => (
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

      {filtered.length === 0 && userWorkouts.length === 0 ? (
        <div className="plan-empty">No workouts match your search.</div>
      ) : (
        <div className="lib-list">
          {userWorkouts.map((w) => (
            <div key={w.id} className="lib-card">
              <span className="lib-thumb" aria-hidden="true" />
              <span className="lib-card__body">
                <span className="lib-title">{w.name}</span>
                <span className="lib-meta">
                  {w.exercises.length} exercise{w.exercises.length === 1 ? '' : 's'} · Custom
                </span>
              </span>
              <ChevronRightIcon size={18} />
            </div>
          ))}
          {filtered.map((w) => (
            <button key={w.id} type="button" className="lib-card" onClick={() => setSelectedWorkout(w)}>
              <span className="lib-thumb" aria-hidden="true" />
              <span className="lib-card__body">
                <span className="lib-title">{w.name}</span>
                <span className="lib-meta">
                  {w.exercises.length} exercise{w.exercises.length === 1 ? '' : 's'} · {w.category}
                </span>
              </span>
              <ChevronRightIcon size={18} />
            </button>
          ))}
        </div>
      )}
    </motion.div>
  );
}
