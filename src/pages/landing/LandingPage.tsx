import React from 'react';
import { Box, Button, Container, Paper, Stack, Typography } from '@mui/material';
import Grid from '@mui/material/Grid';
import { RocketLaunch, AutoAwesome, Shield, FlashOn } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
// Removed decorative aurora background per feedback

const MotionBox = motion(Box as any);

const FeatureCard: React.FC<{ icon: React.ReactNode; title: string; desc: string }> = ({ icon, title, desc }) => (
  <Paper sx={{ p: 3, height: '100%', backgroundImage: 'none' }} elevation={3}>
    <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
      <Box sx={{ p: 1.2, borderRadius: 2, bgcolor: 'primary.main', color: 'primary.contrastText' }}>{icon}</Box>
      <Typography variant="h6">{title}</Typography>
    </Stack>
    <Typography variant="body2" color="text.secondary">{desc}</Typography>
  </Paper>
);

const LandingPage: React.FC = () => {
  return (
    <Box sx={{
      background: (t) => t.palette.mode === 'dark'
        ? 'radial-gradient(1200px 600px at 10% -20%, rgba(124,58,237,.25), transparent), radial-gradient(1000px 500px at 110% 10%, rgba(0,229,255,.18), transparent)'
        : 'linear-gradient(180deg, #F8FAFF 0%, #FFFFFF 40%)',
      pb: 10,
    }}>
      {/* Hero */}
      <Container maxWidth="lg" sx={{ pt: 10 }}>
        <Grid container spacing={6} alignItems="center">
          <Grid size={{ xs: 12, md: 6 }}>
            <MotionBox
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Typography variant="overline" color="secondary" sx={{ letterSpacing: 2 }}>
                FUTURISTIC LEARNING PLATFORM
              </Typography>
              <Typography variant="h2" sx={{ fontWeight: 800, mt: 1, lineHeight: 1.1 }}>
                Learn faster with AI. <Box component="span" sx={{ background: 'linear-gradient(90deg,#7C3AED,#00E5FF)', WebkitBackgroundClip: 'text', color: 'transparent' }}>Teach smarter</Box> with Xenon.
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
                Build courses from your content, personalize paths, and track mastery — all with stunning UX and delightful speed.
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 4 }}>
                <Button component={Link} to="/login" size="large" variant="contained" startIcon={<RocketLaunch />}>Get Started</Button>
                <Button component={Link} to="/login" size="large" variant="outlined">Try Demo</Button>
              </Stack>
            </MotionBox>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <MotionBox
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              sx={{
                borderRadius: 4,
                p: 0.5,
                background: 'linear-gradient(135deg, rgba(124,58,237,.5), rgba(0,229,255,.5))',
              }}
            >
              <Box sx={{ p: 3, borderRadius: 3, bgcolor: 'background.paper' }}>
                <Typography variant="h6" gutterBottom>Instant Course Builder</Typography>
                <Typography color="text.secondary">
                  Paste links or upload files — Xenon AI ingests, chunks, and crafts routes with quizzes in minutes.
                </Typography>
              </Box>
            </MotionBox>
            {/* Decorative illustration */}
            {/* Decorative background removed for a cleaner hero */}
          </Grid>
        </Grid>
      </Container>

      {/* Features */}
      <Container maxWidth="lg" sx={{ mt: 10 }}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 4 }}><FeatureCard icon={<AutoAwesome />} title="AI‑Powered" desc="Smart ingestion, semantic search, and adaptive quizzing for mastery." /></Grid>
          <Grid size={{ xs: 12, md: 4 }}><FeatureCard icon={<FlashOn />} title="Lightning Fast" desc="Built with Vite + React Query for instant, cached experiences." /></Grid>
          <Grid size={{ xs: 12, md: 4 }}><FeatureCard icon={<Shield />} title="Enterprise Ready" desc="Role-based access, progress tracking, and robust API integration." /></Grid>
        </Grid>
      </Container>

      {/* CTA */}
      <Container maxWidth="lg" sx={{ mt: 12 }}>
        <Paper sx={{ p: 5, textAlign: 'center', backgroundImage: 'none' }}>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>
            Ready to accelerate learning?
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 1 }}>
            Join teams building beautiful courses with AI.
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center" sx={{ mt: 3 }}>
            <Button component={Link} to="/login" variant="contained" size="large">Start Free</Button>
            <Button component={Link} to="/login" variant="outlined" size="large">Book a Demo</Button>
          </Stack>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center" sx={{ mt: 2 }}>
            <Button component={Link} to="/trust" size="small">Trust</Button>
            <Button component={Link} to="/faq" size="small">FAQ</Button>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
};

export default LandingPage;
