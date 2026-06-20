import { useState } from 'react';
import './log/log.css';
import WeekCalendarBar from './log/WeekCalendarBar';
import TodaysOverview from './log/TodaysOverview';
import LogActions from './log/LogActions';
import ActiveWorkoutView from './log/ActiveWorkoutView';
import { useWorkoutDataStore } from '../store/workoutDataStore';
import { getDayWorkout, isSameDay, startOfDay } from './log/logDates';

export default function LogView() {
  const today = startOfDay(new Date());
  const [activeDate, setActiveDate] = useState<Date>(today);
  const [weekOffset, setWeekOffset] = useState<number>(0);

  const userPlan = useWorkoutDataStore((s) => s.userPlan);
  const getActiveProgram = useWorkoutDataStore((s) => s.getActiveProgram);
  const getExerciseById = useWorkoutDataStore((s) => s.getExerciseById);
  const activeSession = useWorkoutDataStore((s) => s.activeSession);
  const activeProgram = getActiveProgram();

  const dayWorkout = getDayWorkout(activeDate, userPlan, activeProgram, getExerciseById);
  const hasPlan = userPlan != null && activeProgram != null;
  const isViewingToday = isSameDay(activeDate, today);

  const onSelectDate = (date: Date) => setActiveDate(date);
  const onWeekChange = (delta: number) => setWeekOffset((prev) => prev + delta);
  const onReturnToToday = () => {
    setWeekOffset(0);
    setActiveDate(today);
  };

  if (activeSession != null) {
    return (
      <section className="view log-view">
        <ActiveWorkoutView />
      </section>
    );
  }

  return (
    <section className="view log-view">
      <h1 className="log-view__title">Log</h1>
      <WeekCalendarBar
        weekOffset={weekOffset}
        activeDate={activeDate}
        today={today}
        onSelectDate={onSelectDate}
        onWeekChange={onWeekChange}
      />
      {!isViewingToday && (
        <button type="button" className="log-today-btn" onClick={onReturnToToday}>
          Return to Today
        </button>
      )}
      <TodaysOverview
        activeDate={activeDate}
        dayWorkout={dayWorkout}
        programName={activeProgram?.name}
      />
      <LogActions
        isRestDay={dayWorkout.isRestDay}
        hasPlan={hasPlan}
        dayExercises={dayWorkout.exercises}
        activeProgram={activeProgram}
      />
    </section>
  );
}
