import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Button,
  Card,
  CardContent,
  LinearProgress,
  Chip,
  Alert,
  CircularProgress,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { Link } from 'react-router-dom';
import {
  ArrowBack,
  ArrowForward,
  CheckCircle,
  RadioButtonUnchecked,
  Error,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { apiService } from '../../services/api';
import { Materialization, MaterializationStatus } from '../../types';

const StudentLessonPage: React.FC = () => {
  const { courseId, lessonId } = useParams();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [showResults, setShowResults] = useState(false);
  const [materialization, setMaterialization] = useState<Materialization | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load materialization data on component mount
  useEffect(() => {
    if (!user?.id || !lessonId || !courseId) return;

    let cancelled = false;

    const loadMaterialization = async () => {
      if (cancelled) return;
      try {
        setIsLoading(true);
        setError(null);

        console.log('Loading materialization for:', { studentId: user.id, lessonId, courseId });

        // Try to get existing materialization
        const data = await apiService.getMaterialization(user.id, lessonId);
        console.log('Materialization loaded:', JSON.stringify(data, null, 2));
        console.log('Sections count:', data?.sections?.length);
        console.log('Generation status:', data?.generationStatus);

        if (cancelled) return;
        setMaterialization(data);

        // If status is GENERATING, start polling
        if (data.generationStatus === 'GENERATING') {
          startPolling();
        }

      } catch (error: any) {
        const status = error.response?.status;
        if (status === 404) {
          // No materialization exists, start new one
          try {
            if (cancelled) return;
            await apiService.startMaterialization({ courseId, lessonId });
            if (cancelled) return;
            showToast('Starting lesson preparation...', 'info');
            startPolling();
          } catch (startError) {
            if (cancelled) return;
            console.error('Failed to start materialization:', startError);
            setError('Failed to start lesson preparation');
          }
        } else if (status === 304) {
          // Not modified - content hasn't changed, but this shouldn't happen on first load
          console.log('Content not modified (304)');
          setError('Unable to load lesson content');
        } else {
          if (cancelled) return;
          console.error('Failed to load materialization:', error);
          setError('Failed to load lesson content');
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    loadMaterialization();

    return () => {
      cancelled = true;
    };
  }, [user?.id, lessonId, courseId]);

  const startPolling = () => {
    let pollInterval: NodeJS.Timeout | null = null;

    const poll = async () => {
      if (!user?.id || !lessonId) {
        if (pollInterval) clearInterval(pollInterval);
        return;
      }

      try {
        const data = await apiService.getMaterialization(user.id, lessonId);
        setMaterialization(data);

        if (data.generationStatus !== 'GENERATING') {
          if (pollInterval) clearInterval(pollInterval);
          if (data.generationStatus === 'FINISHED') {
            showToast('Lesson is ready!', 'success');
          } else if (data.generationStatus === 'FAILED') {
            setError('Failed to generate lesson content');
          }
        }
      } catch (error) {
        console.error('Polling error:', error);
        if (pollInterval) clearInterval(pollInterval);
      }
    };

    pollInterval = setInterval(poll, 3000); // Poll every 3 seconds

    // Cleanup after 5 minutes
    setTimeout(() => {
      if (pollInterval) clearInterval(pollInterval);
    }, 300000);
  };

  const handleQuizAnswer = (questionId: number, answerIndex: number) => {
    setQuizAnswers(prev => ({
      ...prev,
      [questionId]: answerIndex
    }));
  };

  const computeUnique = (events: Array<{courseId?:string; lessonId?:string}>) => new Set(events.map(e => `${e.courseId}:${e.lessonId}`)).size;
  const computeStreak = (events: Array<{ts:string}>) => {
    const days = Array.from(new Set(events.map(e => new Date(e.ts).toDateString()))).sort((a,b)=> new Date(a).getTime()-new Date(b).getTime());
    let s = 0; const current = new Date(); current.setHours(0,0,0,0);
    for (let i=days.length-1;i>=0;i--){ const d=new Date(days[i]); d.setHours(0,0,0,0); const diff=Math.round((current.getTime()-d.getTime())/(24*60*60*1000)); if(diff===s) s++; else if(diff> s) break; }
    return Math.max(0,s);
  };

  const handleSubmitQuiz = () => {
    setShowResults(true);
    try {
      if (!user?.id) return;
      const key = `study_events_${user.id}`;
      const prev = JSON.parse(localStorage.getItem(key) || '[]');
      const prevUnique = computeUnique(prev);
      const prevStreak = computeStreak(prev);
      const score = calculateScore();
      const evt = { ts: new Date().toISOString(), courseId, lessonId, score };
      const next = [...prev, evt];
      localStorage.setItem(key, JSON.stringify(next));
      const nextUnique = computeUnique(next);
      const nextStreak = computeStreak(next);
      if (prevUnique < 10 && nextUnique >= 10) {
        showToast('Achievement unlocked: 10 lessons!', 'success');
      }
      if (prevStreak < 7 && nextStreak >= 7) {
        showToast('Achievement unlocked: 7‑day streak!', 'success');
      }
    } catch {}
  };

  const calculateScore = () => {
    let correct = 0;
    lesson.quiz.questions.forEach(q => {
      if (quizAnswers[q.id] === q.correctAnswer) {
        correct++;
      }
    });
    return Math.round((correct / lesson.quiz.questions.length) * 100);
  };

  const steps = [
    { id: 'content', label: 'Lesson Content', completed: true },
    { id: 'quiz', label: 'Quiz', completed: showResults },
    { id: 'results', label: 'Results', completed: false }
  ];

  // Show loading state
  if (isLoading) {
    return (
      <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="400px">
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading lesson...
        </Typography>
      </Box>
    );
  }

  // Show error state
  if (error) {
    return (
      <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="400px">
        <Error sx={{ fontSize: 60, color: 'error.main', mb: 2 }} />
        <Typography variant="h6" color="error" gutterBottom>
          Something went wrong
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          {error}
        </Typography>
        <Button variant="contained" onClick={() => window.location.reload()}>
          Try Again
        </Button>
      </Box>
    );
  }

  // Show generating state
  if (materialization?.generationStatus === 'GENERATING') {
    return (
      <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="400px">
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Preparing your personalized lesson...
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          This may take a few moments
        </Typography>
      </Box>
    );
  }

  // Show failed state
  if (materialization?.generationStatus === 'FAILED') {
    return (
      <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="400px">
        <Error sx={{ fontSize: 60, color: 'error.main', mb: 2 }} />
        <Typography variant="h6" color="error" gutterBottom>
          Failed to generate lesson
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          We couldn't prepare your lesson content. Please try again.
        </Typography>
        <Button variant="contained" onClick={() => window.location.reload()}>
          Try Again
        </Button>
      </Box>
    );
  }

  if (!materialization || materialization.generationStatus !== 'FINISHED') {
    return (
      <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="400px">
        <Typography variant="h6" color="text.secondary">
          No lesson content available
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Button startIcon={<ArrowBack />} component={Link} to={`/courses/${courseId}`}>
          Back to Course
        </Button>
        <Typography variant="h5">
          Lesson Content
        </Typography>
        <Box width={100} /> {/* Spacer */}
      </Box>

      {/* Progress Steps */}
      <Box sx={{ mb: 4 }}>
        <Grid container spacing={2}>
          {steps.map((step, index) => (
            <Grid size={4} key={step.id}>
              <Box textAlign="center">
                <Chip
                  icon={step.completed ? <CheckCircle /> : <RadioButtonUnchecked />}
                  label={step.label}
                  color={step.completed ? 'success' : currentStep === index ? 'primary' : 'default'}
                  variant={currentStep === index ? 'filled' : 'outlined'}
                />
              </Box>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Lesson Content */}
      {currentStep === 0 && (
        <Paper sx={{ p: 3 }}>
          {materialization.sections.map((section, index) => (
            <Box key={index} sx={{ mb: 4 }}>
              <Typography variant="h6" gutterBottom>
                {section.title}
              </Typography>
              <Typography variant="body1" sx={{ mb: 2, whiteSpace: 'pre-wrap' }}>
                {section.content}
              </Typography>
              {section.examples.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Examples:
                  </Typography>
                  {section.examples.map((example, exIndex) => (
                    <Paper
                      key={exIndex}
                      sx={{
                        p: 2,
                        mb: 1,
                        bgcolor: (theme) => theme.palette.mode === 'dark' ? 'grey.900' : 'grey.50',
                        border: (theme) => `1px solid ${theme.palette.divider}`,
                        overflow: 'auto'
                      }}
                    >
                      <Typography
                        variant="body2"
                        component="pre"
                        sx={{
                          fontFamily: 'Consolas, "Courier New", monospace',
                          fontSize: '0.875rem',
                          lineHeight: 1.5,
                          margin: 0,
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word',
                          overflowWrap: 'break-word'
                        }}
                      >
                        {example}
                      </Typography>
                    </Paper>
                  ))}
                </Box>
              )}
            </Box>
          ))}

          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" color="text.secondary">
              Generated from {materialization.generatedFromChunks.length} knowledge sources
            </Typography>
            <Button
              variant="contained"
              endIcon={<ArrowForward />}
              onClick={() => showToast('Quiz feature coming soon!', 'info')}
            >
              Continue Learning
            </Button>
          </Box>
        </Paper>
      )}

    </Box>
  );
};

export default StudentLessonPage;
