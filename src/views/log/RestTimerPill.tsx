import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useWorkoutDataStore } from '../../store/workoutDataStore';
import * as restTimerBus from './restTimerBus';
import { fireRestComplete } from '../../utils/restAlerts';

export default function RestTimerPill() {
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Inter-set rest (driven by restTimerBus)
  const [busState, setBusState] = useState<{ seconds: number; running: boolean }>({
    seconds: 0,
    running: false,
  });

  // Track the bus timer's falling edge (running → stopped at 0) to fire alerts.
  const busWasRunning = useRef(false);
  useEffect(() => {
    return restTimerBus.subscribe((s) => {
      if (busWasRunning.current && !s.running && s.seconds === 0) {
        fireRestComplete('Time for your next set.');
      }
      busWasRunning.current = s.running;
      setBusState(s);
    });
  }, []);

  // Inter-exercise rest (driven by store)
  const interExerciseRestStartedAt = useWorkoutDataStore(
    (s) => s.activeSession?.interExerciseRestStartedAt
  );
  const clearInterExerciseRest = useWorkoutDataStore((s) => s.clearInterExerciseRest);

  const [interExerciseSeconds, setInterExerciseSeconds] = useState<number>(0);

  useEffect(() => {
    if (!interExerciseRestStartedAt) {
      setInterExerciseSeconds(0);
      return;
    }
    const tick = () => {
      const elapsed = Math.floor((Date.now() - Date.parse(interExerciseRestStartedAt)) / 1000);
      const remaining = 90 - elapsed;
      if (remaining <= 0) {
        setInterExerciseSeconds(0);
        clearInterExerciseRest();
        fireRestComplete('Time for your next exercise.');
      } else {
        setInterExerciseSeconds(remaining);
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [interExerciseRestStartedAt, clearInterExerciseRest]);

  // Determine which timer to show — inter-set takes priority
  const showBus = busState.running;
  const showInterExercise = !showBus && interExerciseRestStartedAt != null && interExerciseSeconds > 0;

  if (!showBus && !showInterExercise) return null;

  const displaySeconds = showBus ? busState.seconds : interExerciseSeconds;
  const label = showBus ? 'Rest' : 'Next exercise in';

  const handleDismiss = () => {
    restTimerBus.stop();
    clearInterExerciseRest();
  };

  return (
    <div
      ref={wrapperRef}
      style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 100 }}
    >
      <motion.div
        drag
        dragMomentum={false}
        dragElastic={0.1}
        dragConstraints={wrapperRef}
        className="awd-rest-pill"
        style={{ position: 'absolute', bottom: 80, right: 16, pointerEvents: 'auto' }}
      >
        <div className="awd-rest-pill__label">{label}</div>
        <div className="awd-rest-pill__countdown">
          {String(Math.floor(displaySeconds / 60)).padStart(2, '0')}:
          {String(displaySeconds % 60).padStart(2, '0')}
        </div>
        <button
          type="button"
          className="awd-rest-pill__dismiss"
          onClick={handleDismiss}
          aria-label="Dismiss rest timer"
        >
          ✕
        </button>
      </motion.div>
    </div>
  );
}
