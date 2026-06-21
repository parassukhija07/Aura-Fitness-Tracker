import { useRef, useState } from 'react';
import { useBodyDataStore } from '../../store/bodyDataStore';

export default function PhotoLibrary(): JSX.Element {
  const photos = useBodyDataStore((s) => s.photos);
  const addPhoto = useBodyDataStore((s) => s.addPhoto);
  const deletePhoto = useBodyDataStore((s) => s.deletePhoto);

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

  const comparePhotos = selected.length === 2
    ? selected.map((id) => sortedPhotos.find((p) => p.id === id)).filter(Boolean)
    : [];

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

      {comparePhotos.length === 2 && (
        <>
          <button
            type="button"
            className="photo-lib__compare-toggle"
            onClick={() => setOrientation((o) => (o === 'horizontal' ? 'vertical' : 'horizontal'))}
          >
            {orientation === 'horizontal' ? 'Top / bottom' : 'Side by side'}
          </button>
          <div className={`photo-lib__compare${orientation === 'vertical' ? ' photo-lib__compare--vertical' : ''}`}>
            {comparePhotos.map((photo) => (
              <img key={photo!.id} src={photo!.dataUrl} alt={`Compare ${photo!.date}`} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
