import { PlayIcon } from '../components/icons/AuraIcons';
import './design.css';

type RadiusKey = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'pill';

interface MediaPlaceholderProps {
  label: string;
  aspect?: number;
  rounded?: RadiusKey;
  playButton?: boolean;
  onPlay?: () => void;
  className?: string;
}

export function MediaPlaceholder({
  label,
  aspect = 16 / 9,
  rounded = 'md',
  playButton = false,
  onPlay,
  className = '',
}: MediaPlaceholderProps) {
  const paddingTop = `${(1 / aspect) * 100}%`;

  return (
    <div
      className={`aura-media ${className}`}
      style={{ borderRadius: `var(--r-${rounded})`, position: 'relative' }}
    >
      {/* Padding trick for aspect ratio */}
      <div style={{ paddingTop, width: '100%' }} />
      <div className="aura-media__stripes" />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
        }}
      >
        <span className="aura-media__label">{label}</span>
      </div>
      {playButton && (
        <div className="aura-media__play">
          {onPlay != null ? (
            <button
              type="button"
              className="aura-media__play-btn"
              aria-label="play exercise video"
              onClick={onPlay}
            >
              <PlayIcon size={20} />
            </button>
          ) : (
            <div className="aura-media__play-btn" aria-label="play exercise video">
              <PlayIcon size={20} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
