import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { pageTransition } from '../../utils/motion';
import exercisesData from '../../data/exercises.json';
import ExerciseDetailPage from './ExerciseDetailPage';
import { Chip } from '../../design';
import { MediaPlaceholder } from '../../design';
import { SearchIcon } from '../../components/icons/AuraIcons';
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

const BODY_FILTERS = ['All', 'Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core'] as const;
const EQUIP_FILTERS = ['All', 'Cable', 'Barbell', 'Dumbbell', 'Smith', 'Machine', 'Bodyweight'] as const;

type BodyFilter = typeof BODY_FILTERS[number];
type EquipFilter = typeof EQUIP_FILTERS[number];

export default function ExercisesTab() {
  const [query, setQuery] = useState('');
  const [bodyFilter, setBodyFilter] = useState<BodyFilter>('All');
  const [equipFilter, setEquipFilter] = useState<EquipFilter>('All');
  const [selectedExercise, setSelectedExercise] = useState<CatalogExercise | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return CATALOG.filter((ex) => {
      const groupOk = bodyFilter === 'All' || ex.muscleGroup === bodyFilter;
      const equipOk = equipFilter === 'All' || ex.equipment === equipFilter;
      const nameOk = q === '' || ex.name.toLowerCase().includes(q);
      return groupOk && equipOk && nameOk;
    });
  }, [query, bodyFilter, equipFilter]);

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
      {/* Search */}
      <div className="exercises-tab__search">
        <div className="exercises-tab__search-wrap">
          <span className="exercises-tab__search-icon">
            <SearchIcon size={16} />
          </span>
          <input
            type="text"
            className="exercises-tab__search-input"
            placeholder="Search exercises"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search exercises"
          />
        </div>
      </div>

      {/* Row 1: Body part */}
      <div className="exercises-tab__chips" role="group" aria-label="Filter by body part">
        {BODY_FILTERS.map((f) => (
          <Chip key={f} label={f} selected={f === bodyFilter} onClick={() => setBodyFilter(f)} />
        ))}
      </div>

      {/* Row 2: Equipment */}
      <div className="exercises-tab__chips" role="group" aria-label="Filter by equipment">
        {EQUIP_FILTERS.map((f) => (
          <Chip key={f} label={f} selected={f === equipFilter} color="neutral" onClick={() => setEquipFilter(f)} />
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="plan-empty">No exercises match your search.</div>
      ) : (
        <div className="exercises-tab__grid">
          {filtered.map((ex) => (
            <div
              key={ex.id}
              className="exercises-tab__cell"
              onClick={() => setSelectedExercise(ex)}
            >
              <MediaPlaceholder label={ex.muscleGroup} aspect={4 / 3} rounded="md" />
              <div className="exercises-tab__cell-info">
                <div className="exercises-tab__cell-name">{ex.name}</div>
                <div className="exercises-tab__cell-meta">{ex.muscleGroup} · {ex.equipment}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
