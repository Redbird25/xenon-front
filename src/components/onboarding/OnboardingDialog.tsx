import React from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  Step,
  StepLabel,
  Stepper,
  Typography,
} from '@mui/material';
import { motion } from 'framer-motion';

interface OnboardingDialogProps {
  open: boolean;
  onClose: () => void;
}

const steps = ['Welcome', 'Your Plan', 'Tips'];

const MotionBox = motion(Box as any);

const OnboardingDialog: React.FC<OnboardingDialogProps> = ({ open, onClose }) => {
  const [activeStep, setActiveStep] = React.useState(0);

  const handleNext = () => setActiveStep((s) => Math.min(s + 1, steps.length - 1));
  const handleBack = () => setActiveStep((s) => Math.max(s - 1, 0));

  const done = activeStep === steps.length - 1;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Getting Started</DialogTitle>
      <DialogContent>
        <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 3 }}>
          {steps.map((label) => (
            <Step key={label}><StepLabel>{label}</StepLabel></Step>
          ))}
        </Stepper>

        <MotionBox
          key={activeStep}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          {activeStep === 0 && (
            <>
              <Typography variant="h5" gutterBottom>Welcome to Xenon</Typography>
              <Typography color="text.secondary">We’ve enrolled you. Let’s orient you around lessons, quizzes and progress.</Typography>
            </>
          )}
          {activeStep === 1 && (
            <>
              <Typography variant="h5" gutterBottom>Your Learning Path</Typography>
              <Typography color="text.secondary">Modules and lessons unlock as you progress. Minimum mastery helps you focus on what matters.</Typography>
            </>
          )}
          {activeStep === 2 && (
            <>
              <Typography variant="h5" gutterBottom>Pro Tips</Typography>
              <Typography color="text.secondary">Use the sidebar to navigate, track progress in Dashboard, and take quizzes for instant feedback.</Typography>
            </>
          )}
        </MotionBox>

        <Box display="flex" justifyContent="space-between" sx={{ mt: 3 }}>
          <Button onClick={onClose} color="inherit">Skip</Button>
          <Box display="flex" gap={1}>
            <Button disabled={activeStep === 0} onClick={handleBack}>Back</Button>
            <Button variant="contained" onClick={done ? onClose : handleNext}>{done ? 'Finish' : 'Next'}</Button>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default OnboardingDialog;

