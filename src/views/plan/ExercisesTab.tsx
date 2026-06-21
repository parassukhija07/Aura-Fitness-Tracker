import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { pageTransition } from '../../utils/motion';
import exercisesData from '../../data/exercises.json';
import ExerciseDetailPage from './ExerciseDetailPage';
import './plan.css';

type CatalogExercise = {
  id: string;
  name: string;
  muscleGroup: 'Chest' | 'Back' | 'Legs' | 'Shoulders' | 'Arms' | 'Core';
  equipment: 'Barbell' | 'Dumbbell' | 'Machine' | 'Cable' | 'Bodyweight';
  defaultSets: number;
  defaultRepsMin: number;
  defaultRepsMax: number;
};
const CATALOG = exercisesData as CatalogExercise[];
const FILTERS = ['All', 'Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core'] as const;
type Filter = typeof FILTERS[number];

export default function ExercisesTab() {
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<Filter>('All');
  const [selectedExercise, setSelectedExercise] = useState<CatalogExercise | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return CATALOG.filter((ex) => {
      const groupOk = activeFilter === 'All' || ex.muscleGroup === activeFilter;
      const nameOk = q === '' || ex.name.toLowerCase().includes(q);
      return groupOk && nameOk;
    });
  }, [query, activeFilter]);

  if (selectedExercise != null) {
    return (
      <ExerciseDetailPage
        exercise={selectedExercise}
        onBack={() => setSelectedExercise(null)}
      />
    );
  }

  return (
    <motion.div className="exercises-tab" {...pageTransition}>
      <div className="exercises-tab__search">
        <input
          type="text"
          className="exercises-tab__search-input"
          placeholder="Search exercises"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search exercises"
        />
      </div>

      <div className="exercises-tab__chips" role="tablist">
        {FILTERS.map((f) => (
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
        <div className="plan-empty">No exercises match your search.</div>
      ) : (
        <div className="plan-grid">
          {filtered.map((ex) => (
            <div
                key={ex.id}
                className="plan-card"
                onClick={() => setSelectedExercise(ex)}
                style={{ cursor: 'pointer' }}
              >
              <p className="plan-card__name">{ex.name}</p>
              <p className="plan-card__sub">{ex.muscleGroup}</p>
              <span className="plan-badge">{ex.equipment}</span>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
