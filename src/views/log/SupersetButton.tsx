import { useState } from 'react';
import { motion } from 'framer-motion';
import { useWorkoutDataStore } from '../../store/workoutDataStore';
import { panelTransition } from '../../utils/motion';

interface Props {
  currentIndex: number;
}

export default function SupersetButton({ currentIndex }: Props) {
  const [open, setOpen] = useState(false);

  const exercises = useWorkoutDataStore((s) => s.activeSession?.exercises ?? []);
  const setSupersetGroup = useWorkoutDataStore((s) => s.setSupersetGroup);

  const currentExercise = exercises[currentIndex];
  const currentGroupId = currentExercise?.supersetGroupId;

  // Find all indices that belong to the same group
  const groupIndices = currentGroupId
    ? exercises
        .map((ex, i) => (ex.supersetGroupId === currentGroupId ? i : -1))
        .filter((i) => i !== -1)
    : [];

  const isInGroup = !!currentGroupId;

  const handleSelect = (chosenIndex: number) => {
    setSupersetGroup([currentIndex, chosenIndex], 'ss-' + Date.now());
    setOpen(false);
  };

  const handleUnlink = () => {
    setSupersetGroup(groupIndices, null);
    setOpen(false);
  };

  return (
    <>
      <button
        type="button"
        className={`awd-superset-btn${isInGroup ? ' awd-superset-btn--active' : ''}`}
        onClick={() => setOpen(true)}
      >
        {isInGroup ? 'Superset: Linked' : 'Link Superset'}
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div className="awd-sheet-backdrop" onClick={() => setOpen(false)} />
          <motion.div className="awd-sheet" {...panelTransition}>
            <div className="awd-sheet__title">
              {isInGroup ? 'Manage Superset' : 'Link to Superset'}
            </div>
            {isInGroup && (
              <button
                type="button"
                className="awd-sheet__option awd-sheet__option--danger"
                onClick={handleUnlink}
              >
                Unlink Superset
              </button>
            )}
            {exercises.map((ex, i) => {
              if (i === currentIndex) return null;
              return (
                <button
                  key={i}
                  type="button"
                  className="awd-sheet__option"
                  onClick={() => handleSelect(i)}
                >
                  {ex.exerciseName}
                  {ex.supersetGroupId === currentGroupId && currentGroupId ? ' (linked)' : ''}
                </button>
              );
            })}
            <button
              type="button"
              className="awd-sheet__option awd-sheet__option--cancel"
              onClick={() => setOpen(false)}
            >
              Cancel
            </button>
          </motion.div>
        </>
      )}
    </>
  );
}
