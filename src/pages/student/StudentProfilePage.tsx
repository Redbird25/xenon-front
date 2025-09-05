import React, { useEffect, useState } from 'react';
import { Box, Button, Container, Paper, TextField, Typography, Alert } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';

const StudentProfilePage: React.FC = () => {
  const { user } = useAuth();
  const [bio, setBio] = useState('');
  const [interests, setInterests] = useState('');
  const [hobbies, setHobbies] = useState('');

  useEffect(() => {
    if (!user?.id) return;
    const key = `student_profile_${user.id}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      const s = JSON.parse(saved);
      setBio(s.bio || '');
      setInterests(s.interests || '');
      setHobbies(s.hobbies || '');
    } else {
      setBio(''); setInterests(''); setHobbies('');
    }
  }, [user?.id]);

  const save = () => {
    if (!user?.id) return;
    const key = `student_profile_${user.id}`;
    localStorage.setItem(key, JSON.stringify({ bio, interests, hobbies }));
  };

  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>{user?.name}'s Profile</Typography>
      {!user && (
        <Alert severity="warning" sx={{ mb: 2 }}>Please sign in to edit your profile.</Alert>
      )}
      <Paper sx={{ p:3 }}>
        <TextField fullWidth label="Bio" multiline rows={3} value={bio} onChange={(e)=>setBio(e.target.value)} sx={{ mb:2 }} />
        <TextField fullWidth label="Interests" value={interests} onChange={(e)=>setInterests(e.target.value)} sx={{ mb:2 }} />
        <TextField fullWidth label="Hobbies" value={hobbies} onChange={(e)=>setHobbies(e.target.value)} sx={{ mb:2 }} />
        <Box>
          <Button variant="contained" onClick={save}>Save</Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default StudentProfilePage;
