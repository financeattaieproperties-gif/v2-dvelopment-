import React, { useState } from 'react';
import { Lightbulb } from 'lucide-react';
import { ImageUpload } from './ImageUpload';

interface ApartmentGalleryReorderProps {
  coverUrl: string | null;
  galleryUrls: string[];
  onChange: (coverUrl: string | null, galleryUrls: string[]) => void;
  maxPhotos?: number;
}

export function ApartmentGalleryReorder({
  coverUrl,
  galleryUrls,
  onChange,
  maxPhotos = 9, // 1 cover + up to 8 gallery
}: ApartmentGalleryReorderProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [dropPosition, setDropPosition] = useState<'before' | 'after' | null>(null);

  // Combine cover (index 0) and gallery (indices 1..N)
  const allPhotos: string[] = [
    ...(coverUrl ? [coverUrl] : []),
    ...(Array.isArray(galleryUrls) ? galleryUrls.filter(Boolean) : []),
  ];

  const applyNewOrder = (updatedPhotos: string[]) => {
    const newCover = updatedPhotos.length > 0 ? updatedPhotos[0] : null;
    const newGallery = updatedPhotos.slice(1);
    onChange(newCover, newGallery);
  };

  const movePhoto = (fromIdx: number, toIdx: number) => {
    if (fromIdx === toIdx || fromIdx < 0 || toIdx < 0) return;
    const updated = [...allPhotos];
    const [moved] = updated.splice(fromIdx, 1);
    updated.splice(toIdx, 0, moved);
    applyNewOrder(updated);
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = (e: React.DragEvent, index: number) => {
    if (dragOverIndex === index) {
      setDragOverIndex(null);
      setDropPosition(null);
    }
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    const sourceIdxStr = e.dataTransfer.getData('text/plain');
    const sourceIdx = sourceIdxStr !== '' ? Number(sourceIdxStr) : draggedIndex;

    if (sourceIdx !== null && !isNaN(sourceIdx) && sourceIdx !== targetIndex) {
      movePhoto(sourceIdx, targetIndex);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
    setDropPosition(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
    setDropPosition(null);
  };

  const removePhoto = (index: number) => {
    const updated = allPhotos.filter((_, i) => i !== index);
    applyNewOrder(updated);
  };

  const makeCover = (index: number) => {
    movePhoto(index, 0);
  };

  const moveStep = (index: number, direction: 'left' | 'right') => {
    const targetIdx = direction === 'left' ? index - 1 : index + 1;
    if (targetIdx >= 0 && targetIdx < allPhotos.length) {
      movePhoto(index, targetIdx);
    }
  };

  const canAddMore = allPhotos.length < maxPhotos;
  const galleryCount = Math.max(0, allPhotos.length - (allPhotos.length > 0 ? 1 : 0));

  return (
    <div style={{ marginTop: '0.25rem' }}>
      {/* Informational Header & Summary Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.5rem',
          marginBottom: '0.65rem',
          padding: '0.45rem 0.75rem',
          background: '#F8FAFC',
          border: '1px solid #E2E8F0',
          borderRadius: 8,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 20,
              height: 20,
              borderRadius: 4,
              background: '#0072BC',
              color: '#FFFFFF',
              fontSize: '0.75rem',
              fontWeight: 700,
            }}
          >
            ⠿
          </span>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#1E293B' }}>
            Drag & Drop Photos to Reorder
          </span>
          <span style={{ fontSize: '0.75rem', color: '#818285' }}>
            · Position 1 is always the primary Cover Photo
          </span>
        </div>

        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#818285', fontVariantNumeric: 'tabular-nums' }}>
          {allPhotos.length} of {maxPhotos} Photos ({allPhotos.length > 0 ? '1 Cover' : '0 Cover'} + {galleryCount} Gallery)
        </div>
      </div>

      {/* Grid of Draggable Photo Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))',
          gap: '0.85rem',
          alignItems: 'start',
        }}
      >
        {allPhotos.map((url, i) => {
          const isCover = i === 0;
          const isDragging = draggedIndex === i;
          const isOver = dragOverIndex === i && draggedIndex !== i;

          return (
            <div
              key={`${url}-${i}`}
              draggable
              onDragStart={(e) => handleDragStart(e, i)}
              onDragOver={(e) => handleDragOver(e, i)}
              onDragLeave={(e) => handleDragLeave(e, i)}
              onDrop={(e) => handleDrop(e, i)}
              onDragEnd={handleDragEnd}
              style={{
                position: 'relative',
                background: '#FFFFFF',
                borderRadius: 10,
                border: isOver
                  ? '2px dashed #0072BC'
                  : isCover
                  ? '2px solid #0072BC'
                  : '1px solid #E2E8F0',
                padding: '0.55rem',
                opacity: isDragging ? 0.35 : 1,
                transform: isOver ? 'translateY(-3px)' : 'none',
                transition: 'transform 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease',
                boxShadow: isCover
                  ? '0 2px 8px rgba(0, 114, 188, 0.12)'
                  : isOver
                  ? '0 6px 14px rgba(0, 114, 188, 0.15)'
                  : '0 1px 3px rgba(0, 0, 0, 0.05)',
                cursor: 'grab',
                userSelect: 'none',
              }}
              title="Drag to reorder photo position"
            >
              {/* Card Header: Slot Badge & Drag Grip Handle */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '0.4rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  {isCover ? (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        padding: '0.15rem 0.5rem',
                        borderRadius: 4,
                        background: '#0072BC',
                        color: '#FFFFFF',
                        letterSpacing: '0.02em',
                      }}
                    >
                      <span style={{ color: '#E6F2FA' }}>★</span> Cover Photo
                    </span>
                  ) : (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        padding: '0.15rem 0.45rem',
                        borderRadius: 4,
                        background: '#F1F5F9',
                        color: '#818285',
                      }}
                    >
                      Gallery #{i}
                    </span>
                  )}
                  <span
                    style={{
                      fontSize: '0.68rem',
                      color: '#94A3B8',
                      fontVariantNumeric: 'tabular-nums',
                      fontWeight: 600,
                    }}
                  >
                    Slot {i + 1}
                  </span>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.2rem',
                    color: '#94A3B8',
                    cursor: 'grab',
                  }}
                  title="Click and drag to reorder"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="9" cy="5" r="1" />
                    <circle cx="9" cy="12" r="1" />
                    <circle cx="9" cy="19" r="1" />
                    <circle cx="15" cy="5" r="1" />
                    <circle cx="15" cy="12" r="1" />
                    <circle cx="15" cy="19" r="1" />
                  </svg>
                  <span style={{ fontSize: '0.68rem', fontWeight: 600 }}>Drag</span>
                </div>
              </div>

              {/* Photo Thumbnail */}
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  height: 140,
                  borderRadius: 6,
                  overflow: 'hidden',
                  background: '#F1F5F9',
                }}
              >
                <img
                  src={url}
                  alt={`Apartment photo ${i + 1}`}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: 'block',
                  }}
                />

                {/* Drop target visual overlay */}
                {isOver && (
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'rgba(0, 114, 188, 0.78)',
                      color: '#FFFFFF',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '0.5rem',
                      textAlign: 'center',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                    }}
                  >
                    <span style={{ fontSize: '1.1rem', marginBottom: '0.2rem' }}>↓</span>
                    <span>Drop here for Slot {i + 1}</span>
                    {isCover && (
                      <span style={{ fontSize: '0.68rem', color: '#FCD34D' }}>
                        (Will become Cover Photo)
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Card Footer: Action Controls */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.35rem',
                  marginTop: '0.5rem',
                  paddingTop: '0.4rem',
                  borderTop: '1px solid #F1F5F9',
                }}
              >
                {/* Reorder Arrow Buttons */}
                <div style={{ display: 'flex', gap: '0.2rem' }}>
                  <button
                    type="button"
                    disabled={i === 0}
                    onClick={() => moveStep(i, 'left')}
                    title="Move photo left"
                    aria-label="Move photo left"
                    style={{
                      padding: '0.2rem 0.45rem',
                      background: i === 0 ? '#F8FAFC' : '#F1F5F9',
                      color: i === 0 ? '#CBD5E1' : '#334155',
                      border: '1px solid #E2E8F0',
                      borderRadius: 4,
                      cursor: i === 0 ? 'not-allowed' : 'pointer',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                    }}
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    disabled={i === allPhotos.length - 1}
                    onClick={() => moveStep(i, 'right')}
                    title="Move photo right"
                    aria-label="Move photo right"
                    style={{
                      padding: '0.2rem 0.45rem',
                      background: i === allPhotos.length - 1 ? '#F8FAFC' : '#F1F5F9',
                      color: i === allPhotos.length - 1 ? '#CBD5E1' : '#334155',
                      border: '1px solid #E2E8F0',
                      borderRadius: 4,
                      cursor: i === allPhotos.length - 1 ? 'not-allowed' : 'pointer',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                    }}
                  >
                    →
                  </button>
                </div>

                {/* Make Cover or Remove Button */}
                <div style={{ display: 'flex', gap: '0.35rem' }}>
                  {!isCover && (
                    <button
                      type="button"
                      onClick={() => makeCover(i)}
                      title="Make this photo the primary apartment cover"
                      aria-label="Make primary cover"
                      style={{
                        padding: '0.2rem 0.5rem',
                        background: '#E6F2FA',
                        color: '#0072BC',
                        border: '1px solid #BAE6FD',
                        borderRadius: 4,
                        cursor: 'pointer',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                      }}
                    >
                      ★ Set as Cover
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => removePhoto(i)}
                    title="Remove this photo"
                    aria-label="Remove photo"
                    style={{
                      padding: '0.2rem 0.45rem',
                      background: '#FEF2F2',
                      color: '#B91C1C',
                      border: '1px solid #FECACA',
                      borderRadius: 4,
                      cursor: 'pointer',
                      fontSize: '0.7rem',
                      fontWeight: 600,
                    }}
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {/* Upload Slot for Adding More Photos */}
        {canAddMore && (
          <div
            style={{
              border: '2px dashed #CBD5E1',
              borderRadius: 10,
              padding: '0.55rem',
              background: '#F8FAFC',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              minHeight: 215,
            }}
          >
            <div style={{ marginBottom: '0.35rem', textAlign: 'center' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#475569' }}>
                {allPhotos.length === 0 ? '+ Upload Cover Photo' : `+ Add Photo ${allPhotos.length + 1}`}
              </span>
              <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.68rem', color: '#94A3B8' }}>
                {allPhotos.length === 0
                  ? 'First photo will be set as Cover'
                  : `Add up to ${maxPhotos - allPhotos.length} more photo(s)`}
              </p>
            </div>
            <ImageUpload
              value={null}
              onChange={(newUrl) => {
                if (newUrl) {
                  const updated = [...allPhotos, newUrl];
                  applyNewOrder(updated);
                }
              }}
              purpose="gallery"
            />
          </div>
        )}
      </div>

      {/* Helpful instructions footer */}
      <p
        style={{
          fontSize: '0.72rem',
          color: '#64748B',
          margin: '0.65rem 0 0 0',
          display: 'flex',
          alignItems: 'center',
          gap: '0.35rem',
        }}
      >
        <Lightbulb size={13} style={{ color: '#0072BC', flexShrink: 0 }} aria-hidden="true" />
        <span>
          <strong>Pro-Tip:</strong> Grab any photo card and drag it onto another card to swap positions. Click <strong>★ Set as Cover</strong> to instantly make any interior or balcony shot the primary cover photo.
        </span>
      </p>
    </div>
  );
}
