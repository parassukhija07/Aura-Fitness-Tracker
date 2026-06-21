import { getVideoUrl } from './exerciseMeta';

interface Props {
  exerciseName: string;
}

export default function ExerciseVideoCard({ exerciseName }: Props) {
  const handleClick = () => {
    try {
      window.open(getVideoUrl(exerciseName), '_blank', 'noopener');
    } catch {
      // Failed opens (Capacitor webview etc.) must not throw into React
    }
  };

  return (
    <button type="button" className="awd-video" onClick={handleClick} aria-label={`Watch ${exerciseName} proper form`}>
      <div className="awd-video__placeholder" aria-hidden="true">
        <span className="awd-video__play">▶</span>
      </div>
      <div className="awd-video__label">Watch Form Video</div>
    </button>
  );
}
