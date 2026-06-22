import type { ReactNode } from 'react';
import './design.css';

interface CardProps {
  elevated?: boolean;
  padded?: boolean;
  onClick?: () => void;
  children: ReactNode;
  className?: string;
}

export function Card({ elevated = false, padded = false, onClick, children, className = '' }: CardProps) {
  const classes = [
    'aura-card',
    elevated ? 'aura-card--elevated' : '',
    padded ? 'aura-card--padded' : '',
    onClick ? 'aura-card--clickable' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  if (onClick) {
    return (
      <div className={classes} onClick={onClick} role="button" tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && onClick()}>
        {children}
      </div>
    );
  }

  return <div className={classes}>{children}</div>;
}
