import './design.css';

interface StatTileProps {
  label: string;
  value: string;
  delta?: { dir: 'up' | 'down'; text: string };
  accent?: string;
  className?: string;
}

export function StatTile({ label, value, delta, accent, className = '' }: StatTileProps) {
  return (
    <div className={`aura-stat-tile ${className}`}>
      <div className="aura-stat-tile__label">{label}</div>
      <div className="aura-stat-tile__value" style={accent ? { color: accent } : undefined}>
        {value}
      </div>
      {delta && (
        <div className={`aura-stat-tile__delta aura-stat-tile__delta--${delta.dir}`}>
          {delta.dir === 'up' ? '▲' : '▼'} {delta.text}
        </div>
      )}
    </div>
  );
}
