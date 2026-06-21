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

// ---------------------------------------------------------------------------
// endSession tests
// ---------------------------------------------------------------------------

import type { CompletedWorkout } from '../types/workout';

const SESSION_EX_WITH_COMPLETED: SessionExercise[] = [
  {
    exerciseId: 'bench-press',
    exerciseName: 'Bench Press',
    muscleGroup: 'Chest',
    defaultSets: 3,
    sets: [
      { reps: 8, weight: 100, completed: true, setType: 'Normal' },
      { reps: 6, weight: 110, completed: true, setType: 'Normal' },
      { reps: 0, weight: 0, completed: false, setType: 'Normal' },
    ],
  },
];

const PROGRAM_BENCH: WorkoutProgram = {
  id: 'prog-bench',
  name: 'Bench Program',
  description: '',
  exercises: [{ exerciseId: 'bench-press', sets: 3, repsMin: 6, repsMax: 10 }],
};

beforeEach(() => {
  useWorkoutDataStore.setState({ completedWorkouts: [], activeSession: null });
});

test('endSession — no-op (no history record) when session is null', () => {
  useWorkoutDataStore.setState({ activeSession: null });
  useWorkoutDataStore.getState().endSession();
  expect(useWorkoutDataStore.getState().completedWorkouts.length).toBe(0);
});

test('endSession — does NOT push history when zero completed sets', () => {
  useWorkoutDataStore.getState().startSession(PROGRAM_BENCH, [
    {
      exerciseId: 'bench-press',
      exerciseName: 'Bench Press',
      muscleGroup: 'Chest',
      defaultSets: 3,
      sets: [
        { reps: 0, weight: 0, completed: false, setType: 'Normal' },
      ],
    },
  ]);
  useWorkoutDataStore.getState().endSession();
  expect(useWorkoutDataStore.getState().completedWorkouts.length).toBe(0);
  expect(useWorkoutDataStore.getState().activeSession).toBeNull();
});

test('endSession — pushes a CompletedWorkout and nulls activeSession when sets are completed', () => {
  useWorkoutDataStore.getState().startSession(PROGRAM_BENCH, JSON.parse(JSON.stringify(SESSION_EX_WITH_COMPLETED)));
  useWorkoutDataStore.getState().endSession();
  const { completedWorkouts, activeSession } = useWorkoutDataStore.getState();
  expect(activeSession).toBeNull();
  expect(completedWorkouts.length).toBe(1);
});

test('endSession — filters out empty sets; only completed sets in history record', () => {
  useWorkoutDataStore.getState().startSession(PROGRAM_BENCH, JSON.parse(JSON.stringify(SESSION_EX_WITH_COMPLETED)));
  useWorkoutDataStore.getState().endSession();
  const record = useWorkoutDataStore.getState().completedWorkouts[0];
  expect(record.exercises[0].sets.length).toBe(2);
  record.exercises[0].sets.forEach((s) => expect(s.reps).toBeGreaterThan(0));
});

test('endSession — computes totalVolume correctly', () => {
  useWorkoutDataStore.getState().startSession(PROGRAM_BENCH, JSON.parse(JSON.stringify(SESSION_EX_WITH_COMPLETED)));
  useWorkoutDataStore.getState().endSession();
  const record = useWorkoutDataStore.getState().completedWorkouts[0];
  // 8*100 + 6*110 = 800 + 660 = 1460
  expect(record.totalVolume).toBe(1460);
});

test('endSession — computes prCount=1 when no prior history and weight>0', () => {
  useWorkoutDataStore.setState({ completedWorkouts: [] });
  useWorkoutDataStore.getState().startSession(PROGRAM_BENCH, JSON.parse(JSON.stringify(SESSION_EX_WITH_COMPLETED)));
  useWorkoutDataStore.getState().endSession();
  const record = useWorkoutDataStore.getState().completedWorkouts[0];
  expect(record.prCount).toBe(1);
});

