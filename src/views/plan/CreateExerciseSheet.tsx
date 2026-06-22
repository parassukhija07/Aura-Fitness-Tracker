import { useState } from 'react';
import { Sheet, Button, Chip } from '../../design';
import { useWorkoutDataStore } from '../../store/workoutDataStore';
import type { MuscleGroup, Equipment } from '../../types/workout';

interface CreateExerciseSheetProps {
  open: boolean;
  onClose: () => void;
  onCreated?: (exerciseId: string) => void;
}

const MUSCLE_GROUPS: MuscleGroup[] = ['Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core'];
const EQUIPMENT_OPTIONS: Equipment[] = ['Barbell', 'Dumbbell', 'Machine', 'Cable', 'Smith', 'Bodyweight'];
const DIFFICULTY_OPTIONS = ['Beginner', 'Intermediate', 'Advanced'] as const;
type Difficulty = typeof DIFFICULTY_OPTIONS[number];

export default function CreateExerciseSheet({ open, onClose, onCreated }: CreateExerciseSheetProps) {
  const createExercise = useWorkoutDataStore((s) => s.createExercise);

  const [name, setName] = useState('');
  const [muscleGroup, setMuscleGroup] = useState<MuscleGroup>('Chest');
  const [equipment, setEquipment] = useState<Equipment>('Barbell');
  const [difficulty, setDifficulty] = useState<Difficulty>('Intermediate');
  const [formTips, setFormTips] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');

  function handleSubmit() {
    const trimmed = name.trim();
    if (!trimmed) return;
    const id = createExercise({
      name: trimmed,
      muscleGroup,
      equipment,
      difficulty,
      formTips: formTips.trim() || undefined,
      imageUrl: imageUrl.trim() || undefined,
      videoUrl: videoUrl.trim() || undefined,
    });
    if (id) {
      onCreated?.(id);
      handleClose();
    }
  }

  function handleClose() {
    setName('');
    setMuscleGroup('Chest');
    setEquipment('Barbell');
    setDifficulty('Intermediate');
    setFormTips('');
    setImageUrl('');
    setVideoUrl('');
    onClose();
  }

  return (
    <Sheet open={open} onClose={handleClose} title="Create Exercise">
      <div className="cex-form">
        {/* Name */}
        <div className="cex-field">
          <label className="cex-label" htmlFor="cex-name">Exercise Name *</label>
          <input
            id="cex-name"
            type="text"
            className="cex-input"
            placeholder="e.g. Incline Dumbbell Press"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        {/* Muscle Group */}
        <div className="cex-field">
          <span className="cex-label">Muscle Group</span>
          <div className="cex-chips">
            {MUSCLE_GROUPS.map((mg) => (
              <Chip
                key={mg}
                label={mg}
                selected={mg === muscleGroup}
                onClick={() => setMuscleGroup(mg)}
              />
            ))}
          </div>
        </div>

        {/* Equipment */}
        <div className="cex-field">
          <span className="cex-label">Equipment</span>
          <div className="cex-chips">
            {EQUIPMENT_OPTIONS.map((eq) => (
              <Chip
                key={eq}
                label={eq}
                selected={eq === equipment}
                color="neutral"
                onClick={() => setEquipment(eq)}
              />
            ))}
          </div>
        </div>

        {/* Difficulty */}
        <div className="cex-field">
          <span className="cex-label">Difficulty</span>
          <div className="cex-chips">
            {DIFFICULTY_OPTIONS.map((d) => (
              <Chip
                key={d}
                label={d}
                selected={d === difficulty}
                color="neutral"
                onClick={() => setDifficulty(d)}
              />
            ))}
          </div>
        </div>

        {/* Form Tips */}
        <div className="cex-field">
          <label className="cex-label" htmlFor="cex-tips">Form Tips (optional)</label>
          <textarea
            id="cex-tips"
            className="cex-textarea"
            placeholder="e.g. Keep elbows tucked, full range of motion..."
            value={formTips}
            onChange={(e) => setFormTips(e.target.value)}
            rows={3}
          />
        </div>

        {/* Image URL */}
        <div className="cex-field">
          <label className="cex-label" htmlFor="cex-image">Image URL (optional)</label>
          <input
            id="cex-image"
            type="url"
            className="cex-input"
            placeholder="https://..."
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
          />
        </div>

        {/* Video URL */}
        <div className="cex-field">
          <label className="cex-label" htmlFor="cex-video">Video URL (optional)</label>
          <input
            id="cex-video"
            type="url"
            className="cex-input"
            placeholder="https://..."
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
          />
        </div>

        <Button
          variant="primary"
          size="lg"
          fullWidth
          disabled={name.trim().length === 0}
          onClick={handleSubmit}
        >
          Create Exercise
        </Button>
      </div>
    </Sheet>
  );
}
