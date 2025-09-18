import React from 'react';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  Paper,
  Radio,
  RadioGroup,
  TextField,
  Typography,
} from '@mui/material';
import type { MaterializationQuiz, MaterializationQuizQuestion } from '../../types';

export type AnswersState = Record<string, string | string[]>;

const getQuizQuestionKey = (question: MaterializationQuizQuestion, index: number) =>
  String(question.questionId || question.id || index);

interface QuizPanelProps {
  quiz: MaterializationQuiz;
  loading?: boolean;
  error?: string | null;
  answers: AnswersState;
  setAnswers: React.Dispatch<React.SetStateAction<AnswersState>>;
  submitError?: string | null;
  isSubmitting?: boolean;
  onSubmit: () => void;
  onBackToLesson: () => void;
}

const QuizPanel: React.FC<QuizPanelProps> = ({
  quiz,
  loading,
  error,
  answers,
  setAnswers,
  submitError,
  isSubmitting,
  onSubmit,
  onBackToLesson,
}) => {
  const totalQuestions = quiz?.questions?.length || 0;

  const isAnswerInvalid = React.useCallback((q: any, val: any) => {
    const t = String(q?.type || '').toLowerCase();
    if (t === 'short_answer') {
      const s = String(val || '');
      if (!s) return false; // allow empty until user types
      return /\s/.test(s);
    }
    if (t === 'open') {
      const s = String(val || '');
      return s.length > 256;
    }
    return false;
  }, []);

  const unansweredCount = React.useMemo(() => {
    if (!quiz?.questions) return 0;
    return quiz.questions.reduce((count, question, idx) => {
      const key = getQuizQuestionKey(question, idx);
      const val = answers[key];
      if (Array.isArray(val)) return count + (val.length === 0 ? 1 : 0);
      const s = String(val || '').trim();
      return count + (s.length === 0 ? 1 : 0);
    }, 0);
  }, [quiz?.questions, answers]);

  const hasInvalidAnswers = React.useMemo(() => {
    if (!quiz?.questions) return false;
    return quiz.questions.some((q, idx) => {
      const key = getQuizQuestionKey(q, idx);
      return isAnswerInvalid(q, answers[key]);
    });
  }, [quiz?.questions, answers, isAnswerInvalid]);

  const canSubmitQuiz = !loading && !error && totalQuestions > 0 && unansweredCount === 0 && !hasInvalidAnswers && !isSubmitting;

  if (loading) {
    return (
      <Paper sx={{ p: 3 }}>
        <Typography>Loading quiz…</Typography>
      </Paper>
    );
  }

  if (error) {
    return (
      <Paper sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: { xs: 2, md: 3 } }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
        <Typography variant="h6">Quiz</Typography>
        <Typography variant="body2" color="text.secondary">
          Answered {Object.values(answers).filter((v) => Array.isArray(v) ? v.length > 0 : String(v || '').trim().length > 0).length} / {totalQuestions}
        </Typography>
      </Box>

      <Box>
        {(quiz?.questions || []).map((q, idx) => {
          const qid = getQuizQuestionKey(q, idx);
          const t = String(q.type || '').toLowerCase();
          const hasOptions = (q.options || []).length > 0;
          const groupName = `q-${qid}`;
          const val = answers[qid];
          const invalid = isAnswerInvalid(q, val);
          const renderSingle = t === 'mcq_single' || (hasOptions && t !== 'mcq_multi' && t !== 'short_answer' && t !== 'open');
          const renderMulti = t === 'mcq_multi';
          const renderShort = t === 'short_answer';
          const renderOpen = t === 'open' || (!hasOptions && !renderShort);
          return (
            <Paper key={qid} variant="outlined" sx={{ p: 2, mb: 1.5, borderRadius: 2 }}>
              <Typography variant="subtitle1" sx={{ mb: 1 }}>{idx + 1}. {q.prompt || q.quiz}</Typography>
              {renderSingle && (
                <RadioGroup
                  name={groupName}
                  value={typeof val === 'string' ? (val as string) : ''}
                  onChange={(e) => setAnswers(a => ({ ...a, [qid]: String((e.target as any).value) }))}
                >
                  {(q.options || []).map((opt, i) => {
                    const optionVal = String(opt.id || opt.optionRef || i);
                    return (
                      <FormControlLabel key={`${qid}-${optionVal}`} value={optionVal} control={<Radio />} label={opt.text || opt.optionRef || optionVal} />
                    );
                  })}
                </RadioGroup>
              )}
              {renderMulti && (
                <Box>
                  {(q.options || []).map((opt, i) => {
                    const optionVal = String(opt.id || opt.optionRef || i);
                    const selected = Array.isArray(val) ? (val as string[]).includes(optionVal) : false;
                    return (
                      <FormControlLabel
                        key={`${qid}-cb-${optionVal}`}
                        control={<Checkbox checked={selected} onChange={() => {
                          const v = optionVal;
                          setAnswers(a => {
                            const cur = Array.isArray(a[qid]) ? (a[qid] as string[]) : [];
                            const next = cur.includes(v) ? cur.filter(x => x !== v) : [...cur, v];
                            return { ...a, [qid]: next };
                          });
                        }} />}
                        label={opt.text || opt.optionRef || optionVal}
                      />
                    );
                  })}
                </Box>
              )}
              {renderShort && (
                <TextField
                  fullWidth
                  placeholder="Type one word"
                  value={typeof val === 'string' ? (val as string) : ''}
                  onChange={(e) => {
                    const s = e.target.value.replace(/\s+/g, ' ').trim().split(' ')[0] || '';
                    setAnswers(a => ({ ...a, [qid]: s }));
                  }}
                  error={invalid}
                  helperText={invalid ? 'Please enter a single word without spaces' : undefined}
                />
              )}
              {renderOpen && (
                <TextField
                  fullWidth
                  multiline
                  minRows={2}
                  placeholder="Type your answer (max 256)"
                  inputProps={{ maxLength: 256 }}
                  value={typeof val === 'string' ? (val as string) : ''}
                  onChange={(e) => setAnswers(a => ({ ...a, [qid]: e.target.value }))}
                  error={invalid}
                  helperText={`${String(typeof val === 'string' ? (val as string) : '').length}/256`}
                />
              )}
            </Paper>
          );
        })}
        <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" rowGap={1} sx={{ mt: 2 }}>
          <Box>
            {submitError && (
              <Alert severity="error" sx={{ py: 0.5, px: 1, alignItems: 'center' }}>{submitError}</Alert>
            )}
            {!submitError && !isSubmitting && unansweredCount > 0 && (
              <Typography variant="caption" color="text.secondary">
                Answer the remaining {unansweredCount} question{unansweredCount > 1 ? 's' : ''} to enable submit.
              </Typography>
            )}
          </Box>
          <Box display="flex" gap={1}>
            <Button variant="outlined" onClick={onBackToLesson}>Back to Lesson</Button>
            <Button variant="contained" onClick={onSubmit} disabled={!canSubmitQuiz}>
              {isSubmitting ? 'Submitting...' : 'Submit Quiz'}
            </Button>
          </Box>
        </Box>
      </Box>
    </Paper>
  );
};

export default QuizPanel;
