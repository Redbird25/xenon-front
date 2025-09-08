import React, { useEffect, useMemo, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Box,
  Button,
  Typography,
  Avatar,
  Chip,
  RadioGroup,
  FormControlLabel,
  Radio,
  Paper,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import Grid2 from '@mui/material/Grid';
import TagInput from '../common/TagInput';
import LearningStyleBadge from '../common/LearningStyleBadge';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';

interface Props {
  open: boolean;
  onClose: () => void;
}

const ProfileModal: React.FC<Props> = ({ open, onClose }) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const qc = useQueryClient();
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const isLearner = user?.role === 'student' || user?.role === 'self-learner';

  const { data: profile } = useQuery({
    queryKey: ['student_profile'],
    queryFn: async () => {
      if (!isLearner) return null as any;
      return await api.getStudentProfile();
    },
    enabled: open && !!isLearner,
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const [edit, setEdit] = useState(false);
  const [interests, setInterests] = useState<string[]>([]);
  const [hobbies, setHobbies] = useState<string[]>([]);
  const [format, setFormat] = useState<'video'|'text'|'mixed'>('mixed');

  useEffect(() => {
    if (!open) return;
    setEdit(false);
    if (profile) {
      setInterests(Array.isArray(profile.interests) ? profile.interests : []);
      setHobbies(Array.isArray(profile.hobbies) ? profile.hobbies : []);
      setFormat((profile.learningStyle || 'MIXED').toLowerCase() as any);
    } else {
      setInterests([]); setHobbies([]); setFormat('mixed');
    }
  }, [open, profile?.id]);

  const hasUnsavedChanges = useMemo(() => {
    if (!profile) return false;
    const norm = (arr: string[]) => (arr || []).map((s)=>s.trim().toLowerCase()).filter(Boolean).sort();
    const eqArr = (a: string[], b: string[]) => {
      const aa = norm(a); const bb = norm(b);
      if (aa.length !== bb.length) return false;
      for (let i=0;i<aa.length;i++) if (aa[i] !== bb[i]) return false;
      return true;
    };
    const origF = (profile.learningStyle || 'MIXED').toLowerCase();
    return !eqArr(interests, profile.interests || []) || !eqArr(hobbies, profile.hobbies || []) || format !== (origF as any);
  }, [profile?.id, interests, hobbies, format]);

  const handleClose = () => {
    if (edit && hasUnsavedChanges) {
      const ok = window.confirm('You have unsaved changes. Discard them?');
      if (!ok) return;
    }
    onClose();
  };

  const save = async () => {
    if (!isLearner) return;
    const payload: any = {};
    payload.interests = interests;
    payload.hobbies = hobbies;
    payload.learningStyle = (format || 'mixed').toUpperCase();
    try {
      await api.updateStudentProfile(payload);
      showToast('Profile saved', 'success');
      setEdit(false);
      await qc.invalidateQueries({ queryKey: ['student_profile'] });
    } catch (e) {
      showToast('Failed to save profile', 'error');
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth fullScreen={fullScreen} PaperProps={{ sx: { borderRadius: fullScreen ? 0 : 3 } }}>
      <DialogTitle sx={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap: 'wrap', gap: 1 }}>
        <Box display="flex" alignItems="center" gap={1} sx={{ minWidth: 0 }}>
          <Avatar sx={{ width: 36, height: 36 }}>
            {user?.name?.split(' ').map(s=>s[0]).join('').slice(0,2).toUpperCase()}
          </Avatar>
          <Box>
            <Typography variant="h6" fontWeight={800} sx={{ lineHeight: 1.1 }}>{user?.name}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ wordBreak: 'break-all' }}>{user?.email}</Typography>
          </Box>
        </Box>
        <Box>
          {isLearner && (
            edit ? (
              <Button size={fullScreen ? 'small' : 'medium'} variant="contained" startIcon={<SaveIcon />} onClick={save} disabled={!hasUnsavedChanges} sx={{ mr: 1 }}>Save</Button>
            ) : (
              <Button size={fullScreen ? 'small' : 'medium'} variant="outlined" startIcon={<EditIcon />} onClick={()=>setEdit(true)} sx={{ mr: 1 }}>Edit</Button>
            )
          )}
          <IconButton onClick={handleClose} aria-label="Close" sx={{ mt: fullScreen ? 0 : 0 }}><CloseIcon /></IconButton>
        </Box>
      </DialogTitle>
      <DialogContent dividers sx={{ p: { xs: 2, md: 3 } }}>
        <Grid2 container spacing={{ xs: 2, md: 3 }}>
          <Grid2 size={{ xs: 12, md: 8 }}>
            {isLearner ? (
              <>
                <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, mb: 2 }}>
                  <Typography variant="subtitle1" gutterBottom>Interests</Typography>
                  {edit ? (
                    <TagInput label="Add interests" value={interests} onChange={setInterests} suggestions={["AI","ML","Math","UX","Frontend","Backend","DevOps","Cloud","Data","Security","Python","TypeScript"]} />
                  ) : (
                    <Box sx={{ display:'flex', flexWrap:'wrap', gap: 1 }}>
                      {interests.length ? interests.map((t)=>(<Chip key={t} label={t} />)) : <Typography variant="body2" color="text.secondary">No interests</Typography>}
                    </Box>
                  )}
                </Paper>
                <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                  <Typography variant="subtitle1" gutterBottom>Hobbies</Typography>
                  {edit ? (
                    <TagInput label="Add hobbies" value={hobbies} onChange={setHobbies} suggestions={["Music","Reading","Gaming","Travel","Cooking","Cycling","Running","Photography","Chess","Movies"]} />
                  ) : (
                    <Box sx={{ display:'flex', flexWrap:'wrap', gap: 1 }}>
                      {hobbies.length ? hobbies.map((t)=>(<Chip key={t} label={t} />)) : <Typography variant="body2" color="text.secondary">No hobbies</Typography>}
                    </Box>
                  )}
                </Paper>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle1" gutterBottom>Learning style</Typography>
                  {edit ? (
                    <RadioGroup row value={format} onChange={(e)=>setFormat(e.target.value as any)}>
                      <FormControlLabel value="video" control={<Radio />} label={<LearningStyleBadge value="video" />} />
                      <FormControlLabel value="text" control={<Radio />} label={<LearningStyleBadge value="text" />} />
                      <FormControlLabel value="mixed" control={<Radio />} label={<LearningStyleBadge value="mixed" />} />
                    </RadioGroup>
                  ) : (
                    <LearningStyleBadge value={format} />
                  )}
                </Box>
              </>
            ) : (
              <>
                <Typography variant="subtitle1" gutterBottom>About</Typography>
                <Typography variant="body2" color="text.secondary">This profile shows your account details.</Typography>
              </>
            )}
          </Grid2>
          <Grid2 size={{ xs: 12, md: 4 }}>
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
              <Typography variant="subtitle1" gutterBottom>Quick Info</Typography>
              <Typography variant="body2">Member since: {user ? new Date(user.createdAt).toLocaleDateString() : '—'}</Typography>
              {isLearner && (
                <Box sx={{ mt: 1, display:'flex', gap: 1, alignItems:'center' }}>
                  <Typography variant="body2" color="text.secondary">Learning style:</Typography>
                  <LearningStyleBadge value={format} />
                </Box>
              )}
            </Paper>
          </Grid2>
        </Grid2>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileModal;
