import React from 'react';
import { Box, useTheme } from '@mui/material';
import { keyframes } from '@emotion/react';

const floatA = keyframes`
  0% { transform: translate3d(-8%, -6%, 0) scale(1); }
  50% { transform: translate3d(6%, 4%, 0) scale(1.06); }
  100% { transform: translate3d(-8%, -6%, 0) scale(1); }
`;

const floatB = keyframes`
  0% { transform: translate3d(6%, -4%, 0) scale(1.05); }
  50% { transform: translate3d(-4%, 8%, 0) scale(1); }
  100% { transform: translate3d(6%, -4%, 0) scale(1.05); }
`;

const floatC = keyframes`
  0% { transform: translate3d(-2%, 6%, 0) scale(1); }
  50% { transform: translate3d(4%, -4%, 0) scale(1.04); }
  100% { transform: translate3d(-2%, 6%, 0) scale(1); }
`;

interface AuroraProps {
  height?: number;
}

const Aurora: React.FC<AuroraProps> = ({ height = 220 }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Box
      sx={{
        position: 'relative',
        height,
        width: '100%',
        pointerEvents: 'none',
        overflow: 'hidden',
        WebkitMaskImage: 'radial-gradient(90% 85% at 50% 30%, #000 60%, transparent 100%)',
        maskImage: 'radial-gradient(90% 85% at 50% 30%, #000 60%, transparent 100%)',
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          filter: 'blur(100px)',
          opacity: isDark ? 0.5 : 0.4,
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: '-25%', left: '-15%', width: '65%', height: '160%',
            background: `radial-gradient(60% 60% at 50% 50%, ${theme.palette.primary.main} 0%, transparent 60%)`,
            animation: `${floatA} 18s ease-in-out infinite`,
            mixBlendMode: isDark ? 'screen' : 'multiply',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            top: '-30%', right: '-15%', width: '65%', height: '170%',
            background: `radial-gradient(60% 60% at 50% 50%, ${theme.palette.secondary.main} 0%, transparent 60%)`,
            animation: `${floatB} 22s ease-in-out infinite`,
            mixBlendMode: isDark ? 'screen' : 'multiply',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: '-25%', left: '20%', width: '55%', height: '150%',
            background: `radial-gradient(60% 60% at 50% 50%, ${isDark ? '#3ddcff' : '#5b9bd5'} 0%, transparent 60%)`,
            animation: `${floatC} 26s ease-in-out infinite`,
            mixBlendMode: isDark ? 'screen' : 'multiply',
          }}
        />
      </Box>
    </Box>
  );
};

export default Aurora;
