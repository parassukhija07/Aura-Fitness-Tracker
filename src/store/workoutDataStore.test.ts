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

// ---------------------------------------------------------------------------
// assignWorkoutToDay tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  useWorkoutDataStore.setState({
    userPlan: {
      id: 'user-plan-1',
      activeProgramId: 'full-body-a',
      startDate: '2026-06-20',
      currentWeek: 1,
      currentDay: 1,
      schedule: [null, null, null, null, null, null, null],
    },
  });
});

test('assignWorkoutToDay — assigns a workout id to the correct day index', () => {
  useWorkoutDataStore.getState().assignWorkoutToDay(1, 'full-body-a');
  const { schedule } = useWorkoutDataStore.getState().userPlan!;
  expect(schedule[1]).toBe('full-body-a');
  expect(schedule.filter((_, i) => i !== 1).every((v) => v === null)).toBe(true);
});

test('assignWorkoutToDay — null sets a rest day', () => {
  useWorkoutDataStore.getState().assignWorkoutToDay(1, 'full-body-a');
  useWorkoutDataStore.getState().assignWorkoutToDay(1, null);
  expect(useWorkoutDataStore.getState().userPlan!.schedule[1]).toBeNull();
});

test('assignWorkoutToDay — out-of-bounds dayIndex (7) is a no-op', () => {
  const before = [...useWorkoutDataStore.getState().userPlan!.schedule];
  useWorkoutDataStore.getState().assignWorkoutToDay(7, 'full-body-a');
  expect(useWorkoutDataStore.getState().userPlan!.schedule).toEqual(before);
});

test('assignWorkoutToDay — negative dayIndex (-1) is a no-op', () => {
  const before = [...useWorkoutDataStore.getState().userPlan!.schedule];
  useWorkoutDataStore.getState().assignWorkoutToDay(-1, 'full-body-a');
  expect(useWorkoutDataStore.getState().userPlan!.schedule).toEqual(before);
});

test('assignWorkoutToDay — no-op when userPlan is null', () => {
  useWorkoutDataStore.setState({ userPlan: null });
  expect(() => useWorkoutDataStore.getState().assignWorkoutToDay(0, 'x')).not.toThrow();
  expect(useWorkoutDataStore.getState().userPlan).toBeNull();
});

// ---------------------------------------------------------------------------
// userPrograms / createProgram / createWorkout / addExerciseToWorkout /
// addWorkoutToProgram / updateActiveSchedule / getActiveProgram tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  useWorkoutDataStore.setState({
    userPrograms: [],
    userWorkouts: [],
    userPlan: {
      id: 'user-plan-1', activeProgramId: 'full-body-a', startDate: '2026-06-20',
      currentWeek: 1, currentDay: 1, schedule: [null, null, null, null, null, null, null],
    },
  });
});

test('createProgram — adds a userProgram with correct fields and returns an id starting with program-', () => {
  const id = useWorkoutDataStore.getState().createProgram('My Program', 'A description');
  expect(id.startsWith('program-')).toBe(true);
  const { userPrograms } = useWorkoutDataStore.getState();
  expect(userPrograms.length).toBe(1);
  expect(userPrograms[0].name).toBe('My Program');
  expect(userPrograms[0].description).toBe('A description');
  expect(userPrograms[0].exercises).toEqual([]);
});

test('createProgram — whitespace-only name is a no-op and returns empty string', () => {
  const id = useWorkoutDataStore.getState().createProgram('   ', '');
  expect(id).toBe('');
  expect(useWorkoutDataStore.getState().userPrograms.length).toBe(0);
});

test('createWorkout — adds a userWorkout with correct fields and returns an id starting with custom-', () => {
  const id = useWorkoutDataStore.getState().createWorkout('Push Day');
  expect(id.startsWith('custom-')).toBe(true);
  const { userWorkouts } = useWorkoutDataStore.getState();
  expect(userWorkouts.length).toBe(1);
  expect(userWorkouts[0].name).toBe('Push Day');
  expect(userWorkouts[0].exercises).toEqual([]);
  expect(Number.isNaN(Date.parse(userWorkouts[0].createdAt))).toBe(false);
});

test('createWorkout — whitespace-only name is a no-op and returns empty string', () => {
  const id = useWorkoutDataStore.getState().createWorkout('   ');
  expect(id).toBe('');
  expect(useWorkoutDataStore.getState().userWorkouts.length).toBe(0);
});