test('endSession — computes prCount against history BEFORE pushing new record (not inflated)', () => {
  // Pre-populate history with a heavier set so this session is NOT a PR
  const priorRecord: CompletedWorkout = {
    id: 'session-prior',
    programId: 'prog-bench',
    programName: 'Bench Program',
    date: '2026-06-01',
    startTime: new Date('2026-06-01').toISOString(),
    durationSeconds: 3600,
    totalVolume: 2000,
    prCount: 1,
    exercises: [{
      exerciseId: 'bench-press',
      exerciseName: 'Bench Press',
      muscleGroup: 'Chest',
      sets: [{ reps: 10, weight: 200, setType: 'Normal' }],
    }],
    logSource: 'live',
  };
  useWorkoutDataStore.setState({ completedWorkouts: [priorRecord] });
  useWorkoutDataStore.getState().startSession(PROGRAM_BENCH, JSON.parse(JSON.stringify(SESSION_EX_WITH_COMPLETED)));
  useWorkoutDataStore.getState().endSession();
  const record = useWorkoutDataStore.getState().completedWorkouts[1];
  expect(record.prCount).toBe(0);
});

test('endSession — sets logSource to live', () => {
  useWorkoutDataStore.getState().startSession(PROGRAM_BENCH, JSON.parse(JSON.stringify(SESSION_EX_WITH_COMPLETED)));
  useWorkoutDataStore.getState().endSession();
  expect(useWorkoutDataStore.getState().completedWorkouts[0].logSource).toBe('live');
});

test('endSession — id starts with session-', () => {
  useWorkoutDataStore.getState().startSession(PROGRAM_BENCH, JSON.parse(JSON.stringify(SESSION_EX_WITH_COMPLETED)));
  useWorkoutDataStore.getState().endSession();
  expect(useWorkoutDataStore.getState().completedWorkouts[0].id.startsWith('session-')).toBe(true);
});

// ---------------------------------------------------------------------------
// addExerciseToSession tests
// ---------------------------------------------------------------------------

const PULL_UP_EXERCISE = {
  id: 'pull-up',
  name: 'Pull Up',
  muscleGroup: 'Back' as const,
  equipment: 'Bodyweight' as const,
  defaultSets: 3,
  defaultRepsMin: 8,
  defaultRepsMax: 12,
};

test('addExerciseToSession — no-op when no active session', () => {
  useWorkoutDataStore.setState({ exercises: [PULL_UP_EXERCISE], activeSession: null });
  useWorkoutDataStore.getState().addExerciseToSession('pull-up');
  expect(useWorkoutDataStore.getState().activeSession).toBeNull();
});

test('addExerciseToSession — no-op when exerciseId not in catalog', () => {
  useWorkoutDataStore.setState({ exercises: [PULL_UP_EXERCISE], activeSession: null });
  useWorkoutDataStore.getState().startSession(PROGRAM_BENCH, []);
  useWorkoutDataStore.getState().addExerciseToSession('nonexistent-exercise');
  expect(useWorkoutDataStore.getState().activeSession!.exercises.length).toBe(0);
});

test('addExerciseToSession — appends exercise with one empty set', () => {
  useWorkoutDataStore.setState({ exercises: [PULL_UP_EXERCISE], activeSession: null });
  useWorkoutDataStore.getState().startSession(PROGRAM_BENCH, []);
  useWorkoutDataStore.getState().addExerciseToSession('pull-up');
  const exercises = useWorkoutDataStore.getState().activeSession!.exercises;
  expect(exercises.length).toBe(1);
  expect(exercises[0].exerciseId).toBe('pull-up');
  expect(exercises[0].exerciseName).toBe('Pull Up');
  expect(exercises[0].sets.length).toBe(1);
  expect(exercises[0].sets[0].completed).toBe(false);
  expect(exercises[0].sets[0].reps).toBe(0);
  expect(exercises[0].sets[0].weight).toBe(0);
});

