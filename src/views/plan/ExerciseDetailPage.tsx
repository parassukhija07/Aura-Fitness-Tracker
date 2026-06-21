import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { pageTransition, panelTransition } from '../../utils/motion';
import { useWorkoutDataStore } from '../../store/workoutDataStore';
import { getVideoUrl, getTip } from '../log/exerciseMeta';
import { triggerLightImpact } from '../../utils/haptics';
import type { MuscleGroup, CustomWorkout } from '../../types/workout';
import './plan.css';

type Equipment = 'Barbell' | 'Dumbbell' | 'Machine' | 'Cable' | 'Bodyweight';

interface DetailExercise {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
  equipment: Equipment;
  defaultSets: number;
  defaultRepsMin: number;
  defaultRepsMax: number;
}

interface ExerciseDetailPageProps {
  exercise: DetailExercise;
  onBack: () => void;
}

const DIFFICULTY: Record<Equipment, string> = {
  Barbell: 'Advanced',
  Dumbbell: 'Intermediate',
  Cable: 'Intermediate',
  Machine: 'Beginner',
  Bodyweight: 'Beginner',
};
function getDifficulty(eq: Equipment): string {
  return DIFFICULTY[eq] ?? 'Intermediate';
}

const ACTIVATION: Record<MuscleGroup, { muscle: string; percent: number }[]> = {
  Chest:     [{ muscle: 'Chest', percent: 100 }, { muscle: 'Shoulders', percent: 55 }, { muscle: 'Arms', percent: 45 }],
  Back:      [{ muscle: 'Back', percent: 100 }, { muscle: 'Arms', percent: 55 }, { muscle: 'Shoulders', percent: 40 }],
  Legs:      [{ muscle: 'Legs', percent: 100 }, { muscle: 'Core', percent: 50 }],
  Shoulders: [{ muscle: 'Shoulders', percent: 100 }, { muscle: 'Arms', percent: 45 }],
  Arms:      [{ muscle: 'Arms', percent: 100 }, { muscle: 'Shoulders', percent: 40 }],
  Core:      [{ muscle: 'Core', percent: 100 }],
};
function getActivation(mg: MuscleGroup): { muscle: string; percent: number }[] {
  return ACTIVATION[mg] ?? [{ muscle: mg, percent: 100 }];
}

