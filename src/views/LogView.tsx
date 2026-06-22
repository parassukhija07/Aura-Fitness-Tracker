import { useState } from 'react';
import './log/log.css';
import WeekCalendarBar from './log/WeekCalendarBar';
import TodaysOverview from './log/TodaysOverview';
import StrengthSummary from './log/StrengthSummary';
import ActiveWorkoutView from './log/ActiveWorkoutView';
import { CalendarSheet } from './log/CalendarSheet';
import { useWorkoutDataStore } from '../store/workoutDataStore';
import { getDayWorkout, isSameDay, startOfDay } from './log/logDates';
import type { SessionExercise, MuscleGroup } from '../types/workout';
import { motion } from 'framer-motion';
import { pageTransition } from '../utils/motion';
import { CalendarIcon } from '../components/icons/AuraIcons';

export default function LogView() {
  const today = startOfDay(new Date());
  const [activeDate, setActiveDate] = useState<Date>(today);
  const [weekOffset, setWeekOffset] = useState<number>(0);
  const [restOverrides, setRestOverrides] = useState<Record<string, boolean>>({});
  const [calendarOpen, setCalendarOpen] = useState(false);

  const userPlan = useWorkoutDataStore((s) => s.userPlan);
  const getActiveProgram = useWorkoutDataStore((s) => s.getActiveProgram);
  const getExerciseById = useWorkoutDataStore((s) => s.getExerciseById);
  const activeSession = useWorkoutDataStore((s) => s.activeSession);
  const programs = useWorkoutDataStore((s) => s.programs);
  const userPrograms = useWorkoutDataStore((s) => s.userPrograms);
  const userWorkouts = useWorkoutDataStore((s) => s.userWorkouts);
  const assignWorkoutToDay = useWorkoutDataStore((s) => s.assignWorkoutToDay);
  const startSession = useWorkoutDataStore((s) => s.startSession);

  const activeProgram = getActiveProgram();

  const dateKey = activeDate.toISOString().slice(0, 10);
  const explicitRest = restOverrides[dateKey] === true;
  const sundayIndex = activeDate.getDay();

  const dayWorkout = getDayWorkout(
    activeDate,
    userPlan,
    activeProgram,
    getExerciseById,
    { programs, userPrograms, userWorkouts },
    explicitRest
  );

  const hasPlan = userPlan != null && activeProgram != null;
  const isViewingToday = isSameDay(activeDate, today);

  const onSelectDate = (date: Date) => setActiveDate(date);
  const onWeekChange = (delta: number) => setWeekOffset((prev) => prev + delta);
  const onReturnToToday = () => {
    setWeekOffset(0);
    setActiveDate(today);
  };

  const onAssignWorkout = (workoutId: string) => {
    assignWorkoutToDay(sundayIndex, workoutId);
    setRestOverrides((m) => ({ ...m, [dateKey]: false }));
  };

  const onSetRestDay = () => {
    assignWorkoutToDay(sundayIndex, null);
    setRestOverrides((m) => ({ ...m, [dateKey]: true }));
  };

  const onStartWorkout = () => {
    if (!activeProgram) return;
    const sessionExercises: SessionExercise[] = dayWorkout.exercises.map((ex) => ({
      exerciseId: ex.exerciseId,
      exerciseName: ex.name,
      muscleGroup: ex.muscleGroup as MuscleGroup,
      defaultSets: ex.sets,
      sets: [{ reps: 0, weight: 0, setType: 'Normal', completed: false }],
    }));
    startSession(activeProgram, sessionExercises);
  };

  const dayName = activeDate
    .toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
    .toUpperCase();

  if (activeSession != null) {
    return (
      <motion.section className="view log-view" {...pageTransition}>
        <ActiveWorkoutView />
      </motion.section>
    );
  }

  return (
    <motion.section className="view log-view" {...pageTransition}>
      <div className="log-view__header">
        <div>
          <div className="log-view__eyebrow">{dayName}</div>
          <h1 className="log-view__title">{isViewingToday ? 'Today' : activeDate.toLocaleDateString('en-US', { weekday: 'long' })}</h1>
        </div>
        <button
          className="log-view__cal-btn"
          onClick={() => setCalendarOpen(true)}
          aria-label="Open calendar"
        >
          <CalendarIcon size={19} />
        </button>
      </div>
      <WeekCalendarBar
        weekOffset={weekOffset}
        activeDate={activeDate}
        today={today}
        onSelectDate={onSelectDate}
        onWeekChange={onWeekChange}
        showReturnToToday={!isViewingToday}
        onReturnToToday={onReturnToToday}
      />
      {isViewingToday && <StrengthSummary />}
      <TodaysOverview
        activeDate={activeDate}
        dayWorkout={dayWorkout}
        programName={activeProgram?.name}
        workoutName={activeProgram?.name}
        canStart={hasPlan}
        sundayIndex={sundayIndex}
        programs={programs}
        userPrograms={userPrograms}
        userWorkouts={userWorkouts}
        onAssignWorkout={onAssignWorkout}
        onSetRestDay={onSetRestDay}
        onStartWorkout={onStartWorkout}
      />
      <CalendarSheet
        open={calendarOpen}
        onClose={() => setCalendarOpen(false)}
        selectedDate={activeDate}
        today={today}
        onSelectDate={(date) => {
          onSelectDate(date);
          const offset = Math.round((date.getTime() - today.getTime()) / (7 * 24 * 60 * 60 * 1000));
          setWeekOffset(offset);
        }}
      />
    </motion.section>
  );
}
