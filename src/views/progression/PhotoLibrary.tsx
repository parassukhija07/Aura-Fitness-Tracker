import { useRef, useState } from 'react';
import { useBodyDataStore } from '../../store/bodyDataStore';
import type { BodyMeasurement } from '../../types/body';
import { useUnits } from '../../utils/units';

function fmtDate(iso: string): string {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Weight (kg) from the body log on/closest-before a given date, if any.
function weightNear(logs: BodyMeasurement[], date: string): number | undefined {
  const onOrBefore = logs
    .filter((l) => l.weightKg != null && l.date <= date)
    .sort((a, b) => b.date.localeCompare(a.date));
  return onOrBefore[0]?.weightKg ?? logs.find((l) => l.weightKg != null)?.weightKg;
}

function bodyFatNear(logs: BodyMeasurement[], date: string): number | undefined {
  const onOrBefore = logs
    .filter((l) => l.bodyFatPercentage != null && l.date <= date)
    .sort((a, b) => b.date.localeCompare(a.date));
  return onOrBefore[0]?.bodyFatPercentage;
}

export default function PhotoLibrary(): JSX.Element {
  const photos = useBodyDataStore((s) => s.photos);
  const logs = useBodyDataStore((s) => s.logs);
  const addPhoto = useBodyDataStore((s) => s.addPhoto);
  const deletePhoto = useBodyDataStore((s) => s.deletePhoto);
  const { fmtWeight } = useUnits();

  const [selected, setSelected] = useState<string[]>([]);
  const [orientation, setOrientation] = useState<'horizontal' | 'vertical'>('horizontal');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const sortedPhotos = [...photos].sort((a, b) => b.date.localeCompare(a.date));

  function handleAddClick() {
    fileInputRef.current?.click();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      addPhoto({
        date: new Date().toISOString().slice(0, 10),
        dataUrl: reader.result as string,
      });
    };
    reader.onerror = () => {
      // silently abort on read error
    };
    reader.readAsDataURL(file);

    // Reset so re-picking same file fires onChange again
    e.target.value = '';
  }

  function handleThumbClick(id: string) {
    setSelected((prev) => {
      if (prev.includes(id)) {
        return prev.filter((s) => s !== id);
      }
      if (prev.length < 2) {
        return [...prev, id];
      }
      // Drop oldest, push new
      return [...prev.slice(1), id];
    });
  }

  function handleDelete(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    deletePhoto(id);
    setSelected((prev) => prev.filter((s) => s !== id));
  }

  // Ordered chronologically (older → newer) for a meaningful before/after compare.
  const comparePhotos = selected.length === 2
    ? (selected
        .map((id) => sortedPhotos.find((p) => p.id === id))
        .filter(Boolean) as typeof sortedPhotos)
        .sort((a, b) => a.date.localeCompare(b.date))
    : [];

  // Delta card data
  let deltaCard: { weeks: number; weightDelta?: number; bfDelta?: number } | null = null;
  if (comparePhotos.length === 2) {
    const [before, after] = comparePhotos;
    const days =
      (new Date(after.date + 'T00:00:00').getTime() - new Date(before.date + 'T00:00:00').getTime()) /
      86400000;
    const weeks = Math.max(0, Math.round(days / 7));
    const wA = weightNear(logs, after.date);
    const wB = weightNear(logs, before.date);
    const bfA = bodyFatNear(logs, after.date);
    const bfB = bodyFatNear(logs, before.date);
    deltaCard = {
      weeks,
      weightDelta: wA != null && wB != null ? +(wA - wB).toFixed(1) : undefined,
      bfDelta: bfA != null && bfB != null ? +(bfA - bfB).toFixed(1) : undefined,
    };
  }

  return (
    <div className="photo-lib">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      {comparePhotos.length === 2 && (
        <>
          <div className="photo-lib__seg" role="group" aria-label="Compare orientation">
            <button
              type="button"
              className={`photo-lib__seg-btn${orientation === 'horizontal' ? ' photo-lib__seg-btn--active' : ''}`}
              onClick={() => setOrientation('horizontal')}
            >
              Side by side
            </button>
            <button
              type="button"
              className={`photo-lib__seg-btn${orientation === 'vertical' ? ' photo-lib__seg-btn--active' : ''}`}
              onClick={() => setOrientation('vertical')}
            >
              Up / down
            </button>
          </div>

          <div className={`photo-lib__compare${orientation === 'vertical' ? ' photo-lib__compare--vertical' : ''}`}>
            {comparePhotos.map((photo) => {
              const w = weightNear(logs, photo.date);
              return (
                <div key={photo.id} className="photo-lib__compare-item">
                  <img src={photo.dataUrl} alt={`Compare ${photo.date}`} />
                  <div className="photo-lib__compare-cap">
                    {fmtDate(photo.date)}{w != null ? ` · ${fmtWeight(w)}` : ''}
                  </div>
                </div>
              );
            })}
          </div>

          {deltaCard && (
            <div className="photo-lib__delta">
              <div>
                <div className="photo-lib__delta-title">
                  {deltaCard.weeks} week{deltaCard.weeks === 1 ? '' : 's'} apart
                </div>
                <div className="photo-lib__delta-sub">
                  {deltaCard.weightDelta != null
                    ? `${deltaCard.weightDelta > 0 ? '+' : '−'}${fmtWeight(Math.abs(deltaCard.weightDelta))}`
                    : 'Log weight to see change'}
                  {deltaCard.bfDelta != null
                    ? ` · ${deltaCard.bfDelta > 0 ? '+' : ''}${deltaCard.bfDelta}% body fat`
                    : ''}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      <button type="button" className="photo-lib__add" onClick={handleAddClick}>
        Add Photo
      </button>

      {photos.length === 0 ? (
        <p className="prog-empty">No photos yet.</p>
      ) : (
        <div className="photo-lib__grid">
          {sortedPhotos.map((photo) => (
            <div
              key={photo.id}
              role="button"
              tabIndex={0}
              className={`photo-lib__thumb${selected.includes(photo.id) ? ' photo-lib__thumb--selected' : ''}`}
              onClick={() => handleThumbClick(photo.id)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleThumbClick(photo.id); }}
            >
              <img src={photo.dataUrl} alt={`Progress photo ${photo.date}`} />
              <span className="photo-lib__thumb-date">{fmtDate(photo.date)}</span>
              <button
                type="button"
                className="photo-lib__del"
                aria-label="Delete photo"
                onClick={(e) => handleDelete(e, photo.id)}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {selected.length === 1 && (
        <p className="photo-lib__hint">Select one more photo to compare.</p>
      )}
    </div>
  );
}
