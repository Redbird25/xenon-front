import React, { useState } from 'react';
import { Navigate, Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  Avatar,
  Link,
} from '@mui/material';
import { PersonAdd } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';

const RegisterPage: React.FC = () => {
  const { register, isAuthenticated, isLoading } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    if (!firstName || !lastName || !email || !password) {
      setError('Please fill in all fields');
      return;
    }
    try {
      await register(firstName, lastName, email, password);
      // Save prefill data for login and redirect
      try {
        sessionStorage.setItem('prefill_login', JSON.stringify({ email, password }));
      } catch {}
      showToast('Registration successful. Please sign in.', 'success');
      navigate('/login');
    } catch (err) {
      setError('Registration failed.');
    }
  };

  if (isAuthenticated) {
    return <Navigate to="/dashboard" />;
  }

  return (
    <Container component="main" maxWidth="sm">
      <Box sx={{ mt: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Paper elevation={3} sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
          <Avatar sx={{ m: 1, bgcolor: 'primary.main' }}>
            <PersonAdd />
          </Avatar>
          <Typography component="h1" variant="h5">Create your account</Typography>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1, width: '100%' }}>
            <TextField margin="normal" required fullWidth label="First Name" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            <TextField margin="normal" required fullWidth label="Last Name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
            <TextField margin="normal" required fullWidth label="Email Address" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <TextField margin="normal" required fullWidth label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            {error && (<Alert severity="error" sx={{ mt: 2, width: '100%' }}>{error}</Alert>)}
            <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2 }} disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Register'}
            </Button>
            <Typography variant="body2" align="center">
              Already have an account? <Link component={RouterLink} to="/login">Sign in</Link>
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default RegisterPage;

