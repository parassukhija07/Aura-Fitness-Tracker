import { useState } from 'react';
import { Sheet, Button } from '../../design';
import { useWorkoutDataStore } from '../../store/workoutDataStore';
import type { CompletedWorkout, CompletedExercise, CompletedSet } from '../../types/workout';
import WorkoutPickerSheet from './WorkoutPickerSheet';

interface LogPastWorkoutSheetProps {
  open: boolean;
  date: Date;         // the activeDate from LogView
  onClose: () => void;
}

interface PastSetRow {
  weight: string;
  reps: string;
}

interface PastExercise {
  exerciseId: string;
  exerciseName: string;
  muscleGroup: string;
  sets: PastSetRow[];
}

export default function LogPastWorkoutSheet({ open, date, onClose }: LogPastWorkoutSheetProps) {
  const programs = useWorkoutDataStore((s) => s.programs);
  const userPrograms = useWorkoutDataStore((s) => s.userPrograms);
  const userWorkouts = useWorkoutDataStore((s) => s.userWorkouts);
  const exercises = useWorkoutDataStore((s) => s.exercises);
  const logPastWorkout = useWorkoutDataStore((s) => s.logPastWorkout);

  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickedWorkoutId, setPickedWorkoutId] = useState<string | null>(null);
  const [pickedWorkoutName, setPickedWorkoutName] = useState('');
  const [pastExercises, setPastExercises] = useState<PastExercise[]>([]);
  const [durationMinutes, setDurationMinutes] = useState(45);

  function handlePickWorkout(workoutId: string) {
    setPickerOpen(false);
    setPickedWorkoutId(workoutId);

    // Resolve workout name
    const prog = programs.find((p) => p.id === workoutId) ??
      userPrograms.find((p) => p.id === workoutId);
    const custom = userWorkouts.find((w) => w.id === workoutId);

    if (prog) {
      setPickedWorkoutName(prog.name);
      const exList: PastExercise[] = prog.exercises.map((pe) => {
        const ex = exercises.find((e) => e.id === pe.exerciseId);
        return {
          exerciseId: pe.exerciseId,
          exerciseName: ex?.name ?? pe.exerciseId,
          muscleGroup: ex?.muscleGroup ?? '',
          sets: Array.from({ length: pe.sets }, () => ({ weight: '', reps: '' })),
        };
      });
      setPastExercises(exList);
    } else if (custom) {
      setPickedWorkoutName(custom.name);
      const exList: PastExercise[] = custom.exercises.map((ce) => {
        const ex = exercises.find((e) => e.id === ce.exerciseId);
        return {
          exerciseId: ce.exerciseId,
          exerciseName: ce.exerciseName || ex?.name || ce.exerciseId,
          muscleGroup: ex?.muscleGroup ?? '',
          sets: Array.from({ length: ce.targetSets }, () => ({ weight: '', reps: '' })),
        };
      });
      setPastExercises(exList);
    }
  }

  function updateSet(exIdx: number, setIdx: number, field: 'weight' | 'reps', value: string) {
    setPastExercises((prev) => {
      const next = prev.map((ex, i) => {
        if (i !== exIdx) return ex;
        const sets = ex.sets.map((s, j) => {
          if (j !== setIdx) return s;
          return { ...s, [field]: value };
        });
        return { ...ex, sets };
      });
      return next;
    });
  }

  function addSetToExercise(exIdx: number) {
    setPastExercises((prev) =>
      prev.map((ex, i) =>
        i === exIdx ? { ...ex, sets: [...ex.sets, { weight: '', reps: '' }] } : ex
      )
    );
  }

  function handleSave() {
    const completedExercises: CompletedExercise[] = [];
    for (const ex of pastExercises) {
      const completedSets: CompletedSet[] = ex.sets
        .filter((s) => s.weight.trim() !== '' && s.reps.trim() !== '')
        .map((s) => ({
          weight: parseFloat(s.weight) || 0,
          reps: parseInt(s.reps, 10) || 0,
        }))
        .filter((s) => s.weight > 0 && s.reps > 0);
      if (completedSets.length === 0) continue;
      completedExercises.push({
        exerciseId: ex.exerciseId,
        exerciseName: ex.exerciseName,
        muscleGroup: ex.muscleGroup as CompletedExercise['muscleGroup'],
        sets: completedSets,
      });
    }

    if (completedExercises.length === 0) return;

    const totalVolume = completedExercises.reduce(
      (acc, ex) => acc + ex.sets.reduce((s, set) => s + set.weight * set.reps, 0),
      0
    );

    const dateStr = date.toLocaleDateString('en-CA'); // YYYY-MM-DD
    const startTimeIso = new Date(date).toISOString();

    const record: CompletedWorkout = {
      id: `session-${Date.now()}`,
      programId: pickedWorkoutId ?? '',
      programName: pickedWorkoutName,
      date: dateStr,
      startTime: startTimeIso,
      durationSeconds: durationMinutes * 60,
      totalVolume,
      prCount: 0, // not computed for past workouts
      exercises: completedExercises,
      logSource: 'past',
    };

    logPastWorkout(record);
    handleClose();
  }

  function handleClose() {
    setPickedWorkoutId(null);
    setPickedWorkoutName('');
    setPastExercises([]);
    setDurationMinutes(45);
    onClose();
  }

  const hasCompletedSets = pastExercises.some((ex) =>
    ex.sets.some((s) => s.weight.trim() !== '' && s.reps.trim() !== '')
  );

  return (
    <>
      <Sheet open={open} onClose={handleClose} title="Log Past Workout">
        <div className="lpw-sheet">
          {pickedWorkoutId == null ? (
            <div className="lpw-pick-workout">
              <p className="lpw-pick-workout__label">Select a workout to pre-fill exercises</p>
              <Button variant="primary" fullWidth onClick={() => setPickerOpen(true)}>
                Pick a Workout
              </Button>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span className="lpw-sheet__title">{pickedWorkoutName}</span>
                <Button variant="text" size="md" onClick={() => setPickerOpen(true)}>
                  Change
                </Button>
              </div>

              {/* Duration */}
              <div className="lpw-duration">
                <span className="lpw-duration__label">Duration (min)</span>
                <input
                  type="number"
                  className="lpw-duration__input"
                  value={durationMinutes}
                  min={1}
                  onChange={(e) => setDurationMinutes(Math.max(1, parseInt(e.target.value, 10) || 1))}
                />
              </div>

              {/* Exercises */}
              {pastExercises.map((ex, exIdx) => (
                <div key={ex.exerciseId + exIdx} className="lpw-exercise">
                  <div className="lpw-exercise__header">{ex.exerciseName}</div>
                  <div className="lpw-set-row" style={{ borderBottom: '1px solid var(--separator)', paddingBottom: 4 }}>
                    <span className="lpw-set-row__num">#</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', textAlign: 'center' }}>Weight</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', textAlign: 'center' }}>Reps</span>
                  </div>
                  {ex.sets.map((s, setIdx) => (
                    <div key={setIdx} className="lpw-set-row">
                      <span className="lpw-set-row__num">{setIdx + 1}</span>
                      <input
                        type="number"
                        className="lpw-set-row__input"
                        placeholder="kg"
                        value={s.weight}
                        onChange={(e) => updateSet(exIdx, setIdx, 'weight', e.target.value)}
                      />
                      <input
                        type="number"
                        className="lpw-set-row__input"
                        placeholder="reps"
                        value={s.reps}
                        onChange={(e) => updateSet(exIdx, setIdx, 'reps', e.target.value)}
                      />
                    </div>
                  ))}
                  <button
                    type="button"
                    className="lpw-add-set"
                    onClick={() => addSetToExercise(exIdx)}
                  >
                    + Add Set
                  </button>
                </div>
              ))}

              <Button
                variant="primary"
                size="lg"
                fullWidth
                disabled={!hasCompletedSets}
                onClick={handleSave}
              >
                Save Workout
              </Button>
            </>
          )}
        </div>
      </Sheet>

      {pickerOpen && (
        <WorkoutPickerSheet
          title="Pick a Workout"
          programs={programs}
          userPrograms={userPrograms}
          userWorkouts={userWorkouts}
          onPick={handlePickWorkout}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </>
  );
}
