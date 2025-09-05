import React, { useEffect, useMemo, useState } from 'react';
import { Avatar, Box, Button, Chip, Container, Paper, TextField, Typography, RadioGroup, Radio, FormControlLabel } from '@mui/material';
import Grid2 from '@mui/material/Grid';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { ArrowBack } from '@mui/icons-material';
import { LinearProgress } from '@mui/material';
import TagInput from '../../components/common/TagInput';
import AvatarUpload from '../../components/profile/AvatarUpload';

const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const [bio, setBio] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [hobbies, setHobbies] = useState<string[]>([]);
  const [format, setFormat] = useState<'video'|'text'|'mixed'>('mixed');
  const [edit, setEdit] = useState(true);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [completedLessons, setCompletedLessons] = useState(0);
  const [streak, setStreak] = useState(0);
  const [progressPct, setProgressPct] = useState(0);

  const isLearner = user?.role === 'student' || user?.role === 'self-learner';
  const { showToast } = useToast();

  useEffect(() => {
    if (!isLearner || !user?.id) return;
    const key = `student_profile_${user.id}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      const s = JSON.parse(saved);
      setBio(s.bio || '');
      const ints = Array.isArray(s.interests) ? s.interests : (s.interests ? String(s.interests).split(',').map((t:string)=>t.trim()).filter(Boolean) : []);
      const hobs = Array.isArray(s.hobbies) ? s.hobbies : (s.hobbies ? String(s.hobbies).split(',').map((t:string)=>t.trim()).filter(Boolean) : []);
      setInterests(ints);
      setHobbies(hobs);
    } else {
      setBio(''); setInterests([]); setHobbies([]);
    }
    // preferences
    const prefSaved = localStorage.getItem(`student_onboarding_${user.id}`);
    if (prefSaved) {
      const p = JSON.parse(prefSaved);
      setFormat(p.format || 'mixed');
    }
    const av = localStorage.getItem(`user_avatar_${user.id}`);
    setAvatar(av || null);
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
  }, [user?.id, isLearner]);

  const save = () => {
    if (!isLearner || !user?.id) return;
    const key = `student_profile_${user.id}`;
    localStorage.setItem(key, JSON.stringify({ bio, interests, hobbies }));
    showToast('Profile saved', 'success');
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
            <AvatarUpload size={96} value={avatar} onChange={(data)=>{ setAvatar(data); if (user?.id) { if (data) localStorage.setItem(`user_avatar_${user.id}`, data); else localStorage.removeItem(`user_avatar_${user.id}`); } }} />
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
              <Button size="small" variant="contained" onClick={()=>setEdit((e)=>!e)}>{edit?'View':'Edit'}</Button>
            )}
          </Box>

          {/* Content */}
          <Grid2 container spacing={3} sx={{ mt: 2 }}>
            <Grid2 size={{ xs: 12, md: 8 }}>
              {isLearner ? (
                <>
                  <TextField disabled={!edit} fullWidth label="Bio" multiline rows={3} value={bio} onChange={(e)=>setBio(e.target.value)} sx={{ mb: 2 }} />
                  <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, mb: 2 }}>
                    <TagInput label="Interests" value={interests} onChange={setInterests} suggestions={["AI","ML","Math","UX","Frontend","Backend","DevOps","Cloud","Data","Security","Python","TypeScript"]} />
                  </Paper>
                  <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                    <TagInput label="Hobbies" value={hobbies} onChange={setHobbies} suggestions={["Music","Reading","Gaming","Travel","Cooking","Cycling","Running","Photography","Chess","Movies"]} />
                  </Paper>
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle1" gutterBottom>Learning preferences</Typography>
                    <RadioGroup row value={format} onChange={(e)=>setFormat(e.target.value as any)}>
                      <FormControlLabel value="video" control={<Radio />} label="Video" />
                      <FormControlLabel value="text" control={<Radio />} label="Text" />
                      <FormControlLabel value="mixed" control={<Radio />} label="Mixed" />
                    </RadioGroup>
                  </Box>
                  <Button sx={{ mt: 1 }} variant="contained" onClick={() => { save(); if (user?.id) localStorage.setItem(`student_onboarding_${user.id}`, JSON.stringify({ format })); }}>Save</Button>
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
                      <Typography variant="body2" color="text.secondary">Format: {format}</Typography>
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



