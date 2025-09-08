import React, { useEffect, useMemo, useState } from 'react';
import { Avatar, Box, Button, Chip, Container, Paper, Typography, RadioGroup, Radio, FormControlLabel, Skeleton } from '@mui/material';
import Grid2 from '@mui/material/Grid';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { ArrowBack } from '@mui/icons-material';
import { LinearProgress } from '@mui/material';
import TagInput from '../../components/common/TagInput';
import LearningStyleBadge from '../../components/common/LearningStyleBadge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';

const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const [interests, setInterests] = useState<string[]>([]);
  const [hobbies, setHobbies] = useState<string[]>([]);
  const [format, setFormat] = useState<'video'|'text'|'mixed'>('mixed');
  const [edit, setEdit] = useState(false);
  const [completedLessons, setCompletedLessons] = useState(0);
  const [streak, setStreak] = useState(0);
  const [progressPct, setProgressPct] = useState(0);

  const isLearner = user?.role === 'student' || user?.role === 'self-learner';
  const { showToast } = useToast();

  const qc = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['student_profile'],
    queryFn: async () => {
      const p = await api.getStudentProfile();
      return p;
    },
    enabled: !!isLearner,
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (!isLearner || !user?.id) return;
    if (profile) {
      setInterests(Array.isArray(profile.interests) ? profile.interests : []);
      setHobbies(Array.isArray(profile.hobbies) ? profile.hobbies : []);
      setFormat((profile.learningStyle || 'MIXED').toLowerCase() as any);
    } else {
      setInterests([]); setHobbies([]); setFormat('mixed');
    }
    // compute achievements from study events
    const eventsStr = localStorage.getItem(`study_events_${user.id}`);
    if (eventsStr) {
      try {
        const events = JSON.parse(eventsStr) as Array<{ts:string; courseId?:string; lessonId?:string; score:number}>;
        // unique lessons
        const unique = new Set(events.map(e => `${e.courseId}:${e.lessonId}`));
        setCompletedLessons(unique.size);
        // streak (days in a row ending today)
        const days = Array.from(new Set(events.map(e => new Date(e.ts).toDateString()))).sort((a,b)=> new Date(a).getTime()-new Date(b).getTime());
        let s = 0;
        let current = new Date(); current.setHours(0,0,0,0);
        for (let i = days.length - 1; i >= 0; i--) {
          const d = new Date(days[i]); d.setHours(0,0,0,0);
          const diff = Math.round((current.getTime() - d.getTime()) / (24*60*60*1000));
          if (diff === s) s++; else if (diff > s) break; // gap
        }
        setStreak(Math.max(0, s));
        // simple progress estimation: 5% per unique lesson, up to 100
        setProgressPct(Math.min(100, unique.size * 5));
      } catch {}
    } else {
      setCompletedLessons(0); setStreak(0); setProgressPct(0);
    }
  }, [user?.id, isLearner, profile?.id]);

  // Detect unsaved changes relative to server profile
  const hasUnsavedChanges = useMemo(() => {
    const norm = (arr: string[]) => (arr || []).map((s)=>s.trim().toLowerCase()).filter(Boolean).sort();
    const eqArr = (a: string[], b: string[]) => {
      const aa = norm(a); const bb = norm(b);
      if (aa.length !== bb.length) return false;
      for (let i=0;i<aa.length;i++) if (aa[i] !== bb[i]) return false;
      return true;
    };
    const origI = profile?.interests || [];
    const origH = profile?.hobbies || [];
    const origF = (profile?.learningStyle || 'MIXED').toLowerCase();
    return !eqArr(interests, origI) || !eqArr(hobbies, origH) || format !== (origF as any);
  }, [interests, hobbies, format, profile?.interests, profile?.hobbies, profile?.learningStyle]);

  const save = async () => {
    if (!isLearner) return;
    const orig = profile;
    const payload: any = {};
    if (!orig || JSON.stringify(orig.interests||[]) !== JSON.stringify(interests)) payload.interests = interests;
    if (!orig || JSON.stringify(orig.hobbies||[]) !== JSON.stringify(hobbies)) payload.hobbies = hobbies;
    if (!orig || (orig.learningStyle || 'MIXED').toLowerCase() !== format) payload.learningStyle = (format || 'mixed').toUpperCase();
    if (Object.keys(payload).length === 0) { showToast('Nothing to save', 'info'); setEdit(false); return; }
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
    <Container sx={{ py: 4 }}>
      <Paper elevation={0} sx={{ p: 0, overflow: 'hidden', borderRadius: 3, backdropFilter: 'blur(8px)', border: '1px solid', borderColor: 'divider', background: (t)=> t.palette.mode==='dark' ? 'rgba(17,22,42,0.6)' : 'rgba(255,255,255,0.6)' }}>
        {/* Top bar */}
        <Box sx={{ px: 2, py: 1, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <Button startIcon={<ArrowBack />} onClick={() => window.history.back()}>Back</Button>
        </Box>
        {/* Cover */}
        <Box sx={(t)=>({
          height: 120,
          backgroundImage: (()=>{
            const base = (user?.tenantId || user?.name || 'x') as string;
            let hash = 0; for (let i=0;i<base.length;i++) hash = (hash*31 + base.charCodeAt(i))>>>0;
            const hue1 = hash % 360; const hue2 = (hash*7 % 360);
            const c1 = `hsl(${hue1} 80% ${t.palette.mode==='dark'?40:60}%)`;
            const c2 = `hsl(${hue2} 80% ${t.palette.mode==='dark'?35:55}%)`;
            return `linear-gradient(120deg, ${c1}, ${c2})`;
          })(),
        })} />

        {/* Header */}
        <Box sx={{ px: 3, pb: 3 }}>
          <Box display="flex" alignItems="flex-end" gap={2} sx={{ mt: -6 }}>
            <Avatar sx={{ width: 96, height: 96, fontSize: 36 }}>
              {user?.name?.split(' ').map(s=>s[0]).join('').slice(0,2).toUpperCase()}
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="h5" fontWeight={800} noWrap>{user?.name}</Typography>
              <Typography variant="body2" color="text.secondary" noWrap>{user?.email}</Typography>
              <Box sx={{ mt: 1, display:'flex', gap:1, flexWrap:'wrap' }}>
                <Chip size="small" label={user?.role} />
                {user?.tenantId && <Chip size="small" label={`tenant: ${user.tenantId}`} />}
                {user?.plan && <Chip size="small" label={`plan: ${user.plan}`} />}
              </Box>
            </Box>
            {isLearner && (
              <Button
                size="small"
                variant="contained"
                disabled={edit && hasUnsavedChanges}
                title={edit && hasUnsavedChanges ? 'You have unsaved changes' : undefined}
                onClick={()=>{ if (edit && hasUnsavedChanges) return; setEdit((e)=>!e); }}
              >
                {edit?'View':'Edit'}
              </Button>
            )}
          </Box>

          {/* Content */}
          <Grid2 container spacing={3} sx={{ mt: 2 }}>
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
                  {edit && <Button sx={{ mt: 1 }} variant="contained" onClick={save}>Save</Button>}
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
                <Box>
                  <Typography variant="body2">Member since: {user ? new Date(user.createdAt).toLocaleDateString() : '—'}</Typography>
                  {isLearner && (
                    <>
                      <Box sx={{ display:'inline-flex', alignItems:'center', gap: 1 }}>
                        <Typography variant="body2" color="text.secondary">Learning style:</Typography>
                        <LearningStyleBadge value={format} />
                      </Box>
                      <Typography variant="body2" color="text.secondary">Lessons done: {completedLessons}</Typography>
                      <Typography variant="body2" color="text.secondary">Streak: {streak} day(s)</Typography>
                    </>
                  )}
                </Box>
              </Paper>
              <Box sx={{ height: 8 }} />
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <Typography variant="subtitle1" gutterBottom>Achievements</Typography>
                <Box sx={{ display:'flex', gap: 1, flexWrap:'wrap', mb: 1 }}>
                  <Chip size="small" color="success" label={completedLessons>0 ? 'Starter' : 'Getting started'} />
                  {streak>=3 && <Chip size="small" color="primary" label={`Streak ${streak}d`} />}
                  {completedLessons>=10 && <Chip size="small" color="secondary" label={`10 lessons`} />}
                </Box>
                <Typography variant="body2" color="text.secondary">Overall progress</Typography>
                <LinearProgress variant="determinate" value={progressPct} sx={{ borderRadius: 1, height: 8 }} />
              </Paper>
            </Grid2>
          </Grid2>
        </Box>
      </Paper>
    </Container>
  );
};

export default ProfilePage;



