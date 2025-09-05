import React, { useState } from 'react';
import { Dialog, DialogContent, DialogTitle, Stepper, Step, StepLabel, Box, TextField, RadioGroup, FormControlLabel, Radio, Checkbox, Button, Typography, Stack, Paper } from '@mui/material';
import { motion } from 'framer-motion';

interface Props {
  open: boolean;
  initial?: {
    interests?: string;
    hobbies?: string;
    format?: 'video' | 'text' | 'mixed';
    reminders?: boolean;
  };
  onCancel: () => void;
  onFinish: (data: { interests: string; hobbies: string; format: 'video'|'text'|'mixed'; reminders: boolean }) => void;
}

const steps = ['Welcome', 'Preferences', 'Notifications'];

const MotionBox = motion(Box as any);

const WelcomeOnboarding: React.FC<Props> = ({ open, initial, onCancel, onFinish }) => {
  const [active, setActive] = useState(0);
  const [interests, setInterests] = useState(initial?.interests || '');
  const [hobbies, setHobbies] = useState(initial?.hobbies || '');
  const [format, setFormat] = useState<'video'|'text'|'mixed'>(initial?.format || 'mixed');
  const [reminders, setReminders] = useState<boolean>(initial?.reminders ?? true);

  const next = () => setActive((a) => Math.min(a + 1, steps.length - 1));
  const back = () => setActive((a) => Math.max(a - 1, 0));

  return (
    <Dialog open={open} onClose={onCancel} maxWidth="md" fullWidth>
      <DialogTitle>
        <Typography variant="h5" fontWeight={800}>Let’s personalize your learning</Typography>
      </DialogTitle>
      <DialogContent>
        <Stepper activeStep={active} alternativeLabel sx={{ mb: 3 }}>
          {steps.map((s) => (
            <Step key={s}><StepLabel>{s}</StepLabel></Step>
          ))}
        </Stepper>

        <MotionBox key={active} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .25 }}>
          {active === 0 && (
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography sx={{ mb: 1 }}>Tell us a bit about your interests and hobbies. We’ll use it for better recommendations.</Typography>
              <TextField fullWidth label="Interests" value={interests} onChange={(e)=>setInterests(e.target.value)} sx={{ mb: 2 }} />
              <TextField fullWidth label="Hobbies" value={hobbies} onChange={(e)=>setHobbies(e.target.value)} />
            </Paper>
          )}

          {active === 1 && (
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography sx={{ mb: 1 }}>Preferred learning format</Typography>
              <RadioGroup row value={format} onChange={(e)=>setFormat(e.target.value as any)}>
                <FormControlLabel value="video" control={<Radio />} label="Video" />
                <FormControlLabel value="text" control={<Radio />} label="Text" />
                <FormControlLabel value="mixed" control={<Radio />} label="Mixed" />
              </RadioGroup>
            </Paper>
          )}

          {active === 2 && (
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography sx={{ mb: 1 }}>Notifications</Typography>
              <FormControlLabel control={<Checkbox checked={reminders} onChange={(e)=>setReminders(e.target.checked)} />} label="Send me study reminders" />
            </Paper>
          )}
        </MotionBox>

        <Stack direction="row" justifyContent="space-between" sx={{ mt: 3 }}>
          <Button onClick={onCancel} color="inherit">Skip</Button>
          <Box>
            <Button disabled={active===0} onClick={back} sx={{ mr: 1 }}>Back</Button>
            {active < steps.length - 1 ? (
              <Button variant="contained" onClick={next}>Next</Button>
            ) : (
              <Button variant="contained" onClick={()=>onFinish({ interests, hobbies, format, reminders })}>Finish</Button>
            )}
          </Box>
        </Stack>
      </DialogContent>
    </Dialog>
  );
};

export default WelcomeOnboarding;

