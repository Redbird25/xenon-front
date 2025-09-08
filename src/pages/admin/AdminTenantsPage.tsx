import React, { useState } from 'react';
import { Box, Button, Container, Paper, TextField, Typography, Chip } from '@mui/material';
import Grid from '@mui/material/Grid';
import { Add } from '@mui/icons-material';
import { Tenant } from '../../types';
import { useToast } from '../../contexts/ToastContext';

const AdminTenantsPage: React.FC = () => {
  const { showToast } = useToast();
  const [tenants, setTenants] = useState<Tenant[]>([
    { id: 't-1', name: 'Acme Corp', domain: 'acme.com', createdAt: new Date().toISOString(), plan: 'team', managerIds: ['m-1'] },
  ]);
  const [form, setForm] = useState({ name: '', domain: '', plan: 'team' as Tenant['plan'] });

  const addTenant = () => {
    if (!form.name.trim()) return;
    const t: Tenant = { id: `t-${Date.now()}`, name: form.name.trim(), domain: form.domain || undefined, createdAt: new Date().toISOString(), plan: form.plan, managerIds: [] };
    setTenants((prev) => [...prev, t]);
    setForm({ name: '', domain: '', plan: 'team' });
    showToast('Tenant added', 'success');
  };

  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>Tenants</Typography>
      <Grid container spacing={{ xs: 2, md: 3 }}>
        <Grid size={{ xs: 12, md: 5 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Add Tenant</Typography>
            <TextField fullWidth label="Company Name" value={form.name} onChange={(e)=>setForm({...form,name:e.target.value})} sx={{ mb: 2 }} />
            <TextField fullWidth label="Domain (optional)" value={form.domain} onChange={(e)=>setForm({...form,domain:e.target.value})} sx={{ mb: 2 }} />
            <TextField select SelectProps={{ native: true }} label="Plan" value={form.plan} onChange={(e)=>setForm({...form,plan:e.target.value as Tenant['plan']})} fullWidth sx={{ mb: 2 }}>
              <option value="team">Team</option>
              <option value="enterprise">Enterprise</option>
            </TextField>
            <Button startIcon={<Add />} variant="contained" onClick={addTenant}>Add Tenant</Button>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, md: 7 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Tenant List</Typography>
            {tenants.map((t) => (
              <Box key={t.id} sx={{ display:'flex', alignItems:'center', justifyContent:'space-between', p:1.5, borderRadius:1, border:'1px solid', borderColor:'divider', mb:1 }}>
                <Box>
                  <Typography>{t.name}</Typography>
                  <Typography variant="body2" color="text.secondary">{t.domain || '—'} · {new Date(t.createdAt).toLocaleDateString()}</Typography>
                </Box>
                <Chip label={t.plan} color={t.plan==='enterprise'?'secondary':'primary'} />
              </Box>
            ))}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default AdminTenantsPage;
