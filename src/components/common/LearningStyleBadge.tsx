import React from 'react';
import { Chip, ChipProps, Tooltip } from '@mui/material';
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';
import DescriptionIcon from '@mui/icons-material/Description';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';

type StyleVal = 'video' | 'text' | 'mixed' | 'VIDEO' | 'TEXT' | 'MIXED' | undefined | null;

interface Props {
  value: StyleVal;
  size?: ChipProps['size'];
}

const LearningStyleBadge: React.FC<Props> = ({ value, size = 'small' }) => {
  const v = String(value || '').toLowerCase() as 'video' | 'text' | 'mixed' | '';

  if (!v) return <Chip size={size} label="Unknown" variant="outlined" />;

  const map = {
    video: { label: 'Video first', icon: <VideoLibraryIcon fontSize="small" />, color: 'secondary' as const },
    text: { label: 'Text first', icon: <DescriptionIcon fontSize="small" />, color: 'default' as const },
    mixed: { label: 'Mixed', icon: <AutoAwesomeIcon fontSize="small" />, color: 'primary' as const },
  } as const;

  const cfg = map[v] || map.mixed;

  const chip = (
    <Chip
      size={size}
      color={cfg.color as any}
      icon={cfg.icon}
      label={cfg.label}
      variant={v === 'text' ? 'outlined' : 'filled'}
      sx={{
        fontWeight: 700,
        borderRadius: 999,
        '& .MuiChip-label': {
          padding: '15px 10px', // vertical 15px, horizontal 10px
        },
      }}
    />
  );

  return <Tooltip title="Preferred learning style">{chip}</Tooltip>;
};

export default LearningStyleBadge;
