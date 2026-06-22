import './design.css';

type ChipColor = 'accent' | 'green' | 'red' | 'blue' | 'purple' | 'neutral';

interface ChipProps {
  label: string;
  selected?: boolean;
  onClick?: () => void;
  color?: ChipColor;
  className?: string;
}

export function Chip({ label, selected = false, onClick, color = 'accent', className = '' }: ChipProps) {
  const selectedClass = selected
    ? color === 'accent' || color === 'neutral'
      ? 'aura-chip--selected'
      : `aura-chip--selected-${color}`
    : '';

  const classes = ['aura-chip', selectedClass, className].filter(Boolean).join(' ');

  return (
    <button type="button" className={classes} onClick={onClick}>
      {label}
    </button>
  );
}
