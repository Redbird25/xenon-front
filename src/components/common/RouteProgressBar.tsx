import React from 'react';
import { LinearProgress, Box } from '@mui/material';
import { useLocation } from 'react-router-dom';
import { useIsFetching } from '@tanstack/react-query';

const MIN_VISIBLE_MS = 300;
const HIDE_DELAY_MS = 150;

const RouteProgressBar: React.FC = () => {
  const location = useLocation();
  const isFetching = useIsFetching();

  const [visible, setVisible] = React.useState(false);
  const activatedAt = React.useRef<number>(0);

  // Trigger on navigation
  React.useEffect(() => {
    activatedAt.current = Date.now();
    setVisible(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, location.search]);

  // Combine with React Query fetching
  React.useEffect(() => {
    if (isFetching > 0) {
      if (!visible) {
        activatedAt.current = Date.now();
        setVisible(true);
      }
      return;
    }
    // When fetching finishes, keep bar at least MIN_VISIBLE_MS to avoid flicker
    const elapsed = Date.now() - activatedAt.current;
    const remaining = Math.max(0, MIN_VISIBLE_MS - elapsed);
    const t = window.setTimeout(() => setVisible(false), remaining + HIDE_DELAY_MS);
    return () => window.clearTimeout(t);
  }, [isFetching, visible]);

  if (!visible) return null;
  return (
    <Box sx={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 2000 }}>
      <LinearProgress />
    </Box>
  );
};

export default RouteProgressBar;
