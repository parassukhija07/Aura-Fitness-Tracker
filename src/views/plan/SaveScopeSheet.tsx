import { Sheet } from '../../design/Sheet';
import { Button } from '../../design/Button';

interface SaveScopeSheetProps {
  open: boolean;
  onClose: () => void;
  onJustToday: () => void;
  onPermanently: () => void;
}

export function SaveScopeSheet({ open, onClose, onJustToday, onPermanently }: SaveScopeSheetProps) {
  return (
    <Sheet open={open} onClose={onClose} title="Save Changes">
      <p style={{ fontSize: 14, color: 'var(--text-2)', marginBottom: 'var(--s4)', lineHeight: 1.5 }}>
        How do you want to save these changes?
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s2)' }}>
        <Button variant="primary" fullWidth onClick={() => { onJustToday(); onClose(); }}>
          Just for Today
        </Button>
        <Button variant="secondary" fullWidth onClick={() => { onPermanently(); onClose(); }}>
          Permanently (Update My Plan)
        </Button>
        <Button variant="text" fullWidth onClick={onClose}>
          Cancel
        </Button>
      </div>
    </Sheet>
  );
}
