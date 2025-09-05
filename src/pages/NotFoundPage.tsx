import React from 'react';
import { Box, Button, Container, Typography } from '@mui/material';
import { Link } from 'react-router-dom';

const NotFoundPage: React.FC = () => {
  return (
    <Container sx={{ py: 10, textAlign: 'center' }}>
      <Typography variant="h2" sx={{ fontWeight: 800, mb: 2 }}>
        404
      </Typography>
      <Typography variant="h5" sx={{ mb: 3 }}>
        The page you’re looking for doesn’t exist.
      </Typography>
      <Box display="flex" gap={2} justifyContent="center">
        <Button component={Link} to="/dashboard" variant="contained">Go to Dashboard</Button>
        <Button component={Link} to="/landing" variant="outlined">Back to Landing</Button>
      </Box>
    </Container>
  );
};

export default NotFoundPage;

