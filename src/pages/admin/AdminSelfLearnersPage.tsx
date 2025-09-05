import React, { useState } from 'react';
import { Container, Typography, Paper, Box, Chip } from '@mui/material';
import { User } from '../../types';

const AdminSelfLearnersPage: React.FC = () => {
  const [users] = useState<User[]>([
    { id: 's1', email: 'solo@example.com', name: 'Solo Learner', role: 'self-learner', createdAt: new Date().toISOString(), plan: 'free' },
  ]);

  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>Self‑Learners</Typography>
      <Paper sx={{ p: 3 }}>
        {users.map((u)=> (
          <Box key={u.id} sx={{ display:'flex', alignItems:'center', justifyContent:'space-between', p:1.5, borderRadius:1, border:'1px solid', borderColor:'divider', mb:1 }}>
            <Box>
              <Typography>{u.name}</Typography>
              <Typography variant="body2" color="text.secondary">{u.email}</Typography>
            </Box>
            <Chip label={u.plan || 'free'} />
          </Box>
        ))}
      </Paper>
    </Container>
  );
};

export default AdminSelfLearnersPage;

