import { useState, useEffect } from 'react';
import { useWorkoutDataStore } from '../../store/workoutDataStore';
import SessionHeader from './SessionHeader';
import ExerciseList from './ExerciseList';
import ExerciseDetailView from './ExerciseDetailView';
import RestTimerPill from './RestTimerPill';
import EndWorkoutSheet from './EndWorkoutSheet';
import PostWorkoutSummary from './PostWorkoutSummary';

export default function ActiveWorkoutView() {
  const activeSession = useWorkoutDataStore((s) => s.activeSession);

  const [selectedExerciseIndex, setSelectedExerciseIndex] = useState<number | null>(null);
  const [showEndSheet, setShowEndSheet] = useState(false);
  const [showSummary, setShowSummary] = useState(false);

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

  return (
    <>
      <SessionHeader
        title="Active Workout"
        elapsedTime={activeSession.elapsedTime}
        onEnd={() => setShowEndSheet(true)}
        onBack={selectedExerciseIndex != null ? () => setSelectedExerciseIndex(null) : undefined}
      />
      {selectedExerciseIndex == null || exercise === undefined ? (
        <ExerciseList
          exercises={activeSession.exercises}
          onSelect={setSelectedExerciseIndex}
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
    </>
  );
}
