import React from 'react';
import { Box, Skeleton } from '@mui/material';

const PageLoader: React.FC = () => (
  <Box sx={{ p: 3 }}>
    <Skeleton variant="text" width={240} height={40} />
    <Skeleton variant="rectangular" height={120} sx={{ my: 2, borderRadius: 2 }} />
    <Skeleton variant="rectangular" height={240} sx={{ my: 1, borderRadius: 2 }} />
  </Box>
);

export default PageLoader;

