import React, { useState } from 'react';
import { Box, Button, Container, Paper, TextField, Typography, Chip } from '@mui/material';
import Grid from '@mui/material/Grid';
import { Add } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

type Role = 'teacher' | 'student';

const TenantUsersPage: React.FC = () => {
  const { user } = useAuth();
  const [list, setList] = useState<Array<{id:string; email:string; name:string; role:Role}>>([
    { id:'t1', email:'teacher@'+(user?.tenantId||'tenant')+'.com', name:'First Teacher', role:'teacher' },
  ]);
  const [form, setForm] = useState<{email:string; name:string; role:Role}>({ email:'', name:'', role:'student' });

  const add = () => {
    if (!form.email || !form.name) return;
    setList((prev)=>[...prev, {id:String(Date.now()), ...form}]);
    setForm({ email:'', name:'', role:'student' });
  };

  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>Manage People — Tenant {user?.tenantId || '—'}</Typography>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 5 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Create User</Typography>
            <TextField fullWidth label="Full Name" value={form.name} onChange={(e)=>setForm({...form,name:e.target.value})} sx={{ mb: 2 }} />
            <TextField fullWidth label="Email" type="email" value={form.email} onChange={(e)=>setForm({...form,email:e.target.value})} sx={{ mb: 2 }} />
            <TextField fullWidth select SelectProps={{native:true}} label="Role" value={form.role} onChange={(e)=>setForm({...form,role:e.target.value as Role})} sx={{ mb: 2 }}>
              <option value="student">Student</option>
              <option value="teacher">Instructor</option>
            </TextField>
            <Button startIcon={<Add />} variant="contained" onClick={add}>Create</Button>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, md: 7 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Users</Typography>
            {list.map((u)=> (
              <Box key={u.id} sx={{ display:'flex', alignItems:'center', justifyContent:'space-between', p:1.5, borderRadius:1, border:'1px solid', borderColor:'divider', mb:1 }}>
                <Box>
                  <Typography>{u.name}</Typography>
                  <Typography variant="body2" color="text.secondary">{u.email}</Typography>
                </Box>
                <Chip label={u.role} color={u.role==='teacher'?'primary':'default'} />
              </Box>
            ))}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default TenantUsersPage;
