import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { pageTransition } from '../../utils/motion';
import { useWorkoutDataStore } from '../../store/workoutDataStore';
import { getVideoUrl, getTip } from '../log/exerciseMeta';
import { triggerLightImpact } from '../../utils/haptics';
import type { MuscleGroup, CustomWorkout } from '../../types/workout';
import { MediaPlaceholder, ProgressBar, Button, Chip, Sheet, BodyMap } from '../../design';
import { ChevronLeftIcon } from '../../components/icons/AuraIcons';
import './plan.css';

type Equipment = 'Barbell' | 'Dumbbell' | 'Machine' | 'Cable' | 'Smith' | 'Bodyweight';

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
  Smith: 'Beginner',
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
  const replaceExerciseInWorkout = useWorkoutDataStore((s) => s.replaceExerciseInWorkout);
  const addExerciseToSession = useWorkoutDataStore((s) => s.addExerciseToSession);
  const getExerciseById = useWorkoutDataStore((s) => s.getExerciseById);

  // Full library record (carries video, pro tips, targeted muscles, difficulty)
  const record = typeof getExerciseById === 'function' ? getExerciseById(exercise.id) : undefined;

  const [toast, setToast] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [pickedWorkoutId, setPickedWorkoutId] = useState<string | null>(null);
  // 'append' | 'replace' — track what mode we're in after picking a workout
  const [sheetMode, setSheetMode] = useState<'pick-workout' | 'pick-action' | 'pick-replace-slot'>('pick-workout');
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function showToast(msg: string) {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(msg);
    toastTimer.current = setTimeout(() => setToast(null), 3000);
  }
  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current); }, []);

  function handleAddToday() {
    if (activeSession == null) {
      showToast('No active workout. Start a session from the Log tab first.');
    } else {
      addExerciseToSession(exercise.id);
      triggerLightImpact();
      showToast('Added to your active workout.');
    }
  }

  const scheduledIds = (userPlan?.schedule ?? []).filter((id): id is string => !!id);
  const uniqueIds = Array.from(new Set(scheduledIds));
  const planWorkouts: CustomWorkout[] = uniqueIds
    .map((id) => userWorkouts.find((w) => w.id === id))
    .filter((w): w is CustomWorkout => !!w);

  function openSheet() {
    setSheetMode('pick-workout');
    setPickedWorkoutId(null);
    setSheetOpen(true);
  }

  function handlePickWorkout(workoutId: string) {
    setPickedWorkoutId(workoutId);
    setSheetMode('pick-action');
  }

  function handleAppend() {
    if (!pickedWorkoutId) return;
    addExerciseToWorkout(pickedWorkoutId, {
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      targetSets: exercise.defaultSets,
      targetReps:
        exercise.defaultRepsMin === exercise.defaultRepsMax
          ? String(exercise.defaultRepsMin)
          : `${exercise.defaultRepsMin}-${exercise.defaultRepsMax}`,
    });
    triggerLightImpact();
    const workoutName = planWorkouts.find((w) => w.id === pickedWorkoutId)?.name ?? 'workout';
    closeSheet();
    showToast(`Added to ${workoutName}.`);
  }

  function handleStartReplace() {
    // Show the list of exercises in the picked workout to choose which to replace
    setSheetMode('pick-replace-slot');
  }

  function handleReplaceSlot(index: number) {
    if (!pickedWorkoutId) return;
    replaceExerciseInWorkout(pickedWorkoutId, index, {
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      targetSets: exercise.defaultSets,
      targetReps:
        exercise.defaultRepsMin === exercise.defaultRepsMax
          ? String(exercise.defaultRepsMin)
          : `${exercise.defaultRepsMin}-${exercise.defaultRepsMax}`,
    });
    triggerLightImpact();
    const workoutName = planWorkouts.find((w) => w.id === pickedWorkoutId)?.name ?? 'workout';
    closeSheet();
    showToast(`Replaced in ${workoutName}.`);
  }

  function closeSheet() {
    setSheetOpen(false);
    setPickedWorkoutId(null);
    setSheetMode('pick-workout');
  }

  const pickedWorkout = pickedWorkoutId ? planWorkouts.find((w) => w.id === pickedWorkoutId) : null;

  // Prefer the library record's targeted muscles for the activation chart,
  // falling back to the muscle-group heuristic.
  const activation = (() => {
    const targeted = record?.musclesTargeted;
    if (targeted && targeted.length) {
      return targeted.slice(0, 4).map((muscle, i) => ({
        muscle,
        percent: Math.max(35, 100 - i * 22),
      }));
    }
    return getActivation(exercise.muscleGroup);
  })();

  const videoUrl = record?.videoUrl ?? getVideoUrl(exercise.name);
  const difficulty = record?.difficulty ?? getDifficulty(exercise.equipment);
  const proTip = record?.proTips?.length ? record.proTips[0] : getTip(exercise.muscleGroup);

  return (
    <motion.div className="ex-detail" {...pageTransition}>
      {/* Header */}
      <div className="ex-detail__header">
        <button className="ex-detail__back" aria-label="Back" onClick={onBack}>
          <ChevronLeftIcon size={18} />
        </button>
        <span className="ex-detail__title">{exercise.name}</span>
      </div>

      {/* Demo video placeholder */}
      <MediaPlaceholder
        label="exercise demo"
        aspect={16 / 9}
        rounded="lg"
        playButton
        onPlay={() => window.open(videoUrl, '_blank', 'noopener,noreferrer')}
      />

      {/* 3-col category / equipment / level strip */}
      <div className="awd-strip" style={{ marginTop: 'var(--s3)' }}>
        <div className="awd-strip__item">
          <div className="awd-strip__label">Category</div>
          <div className="awd-strip__value">{exercise.muscleGroup}</div>
        </div>
        <div className="awd-strip__item">
          <div className="awd-strip__label">Equipment</div>
          <div className="awd-strip__value">{exercise.equipment}</div>
        </div>
        <div className="awd-strip__item">
          <div className="awd-strip__label">Level</div>
          <div className="awd-strip__value">{difficulty}</div>
        </div>
      </div>

      {/* Chips */}
      <div className="ex-detail__chips">
        <Chip label={exercise.muscleGroup} selected color="accent" />
        <Chip label={exercise.equipment} />
        <Chip label={difficulty} />
      </div>

      {/* Pro Tip */}
      <div className="awd-card awd-card--tip">
        <div className="awd-card__label">Pro Tip</div>
        <div className="awd-card__tip-text">{proTip}</div>
      </div>

      {/* Muscle Activation */}
      <div className="awd-card">
        <div className="awd-card__label">Muscle Activation</div>
        {activation.map(({ muscle, percent }) => (
          <div className="awd-muscle__row" key={muscle}>
            <span className="awd-muscle__name">{muscle}</span>
            <div className="awd-muscle__bar-wrap">
              <ProgressBar value={percent} max={100} color="var(--accent)" />
            </div>
            <span className="awd-muscle__pct">{percent}%</span>
          </div>
        ))}
        <BodyMap
          highlighted={activation.map((a) => a.muscle as MuscleGroup).filter((m): m is MuscleGroup =>
            ['Chest','Back','Legs','Shoulders','Arms','Core'].includes(m)
          )}
          intensity={Object.fromEntries(
            activation
              .filter((a) => ['Chest','Back','Legs','Shoulders','Arms','Core'].includes(a.muscle))
              .map((a) => [a.muscle as MuscleGroup, a.percent / 100])
          ) as Partial<Record<MuscleGroup, number>>}
        />
      </div>

      {/* Actions */}
      <div className="ex-detail__actions">
        <Button variant="primary" size="lg" fullWidth onClick={handleAddToday}>
          Add to Today&apos;s Workout
        </Button>
        <Button variant="secondary" size="md" fullWidth onClick={openSheet}>
          Add to a Plan
        </Button>
      </div>

      {toast != null && (
        <div className="ex-detail__toast" role="status">{toast}</div>
      )}

      {/* Add to Plan Sheet */}
      <Sheet
        open={sheetOpen}
        onClose={closeSheet}
        title={
          sheetMode === 'pick-workout'
            ? 'Add to My Plan'
            : sheetMode === 'pick-action'
            ? 'Choose Action'
            : 'Replace Which Exercise?'
        }
      >
        {sheetMode === 'pick-workout' && (
          planWorkouts.length === 0 ? (
            <>
              <p className="ex-detail__sheet-empty">
                No editable workouts in your plan. Create a workout in My Plans first.
              </p>
              <Button variant="secondary" fullWidth onClick={closeSheet}>
                Close
              </Button>
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s2)' }}>
              {planWorkouts.map((w) => (
                <Button key={w.id} variant="secondary" fullWidth onClick={() => handlePickWorkout(w.id)}>
                  {w.name}
                </Button>
              ))}
            </div>
          )
        )}

        {sheetMode === 'pick-action' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s2)' }}>
            <Button variant="primary" fullWidth onClick={handleAppend}>
              Add as New Exercise
            </Button>
            <Button variant="secondary" fullWidth onClick={handleStartReplace}>
              Replace an Exercise
            </Button>
            <Button variant="text" fullWidth onClick={() => setSheetMode('pick-workout')}>
              Back
            </Button>
          </div>
        )}

        {sheetMode === 'pick-replace-slot' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s2)' }}>
            {pickedWorkout && pickedWorkout.exercises.length > 0 ? (
              pickedWorkout.exercises.map((ex, idx) => (
                <Button
                  key={idx}
                  variant="secondary"
                  fullWidth
                  onClick={() => handleReplaceSlot(idx)}
                >
                  {ex.exerciseName || ex.exerciseId}
                </Button>
              ))
            ) : (
              <p className="ex-detail__sheet-empty">No exercises in this workout.</p>
            )}
            <Button variant="text" fullWidth onClick={() => setSheetMode('pick-action')}>
              Back
            </Button>
          </div>
        )}
      </Sheet>
    </motion.div>
  );
}
