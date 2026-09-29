'use client';

import { useState, useRef, ChangeEvent, DragEvent } from 'react';
import styles from './PhotoUploader.module.css';

interface PhotoUploaderProps {
  onPhotoSelected: (file: File | null) => void;
  caption: string;
  onCaptionChange: (caption: string) => void;
  initialPreview?: string | null;
}

export default function PhotoUploader({
  onPhotoSelected,
  caption,
  onCaptionChange,
  initialPreview,
}: PhotoUploaderProps) {
  const [preview, setPreview] = useState<string | null>(initialPreview || null);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Client-side image resize & compression via HTML Canvas
  const compressImage = (file: File): Promise<File> => {
    return new Promise((resolve) => {
      // If SVG or gif, return as is
      if (file.type === 'image/svg+xml' || file.type === 'image/gif') {
        resolve(file);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const maxWidth = 1600;
          const maxHeight = 1600;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(file);
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".webp", {
                  type: 'image/webp',
                  lastModified: Date.now(),
                });
                resolve(compressedFile);
              } else {
                resolve(file);
              }
            },
            'image/webp',
            0.85
          );
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const processFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (JPG, PNG, WebP).');
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      alert('File size exceeds the 15MB limit. Please choose a smaller photo.');
      return;
    }
    const compressed = await compressImage(file);
    const objectUrl = URL.createObjectURL(compressed);
    setPreview(objectUrl);
    onPhotoSelected(compressed);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleRemove = () => {
    if (preview && preview.startsWith('blob:')) {
      URL.revokeObjectURL(preview);
    }
    setPreview(null);
    onPhotoSelected(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  return (
    <div className={styles.uploader}>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        style={{ display: 'none' }}
        id="photo-file-input"
      />

      {!preview ? (
        <div
          className={`${styles.dropzone} ${isDragging ? styles.dropzoneActive : ''}`}
          onClick={() => inputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          role="button"
          tabIndex={0}
        >
          <span className={styles.icon}>🖼️</span>
          <p className={styles.title}>Attach a cherished family photo</p>
          <p className={styles.hint}>Drag & drop or click to browse (JPG, PNG, WebP)</p>
        </div>
      ) : (
        <div className={styles.previewCard}>
          <div className={styles.imageWrap}>
            <img src={preview} alt="Memory preview" className={styles.previewImg} />
            <button
              type="button"
              className={styles.removeBtn}
              onClick={handleRemove}
              title="Remove photo"
            >
              ✕
            </button>
          </div>
          <div className={styles.captionWrap}>
            <input
              type="text"
              className={styles.captionInput}
              placeholder="Add photo caption (e.g. Grandma and Mom in Da Lat, 1978)..."
              value={caption}
              onChange={(e) => onCaptionChange(e.target.value)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
