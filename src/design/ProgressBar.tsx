import './design.css';

interface ProgressBarProps {
  value: number;
  max: number;
  color?: string;
  className?: string;
}

export function ProgressBar({ value, max, color, className = '' }: ProgressBarProps) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;

  return (
    <div className={`aura-progress-bar ${className}`}>
      <div
        className="aura-progress-bar__fill"
        style={{ width: `${pct}%`, background: color ?? undefined }}
      />
    </div>
  );
}
