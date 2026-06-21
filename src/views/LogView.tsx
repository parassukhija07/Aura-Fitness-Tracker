import { useState } from 'react';
import './log/log.css';
import WeekCalendarBar from './log/WeekCalendarBar';
import TodaysOverview from './log/TodaysOverview';
import LogActions from './log/LogActions';
import ActiveWorkoutView from './log/ActiveWorkoutView';
import { useWorkoutDataStore } from '../store/workoutDataStore';
import { getDayWorkout, isSameDay, startOfDay } from './log/logDates';
import { motion } from 'framer-motion';
import { pageTransition } from '../utils/motion';

export default function LogView() {
  const today = startOfDay(new Date());
  const [activeDate, setActiveDate] = useState<Date>(today);
  const [weekOffset, setWeekOffset] = useState<number>(0);
  const [restOverrides, setRestOverrides] = useState<Record<string, boolean>>({});

  const userPlan = useWorkoutDataStore((s) => s.userPlan);
  const getActiveProgram = useWorkoutDataStore((s) => s.getActiveProgram);
  const getExerciseById = useWorkoutDataStore((s) => s.getExerciseById);
  const activeSession = useWorkoutDataStore((s) => s.activeSession);
  const programs = useWorkoutDataStore((s) => s.programs);
  const userPrograms = useWorkoutDataStore((s) => s.userPrograms);
  const userWorkouts = useWorkoutDataStore((s) => s.userWorkouts);
  const assignWorkoutToDay = useWorkoutDataStore((s) => s.assignWorkoutToDay);

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

  if (activeSession != null) {
    return (
      <motion.section className="view log-view" {...pageTransition}>
        <ActiveWorkoutView />
      </motion.section>
    );
  }

  return (
    <motion.section className="view log-view" {...pageTransition}>
      <h1 className="log-view__title">Log</h1>
      <WeekCalendarBar
        weekOffset={weekOffset}
        activeDate={activeDate}
        today={today}
        onSelectDate={onSelectDate}
        onWeekChange={onWeekChange}
        showReturnToToday={!isViewingToday}
        onReturnToToday={onReturnToToday}
      />
      <TodaysOverview
        activeDate={activeDate}
        dayWorkout={dayWorkout}
        programName={activeProgram?.name}
        sundayIndex={sundayIndex}
        programs={programs}
        userPrograms={userPrograms}
        userWorkouts={userWorkouts}
        onAssignWorkout={onAssignWorkout}
        onSetRestDay={onSetRestDay}
      />
      <LogActions
        isRestDay={dayWorkout.isRestDay}
        hasPlan={hasPlan}
        dayExercises={dayWorkout.exercises}
        activeProgram={activeProgram}
      />
    </motion.section>
  );
}
