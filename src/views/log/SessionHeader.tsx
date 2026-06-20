interface SessionHeaderProps {
  title: string;
  elapsedTime: number;
  onEnd: () => void;
  onBack?: () => void;
}

function formatElapsed(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const mm = String(m).padStart(2, '0');
  const ss = String(s).padStart(2, '0');
  if (h > 0) {
    const hh = String(h).padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
  }
  return `${mm}:${ss}`;
}

export default function SessionHeader({ title, elapsedTime, onEnd, onBack }: SessionHeaderProps) {
  const handleEnd = () => {
    if (window.confirm('End workout early? Unsaved progress will be lost.')) onEnd();
  };

  return (
    <header className="aw-header">
      {onBack && (
        <button type="button" className="aw-header__back" onClick={onBack}>
          ‹ Back
        </button>
      )}
      <div className="aw-header__center">
        <div className="aw-header__timer">{formatElapsed(elapsedTime)}</div>
        <div className="aw-header__title">{title}</div>
      </div>
      <button type="button" className="aw-header__end" onClick={handleEnd}>
        End
      </button>
    </header>
  );
}
