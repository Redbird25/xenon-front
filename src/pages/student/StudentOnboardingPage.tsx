import React, { useEffect, useState } from 'react';
import { Box, Button, Checkbox, Container, FormControlLabel, Paper, Radio, RadioGroup, TextField, Typography, Alert } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const StudentOnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [interests, setInterests] = useState('');
  const [hobbies, setHobbies] = useState('');
  const [format, setFormat] = useState<'video'|'text'|'mixed'>('mixed');
  const [optInReminders, setOptInReminders] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    const key = `student_onboarding_${user.id}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      const s = JSON.parse(saved);
      setInterests(s.interests || '');
      setHobbies(s.hobbies || '');
      setFormat(s.format || 'mixed');
      setOptInReminders(!!s.optInReminders);
    } else {
      setInterests(''); setHobbies(''); setFormat('mixed'); setOptInReminders(true);
    }
  }, [user?.id]);

  const save = () => {
    if (!user?.id) return;
    const key = `student_onboarding_${user.id}`;
    localStorage.setItem(key, JSON.stringify({ interests, hobbies, format, optInReminders }));
    navigate('/dashboard');
  };

  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>Welcome! Tell us about you</Typography>
      {!user && (
        <Alert severity="warning" sx={{ mb: 2 }}>Please sign in to continue onboarding.</Alert>
      )}
      <Paper sx={{ p:3 }}>
        <TextField fullWidth label="Interests" value={interests} onChange={(e)=>setInterests(e.target.value)} sx={{ mb:2 }} />
        <TextField fullWidth label="Hobbies" value={hobbies} onChange={(e)=>setHobbies(e.target.value)} sx={{ mb:2 }} />
        <Typography variant="subtitle1" sx={{ mb: 1 }}>Preferred learning format</Typography>
        <RadioGroup row value={format} onChange={(e)=>setFormat(e.target.value as any)}>
          <FormControlLabel value="video" control={<Radio />} label="Video" />
          <FormControlLabel value="text" control={<Radio />} label="Text" />
          <FormControlLabel value="mixed" control={<Radio />} label="Mixed" />
        </RadioGroup>
        <FormControlLabel control={<Checkbox checked={optInReminders} onChange={(e)=>setOptInReminders(e.target.checked)} />} label="Send me study reminders" />
        <Box sx={{ mt:2 }}>
          <Button variant="contained" onClick={save}>Save and continue</Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default StudentOnboardingPage;
