import { useState, useEffect } from 'react';
import { useWorkoutDataStore } from '../../store/workoutDataStore';
import SessionHeader from './SessionHeader';
import ExerciseList from './ExerciseList';
import ExerciseDetailView from './ExerciseDetailView';
import RestTimerPill from './RestTimerPill';
import EndWorkoutSheet from './EndWorkoutSheet';
import PostWorkoutSummary from './PostWorkoutSummary';
import SessionExerciseActionsSheet from './SessionExerciseActionsSheet';
import ExerciseSelectorModal from '../plan/ExerciseSelectorModal';

export default function ActiveWorkoutView() {
  const activeSession = useWorkoutDataStore((s) => s.activeSession);
  const removeExerciseFromSession = useWorkoutDataStore((s) => s.removeExerciseFromSession);
  const substituteExercise = useWorkoutDataStore((s) => s.substituteExercise);
  const addExerciseToSession = useWorkoutDataStore((s) => s.addExerciseToSession);
  const setSupersetGroup = useWorkoutDataStore((s) => s.setSupersetGroup);
  const programs = useWorkoutDataStore((s) => s.programs);
  const userPrograms = useWorkoutDataStore((s) => s.userPrograms);

  const [selectedExerciseIndex, setSelectedExerciseIndex] = useState<number | null>(null);
  const [showEndSheet, setShowEndSheet] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [actionsForIndex, setActionsForIndex] = useState<number | null>(null);
  const [substitutePickerIndex, setSubstitutePickerIndex] = useState<number | null>(null);
  const [addPickerOpen, setAddPickerOpen] = useState(false);

  // Timer: reads fresh state via getState() to avoid stale closure
  useEffect(() => {
    const id = setInterval(() => {
      useWorkoutDataStore.getState().updateElapsedTime(
        (useWorkoutDataStore.getState().activeSession?.elapsedTime ?? 0) + 1
      );
    }, 1000);
    return () => clearInterval(id);
  }, []);

  // Edge guard: reset to list if selected exercise index is out of range
  useEffect(() => {
    if (
      selectedExerciseIndex != null &&
      activeSession != null &&
      activeSession.exercises[selectedExerciseIndex] === undefined
    ) {
      setSelectedExerciseIndex(null);
    }
  }, [selectedExerciseIndex, activeSession?.exercises.length]);

  if (activeSession == null) return null;

  const exercise =
    selectedExerciseIndex != null
      ? activeSession.exercises[selectedExerciseIndex]
      : undefined;

  const programName =
    programs.find((p) => p.id === activeSession.workoutId)?.name ??
    userPrograms.find((p) => p.id === activeSession.workoutId)?.name ??
    'Workout';

  return (
    <>
      <SessionHeader
        title={programName}
        elapsedTime={activeSession.elapsedTime}
        onEnd={() => setShowEndSheet(true)}
        onBack={selectedExerciseIndex != null ? () => setSelectedExerciseIndex(null) : undefined}
        onAdd={selectedExerciseIndex == null ? () => setAddPickerOpen(true) : undefined}
      />
      {selectedExerciseIndex == null || exercise === undefined ? (
        <ExerciseList
          exercises={activeSession.exercises}
          programName={programName}
          onSelect={setSelectedExerciseIndex}
          onExerciseActions={(idx) => setActionsForIndex(idx)}
          onFinish={() => setShowSummary(true)}
          onAddExercise={() => setAddPickerOpen(true)}
        />
      ) : (
        <ExerciseDetailView
          exerciseIndex={selectedExerciseIndex}
          exercise={exercise}
          onComplete={() => setSelectedExerciseIndex(null)}
        />
      )}
      <RestTimerPill />
      {showEndSheet && (
        <EndWorkoutSheet
          onEndEarly={() => { setShowEndSheet(false); setShowSummary(true); }}
          onCancel={() => { setShowEndSheet(false); }}
          onDiscard={() => { setShowEndSheet(false); }}
          onClose={() => setShowEndSheet(false)}
        />
      )}
      {showSummary && (
        <PostWorkoutSummary onSave={() => setShowSummary(false)} />
      )}
      <SessionExerciseActionsSheet
        open={actionsForIndex !== null}
        exerciseIndex={actionsForIndex ?? 0}
        canSuperset={
          actionsForIndex !== null &&
          actionsForIndex < activeSession.exercises.length - 1
        }
        onSubstitute={() => {
          const idx = actionsForIndex ?? 0;
          setSubstitutePickerIndex(idx);
          setActionsForIndex(null);
        }}
        onSuperset={() => {
          const idx = actionsForIndex ?? 0;
          setSupersetGroup([idx, idx + 1], `ss-${Date.now()}`);
          setActionsForIndex(null);
        }}
        onAddAfter={() => {
          setActionsForIndex(null);
          setAddPickerOpen(true);
        }}
        onRemove={() => {
          const idx = actionsForIndex ?? 0;
          setActionsForIndex(null);
          if (window.confirm('Remove this exercise?')) {
            removeExerciseFromSession(idx);
          }
        }}
        onClose={() => setActionsForIndex(null)}
      />
      {substitutePickerIndex !== null && (
        <ExerciseSelectorModal
          onSelect={(ex) => {
            substituteExercise(substitutePickerIndex, ex.id);
            setSubstitutePickerIndex(null);
          }}
          onClose={() => setSubstitutePickerIndex(null)}
        />
      )}
      {addPickerOpen && (
        <ExerciseSelectorModal
          onSelect={(ex) => {
            addExerciseToSession(ex.id);
            setAddPickerOpen(false);
          }}
          onClose={() => setAddPickerOpen(false)}
        />
      )}
    </>
  );
}
