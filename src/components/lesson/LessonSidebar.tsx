import React from 'react';
import { Box, Button, Chip, Divider, Paper, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

export type StepId = 'content' | 'quiz' | 'results';

interface LessonSidebarProps {
  title?: string;
  masteryPercent: number | null;
  minMastery: number | null;
  attemptsCount: number;
  latestScorePercent: number | null;
  onGoTo: (step: StepId) => void;
  onRetake: () => void | Promise<void>;
  needsRetake: boolean;
  canRetake?: boolean;
  nextLessonPath?: string | null;
  quizAvailable?: boolean;
  onNextLesson?: () => void | Promise<void>;
}

const LessonSidebar: React.FC<LessonSidebarProps> = ({
  title,
  masteryPercent,
  minMastery,
  attemptsCount,
  latestScorePercent,
  onGoTo,
  onRetake,
  needsRetake,
  canRetake = true,
  nextLessonPath,
  quizAvailable = true,
  onNextLesson,
}) => {
  const mastery = masteryPercent !== null ? Math.round(masteryPercent) : null;
  const min = minMastery !== null ? Math.round(minMastery * 100) : null;

  return (
    <Paper sx={{ p: { xs: 2, md: 2.5 }, position: 'sticky', top: 12, display: 'flex', flexDirection: 'column', gap: 1.25 }}>
      <Box>
        <Typography variant="overline" color="text.secondary">Lesson</Typography>
        <Typography variant="h6" sx={{ lineHeight: 1.2 }}>{title || 'Lesson'}</Typography>
      </Box>

      <Divider sx={{ my: 1.25 }} />

      <Box>
        <Typography variant="subtitle2">Mastery</Typography>
        <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
          <Chip size="small" label={mastery !== null ? `${mastery}%` : '--'} color={mastery !== null && mastery >= 80 ? 'success' : mastery !== null && mastery >= 50 ? 'warning' : 'default'} />
          {min !== null && (
            <Typography variant="caption" color="text.secondary">min {min}%</Typography>
          )}
        </Box>
      </Box>

      <Box>
        <Typography variant="subtitle2">Attempts</Typography>
        <Typography variant="body2" color="text.secondary">{attemptsCount}</Typography>
        {latestScorePercent !== null && (
          <Typography variant="caption" color="text.secondary">Latest score {Math.round(latestScorePercent)}%</Typography>
        )}
      </Box>

      {needsRetake && attemptsCount > 0 && (
        <Paper variant="outlined" sx={{ p: 1.5, borderColor: 'warning.main', bgcolor: (t) => t.palette.mode === 'dark' ? 'warning.900' : 'warning.50' }}>
          <Typography variant="caption" color="text.secondary">
            Your mastery is below the required threshold. Retake the quiz to improve your mastery.
          </Typography>
        </Paper>
      )}

      <Box display="flex" gap={1} flexWrap="wrap" sx={{ mt: 1.25 }}>
        {!quizAvailable ? (
          nextLessonPath ? (
            onNextLesson ? (
              <Button size="small" variant="contained" onClick={() => { void onNextLesson(); }}>
                Next Lesson
              </Button>
            ) : (
              <Button size="small" variant="contained" component={RouterLink} to={nextLessonPath}>
                Next Lesson
              </Button>
            )
          ) : null
        ) : attemptsCount === 0 ? (
          <Button size="small" variant="contained" onClick={() => onGoTo('quiz')}>
            Start Quiz
          </Button>
        ) : (!canRetake || !needsRetake) && nextLessonPath ? (
          onNextLesson ? (
            <Button size="small" variant="contained" onClick={() => { void onNextLesson(); }}>
              Next Lesson
            </Button>
          ) : (
            <Button size="small" variant="contained" component={RouterLink} to={nextLessonPath}>
              Next Lesson
            </Button>
          )
        ) : (
          <Button size="small" variant="contained" onClick={() => onRetake()} disabled={!canRetake}>
            Retake Quiz
          </Button>
        )}
      </Box>
    </Paper>
  );
};

export default LessonSidebar;
