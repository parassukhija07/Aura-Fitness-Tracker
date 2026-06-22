import type { LoggedSet, SetType } from '../../types/workout';
import { useWorkoutDataStore } from '../../store/workoutDataStore';
import { triggerSuccess } from '../../utils/haptics';
import { useUnits } from '../../utils/units';
import { useUserPreferencesStore } from '../../store/userPreferencesStore';

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
  const { weightInput, weightToKg, weightSuffix } = useUnits();
  const repsFirst = useUserPreferencesStore((s) => s.showRepsTimeFirst);

  const handleBlur = () => {
    if (!set.completed && set.weight > 0 && set.reps > 0) {
      completeSet(exerciseIndex, setIndex);
      triggerSuccess();
    }
  };

  const weightField = (
    <input
      key="weight"
      className="aw-set__input"
      type="text"
      inputMode="decimal"
      aria-label={`Weight (${weightSuffix})`}
      value={set.weight === 0 ? '' : weightInput(set.weight)}
      onChange={(e) => {
        const display = parseFloat(e.target.value);
        updateSetField(exerciseIndex, setIndex, 'weight', Number.isNaN(display) ? 0 : weightToKg(display));
      }}
      onBlur={handleBlur}
    />
  );
  const repsField = (
    <input
      key="reps"
      className="aw-set__input"
      type="text"
      inputMode="numeric"
      aria-label="Reps"
      value={set.reps === 0 ? '' : String(set.reps)}
      onChange={(e) => updateSetField(exerciseIndex, setIndex, 'reps', parseInt(e.target.value, 10) || 0)}
      onBlur={handleBlur}
    />
  );

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
      {repsFirst ? [repsField, weightField] : [weightField, repsField]}
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
