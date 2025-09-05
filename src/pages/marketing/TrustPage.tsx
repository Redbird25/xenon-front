import React from 'react';
import { Box, Chip, Container, Typography } from '@mui/material';

const brands = ['Acme Corp', 'Globex', 'Initech', 'Umbrella', 'Hooli', 'Soylent'];

const TrustPage: React.FC = () => (
  <Container sx={{ py: 8 }}>
    <Typography variant="h3" sx={{ fontWeight: 800 }} gutterBottom>Trusted by modern teams</Typography>
    <Typography color="text.secondary" sx={{ mb: 3 }}>A few of the organizations exploring learning with Xenon.</Typography>
    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
      {brands.map((b) => (
        <Chip key={b} label={b} variant="outlined" />
      ))}
    </Box>
  </Container>
);

export default TrustPage;

