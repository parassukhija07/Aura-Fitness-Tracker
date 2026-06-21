import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { pageTransition } from '../../utils/motion';
import { useWorkoutDataStore } from '../../store/workoutDataStore';
import WorkoutBuilderView from './WorkoutBuilderView';
import WorkoutDetailView from './WorkoutDetailView';
import { SEED_CATALOG_WORKOUTS } from '../../data/seedWorkouts';
import type { CatalogWorkout } from '../../types/workout';
import './plan.css';

const WORKOUT_FILTERS = [
  'All', 'Push', 'Pull', 'Legs', 'Upper', 'Lower', 'Full Body',
  'Chest', 'Back', 'Shoulders', 'Arms', 'Core',
] as const;
type WorkoutFilter = typeof WORKOUT_FILTERS[number];

export default function WorkoutsTab() {
  const [isBuilding, setIsBuilding] = useState(false);
  const [selectedWorkout, setSelectedWorkout] = useState<CatalogWorkout | null>(null);
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<WorkoutFilter>('All');

  const getActiveProgram = useWorkoutDataStore((s) => s.getActiveProgram);
  const getExerciseById = useWorkoutDataStore((s) => s.getExerciseById);
  const userWorkouts = useWorkoutDataStore((s) => s.userWorkouts);
  const activeProgram = getActiveProgram();

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
      <button type="button" className="workout-builder-fab" onClick={() => setIsBuilding(true)}>
        Create Workout
      </button>

      <div className="exercises-tab__search">
        <input
          type="text"
          className="exercises-tab__search-input"
          placeholder="Search workouts"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search workouts"
        />
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

      {filtered.length === 0 ? (
        <div className="plan-empty">No workouts match your search.</div>
      ) : (
        <div className="plan-grid">
          {filtered.map((w) => (
            <div key={w.id} className="plan-card" onClick={() => setSelectedWorkout(w)} style={{ cursor: 'pointer' }}>
              <p className="plan-card__name">{w.name}</p>
              <p className="plan-card__sub">{w.category}</p>
              <span className="plan-badge">{w.exercises.length} exercises</span>
            </div>
          ))}
        </div>
      )}

      {userWorkouts.length > 0 && (
        <div className="plan-list" style={{ marginTop: 16 }}>
          {userWorkouts.map((w) => (
            <div key={w.id} className="plan-card">
              <p className="plan-card__name">{w.name}</p>
              <p className="plan-card__sub">{w.exercises.length} exercise{w.exercises.length !== 1 ? 's' : ''}</p>
            </div>
          ))}
        </div>
      )}

      {activeProgram != null && activeProgram.exercises.length > 0 && (
        <>
          <p className="plan-card__name" style={{ marginTop: 16 }}>{activeProgram.name} — Session</p>
          <div className="plan-list">
            {activeProgram.exercises.map((progEx) => {
              const ex = getExerciseById(progEx.exerciseId);
              return (
                <div key={progEx.exerciseId} className="plan-card">
                  <p className="plan-card__name">{ex ? ex.name : progEx.exerciseId}</p>
                  <p className="plan-card__sub">{progEx.sets} sets &times; {progEx.repsMin}–{progEx.repsMax} reps</p>
                </div>
              );
            })}
          </div>
        </>
      )}
    </motion.div>
  );
}
