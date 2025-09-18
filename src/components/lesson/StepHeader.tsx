import React from 'react';
import { Box, Chip } from '@mui/material';
import Grid from '@mui/material/Grid';
import { CheckCircle, RadioButtonUnchecked } from '@mui/icons-material';

export type LessonStepId = 'content' | 'quiz' | 'results';

export interface StepInfo {
  id: LessonStepId;
  label: string;
  completed?: boolean;
}

interface StepHeaderProps {
  steps: StepInfo[];
  activeIndex: number;
  canNavigateTo: (id: LessonStepId) => boolean;
  onChange: (index: number) => void;
}

const StepHeader: React.FC<StepHeaderProps> = ({ steps, activeIndex, canNavigateTo, onChange }) => {
  return (
    <Box sx={{ mb: { xs: 2, md: 3 } }}>
      <Grid container spacing={2}>
        {steps.map((step, index) => {
          const isActive = activeIndex === index;
          const clickable = canNavigateTo(step.id);
          return (
            <Grid key={step.id} size={4}>
              <Box textAlign="center" sx={{ px: 0.5 }}>
                <Chip
                  icon={step.completed ? <CheckCircle /> : <RadioButtonUnchecked />}
                  label={step.label}
                  color={step.completed ? 'success' : isActive ? 'primary' : 'default'}
                  variant={isActive ? 'filled' : 'outlined'}
                  clickable={clickable}
                  onClick={clickable ? () => onChange(index) : undefined}
                />
              </Box>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
};

export default StepHeader;
