import React from 'react';
import { Box, Button, Card, CardContent, Chip, Container, Grid, Stack, Typography } from '@mui/material';
import { CheckCircle, Star } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const MotionCard = motion(Card as any);

const plans = [
  { name: 'Starter', price: 'Free', features: ['1 course', 'AI ingest up to 3 resources', 'Community support'], cta: 'Get Started', highlighted: false },
  { name: 'Pro', price: '$19/mo', features: ['Unlimited courses', 'AI ingest + search', 'Advanced quizzes', 'Priority support'], cta: 'Start Pro', highlighted: true },
  { name: 'Team', price: '$59/mo', features: ['Seats & roles', 'Progress analytics', 'SSO (coming soon)'], cta: 'Talk to Sales', highlighted: false },
];

const logos = ['Acme', 'Globex', 'Umbrella', 'Initech', 'Hooli'];

const PricingPage: React.FC = () => {
  return (
    <Container sx={{ py: 8 }}>
      <Typography variant="h3" sx={{ fontWeight: 800 }} gutterBottom>
        Simple pricing for every stage
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 4 }}>
        Build and sell courses with AI assistance. Cancel anytime.
      </Typography>

      <Grid container spacing={{ xs: 2, md: 3 }}>
        {plans.map((p, i) => (
          <Grid key={p.name} size={{ xs: 12, md: 4 }}>
            <MotionCard initial={{opacity:0, y: 12}} whileInView={{opacity:1, y:0}} viewport={{ once: true }}
              sx={{ borderRadius: 3, border: p.highlighted ? '1px solid' : undefined, borderColor: p.highlighted ? 'primary.main' : undefined }}>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>{p.name}</Typography>
                  {p.highlighted && <Chip icon={<Star />} label="Popular" color="primary" size="small" />}
                </Stack>
                <Typography variant="h4" sx={{ mt: 1, mb: 2 }}>{p.price}</Typography>
                <Stack spacing={1} sx={{ mb: 3 }}>
                  {p.features.map((f) => (
                    <Stack direction="row" key={f} spacing={1} alignItems="center">
                      <CheckCircle color="success" fontSize="small" />
                      <Typography variant="body2">{f}</Typography>
                    </Stack>
                  ))}
                </Stack>
                <Button fullWidth variant={p.highlighted ? 'contained' : 'outlined'} component={Link} to="/register">{p.cta}</Button>
              </CardContent>
            </MotionCard>
          </Grid>
        ))}
      </Grid>

      <Box sx={{ mt: 8 }}>
        <Typography variant="overline" color="text.secondary">TRUSTED BY</Typography>
        <Stack direction="row" spacing={3} sx={{ mt: 2 }}>
          {logos.map((l) => (
            <Chip key={l} label={l} variant="outlined" />
          ))}
        </Stack>
      </Box>

      <Box sx={{ mt: 8 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }} gutterBottom>Frequently asked questions</Typography>
        <Stack spacing={1}>
          <Typography><b>How does AI ingest work?</b> Paste links or upload files — Xenon chunks and indexes them for search and quizzes.</Typography>
          <Typography><b>Can I cancel anytime?</b> Yes, no lock-in.</Typography>
          <Typography><b>Do you offer team plans?</b> Yes — Team plan includes seats and advanced analytics.</Typography>
        </Stack>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 2 }}>
          <Button component={Link} to="/trust" size="small">Trust</Button>
          <Button component={Link} to="/faq" size="small">FAQ</Button>
        </Stack>
      </Box>
    </Container>
  );
};

export default PricingPage;
