jest.mock('@capacitor/preferences', () => ({
  Preferences: {
    get: jest.fn(),
    set: jest.fn().mockResolvedValue(undefined),
    remove: jest.fn().mockResolvedValue(undefined),
  },
}));

import { Preferences } from '@capacitor/preferences';
import { capacitorStorage } from './capacitorStorage';
import { useWorkoutDataStore } from './workoutDataStore';
import type { SessionExercise, WorkoutProgram } from '../types/workout';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const SESSION_EXERCISES: SessionExercise[] = [
  {
    exerciseId: 'squat',
    exerciseName: 'Back Squat',
    muscleGroup: 'Legs',
    defaultSets: 2,
    sets: [
      { reps: 5, weight: 100, completed: false },
      { reps: 5, weight: 100, completed: false },
    ],
  },
];

const PROGRAM: WorkoutProgram = {
  id: 'prog-1',
  name: 'Test Program',
  description: 'fixture',
  exercises: [{ exerciseId: 'squat', sets: 2, repsMin: 5, repsMax: 8 }],
};

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  (Preferences.get as jest.Mock).mockReset();
  useWorkoutDataStore.setState({ activeSession: null });
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test('capacitorStorage.getItem — returns the stored value when Preferences.get yields a string', async () => {
  (Preferences.get as jest.Mock).mockResolvedValue({ value: 'stored-json' });
  const result = await capacitorStorage.getItem('aura-workout-data');
  expect(result).toBe('stored-json');
  expect(Preferences.get).toHaveBeenCalledWith({ key: 'aura-workout-data' });
});

test('capacitorStorage.getItem — coalesces null value to null', async () => {
  (Preferences.get as jest.Mock).mockResolvedValue({ value: null });
  await expect(capacitorStorage.getItem('missing')).resolves.toBeNull();
});

test('capacitorStorage.getItem — coalesces undefined value to null', async () => {
  (Preferences.get as jest.Mock).mockResolvedValue({});
  await expect(capacitorStorage.getItem('missing')).resolves.toBeNull();
});

test('startSession — populates activeSession with workoutId, exercises, zero elapsed, ISO startTime', () => {
  useWorkoutDataStore.getState().startSession(PROGRAM, JSON.parse(JSON.stringify(SESSION_EXERCISES)));
  const session = useWorkoutDataStore.getState().activeSession;
  expect(session).not.toBeNull();
  expect(session!.workoutId).toBe('prog-1');
  expect(session!.elapsedTime).toBe(0);
  expect(session!.exercises.length).toBe(1);
  expect(session!.exercises[0].exerciseId).toBe('squat');
  expect(session!.startTime).toMatch(/^\d{4}-\d{2}-\d{2}T/);
});

test('updateElapsedTime — no-op when activeSession is null', () => {
  useWorkoutDataStore.getState().updateElapsedTime(42);
  expect(useWorkoutDataStore.getState().activeSession).toBeNull();
});

test('updateElapsedTime — sets elapsedTime when a session is active', () => {
  useWorkoutDataStore.getState().startSession(PROGRAM, JSON.parse(JSON.stringify(SESSION_EXERCISES)));
  useWorkoutDataStore.getState().updateElapsedTime(90);
  expect(useWorkoutDataStore.getState().activeSession!.elapsedTime).toBe(90);
});

test('completeSet — marks the targeted set completed', () => {
  useWorkoutDataStore.getState().startSession(PROGRAM, JSON.parse(JSON.stringify(SESSION_EXERCISES)));
  useWorkoutDataStore.getState().completeSet(0, 1);
  expect(useWorkoutDataStore.getState().activeSession!.exercises[0].sets[1].completed).toBe(true);
  expect(useWorkoutDataStore.getState().activeSession!.exercises[0].sets[0].completed).toBe(false);
});

test('completeSet — out-of-range exerciseIndex is a no-op', () => {
  useWorkoutDataStore.getState().startSession(PROGRAM, JSON.parse(JSON.stringify(SESSION_EXERCISES)));
  useWorkoutDataStore.getState().completeSet(5, 0);
  const session = useWorkoutDataStore.getState().activeSession;
  expect(session!.exercises[0].sets.every(s => !s.completed)).toBe(true);
});

test('completeSet — out-of-range setIndex is a no-op', () => {
  useWorkoutDataStore.getState().startSession(PROGRAM, JSON.parse(JSON.stringify(SESSION_EXERCISES)));
  useWorkoutDataStore.getState().completeSet(0, 9);
  expect(useWorkoutDataStore.getState().activeSession!.exercises[0].sets.every(s => !s.completed)).toBe(true);
});

// ---------------------------------------------------------------------------
// saveCustomWorkout tests
// ---------------------------------------------------------------------------

import type { CustomWorkoutExercise } from '../types/workout';

const SAMPLE_EXERCISE: CustomWorkoutExercise = {
  exerciseId: 'barbell-bench-press',
  exerciseName: 'Barbell Bench Press',
  targetSets: 3,
  targetReps: '8-12',
};

beforeEach(() => {
  useWorkoutDataStore.setState({ userWorkouts: [] });
});

test('saveCustomWorkout — adds a workout with correct fields', () => {
  useWorkoutDataStore.getState().saveCustomWorkout('Push Day', [SAMPLE_EXERCISE]);
  const { userWorkouts } = useWorkoutDataStore.getState();
  expect(userWorkouts.length).toBe(1);
  expect(userWorkouts[0].name).toBe('Push Day');
  expect(userWorkouts[0].exercises.length).toBe(1);
  expect(userWorkouts[0].exercises[0].targetReps).toBe('8-12');
});

test('saveCustomWorkout — generates id starting with custom- and valid createdAt', () => {
  useWorkoutDataStore.getState().saveCustomWorkout('Push Day', [SAMPLE_EXERCISE]);
  const w = useWorkoutDataStore.getState().userWorkouts[0];
  expect(w.id.startsWith('custom-')).toBe(true);
  expect(Number.isNaN(Date.parse(w.createdAt))).toBe(false);
});

test('saveCustomWorkout — two saves produce two distinct ids', () => {
  useWorkoutDataStore.getState().saveCustomWorkout('Push Day', [SAMPLE_EXERCISE]);
  useWorkoutDataStore.getState().saveCustomWorkout('Pull Day', [SAMPLE_EXERCISE]);
  const { userWorkouts } = useWorkoutDataStore.getState();
  expect(userWorkouts.length).toBe(2);
  expect(userWorkouts[0].id).not.toBe(userWorkouts[1].id);
});

test('saveCustomWorkout — whitespace-only name does not add workout', () => {
  useWorkoutDataStore.getState().saveCustomWorkout('   ', [SAMPLE_EXERCISE]);
  expect(useWorkoutDataStore.getState().userWorkouts.length).toBe(0);
});

test('saveCustomWorkout — empty exercises array does not add workout', () => {
  useWorkoutDataStore.getState().saveCustomWorkout('Push Day', []);
  expect(useWorkoutDataStore.getState().userWorkouts.length).toBe(0);
});

test('saveCustomWorkout — mutating input array does not affect stored exercises', () => {
  const input: CustomWorkoutExercise[] = [{ ...SAMPLE_EXERCISE }];
  useWorkoutDataStore.getState().saveCustomWorkout('Push Day', input);
  input.push({ exerciseId: 'squat', exerciseName: 'Squat', targetSets: 3, targetReps: '5' });
  expect(useWorkoutDataStore.getState().userWorkouts[0].exercises.length).toBe(1);
});