// ---------------------------------------------------------------------------
// removeExerciseFromSession tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  useWorkoutDataStore.setState({ activeSession: null });
});

test('removeExerciseFromSession — no-op when no active session', () => {
  expect(() => useWorkoutDataStore.getState().removeExerciseFromSession(0)).not.toThrow();
});

test('removeExerciseFromSession — removes the exercise at the given index', () => {
  useWorkoutDataStore.getState().startSession(PROGRAM_BENCH, JSON.parse(JSON.stringify(SESSION_EX_WITH_COMPLETED)));
  useWorkoutDataStore.getState().removeExerciseFromSession(0);
  expect(useWorkoutDataStore.getState().activeSession!.exercises.length).toBe(0);
});

test('removeExerciseFromSession — out-of-bounds index is a no-op', () => {
  useWorkoutDataStore.getState().startSession(PROGRAM_BENCH, JSON.parse(JSON.stringify(SESSION_EX_WITH_COMPLETED)));
  useWorkoutDataStore.getState().removeExerciseFromSession(5);
  expect(useWorkoutDataStore.getState().activeSession!.exercises.length).toBe(1);
});

test('removeExerciseFromSession — dissolves superset when only 1 member remains after removal', () => {
  const exA: SessionExercise = {
    exerciseId: 'ex-a', exerciseName: 'Ex A', muscleGroup: 'Chest',
    defaultSets: 3, sets: [{ reps: 5, weight: 50, completed: false, setType: 'Normal' }],
    supersetGroupId: 'ss-1',
  };
  const exB: SessionExercise = {
    exerciseId: 'ex-b', exerciseName: 'Ex B', muscleGroup: 'Back',
    defaultSets: 3, sets: [{ reps: 5, weight: 60, completed: false, setType: 'Normal' }],
    supersetGroupId: 'ss-1',
  };
  useWorkoutDataStore.getState().startSession(PROGRAM_BENCH, [exA, exB]);
  // Remove the first, leaving only exB in superset
  useWorkoutDataStore.getState().removeExerciseFromSession(0);
  const remaining = useWorkoutDataStore.getState().activeSession!.exercises;
  expect(remaining.length).toBe(1);
  expect(remaining[0].supersetGroupId).toBeUndefined();
});

test('removeExerciseFromSession — does NOT dissolve superset when 2+ members remain', () => {
  const exA: SessionExercise = {
    exerciseId: 'ex-a', exerciseName: 'Ex A', muscleGroup: 'Chest',
    defaultSets: 3, sets: [{ reps: 5, weight: 50, completed: false, setType: 'Normal' }],
    supersetGroupId: 'ss-2',
  };
  const exB: SessionExercise = {
    exerciseId: 'ex-b', exerciseName: 'Ex B', muscleGroup: 'Back',
    defaultSets: 3, sets: [{ reps: 5, weight: 60, completed: false, setType: 'Normal' }],
    supersetGroupId: 'ss-2',
  };
  const exC: SessionExercise = {
    exerciseId: 'ex-c', exerciseName: 'Ex C', muscleGroup: 'Arms',
    defaultSets: 3, sets: [{ reps: 5, weight: 40, completed: false, setType: 'Normal' }],
    supersetGroupId: 'ss-2',
  };
  useWorkoutDataStore.getState().startSession(PROGRAM_BENCH, [exA, exB, exC]);
  useWorkoutDataStore.getState().removeExerciseFromSession(0);
  const remaining = useWorkoutDataStore.getState().activeSession!.exercises;
  expect(remaining.length).toBe(2);
  expect(remaining[0].supersetGroupId).toBe('ss-2');
  expect(remaining[1].supersetGroupId).toBe('ss-2');
});

// ---------------------------------------------------------------------------
// substituteExercise tests
// ---------------------------------------------------------------------------

const INCLINE_PRESS_EXERCISE = {
  id: 'incline-press',
  name: 'Incline Press',
  muscleGroup: 'Chest' as const,
  equipment: 'Barbell' as const,
  defaultSets: 3,
  defaultRepsMin: 8,
  defaultRepsMax: 12,
};

