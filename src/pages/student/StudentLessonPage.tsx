import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
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
  TextField,
  RadioGroup,
  FormControlLabel,
  Radio,
  Checkbox,
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
import {
  Materialization,
  MaterializationStatus,
  LessonProgress,
  MaterializationQuiz,
  MaterializationQuizQuestion,
  MaterializationQuizEvaluateResponse,
  MaterializationQuizAttempt,
} from '../../types';

const getQuizQuestionKey = (question: MaterializationQuizQuestion, index: number) =>
  String(question.questionId || question.id || index);

const getOptionLetter = (index: number) => String.fromCharCode(97 + index);

const StudentLessonPage: React.FC = () => {
  const { courseId, lessonId } = useParams();
  const location = useLocation();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [materialization, setMaterialization] = useState<Materialization | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lessonProgress, setLessonProgress] = useState<LessonProgress | null>(null);
  const [quiz, setQuiz] = useState<MaterializationQuiz | null>(null);
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizError, setQuizError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [quizEvaluation, setQuizEvaluation] = useState<MaterializationQuizEvaluateResponse | null>(null);
  const [isSubmittingQuiz, setIsSubmittingQuiz] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isRetryingLesson, setIsRetryingLesson] = useState(false);
  const [quizAttempts, setQuizAttempts] = useState<MaterializationQuizAttempt[]>([]);
  const [attemptsLoading, setAttemptsLoading] = useState(false);
  const [attemptsError, setAttemptsError] = useState<string | null>(null);
  const [selectedAttemptId, setSelectedAttemptId] = useState<string | null>(null);
  const startMaterializationRequestedRef = React.useRef(false);
  const attemptsFetchedRef = React.useRef<string | null>(null);
  const navigationPrevLessonId = React.useMemo(() => {
    const state = location?.state as { prevLessonId?: string | null } | null;
    const val = state?.prevLessonId;
    return typeof val === 'string' && val.trim().length > 0 ? val.trim() : undefined;
  }, [location?.state]);

  const prevLessonStorageKey = React.useMemo(() => {
    if (!user?.id || !courseId) return null;
    return `last_lesson_${user.id}_${courseId}`;
  }, [user?.id, courseId]);

  const getStoredPrevLessonId = React.useCallback(() => {
    if (navigationPrevLessonId) return navigationPrevLessonId;
    if (!lessonId) return lessonId || '';
    if (!prevLessonStorageKey || typeof window === 'undefined') return lessonId;
    try {
      const stored = localStorage.getItem(prevLessonStorageKey);
      if (stored && stored.trim().length > 0) {
        return stored;
      }
    } catch {
      // ignore storage errors
    }
    return lessonId;
  }, [navigationPrevLessonId, prevLessonStorageKey, lessonId]);

  useEffect(() => {
    startMaterializationRequestedRef.current = false;
    attemptsFetchedRef.current = null;
    setQuizAttempts([]);
    setSelectedAttemptId(null);
    setAttemptsError(null);
  }, [lessonId, courseId, user?.id]);

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

  const totalQuestions = quiz?.questions?.length || 0;

  const unansweredCount = React.useMemo(() => {
    if (!quiz?.questions) return 0;
    return quiz.questions.reduce((count, question, idx) => {
      const key = getQuizQuestionKey(question, idx);
      const val = answers[key];
      const hasAnswer = Array.isArray(val)
        ? (val as string[]).filter((v) => String(v || '').trim().length > 0).length > 0
        : String(val || '').trim().length > 0;
      return hasAnswer ? count : count + 1;
    }, 0);
  }, [answers, quiz?.questions]);

  const hasInvalidAnswers = React.useMemo(() => {
    if (!quiz?.questions) return false;
    return quiz.questions.some((question, idx) => {
      const key = getQuizQuestionKey(question, idx);
      return isAnswerInvalid(question, answers[key]);
    });
  }, [answers, quiz?.questions, isAnswerInvalid]);

  const canSubmitQuiz = totalQuestions > 0 && unansweredCount === 0 && !hasInvalidAnswers && !isSubmittingQuiz;

  const quizQuestionMap = React.useMemo(() => {
    if (!quiz?.questions) return {} as Record<string, { question: MaterializationQuizQuestion; index: number; key: string }>;
    const map: Record<string, { question: MaterializationQuizQuestion; index: number; key: string }> = {};
    quiz.questions.forEach((question, index) => {
      const key = getQuizQuestionKey(question, index);
      const entry = { question, index, key };
      const ids = [question.questionId, question.id, key].filter(Boolean) as string[];
      ids.forEach((id) => {
        map[String(id)] = entry;
      });
    });
    return map;
  }, [quiz?.questions]);

  const toPercent = React.useCallback((value?: number | null) => {
    if (value === undefined || value === null) return null;
    const normalized = value > 1 ? value : value * 100;
    return Math.max(0, Math.min(100, normalized));
  }, []);

  const selectedAttempt = React.useMemo(() => {
    if (selectedAttemptId) {
      return quizAttempts.find((attempt) => attempt.id === selectedAttemptId) || null;
    }
    return quizAttempts[0] || null;
  }, [quizAttempts, selectedAttemptId]);

  const latestAttempt = React.useMemo(() => quizAttempts[0] || null, [quizAttempts]);

  const displayAttempt = selectedAttempt || latestAttempt || quizEvaluation || null;

  const displayScorePercent = React.useMemo(
    () => toPercent(displayAttempt?.scorePercent ?? quizEvaluation?.scorePercent ?? null),
    [displayAttempt?.scorePercent, quizEvaluation?.scorePercent, toPercent]
  );

  const latestScorePercent = React.useMemo(
    () => toPercent(latestAttempt?.scorePercent ?? null),
    [latestAttempt?.scorePercent, toPercent]
  );

  const masteryPercent = React.useMemo(
    () => toPercent(lessonProgress?.mastery ?? null),
    [lessonProgress?.mastery, toPercent]
  );

  const displayAttemptTimestamp = React.useMemo(() => {
    const ts = displayAttempt?.createdAt || quizEvaluation?.createdAt;
    if (!ts) return '';
    try {
      return new Date(ts).toLocaleString();
    } catch {
      return ts;
    }
  }, [displayAttempt?.createdAt, quizEvaluation?.createdAt]);

  const attemptHistory = React.useMemo(() => {
    const total = quizAttempts.length;
    return quizAttempts.map((attempt, idx) => {
      const score = toPercent(attempt.scorePercent);
      let timestamp = attempt.createdAt;
      try {
        timestamp = new Date(attempt.createdAt).toLocaleString();
      } catch {}
      const isSelected = selectedAttemptId ? attempt.id === selectedAttemptId : idx === 0;
      const chipColor = score !== null && score >= 80 ? 'success' : score !== null && score >= 50 ? 'warning' : 'error';
      return {
        attempt,
        index: idx,
        label: `Attempt ${total - idx}${idx === 0 ? ' (Latest)' : ''}`,
        isSelected,
        timestamp,
        score,
        chipColor,
      };
    });
  }, [quizAttempts, selectedAttemptId, toPercent]);

  const questionReviews = React.useMemo(() => {
    const details = displayAttempt?.details || quizEvaluation?.details || [];
    const content = displayAttempt?.content || quizEvaluation?.content || [];
    if (!details.length) return [] as Array<{
      key: string;
      index: number;
      questionText: string;
      verdictLabel: string;
      verdictColor: 'success' | 'warning' | 'error' | 'info';
      userAnswerText: string;
      recommendedText: string;
      explanation?: string;
    }>;
    return details.map((detail, idx) => {
      const meta = quizQuestionMap[String(detail.questionId)] || quizQuestionMap[String(idx)];
      const question = meta?.question;
      const questionText = question?.prompt || question?.quiz || content[idx]?.question || `Question ${idx + 1}`;
      const isCurrentAttempt = displayAttempt?.id === quizEvaluation?.id;
      const answerValue = isCurrentAttempt && meta ? answers[meta.key] : undefined;
      const userAnswerText = isCurrentAttempt ? formatAnswerText(question, answerValue) : '—';
      const recommended = content[idx]?.options || [];
      const recommendedText = recommended.length ? recommended.join(', ') : '';
      const verdictLabel = detail.verdict || 'Reviewed';
      const verdictLower = verdictLabel.toLowerCase();
      let verdictColor: 'success' | 'warning' | 'error' | 'info' = 'info';
      if (verdictLower.includes('correct') || verdictLower.includes('pass')) verdictColor = 'success';
      else if (verdictLower.includes('partial') || verdictLower.includes('review')) verdictColor = 'warning';
      else if (verdictLower.includes('incorrect') || verdictLower.includes('wrong') || verdictLower.includes('fail')) verdictColor = 'error';

      return {
        key: `${detail.questionId || 'detail'}-${idx}`,
        index: idx,
        questionText,
        verdictLabel,
        verdictColor,
        userAnswerText,
        recommendedText,
        explanation: detail.explanation,
      };
    });
  }, [displayAttempt, quizEvaluation, quizQuestionMap, answers, formatAnswerText]);

  const formatAnswerText = React.useCallback(
    (question: MaterializationQuizQuestion | undefined, value: string | string[] | undefined) => {
      if (!value || (Array.isArray(value) && value.length === 0)) return '—';
      const toLabel = (val: string) => {
        if (!question?.options?.length) return val;
        const match = question.options.find((opt) => String(opt.id || opt.optionRef) === val);
        return match?.text || match?.optionRef || val;
      };
      if (Array.isArray(value)) {
        const mapped = value.map((v) => toLabel(String(v)));
        const filtered = mapped.filter((item) => item && item.trim().length > 0);
        return filtered.length ? filtered.join(', ') : '—';
      }
      const single = toLabel(String(value));
      return single || '—';
    },
    []
  );

  // Ensure server-side lesson progress exists (do not override step; respect server)
  useEffect(() => {
    if (!lessonId) return;
    let cancelled = false;
    (async () => {
      try {
        let p: LessonProgress | null = null;
        try {
          p = await apiService.getLessonProgress(lessonId);
        } catch (e: any) {
          if (e?.response?.status === 404) {
            const previousLessonId = getStoredPrevLessonId() || lessonId;
            p = await apiService.startLessonProgress(lessonId, previousLessonId || lessonId);
          } else {
            throw e;
          }
        }
        if (!p || cancelled) return;
        if (!cancelled) setLessonProgress(p);
      } catch {
        // ignore; the lesson content can still load and user can retry
      }
    })();
    return () => { cancelled = true; };
  }, [lessonId, user?.id, getStoredPrevLessonId]);

  useEffect(() => {
    setQuizEvaluation(null);
    setSubmitError(null);
    setAnswers({});
  }, [quiz?.id]);

  useEffect(() => {
    if (submitError) {
      setSubmitError(null);
    }
  }, [answers]);

  useEffect(() => {
    if (!showResults) return;
    const quizId = quiz?.id || quizEvaluation?.quizId;
    if (!quizId) return;
    if (attemptsFetchedRef.current === quizId && quizAttempts.length > 0) return;
    attemptsFetchedRef.current = quizId;
    fetchQuizAttempts(
      quizId,
      quizEvaluation?.id ? { selectAttemptId: quizEvaluation.id } : undefined
    ).catch(() => {});
  }, [showResults, quiz?.id, quizEvaluation?.quizId, quizEvaluation?.id, quizAttempts.length, fetchQuizAttempts]);

  // Reflect server step in UI; auto-fetch quiz if needed
  useEffect(() => {
    const s = lessonProgress?.step;
    if (!s) return;
    if (s === 'QUIZ') {
      setCurrentStep(1);
      if (materialization?.lessonMaterialId && !quiz && !quizLoading) {
        refetchQuiz();
      }
    } else if (s === 'RESULTS') {
      setCurrentStep(2);
      setShowResults(true);
    } else {
      setCurrentStep(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonProgress?.step, materialization?.lessonMaterialId]);

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
            if (startMaterializationRequestedRef.current) {
              return;
            }
            startMaterializationRequestedRef.current = true;
            try {
              await apiService.startMaterialization({ courseId, lessonId });
            } catch (startErr) {
              startMaterializationRequestedRef.current = false;
              throw startErr;
            }
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
  }, [user?.id, lessonId, courseId, getStoredPrevLessonId]);

  useEffect(() => {
    if (!prevLessonStorageKey || typeof window === 'undefined') return;
    if (!navigationPrevLessonId) return;
    try {
      localStorage.setItem(prevLessonStorageKey, navigationPrevLessonId);
    } catch {
      // ignore storage errors
    }
  }, [prevLessonStorageKey, navigationPrevLessonId]);

  const retryLessonGeneration = async () => {
    if (!materialization?.lessonMaterialId || !courseId || isRetryingLesson) return;
    setIsRetryingLesson(true);
    setError(null);
    try {
      await apiService.retryMaterializationLesson(materialization.lessonMaterialId, courseId);
      setMaterialization((prev) => prev ? { ...prev, generationStatus: 'GENERATING' } : prev);
      showToast('Regenerating lesson content...', 'info');
      startPolling();
    } catch (err) {
      console.error('Failed to restart lesson generation', err);
      setError('Failed to restart lesson generation');
      showToast('Failed to restart lesson generation', 'error');
    } finally {
      setIsRetryingLesson(false);
    }
  };

  const fetchQuizAttempts = React.useCallback(
    async (quizId: string, options: { selectAttemptId?: string } = {}) => {
      setAttemptsLoading(true);
      setAttemptsError(null);
      try {
        const data = await apiService.getMaterializationQuizAttempts(quizId);
        const sorted = [...data].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setQuizAttempts(sorted);
        if (options.selectAttemptId) {
          setSelectedAttemptId(options.selectAttemptId);
        } else if (sorted.length > 0) {
          if (!selectedAttemptId || !sorted.some((attempt) => attempt.id === selectedAttemptId)) {
            setSelectedAttemptId(sorted[0].id);
          }
        } else {
          setSelectedAttemptId(null);
        }
        return sorted;
      } catch (err) {
        console.error('Failed to fetch quiz attempts', err);
        setAttemptsError('Failed to load attempt history');
        throw err;
      } finally {
        setAttemptsLoading(false);
      }
    },
    [selectedAttemptId]
  );

  const startPolling = () => {
    let pollInterval: ReturnType<typeof setInterval> | null = null;

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

  // Navigate to quiz: set server step and fetch quiz with simple polling
  const goToQuiz = async () => {
    if (!lessonProgress) return;
    try { await apiService.changeLessonProgressStep(lessonProgress.id, 'QUIZ'); } catch {}
    setCurrentStep(1);
    if (!materialization?.lessonMaterialId) return;
    setQuizLoading(true); setQuizError(null);
    try {
      let q = await apiService.getMaterializationQuiz(materialization.lessonMaterialId);
      const start = Date.now();
      while (q.status === 'GENERATING' && Date.now() - start < 120000) {
        await new Promise(r => setTimeout(r, 3000));
        q = await apiService.getMaterializationQuiz(materialization.lessonMaterialId);
      }
      setQuiz(q);
    } catch (e) {
      setQuizError('Failed to load quiz');
    } finally {
      setQuizLoading(false);
    }
  };

  // Retry fetching quiz without changing server step
  const refetchQuiz = async () => {
    if (!materialization?.lessonMaterialId) return;
    setQuizLoading(true); setQuizError(null);
    try {
      let q = await apiService.getMaterializationQuiz(materialization.lessonMaterialId);
      const start = Date.now();
      while (q.status === 'GENERATING' && Date.now() - start < 120000) {
        await new Promise(r => setTimeout(r, 3000));
        q = await apiService.getMaterializationQuiz(materialization.lessonMaterialId);
      }
      setQuiz(q);
    } catch (e) {
      setQuizError('Failed to load quiz');
    } finally {
      setQuizLoading(false);
    }
  };

  // Call try-again endpoint then poll via GET
  const retryQuizGeneration = async () => {
    try {
      if (!materialization?.lessonMaterialId || !courseId) return;
      await apiService.retryMaterializationQuiz(materialization.lessonMaterialId, courseId);
      await refetchQuiz();
    } catch (e) {
      setQuizError('Failed to restart quiz generation');
    }
  };

  const submitQuizFinal = async () => {
    if (!quiz || !lessonId) {
      setSubmitError('Quiz is not ready yet.');
      return;
    }
    if (unansweredCount > 0) {
      setSubmitError(`Answer the remaining ${unansweredCount} question${unansweredCount > 1 ? 's' : ''}.`);
      showToast('Please answer all questions before submitting.', 'warning');
      return;
    }
    if (hasInvalidAnswers) {
      setSubmitError('One or more answers need attention.');
      showToast('Please review your answers.', 'warning');
      return;
    }

    const quizIdentifier = (quiz as any).quizId || quiz.id;
    if (!quizIdentifier) {
      setSubmitError('Quiz identifier is missing.');
      return;
    }

    const items = (quiz.questions || []).map((question, idx) => {
      const key = getQuizQuestionKey(question, idx);
      const raw = answers[key];
      const qType = String(question.type || '').toLowerCase();
      const options = question.options || [];
      const questionText = String(question.prompt || question.quiz || `Question ${idx + 1}`).trim();

      const collectAnswerLetters = (value: string | string[]) => {
        const ensureArray = Array.isArray(value) ? value : value ? [value] : [];
        const letters: string[] = [];
        ensureArray.forEach((item) => {
          const normalized = String(item || '').trim();
          if (!normalized) return;
          let letter: string | null = null;
          options.forEach((opt, optionIndex) => {
            if (letter) return;
            const candidates = [
              opt.id,
              opt.optionRef,
              String(optionIndex),
              getOptionLetter(optionIndex),
              (opt.text || '').toString(),
            ]
              .filter(Boolean)
              .map((val) => String(val).trim().toLowerCase());
            if (candidates.includes(normalized.toLowerCase())) {
              letter = getOptionLetter(optionIndex);
            }
          });
          if (!letter) {
            const indexFromValue = Number(normalized);
            if (!Number.isNaN(indexFromValue) && indexFromValue >= 0 && indexFromValue < options.length) {
              letter = getOptionLetter(indexFromValue);
            }
          }
          if (!letter) {
            letter = normalized.toLowerCase();
          }
          if (!letters.includes(letter)) {
            letters.push(letter);
          }
        });
        return letters;
      };

      let answer: string[] = [];
      if (qType === 'mcq_single' || qType === 'mcq_multi') {
        if (Array.isArray(raw)) {
          answer = collectAnswerLetters(raw as string[]);
        } else {
          const value = String(raw || '').trim();
          answer = collectAnswerLetters(value ? [value] : []);
        }
      } else if (Array.isArray(raw)) {
        answer = (raw as string[]).map((v) => String(v || '').trim()).filter((v) => v.length > 0);
      } else {
        const value = String(raw || '').trim();
        if (value) answer = [value];
      }

      return {
        question: questionText || `Question ${idx + 1}`,
        answer,
      };
    });

    const payload = {
      quizId: quizIdentifier,
      items,
    };

    setIsSubmittingQuiz(true);
    setSubmitError(null);

    try {
      const evaluation = await apiService.evaluateMaterializationQuiz(lessonId, payload);
      setQuizEvaluation(evaluation);
      setCurrentStep(2);
      setShowResults(true);

      if (lessonProgress) {
        try {
          const updated = await apiService.changeLessonProgressStep(lessonProgress.id, 'RESULTS');
          setLessonProgress(updated);
        } catch (stepError) {
          console.error('Failed to sync lesson progress step', stepError);
        }
      }

      try {
        await fetchQuizAttempts(evaluation.quizId, { selectAttemptId: evaluation.id });
      } catch {
        // errors handled in fetchQuizAttempts
      }

      try {
        if (user?.id) {
          const key = `study_events_${user.id}`;
          const prev = JSON.parse(localStorage.getItem(key) || '[]');
          const rawScore = evaluation?.scorePercent ?? 0;
          const normalizedScore = rawScore > 1 ? rawScore : rawScore * 100;
          const score = Math.round(Math.max(0, Math.min(100, normalizedScore)));
          const evt = { ts: new Date().toISOString(), courseId, lessonId, score };
          localStorage.setItem(key, JSON.stringify([...prev, evt]));
        }
      } catch (storageError) {
        console.warn('Failed to record study event', storageError);
      }

      showToast('Quiz submitted', 'success');
    } catch (error) {
      console.error('Failed to evaluate quiz', error);
      setSubmitError('Failed to evaluate quiz. Please try again.');
      showToast('Failed to submit quiz', 'error');
    } finally {
      setIsSubmittingQuiz(false);
    }
  };

  const steps = [
    { id: 'content', label: 'Lesson Content', completed: true },
    { id: 'quiz', label: 'Quiz', completed: showResults },
    { id: 'results', label: 'Results', completed: showResults }
  ];

  const answeredCount = React.useMemo(() => {
    return Object.values(answers).filter((v) =>
      Array.isArray(v) ? v.length > 0 : String(v || '').trim().length > 0
    ).length;
  }, [answers]);



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
        <Box display="flex" gap={2}>
          <Button
            variant="contained"
            onClick={retryLessonGeneration}
            disabled={isRetryingLesson}
          >
            {isRetryingLesson ? 'Retrying…' : 'Try Again'}
          </Button>
          <Button variant="outlined" onClick={() => window.location.reload()} disabled={isRetryingLesson}>
            Reload Page
          </Button>
        </Box>
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
          {steps.map((step, index) => {
            const isActive = currentStep === index;
            const isResultsStep = step.id === 'results';
            const isQuizStep = step.id === 'quiz';
            const canNavigateToResults = isResultsStep && showResults && !!quizEvaluation;
            const canNavigateToQuiz = isQuizStep && !!quiz;
            const canNavigateToContent = step.id === 'content';

            const handleStepClick = () => {
              if (canNavigateToResults) {
                setCurrentStep(2);
                setShowResults(true);
              } else if (canNavigateToQuiz) {
                setCurrentStep(1);
              } else if (canNavigateToContent) {
                setCurrentStep(0);
              }
            };

            const clickable = canNavigateToResults || canNavigateToQuiz || canNavigateToContent;

            return (
              <Grid size={4} key={step.id}>
                <Box textAlign="center">
                  <Chip
                    icon={step.completed ? <CheckCircle /> : <RadioButtonUnchecked />}
                    label={step.label}
                    color={step.completed ? 'success' : isActive ? 'primary' : 'default'}
                    variant={isActive ? 'filled' : 'outlined'}
                    clickable={clickable}
                    onClick={clickable ? handleStepClick : undefined}
                  />
                </Box>
              </Grid>
            );
          })}
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
            <Button variant="outlined" sx={{ mr: 1 }} endIcon={<ArrowForward />} onClick={goToQuiz}>Start Quiz</Button>
            
          </Box>
        </Paper>
      )}

      {/* Quiz */}
      {currentStep === 1 && (
        <Paper sx={{ p: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Button startIcon={<ArrowBack />} onClick={async () => { try { if (lessonProgress) await apiService.changeLessonProgressStep(lessonProgress.id, 'LESSON'); } catch {} setCurrentStep(0); }}>
              Back to Lesson
            </Button>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>Quiz</Typography>
            <Chip size="small" label={`${answeredCount}/${totalQuestions} answered`} />
          </Box>
          {quizLoading && (
            <Box textAlign="center" sx={{ py: 4 }}>
              <CircularProgress />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Preparing quiz…</Typography>
            </Box>
          )}
          {quizError && (
            <Alert severity="error" action={<Button color="inherit" size="small" onClick={retryQuizGeneration}>Try Again</Button>}>
              {quizError}
            </Alert>
          )}
          {quiz && quiz.status === 'FAILED' && (
            <Alert severity="error" action={<Button color="inherit" size="small" onClick={retryQuizGeneration}>Try Again</Button>}>
              Failed to generate quiz
            </Alert>
          )}
          {quiz && quiz.questions && quiz.questions.length > 0 && (
            <Box>
              {quiz.questions.map((q, idx) => {
                const qid = getQuizQuestionKey(q, idx);
                const t = String(q.type || '').toLowerCase();
                const groupName = `quiz-${lessonId || 'lesson'}-${qid}`;
                const val = answers[qid];
                const invalid = isAnswerInvalid(q, val);
                const hasOptions = Array.isArray(q.options) && q.options.length > 0;
                const renderSingle = t === 'mcq_single' || (hasOptions && t !== 'mcq_multi' && t !== 'short_answer' && t !== 'open');
                const renderMulti = t === 'mcq_multi';
                const renderShort = t === 'short_answer';
                const renderOpen = t === 'open' || (!hasOptions && !renderShort);
                return (
                  <Paper key={qid} variant="outlined" sx={{ p: 2, mb: 2, borderRadius: 2 }}>
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
                              control={<Checkbox checked={selected} onChange={(e) => {
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
                          // Оставляем только первое 'слово' и без пробелов
                          const s = e.target.value.replace(/\s+/g, ' ').trim().split(' ')[0] || '';
                          setAnswers(a => ({ ...a, [qid]: s }));
                        }}
                        error={invalid}
                        helperText={invalid ? 'Введите одно слово без пробелов' : undefined}
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
              <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" rowGap={1}>
                <Box>
                  {submitError && (
                    <Alert severity="error" sx={{ py: 0.5, px: 1, alignItems: 'center' }}>{submitError}</Alert>
                  )}
                  {!submitError && !isSubmittingQuiz && unansweredCount > 0 && (
                    <Typography variant="caption" color="text.secondary">
                      Answer the remaining {unansweredCount} question{unansweredCount > 1 ? 's' : ''} to enable submit.
                    </Typography>
                  )}
                </Box>
                <Box display="flex" gap={1}>
                  <Button
                    variant="outlined"
                    onClick={async () => {
                      try {
                        if (lessonProgress) await apiService.changeLessonProgressStep(lessonProgress.id, 'LESSON');
                      } catch {}
                      setCurrentStep(0);
                      setShowResults(false);
                    }}
                  >
                    Back to Lesson
                  </Button>
                  <Button
                    variant="contained"
                    onClick={submitQuizFinal}
                    disabled={!canSubmitQuiz}
                  >
                    {isSubmittingQuiz ? 'Submitting...' : 'Submit Quiz'}
                  </Button>
                </Box>
              </Box>
            </Box>
          )}
        </Paper>
      )}

      {/* Results */}
      {currentStep === 2 && (
        <Paper sx={{ p: 3 }}>
          {(displayAttempt || quizEvaluation || attemptsLoading) ? (
            <>
              <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" rowGap={2}>
                <Box sx={{ minWidth: { xs: '100%', md: '45%' } }}>
                  <Typography variant="overline" color="text.secondary">Quiz Score</Typography>
                  <Typography variant="h3" sx={{ fontWeight: 700 }}>
                    {displayScorePercent !== null ? `${Math.round(displayScorePercent)}%` : '--'}
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={displayScorePercent ?? 0}
                    sx={{ mt: 1, height: 10, borderRadius: 6, backgroundColor: (theme) => theme.palette.action.hover }}
                  />
                </Box>
                <Box sx={{ textAlign: { xs: 'left', md: 'right' }, minWidth: { xs: '100%', md: '45%' } }}>
                  {displayScorePercent !== null && (
                    <Chip
                      label={displayScorePercent >= 80 ? 'Mastered' : displayScorePercent >= 50 ? 'Keep practicing' : 'Needs review'}
                      color={displayScorePercent >= 80 ? 'success' : displayScorePercent >= 50 ? 'warning' : 'error'}
                      sx={{ fontWeight: 600, mr: 1, mb: { xs: 1, md: 0 } }}
                    />
                  )}
                  {displayAttemptTimestamp && (
                    <Typography variant="caption" color="text.secondary" display="block">
                      Evaluated {displayAttemptTimestamp}
                    </Typography>
                  )}
                  <Typography variant="caption" color="text.secondary" display="block">
                    {quizAttempts.length > 0 ? `${quizAttempts.length} attempt${quizAttempts.length === 1 ? '' : 's'} recorded` : 'First attempt recorded'}
                  </Typography>
                  {latestScorePercent !== null && (
                    <Typography variant="caption" color="text.secondary" display="block">
                      Latest attempt: {Math.round(latestScorePercent)}%
                    </Typography>
                  )}
                  {masteryPercent !== null && (
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="overline" color="text.secondary">Overall Mastery</Typography>
                      <Typography variant="h6">{Math.round(masteryPercent)}%</Typography>
                    </Box>
                  )}
                </Box>
              </Box>

              <Box sx={{ mt: 3 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>Attempt History</Typography>
                {attemptsLoading && (
                  <Box sx={{ py: 2 }}>
                    <LinearProgress />
                  </Box>
                )}
                {attemptsError && (
                  <Alert severity="warning" sx={{ mb: 2 }}>{attemptsError}</Alert>
                )}
                {!attemptsLoading && attemptHistory.length === 0 && (
                  <Typography variant="body2" color="text.secondary">
                    No recorded attempts yet.
                  </Typography>
                )}
                {!attemptsLoading && attemptHistory.length > 0 && (
                  <Box display="flex" flexDirection="column" gap={1}>
                    {attemptHistory.map(({ attempt, index, isSelected, timestamp, score, chipColor, label }) => (
                      <Paper
                        key={attempt.id}
                        variant={isSelected ? 'outlined' : 'elevation'}
                        sx={{
                          p: 1.5,
                          borderColor: isSelected ? 'primary.main' : undefined,
                          cursor: 'pointer',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                        onClick={() => setSelectedAttemptId(attempt.id)}
                      >
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: isSelected ? 700 : 500 }}>
                            {label}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">{timestamp}</Typography>
                        </Box>
                        <Chip
                          label={score !== null ? `${Math.round(score)}%` : '--'}
                          color={score !== null ? chipColor : 'default'}
                          size="small"
                        />
                      </Paper>
                    ))}
                  </Box>
                )}
              </Box>

              <Box sx={{ mt: 3 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>Question Review</Typography>
                {questionReviews.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No detailed feedback available yet.
                  </Typography>
                ) : (
                  questionReviews.map((item) => (
                    <Paper key={item.key} variant="outlined" sx={{ p: 2, mb: 2, borderRadius: 2 }}>
                      <Box display="flex" justifyContent="space-between" alignItems="flex-start" gap={2} flexWrap="wrap">
                        <Typography variant="subtitle1" sx={{ flex: 1, minWidth: '60%', fontWeight: 600 }}>
                          {item.index + 1}. {item.questionText}
                        </Typography>
                        <Chip label={item.verdictLabel} color={item.verdictColor} size="small" />
                      </Box>
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        <Box component="span" sx={{ fontWeight: 600 }}>Your answer:</Box> {item.userAnswerText}
                      </Typography>
                      {item.recommendedText && (
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

              <Box display="flex" justifyContent="flex-end" gap={1} flexWrap="wrap" sx={{ mt: 2 }}>
                <Button
                  variant="text"
                  onClick={() => {
                    setCurrentStep(0);
                    setShowResults(false);
                  }}
                >
                  Review Lesson
                </Button>
                <Button
                  variant="outlined"
                  onClick={async () => {
                    setQuizEvaluation(null);
                    setShowResults(false);
                    setSubmitError(null);
                    setAnswers({});
                    setCurrentStep(1);
                    if (lessonProgress) {
                      try {
                        const updated = await apiService.changeLessonProgressStep(lessonProgress.id, 'QUIZ');
                        setLessonProgress(updated);
                      } catch (err) {
                        console.warn('Failed to reset lesson step', err);
                      }
                    }
                    await retryQuizGeneration();
                  }}
                >
                  Retake Quiz
                </Button>
                <Button component={Link} to={`/courses/${courseId}`} variant="contained">
                  Back to Course
                </Button>
              </Box>
            </>
          ) : (
            <Box textAlign="center">
              <CheckCircle color="success" sx={{ fontSize: 48, mb: 1 }} />
              <Typography variant="h6" gutterBottom>
                Lesson completed
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                You can return to the course to continue.
              </Typography>
              <Button component={Link} to={`/courses/${courseId}`} variant="contained">
                Back to Course
              </Button>
            </Box>
          )}
        </Paper>
      )}

    </Box>
  );
};

export default StudentLessonPage;

