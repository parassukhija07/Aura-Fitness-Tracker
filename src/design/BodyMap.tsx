import type { MuscleGroup } from '../types/workout';

interface BodyMapProps {
  highlighted: MuscleGroup[];
  intensity?: Partial<Record<MuscleGroup, number>>;
}

const DEFAULT_FILL = 'var(--surface-2, var(--surface))';
const ACCENT_FILL = 'var(--accent)';

/**
 * Inline SVG front-view body map. Highlights targeted muscle groups.
 * Scales with container; uses CSS vars for dark-mode compatibility.
 */
export function BodyMap({ highlighted, intensity }: BodyMapProps) {
  const set = new Set(highlighted);

  function fill(mg: MuscleGroup): string {
    if (!set.has(mg)) return DEFAULT_FILL;
    const opacity = intensity?.[mg] ?? 1;
    if (opacity >= 0.9) return ACCENT_FILL;
    return ACCENT_FILL; // use CSS opacity below
  }

  function opacity(mg: MuscleGroup): number {
    if (!set.has(mg)) return 1;
    return intensity?.[mg] ?? 1;
  }

  return (
    <svg
      viewBox="0 0 120 280"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Body muscle map"
      style={{ width: '100%', maxWidth: 160, display: 'block', margin: '0 auto' }}
    >
      {/* Outline */}
      {/* Head */}
      <ellipse cx="60" cy="22" rx="14" ry="18" fill="var(--surface-2, #333)" stroke="var(--border,#555)" strokeWidth="1" />

      {/* Neck */}
      <rect x="55" y="38" width="10" height="10" rx="2" fill="var(--surface-2, #333)" stroke="var(--border,#555)" strokeWidth="0.5" />

      {/* Chest */}
      <ellipse
        cx="60" cy="70" rx="24" ry="18"
        fill={fill('Chest')} opacity={opacity('Chest')}
        stroke="var(--border,#555)" strokeWidth="1"
        data-muscle="Chest"
      />

      {/* Left Shoulder */}
      <ellipse
        cx="31" cy="60" rx="10" ry="12"
        fill={fill('Shoulders')} opacity={opacity('Shoulders')}
        stroke="var(--border,#555)" strokeWidth="1"
        data-muscle="Shoulders-L"
      />

      {/* Right Shoulder */}
      <ellipse
        cx="89" cy="60" rx="10" ry="12"
        fill={fill('Shoulders')} opacity={opacity('Shoulders')}
        stroke="var(--border,#555)" strokeWidth="1"
        data-muscle="Shoulders-R"
      />

      {/* Left Upper Arm */}
      <rect
        x="18" y="72" width="12" height="30" rx="6"
        fill={fill('Arms')} opacity={opacity('Arms')}
        stroke="var(--border,#555)" strokeWidth="1"
        data-muscle="Arms-L"
      />

      {/* Right Upper Arm */}
      <rect
        x="90" y="72" width="12" height="30" rx="6"
        fill={fill('Arms')} opacity={opacity('Arms')}
        stroke="var(--border,#555)" strokeWidth="1"
        data-muscle="Arms-R"
      />

      {/* Left Forearm */}
      <rect x="16" y="104" width="11" height="26" rx="5"
        fill={fill('Arms')} opacity={opacity('Arms') * 0.8}
        stroke="var(--border,#555)" strokeWidth="0.7"
      />
      {/* Right Forearm */}
      <rect x="93" y="104" width="11" height="26" rx="5"
        fill={fill('Arms')} opacity={opacity('Arms') * 0.8}
        stroke="var(--border,#555)" strokeWidth="0.7"
      />

      {/* Abs / Core */}
      <rect
        x="46" y="88" width="28" height="42" rx="6"
        fill={fill('Core')} opacity={opacity('Core')}
        stroke="var(--border,#555)" strokeWidth="1"
        data-muscle="Core"
      />
      {/* Abs grid lines */}
      <line x1="46" y1="102" x2="74" y2="102" stroke="var(--border,#555)" strokeWidth="0.5" opacity="0.4" />
      <line x1="46" y1="116" x2="74" y2="116" stroke="var(--border,#555)" strokeWidth="0.5" opacity="0.4" />
      <line x1="60" y1="88" x2="60" y2="130" stroke="var(--border,#555)" strokeWidth="0.5" opacity="0.4" />

      {/* Back label region (behind) — shown as outline only since it's front view */}
      {/* We still highlight back with a subtle outline box */}
      {set.has('Back') && (
        <rect
          x="36" y="55" width="48" height="30" rx="4"
          fill="none"
          stroke={ACCENT_FILL} strokeWidth="2" strokeDasharray="4 2"
          opacity={opacity('Back')}
          data-muscle="Back"
        />
      )}

      {/* Left Quad */}
      <ellipse
        cx="50" cy="170" rx="13" ry="25"
        fill={fill('Legs')} opacity={opacity('Legs')}
        stroke="var(--border,#555)" strokeWidth="1"
        data-muscle="Legs-L"
      />

      {/* Right Quad */}
      <ellipse
        cx="70" cy="170" rx="13" ry="25"
        fill={fill('Legs')} opacity={opacity('Legs')}
        stroke="var(--border,#555)" strokeWidth="1"
        data-muscle="Legs-R"
      />

      {/* Left Calf */}
      <ellipse cx="50" cy="225" rx="9" ry="16"
        fill={fill('Legs')} opacity={opacity('Legs') * 0.75}
        stroke="var(--border,#555)" strokeWidth="0.7"
      />
      {/* Right Calf */}
      <ellipse cx="70" cy="225" rx="9" ry="16"
        fill={fill('Legs')} opacity={opacity('Legs') * 0.75}
        stroke="var(--border,#555)" strokeWidth="0.7"
      />
    </svg>
  );
}