test('substituteExercise — replaces exercise fields and resets sets', () => {
  useWorkoutDataStore.setState({ exercises: [INCLINE_PRESS_EXERCISE], activeSession: null });
  useWorkoutDataStore.getState().startSession(PROGRAM_BENCH, JSON.parse(JSON.stringify(SESSION_EX_WITH_COMPLETED)));
  useWorkoutDataStore.getState().substituteExercise(0, 'incline-press');
  const ex = useWorkoutDataStore.getState().activeSession!.exercises[0];
  expect(ex.exerciseId).toBe('incline-press');
  expect(ex.exerciseName).toBe('Incline Press');
  expect(ex.sets.length).toBe(1);
  expect(ex.sets[0].completed).toBe(false);
});

test('substituteExercise — preserves supersetGroupId', () => {
  useWorkoutDataStore.setState({ exercises: [INCLINE_PRESS_EXERCISE], activeSession: null });
  const exWithSuperset: SessionExercise = {
    exerciseId: 'bench-press', exerciseName: 'Bench Press', muscleGroup: 'Chest',
    defaultSets: 3, sets: [{ reps: 8, weight: 100, completed: true, setType: 'Normal' }],
    supersetGroupId: 'ss-99',
  };
  useWorkoutDataStore.getState().startSession(PROGRAM_BENCH, [exWithSuperset]);
  useWorkoutDataStore.getState().substituteExercise(0, 'incline-press');
  expect(useWorkoutDataStore.getState().activeSession!.exercises[0].supersetGroupId).toBe('ss-99');
});

test('substituteExercise — no-op for unknown newExerciseId', () => {
  useWorkoutDataStore.setState({ exercises: [INCLINE_PRESS_EXERCISE], activeSession: null });
  useWorkoutDataStore.getState().startSession(PROGRAM_BENCH, JSON.parse(JSON.stringify(SESSION_EX_WITH_COMPLETED)));
  useWorkoutDataStore.getState().substituteExercise(0, 'nonexistent');
  expect(useWorkoutDataStore.getState().activeSession!.exercises[0].exerciseId).toBe('bench-press');
});

// ---------------------------------------------------------------------------
// createExercise tests
// ---------------------------------------------------------------------------

test('createExercise — returns empty string for empty name', () => {
  useWorkoutDataStore.setState({ exercises: [] });
  const id = useWorkoutDataStore.getState().createExercise({
    name: '   ', muscleGroup: 'Chest', equipment: 'Barbell',
  });
  expect(id).toBe('');
  expect(useWorkoutDataStore.getState().exercises.length).toBe(0);
});

test('createExercise — adds exercise to store and returns a non-empty id', () => {
  useWorkoutDataStore.setState({ exercises: [] });
  const id = useWorkoutDataStore.getState().createExercise({
    name: 'My Custom Curl', muscleGroup: 'Arms', equipment: 'Dumbbell',
  });
  expect(id).not.toBe('');
  const exercises = useWorkoutDataStore.getState().exercises;
  expect(exercises.length).toBe(1);
  expect(exercises[0].name).toBe('My Custom Curl');
  expect(exercises[0].custom).toBe(true);
  expect(exercises[0].muscleGroup).toBe('Arms');
  expect(exercises[0].equipment).toBe('Dumbbell');
});

test('createExercise — id includes a slug derived from the name', () => {
  useWorkoutDataStore.setState({ exercises: [] });
  const id = useWorkoutDataStore.getState().createExercise({
    name: 'My Custom Curl', muscleGroup: 'Arms', equipment: 'Dumbbell',
  });
  expect(id.startsWith('my-custom-curl-')).toBe(true);
});