test('addExerciseToWorkout — appends a CustomWorkoutExercise to the matching workout', () => {
  const workoutId = useWorkoutDataStore.getState().createWorkout('Pull Day');
  const ex: CustomWorkoutExercise = { exerciseId: 'pull-up', exerciseName: 'Pull Up', targetSets: 3, targetReps: '8-12' };
  useWorkoutDataStore.getState().addExerciseToWorkout(workoutId, ex);
  const w = useWorkoutDataStore.getState().userWorkouts.find((x) => x.id === workoutId)!;
  expect(w.exercises.length).toBe(1);
  expect(w.exercises[0].exerciseName).toBe('Pull Up');
});

test('addExerciseToWorkout — unknown workoutId is a no-op', () => {
  const ex: CustomWorkoutExercise = { exerciseId: 'pull-up', exerciseName: 'Pull Up', targetSets: 3, targetReps: '8-12' };
  expect(() => useWorkoutDataStore.getState().addExerciseToWorkout('nonexistent', ex)).not.toThrow();
});

test('addWorkoutToProgram — maps exercises, "8-12" => {repsMin:8, repsMax:12}', () => {
  const programId = useWorkoutDataStore.getState().createProgram('Full Body', '');
  const workoutId = useWorkoutDataStore.getState().createWorkout('Day A');
  useWorkoutDataStore.getState().addExerciseToWorkout(workoutId, {
    exerciseId: 'squat', exerciseName: 'Squat', targetSets: 4, targetReps: '8-12',
  });
  useWorkoutDataStore.getState().addWorkoutToProgram(programId, workoutId);
  const prog = useWorkoutDataStore.getState().userPrograms.find((p) => p.id === programId)!;
  expect(prog.exercises.length).toBe(1);
  expect(prog.exercises[0]).toEqual({ exerciseId: 'squat', sets: 4, repsMin: 8, repsMax: 12 });
});

test('addWorkoutToProgram — single number "5" => {repsMin:5, repsMax:5}', () => {
  const programId = useWorkoutDataStore.getState().createProgram('Strength', '');
  const workoutId = useWorkoutDataStore.getState().createWorkout('Day B');
  useWorkoutDataStore.getState().addExerciseToWorkout(workoutId, {
    exerciseId: 'deadlift', exerciseName: 'Deadlift', targetSets: 5, targetReps: '5',
  });
  useWorkoutDataStore.getState().addWorkoutToProgram(programId, workoutId);
  const prog = useWorkoutDataStore.getState().userPrograms.find((p) => p.id === programId)!;
  expect(prog.exercises[0]).toEqual({ exerciseId: 'deadlift', sets: 5, repsMin: 5, repsMax: 5 });
});

test('addWorkoutToProgram — unknown programId is a no-op', () => {
  const workoutId = useWorkoutDataStore.getState().createWorkout('Day C');
  expect(() => useWorkoutDataStore.getState().addWorkoutToProgram('nonexistent', workoutId)).not.toThrow();
});

test('addWorkoutToProgram — unknown workoutId is a no-op', () => {
  const programId = useWorkoutDataStore.getState().createProgram('Program X', '');
  expect(() => useWorkoutDataStore.getState().addWorkoutToProgram(programId, 'nonexistent')).not.toThrow();
  expect(useWorkoutDataStore.getState().userPrograms.find((p) => p.id === programId)!.exercises.length).toBe(0);
});

test('updateActiveSchedule — overwrites userPlan.schedule with a length-7 array', () => {
  const newSchedule = [null, 'prog-1', null, 'prog-1', null, 'prog-1', null];
  useWorkoutDataStore.getState().updateActiveSchedule(newSchedule);
  expect(useWorkoutDataStore.getState().userPlan!.schedule).toEqual(newSchedule);
});

test('updateActiveSchedule — wrong length (5) is a no-op', () => {
  const before = [...useWorkoutDataStore.getState().userPlan!.schedule];
  useWorkoutDataStore.getState().updateActiveSchedule([null, null, null, null, null]);
  expect(useWorkoutDataStore.getState().userPlan!.schedule).toEqual(before);
});

test('updateActiveSchedule — no-op when userPlan is null, must not throw', () => {
  useWorkoutDataStore.setState({ userPlan: null });
  expect(() => useWorkoutDataStore.getState().updateActiveSchedule([null, null, null, null, null, null, null])).not.toThrow();
  expect(useWorkoutDataStore.getState().userPlan).toBeNull();
});

test('getActiveProgram — returns a userProgram when activeProgramId matches a userProgram id', () => {
  const programId = useWorkoutDataStore.getState().createProgram('My User Program', 'desc');
  useWorkoutDataStore.setState({ userPlan: { id: 'user-plan-1', activeProgramId: programId, startDate: '2026-06-20', currentWeek: 1, currentDay: 1, schedule: [null, null, null, null, null, null, null] } });
  const active = useWorkoutDataStore.getState().getActiveProgram();
  expect(active).toBeDefined();
  expect(active!.id).toBe(programId);
  expect(active!.name).toBe('My User Program');
});
