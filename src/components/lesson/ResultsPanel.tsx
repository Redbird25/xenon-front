import React from 'react';
import { Alert, Box, Chip, LinearProgress, Paper, Typography, Button, Select, MenuItem, ToggleButtonGroup, ToggleButton, Stack, CircularProgress } from '@mui/material';
import { CheckCircle } from '@mui/icons-material';
import { Link } from 'react-router-dom';
import type {
  MaterializationQuizAttempt,
  MaterializationQuizEvaluateContentItem,
  MaterializationQuizEvaluateDetail,
  MaterializationQuizEvaluateResponse,
  MaterializationQuizQuestion,
} from '../../types';

export interface ResultsPanelProps {
  courseId?: string;
  displayAttempt: MaterializationQuizAttempt | MaterializationQuizEvaluateResponse | null;
  quizEvaluation: MaterializationQuizEvaluateResponse | null;
  quizAttempts: MaterializationQuizAttempt[];
  attemptsLoading: boolean;
  attemptsError: string | null;
  displayScorePercent: number | null;
  displayAttemptTimestamp: string;
  latestScorePercent: number | null;
  masteryPercent: number | null;
  selectedAttemptId: string | null;
  onSelectAttempt: (id: string) => void;
  toPercent: (value?: number | null) => number | null;
  answers: Record<string, string | string[]>;
  formatAnswerText: (question: MaterializationQuizQuestion | undefined, value: string | string[] | undefined) => string;
  quizQuestionMap: Record<string, { question: MaterializationQuizQuestion; index: number; key: string }>;
  displayDetails: MaterializationQuizEvaluateDetail[];
  displayContent: MaterializationQuizEvaluateContentItem[];
  onReviewLesson: () => void;
  onRetakeQuiz: () => Promise<void>;
  minMasteryPercent?: number | null;
}