test('createExercise — two exercises with same name produce different ids', () => {
  useWorkoutDataStore.setState({ exercises: [] });
  const id1 = useWorkoutDataStore.getState().createExercise({ name: 'Curl', muscleGroup: 'Arms', equipment: 'Dumbbell' });
  const id2 = useWorkoutDataStore.getState().createExercise({ name: 'Curl', muscleGroup: 'Arms', equipment: 'Dumbbell' });
  expect(id1).not.toBe(id2);
});

test('createExercise — sets defaults: 3 sets, 8-12 reps, Intermediate difficulty', () => {
  useWorkoutDataStore.setState({ exercises: [] });
  useWorkoutDataStore.getState().createExercise({ name: 'Curl', muscleGroup: 'Arms', equipment: 'Dumbbell' });
  const ex = useWorkoutDataStore.getState().exercises[0];
  expect(ex.defaultSets).toBe(3);
  expect(ex.defaultRepsMin).toBe(8);
  expect(ex.defaultRepsMax).toBe(12);
  expect(ex.difficulty).toBe('Intermediate');
});

// ---------------------------------------------------------------------------
// logPastWorkout tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  useWorkoutDataStore.setState({ completedWorkouts: [] });
});

test('logPastWorkout — appends the record to completedWorkouts', () => {
  const workout: CompletedWorkout = {
    id: 'session-past-1',
    programId: 'prog-bench',
    programName: 'Bench Program',
    date: '2026-06-20',
    startTime: new Date('2026-06-20T10:00:00').toISOString(),
    durationSeconds: 2700,
    totalVolume: 1500,
    prCount: 0,
    exercises: [],
    logSource: 'past',
  };
  useWorkoutDataStore.getState().logPastWorkout(workout);
  expect(useWorkoutDataStore.getState().completedWorkouts.length).toBe(1);
  expect(useWorkoutDataStore.getState().completedWorkouts[0].id).toBe('session-past-1');
  expect(useWorkoutDataStore.getState().completedWorkouts[0].logSource).toBe('past');
});

// ---------------------------------------------------------------------------
// replaceExerciseInWorkout tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  useWorkoutDataStore.setState({ userWorkouts: [] });
});

test('replaceExerciseInWorkout — replaces the exercise at given index', () => {
  const workoutId = useWorkoutDataStore.getState().createWorkout('My Workout');
  useWorkoutDataStore.getState().addExerciseToWorkout(workoutId, {
    exerciseId: 'squat', exerciseName: 'Squat', targetSets: 3, targetReps: '5',
  });
  useWorkoutDataStore.getState().replaceExerciseInWorkout(workoutId, 0, {
    exerciseId: 'deadlift', exerciseName: 'Deadlift', targetSets: 4, targetReps: '3',
  });
  const w = useWorkoutDataStore.getState().userWorkouts.find((x) => x.id === workoutId)!;
  expect(w.exercises.length).toBe(1);
  expect(w.exercises[0].exerciseId).toBe('deadlift');
});

test('replaceExerciseInWorkout — out-of-bounds index is a no-op', () => {
  const workoutId = useWorkoutDataStore.getState().createWorkout('My Workout');
  useWorkoutDataStore.getState().addExerciseToWorkout(workoutId, {
    exerciseId: 'squat', exerciseName: 'Squat', targetSets: 3, targetReps: '5',
  });
  useWorkoutDataStore.getState().replaceExerciseInWorkout(workoutId, 5, {
    exerciseId: 'deadlift', exerciseName: 'Deadlift', targetSets: 4, targetReps: '3',
  });
  const w = useWorkoutDataStore.getState().userWorkouts.find((x) => x.id === workoutId)!;
  expect(w.exercises[0].exerciseId).toBe('squat');
});

test('replaceExerciseInWorkout — unknown workoutId is a no-op', () => {
  expect(() => useWorkoutDataStore.getState().replaceExerciseInWorkout('nonexistent', 0, {
    exerciseId: 'deadlift', exerciseName: 'Deadlift', targetSets: 4, targetReps: '3',
  })).not.toThrow();
});
