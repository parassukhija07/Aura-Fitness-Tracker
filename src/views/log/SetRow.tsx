import type { LoggedSet, SetType } from '../../types/workout';
import { useWorkoutDataStore } from '../../store/workoutDataStore';
import { triggerSuccess } from '../../utils/haptics';

interface SetRowProps {
  exerciseIndex: number;
  setIndex: number;
  set: LoggedSet;
  onDelete: () => void;
}

const SET_TYPES: SetType[] = ['Normal', 'Drop Set', 'Rest-Pause', 'Failure', 'Partials'];

export default function SetRow({ exerciseIndex, setIndex, set, onDelete }: SetRowProps) {
  const updateSetField = useWorkoutDataStore((s) => s.updateSetField);
  const updateSetType = useWorkoutDataStore((s) => s.updateSetType);
  const completeSet = useWorkoutDataStore((s) => s.completeSet);

  const handleBlur = () => {
    if (!set.completed && set.weight > 0 && set.reps > 0) {
      completeSet(exerciseIndex, setIndex);
      triggerSuccess();
    }
  };

  return (
    <div className={`aw-set${set.completed ? ' aw-set--done' : ''}`}>
      <span className="aw-set__num">{setIndex + 1}</span>
      <select
        className="aw-set__type"
        value={set.setType ?? 'Normal'}
        onChange={(e) => updateSetType(exerciseIndex, setIndex, e.target.value as SetType)}
      >
        {SET_TYPES.map((t) => (
          <option key={t} value={t}>{t}</option>
        ))}
      </select>
      <span className="aw-set__prev">—</span>
      <input
        className="aw-set__input"
        type="text"
        inputMode="decimal"
        value={set.weight === 0 ? '' : String(set.weight)}
        onChange={(e) => updateSetField(exerciseIndex, setIndex, 'weight', parseFloat(e.target.value) || 0)}
        onBlur={handleBlur}
      />
      <input
        className="aw-set__input"
        type="text"
        inputMode="numeric"
        value={set.reps === 0 ? '' : String(set.reps)}
        onChange={(e) => updateSetField(exerciseIndex, setIndex, 'reps', parseInt(e.target.value, 10) || 0)}
        onBlur={handleBlur}
      />
      <input
        type="checkbox"
        checked={set.completed}
        onChange={() => {
          if (!set.completed) triggerSuccess();
          completeSet(exerciseIndex, setIndex);
        }}
      />
      <button type="button" className="aw-set__delete" onClick={onDelete}>✕</button>
    </div>
  );
}