export default function ExerciseDetailPage(props: ExerciseDetailPageProps): JSX.Element {
  const { exercise, onBack } = props;

  const activeSession = useWorkoutDataStore((s) => s.activeSession);
  const userPlan = useWorkoutDataStore((s) => s.userPlan);
  const userWorkouts = useWorkoutDataStore((s) => s.userWorkouts);
  const addExerciseToWorkout = useWorkoutDataStore((s) => s.addExerciseToWorkout);

  const [toast, setToast] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [pickedWorkoutId, setPickedWorkoutId] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function showToast(msg: string) {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(msg);
    toastTimer.current = setTimeout(() => setToast(null), 3000);
  }
  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current); }, []);

  function handlePlay() {
    window.open(getVideoUrl(exercise.name), '_blank', 'noopener,noreferrer');
  }

  function handleAddToday() {
    if (activeSession == null) {
      showToast('No active workout. Start a session from the Log tab first.');
    } else {
      triggerLightImpact();
      showToast('Open the Log tab to add this to your active workout.');
    }
  }

  const scheduledIds = (userPlan?.schedule ?? []).filter((id): id is string => !!id);
  const uniqueIds = Array.from(new Set(scheduledIds));
  const planWorkouts: CustomWorkout[] = uniqueIds
    .map((id) => userWorkouts.find((w) => w.id === id))
    .filter((w): w is CustomWorkout => !!w);

  function handleAddToPlan(workoutId: string, mode: 'append' | 'replace') {
    addExerciseToWorkout(workoutId, {
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      targetSets: exercise.defaultSets,
      targetReps:
        exercise.defaultRepsMin === exercise.defaultRepsMax
          ? String(exercise.defaultRepsMin)
          : `${exercise.defaultRepsMin}-${exercise.defaultRepsMax}`,
    });
    triggerLightImpact();
    setSheetOpen(false);
    setPickedWorkoutId(null);
    const workoutName = planWorkouts.find((w) => w.id === workoutId)?.name ?? 'workout';
    if (mode === 'append') {
      showToast(`Added to ${workoutName}.`);
    } else {
      showToast("Replace isn't available yet — added as a new exercise instead.");
    }
  }

  const activation = getActivation(exercise.muscleGroup);
  const onMuscles = new Map(activation.map((a) => [a.muscle, a.percent] as const));
  function muscleClass(name: string): string {
    const pct = onMuscles.get(name);
    if (pct === 100) return 'ex-detail__muscle ex-detail__muscle--on';
    if (pct != null) return 'ex-detail__muscle ex-detail__muscle--sub';
    return 'ex-detail__muscle';
  }

  return (
    <motion.div className="ex-detail" {...pageTransition}>
      <div className="ex-detail__header">
        <button className="ex-detail__back" aria-label="Back" onClick={onBack}>‹</button>
        <span className="ex-detail__title">{exercise.name}</span>
      </div>

      <div className="ex-detail__hero">
        <button
          className="ex-detail__play"
          aria-label="Play exercise video"
          onClick={handlePlay}
        >
          ▶
        </button>
      </div>

      <div className="ex-detail__chips">
        <span className="ex-detail__chip">{exercise.muscleGroup}</span>
        <span className="ex-detail__chip">{getDifficulty(exercise.equipment)}</span>
        <span className="ex-detail__chip">{exercise.equipment}</span>
      </div>

      <div className="ex-detail__card">
        <p className="ex-detail__card-title">Pro Tips</p>
        <p className="ex-detail__card-body">{getTip(exercise.muscleGroup)}</p>
      </div>

      <div className="ex-detail__card">
        <p className="ex-detail__card-title">Muscle Activation</p>
        {activation.map(({ muscle, percent }) => (
          <div className="ex-detail__bar-row" key={muscle}>
            <span className="ex-detail__bar-label">{muscle}</span>
            <div className="ex-detail__bar-track">
              <div className="ex-detail__bar-fill" style={{ width: `${percent}%` }} />
            </div>
            <span className="ex-detail__bar-pct">{percent}%</span>
          </div>
        ))}
        <svg className="ex-detail__body" viewBox="0 0 100 200" role="img" aria-label="Body muscle map">
          <circle cx="50" cy="14" r="9" className="ex-detail__body-base" />
          <rect x="32" y="26" width="36" height="50" rx="6" className="ex-detail__body-base" />
          <ellipse cx="28" cy="32" rx="7" ry="6" className={muscleClass('Shoulders')} data-muscle="Shoulders" />
          <ellipse cx="72" cy="32" rx="7" ry="6" className={muscleClass('Shoulders')} data-muscle="Shoulders" />
          <rect x="34" y="34" width="32" height="16" rx="4" className={muscleClass('Chest')} data-muscle="Chest" />
          <rect x="22" y="40" width="8" height="34" rx="4" className={muscleClass('Arms')} data-muscle="Arms" />
          <rect x="70" y="40" width="8" height="34" rx="4" className={muscleClass('Arms')} data-muscle="Arms" />
          <rect x="38" y="52" width="24" height="22" rx="4" className={muscleClass('Core')} data-muscle="Core" />
          <rect x="34" y="50" width="32" height="4" rx="2" className={muscleClass('Back')} data-muscle="Back" />
          <rect x="36" y="78" width="11" height="48" rx="5" className={muscleClass('Legs')} data-muscle="Legs" />
          <rect x="53" y="78" width="11" height="48" rx="5" className={muscleClass('Legs')} data-muscle="Legs" />
        </svg>
      </div>

      <div className="ex-detail__actions">
        <button
          className="ex-detail__action-btn ex-detail__action-btn--primary"
          onClick={handleAddToday}
        >
          Add to Today's Workout
        </button>
        <button
          className="ex-detail__action-btn"
          onClick={() => setSheetOpen(true)}
        >
          Add to My Plan
        </button>
      </div>

      {toast != null && (
        <div className="ex-detail__toast" role="status">{toast}</div>
      )}

      {sheetOpen && (
        <>
          <div
            className="awd-sheet-backdrop"
            onClick={() => { setSheetOpen(false); setPickedWorkoutId(null); }}
          />
          <motion.div className="awd-sheet" {...panelTransition}>
            <div className="awd-sheet__title">Add to My Plan</div>
            {planWorkouts.length === 0 ? (
              <>
                <p className="ex-detail__sheet-empty">
                  No editable workouts in your plan. Create a workout in My Plans first.
                </p>
                <button
                  className="awd-sheet__option"
                  onClick={() => { setSheetOpen(false); setPickedWorkoutId(null); }}
                >
                  Close
                </button>
              </>
            ) : pickedWorkoutId == null ? (
              planWorkouts.map((w) => (
                <button
                  className="awd-sheet__option"
                  key={w.id}
                  onClick={() => setPickedWorkoutId(w.id)}
                >
                  {w.name}
                </button>
              ))
            ) : (
              <>
                <button
                  className="awd-sheet__option"
                  onClick={() => handleAddToPlan(pickedWorkoutId, 'append')}
                >
                  Add as New Exercise
                </button>
                <button
                  className="awd-sheet__option"
                  onClick={() => handleAddToPlan(pickedWorkoutId, 'replace')}
                >
                  Replace an Exercise
                </button>
                <button
                  className="awd-sheet__option"
                  onClick={() => setPickedWorkoutId(null)}
                >
                  Back
                </button>
              </>
            )}
          </motion.div>
        </>
      )}
    </motion.div>
  );
}
