import type { ReactNode } from 'react';
import { triggerLightImpact } from '../utils/haptics';
import './design.css';

type Variant = 'primary' | 'secondary' | 'tinted' | 'destructive' | 'text';
type Size = 'lg' | 'md';

interface ButtonProps {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  children: ReactNode;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  onClick,
  children,
  className = '',
  type = 'button',
}: ButtonProps) {
  const classes = [
    'aura-btn',
    `aura-btn--${size}`,
    `aura-btn--${variant}`,
    fullWidth ? 'aura-btn--full' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const handleClick = () => {
    if (disabled) return;
    triggerLightImpact();
    onClick?.();
  };

  return (
    <button type={type} className={classes} disabled={disabled} onClick={handleClick}>
      {children}
    </button>
  );
}