const ResultsPanel: React.FC<ResultsPanelProps> = ({
  courseId,
  displayAttempt,
  quizEvaluation,
  quizAttempts,
  attemptsLoading,
  attemptsError,
  displayScorePercent,
  displayAttemptTimestamp,
  latestScorePercent,
  masteryPercent,
  selectedAttemptId,
  onSelectAttempt,
  toPercent,
  answers,
  formatAnswerText,
  quizQuestionMap,
  displayDetails,
  displayContent,
  onReviewLesson,
  onRetakeQuiz,
  minMasteryPercent,
}) => {
  const attemptHistory = quizAttempts.map((attempt, idx) => {
    const score = toPercent(attempt.scorePercent);
    let timestamp = attempt.createdAt;
    try { timestamp = new Date(attempt.createdAt).toLocaleString(); } catch {}
    const total = quizAttempts.length;
    const isSelected = selectedAttemptId ? attempt.id === selectedAttemptId : idx === 0;
    const chipColor: 'success' | 'warning' | 'error' = score !== null && score >= 80 ? 'success' : score !== null && score >= 50 ? 'warning' : 'error';
    const label = `Attempt ${total - idx}${idx === 0 ? ' (Latest)' : ''}`;
    return { attempt, index: idx, score, chipColor, isSelected, timestamp, label };
  });

  const stripMetrics = (s: string): string => {
    try {
      let out = String(s);
      out = out.replace(/\b(emb|literal|tokens|keywords|context)\s*=\s*[-+]?\d*\.?\d+(?:[eE][-+]?\d+)?/g, '').replace(/\s{2,}/g,' ').trim();
      // remove empty parentheses and trailing commas
      out = out.replace(/\(\s*\)/g, '').replace(/,\s*,/g, ',').replace(/,\s*$/,'').replace(/^,\s*/, '');
      return out.trim();
    } catch { return String(s || ''); }
  };

  const questionReviews = displayDetails.map((detail, idx) => {
    const meta = quizQuestionMap[String(detail.questionId)] || quizQuestionMap[String(idx)];
    const question = meta?.question;
    const questionText = question?.prompt || question?.quiz || displayContent[idx]?.question || `Question ${idx + 1}`;
    const attemptOptions = (displayContent[idx]?.options || []) as string[];
    const answerValue = meta ? answers[meta.key] : undefined;
    const fallback = answerValue ? formatAnswerText(question, answerValue) : '-';
    const userAnswerTextRaw = attemptOptions.length > 0 ? attemptOptions.join(', ') : fallback;
    const userAnswerText = stripMetrics(userAnswerTextRaw);
    const verdictLabel = `${Math.round(detail.score * 100)}%`;
    const verdictColor: 'success' | 'warning' | 'error' = detail.score >= 0.8 ? 'success' : detail.score >= 0.5 ? 'warning' : 'error';
    return {
      key: String(detail.questionId || idx),
      index: idx,
      questionText,
      userAnswerText,
      recommendedText: '',
      verdictLabel,
      verdictColor,
      explanation: stripMetrics(detail.explanation || ''),
    };
  });

  // Summary numbers
  const total = questionReviews.length;
  const countCorrect = questionReviews.filter(q => q.verdictColor === 'success').length;
  const countPartial = questionReviews.filter(q => q.verdictColor === 'warning').length;
  const countIncorrect = questionReviews.filter(q => q.verdictColor === 'error').length;

  // Attempt selector options
  const selectItems = attemptHistory.map(({ attempt, timestamp, score }, idx) => ({
    id: attempt.id,
    label: `Attempt ${attemptHistory.length - idx} • ${timestamp}${score !== null ? ` • ${Math.round(score)}%` : ''}`,
  }));

  // Filters for question review
  const [filter, setFilter] = React.useState<'all' | 'correct' | 'partial' | 'incorrect'>('all');
  const filteredReviews = React.useMemo(() => {
    if (filter === 'all') return questionReviews;
    if (filter === 'correct') return questionReviews.filter(q => q.verdictColor === 'success');
    if (filter === 'partial') return questionReviews.filter(q => q.verdictColor === 'warning');
    return questionReviews.filter(q => q.verdictColor === 'error');
  }, [filter, questionReviews]);

  const summaryChipColor: 'success' | 'warning' | 'error' | 'default' = (() => {
    const s = displayScorePercent ?? null;
    if (s === null) return 'default';
    return s >= 80 ? 'success' : s >= 50 ? 'warning' : 'error';
  })();

  const masteryChipColor: 'success' | 'warning' | 'error' | 'default' = (() => {
    if (masteryPercent == null) return 'default';
    if (minMasteryPercent == null) return masteryPercent >= 80 ? 'success' : masteryPercent >= 50 ? 'warning' : 'default';
    return masteryPercent >= minMasteryPercent ? 'success' : 'warning';
  })();

  return (
    <Paper sx={{ p: { xs: 2, md: 2.5 } }}>
      {/* Top Summary + Attempt side by side */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'stretch',
          flexWrap: { xs: 'wrap', md: 'nowrap' },
          gap: { xs: 2, md: 0 },
        }}
      >
        <Box sx={{ width: { xs: '100%', md: '48%' } }}>
          <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
            <Box display="flex" justifyContent="space-between" alignItems="flex-start" gap={2} flexWrap="wrap">
              <Stack direction="row" spacing={2} alignItems="center">
                <Box position="relative" display="inline-flex">
                  <CircularProgress variant="determinate" value={Math.max(0, Math.min(100, displayScorePercent ?? 0))} size={72} thickness={5} />
                  <Box
                    top={0}
                    left={0}
                    bottom={0}
                    right={0}
                    position="absolute"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Typography variant="subtitle1" component="div">
                      {displayScorePercent !== null ? `${Math.round(displayScorePercent)}%` : '--'}
                    </Typography>
                  </Box>
                </Box>
                <Box>
                  <Typography variant="h6" sx={{ lineHeight: 1.1 }}>Results</Typography>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
                    <Chip size="small" label={displayScorePercent !== null ? `${Math.round(displayScorePercent)}% score` : 'No score'} color={summaryChipColor} />
                    {masteryPercent !== null && (
                      <Chip size="small" label={`Mastery ${Math.round(masteryPercent)}%${minMasteryPercent != null ? ` / min ${minMasteryPercent}%` : ''}`} color={masteryChipColor} />
                    )}
                  </Stack>
                  {displayAttemptTimestamp && (
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                      Evaluated {displayAttemptTimestamp}
                    </Typography>
                  )}
                </Box>
              </Stack>

              
            </Box>

            <Box display="grid" gridTemplateColumns={{ xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' }} gap={2} sx={{ mt: 1.5 }}>
              <Box>
                <Typography variant="caption" color="text.secondary">Questions</Typography>
                <Typography variant="subtitle1">{total || '--'}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Correct</Typography>
                <Typography variant="subtitle1">{countCorrect}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Partial</Typography>
                <Typography variant="subtitle1">{countPartial}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Incorrect</Typography>
                <Typography variant="subtitle1">{countIncorrect}</Typography>
              </Box>
            </Box>
          </Paper>
        </Box>

        <Box sx={{ width: { xs: '100%', md: '48%' } }}>
          <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Attempt</Typography>
            {attemptsLoading ? (
              <LinearProgress />
            ) : (
              <Select
                size="small"
                fullWidth
                value={selectedAttemptId || ''}
                onChange={(e) => onSelectAttempt(String(e.target.value))}
                displayEmpty
              >
                {selectItems.length === 0 && (
                  <MenuItem value="" disabled>No attempts yet</MenuItem>
                )}
                {selectItems.map((it) => (
                  <MenuItem key={it.id} value={it.id}>{it.label}</MenuItem>
                ))}
              </Select>
            )}

            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
              {quizAttempts.length > 0 ? `${quizAttempts.length} attempt${quizAttempts.length === 1 ? '' : 's'}` : 'No attempts yet'}
            </Typography>
            {latestScorePercent !== null && (
              <Typography variant="caption" color="text.secondary" display="block">Latest score {Math.round(latestScorePercent)}%</Typography>
            )}
          </Paper>
        </Box>
      </Box>

      {/* Question Review */}
      <Box sx={{ mt: 2.5 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1}>
          <Typography variant="h6">Question Review</Typography>
          <ToggleButtonGroup
            size="small"
            value={filter}
            exclusive
            onChange={(_, v) => v && setFilter(v)}
          >
            <ToggleButton value="all">All</ToggleButton>
            <ToggleButton value="incorrect">Incorrect</ToggleButton>
            <ToggleButton value="partial">Partial</ToggleButton>
            <ToggleButton value="correct">Correct</ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {displayDetails.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            No detailed feedback available yet.
          </Typography>
        ) : (
          filteredReviews.map((item) => (
            <Paper key={item.key} variant="outlined" sx={{ p: 2, mb: 1.25, borderRadius: 2 }}>
              <Box display="flex" justifyContent="space-between" alignItems="flex-start" gap={2} flexWrap="wrap">
                <Typography variant="subtitle1" sx={{ flex: 1, minWidth: '60%', fontWeight: 600 }}>
                  {item.index + 1}. {item.questionText}
                </Typography>
                <Chip label={item.verdictLabel} color={item.verdictColor as 'success' | 'warning' | 'error'} size="small" />
              </Box>
              <Typography variant="body2" sx={{ mt: 1 }}>
                <Box component="span" sx={{ fontWeight: 600 }}>Your answer:</Box> {item.userAnswerText}
              </Typography>
              {item.recommendedText && item.recommendedText.trim() && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  <Box component="span" sx={{ fontWeight: 600 }}>Suggested:</Box> {item.recommendedText}
                </Typography>
              )}
              {item.explanation && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  {item.explanation}
                </Typography>
              )}
            </Paper>
          ))
        )}
      </Box>
    </Paper>
  );
};

export default ResultsPanel;
