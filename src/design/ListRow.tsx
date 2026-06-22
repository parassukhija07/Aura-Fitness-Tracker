import type { ReactNode } from 'react';
import { ChevronRightIcon } from '../components/icons/AuraIcons';
import './design.css';

interface ListRowProps {
  leading?: ReactNode;
  title: string;
  subtitle?: string;
  trailing?: ReactNode;
  onClick?: () => void;
  destructive?: boolean;
  className?: string;
}

export function ListRow({
  leading,
  title,
  subtitle,
  trailing,
  onClick,
  destructive = false,
  className = '',
}: ListRowProps) {
  const classes = [
    'aura-list-row',
    onClick ? 'aura-list-row--clickable' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const showChevron = !!onClick && trailing == null;

  return (
    <div className={classes} onClick={onClick} role={onClick ? 'button' : undefined} tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}>
      {leading && <div className="aura-list-row__leading">{leading}</div>}
      <div className="aura-list-row__body">
        <div className={`aura-list-row__title ${destructive ? 'aura-list-row__title--destructive' : ''}`}>
          {title}
        </div>
        {subtitle && <div className="aura-list-row__subtitle">{subtitle}</div>}
      </div>
      {trailing && <div className="aura-list-row__trailing">{trailing}</div>}
      {showChevron && (
        <div className="aura-list-row__chevron">
          <ChevronRightIcon size={16} />
        </div>
      )}
    </div>
  );
}
