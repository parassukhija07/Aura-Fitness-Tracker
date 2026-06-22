import { Sheet } from '../../design/Sheet';
import { ListRow } from '../../design/ListRow';
import { MoonIcon, DumbbellIcon, TrashIcon } from '../../components/icons/AuraIcons';

interface ManageTodaySheetProps {
  open: boolean;
  onClose: () => void;
  onSwitch: () => void;
  onMakeRestDay: () => void;
  onRemove: () => void;
}

export function ManageTodaySheet({ open, onClose, onSwitch, onMakeRestDay, onRemove }: ManageTodaySheetProps) {
  return (
    <Sheet open={open} onClose={onClose} title="Manage Today">
      <div className="log-manage-list">
        <ListRow
          leading={<DumbbellIcon size={18} />}
          title="Switch to Another Workout"
          onClick={() => { onSwitch(); onClose(); }}
        />
        <ListRow
          leading={<MoonIcon size={18} />}
          title="Make it a Rest Day"
          onClick={() => { onMakeRestDay(); onClose(); }}
        />
        <ListRow
          leading={<TrashIcon size={18} />}
          title="Remove"
          destructive
          onClick={() => { onRemove(); onClose(); }}
        />
      </div>
    </Sheet>
  );
}
