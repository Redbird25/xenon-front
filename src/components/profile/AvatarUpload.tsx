import React, { useCallback, useRef, useState } from 'react';
import { Box, Button } from '@mui/material';

interface AvatarUploadProps {
  size?: number;
  value?: string | null; // dataURL
  onChange: (dataUrl: string | null) => void;
}

function readFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.onload = () => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Invalid image'));
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

function cropCenterSquare(img: HTMLImageElement, outSize: number): string {
  const canvas = document.createElement('canvas');
  canvas.width = outSize;
  canvas.height = outSize;
  const ctx = canvas.getContext('2d')!;
  // compute source crop (center square)
  const s = Math.min(img.naturalWidth, img.naturalHeight);
  const sx = Math.max(0, (img.naturalWidth - s) / 2);
  const sy = Math.max(0, (img.naturalHeight - s) / 2);
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, sx, sy, s, s, 0, 0, outSize, outSize);
  return canvas.toDataURL('image/png');
}

const AvatarUpload: React.FC<AvatarUploadProps> = ({ size = 96, value, onChange }) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleSelect = useCallback(async (file: File) => {
    const img = await readFile(file);
    // simple center-square autocrop (no UI)
    const dataUrl = cropCenterSquare(img, 256);
    onChange(dataUrl);
  }, [onChange]);

  const onDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) await handleSelect(file);
  };

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) await handleSelect(file);
  };

  return (
    <Box
      onDragOver={(e)=>{ e.preventDefault(); setDragOver(true); }}
      onDragLeave={()=> setDragOver(false)}
      onDrop={onDrop}
      sx={{
        position: 'relative',
        width: size,
        height: size,
        borderRadius: '50%',
        overflow: 'hidden',
        boxShadow: dragOver ? '0 0 0 2px rgba(124,58,237,.6) inset' : undefined,
        cursor: 'pointer',
        bgcolor: 'action.selected',
      }}
      onClick={()=> inputRef.current?.click()}
      aria-label="Change avatar"
      role="button"
    >
      {value ? (
        <img src={value} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        <Box sx={{ width: '100%', height: '100%' }} />
      )}
      <input ref={inputRef} type="file" accept="image/*" hidden onChange={onFileChange} />
      <Button size="small" variant="contained" sx={{ position: 'absolute', bottom: 6, left: '50%', transform: 'translateX(-50%)', px: 1.5, py: 0.2 }}>
        Change
      </Button>
    </Box>
  );
};

export default AvatarUpload;
