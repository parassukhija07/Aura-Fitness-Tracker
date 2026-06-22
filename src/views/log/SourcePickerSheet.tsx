import { Sheet } from '../../design/Sheet';
import {
  DumbbellIcon,
  PlusIcon,
  SearchIcon,
  SparkleIcon,
  ChevronRightIcon,
} from '../../components/icons/AuraIcons';

interface SourcePickerSheetProps {
  open: boolean;
  onClose: () => void;
  onFromProgram: () => void;
  onSavedWorkout: () => void;
  onBuildFromLibrary: () => void;
  onEmpty: () => void;
}

const SOURCES = [
  {
    id: 'program',
    icon: SparkleIcon,
    title: 'From a Program',
    sub: 'Your active plan & saved programs',
    tint: 'accent',
  },
  {
    id: 'saved',
    icon: DumbbellIcon,
    title: 'A Saved Workout',
    sub: 'Custom & predefined workouts',
    tint: 'blue',
  },
  {
    id: 'library',
    icon: SearchIcon,
    title: 'Build from Library',
    sub: 'Pick exercises from scratch',
    tint: 'green',
  },
  {
    id: 'empty',
    icon: PlusIcon,
    title: 'Empty Workout',
    sub: 'Start blank, add as you go',
    tint: 'gray',
  },
] as const;

export function SourcePickerSheet({
  open,
  onClose,
  onFromProgram,
  onSavedWorkout,
  onBuildFromLibrary,
  onEmpty,
}: SourcePickerSheetProps) {
  const handlers: Record<string, () => void> = {
    program: onFromProgram,
    saved: onSavedWorkout,
    library: onBuildFromLibrary,
    empty: onEmpty,
  };

  return (
    <Sheet open={open} onClose={onClose} title="Add a Workout">
      <div className="log-source-hint">Where should this workout come from?</div>
      <div className="log-source-list">
        {SOURCES.map(({ id, icon: Icon, title, sub, tint }) => (
          <button
            key={id}
            type="button"
            className="log-source-card"
            onClick={() => { handlers[id](); onClose(); }}
          >
            <span className={`log-source-card__icon log-source-card__icon--${tint}`}>
              <Icon size={22} />
            </span>
            <span className="log-source-card__text">
              <span className="log-source-card__title">{title}</span>
              <span className="log-source-card__sub">{sub}</span>
            </span>
            <ChevronRightIcon size={18} />
          </button>
        ))}
      </div>
    </Sheet>
  );
}
