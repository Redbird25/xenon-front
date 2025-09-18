import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Box, Typography, Button, CircularProgress, Alert } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { apiService } from '../../services/api';
import type {
  LessonProgress,
  Materialization,
  MaterializationQuiz,
  MaterializationQuizAttempt,
  MaterializationQuizEvaluateContentItem,
  MaterializationQuizEvaluateDetail,
  MaterializationQuizEvaluateResponse,
  MaterializationQuizQuestion,
} from '../../types';
import { StepHeader, ContentPanel, QuizPanel, ResultsPanel, LessonSidebar } from '../../components/lesson';
import type { BackendCourse } from '../../services/api';

type StepId = 'content' | 'quiz' | 'results';

const getQuizQuestionKey = (q: MaterializationQuizQuestion, index: number) => String(q.questionId || q.id || index);
const getOptionLetter = (index: number) => String.fromCharCode(97 + index);

const StudentLessonPage: React.FC = () => {
  const { courseId, lessonId } = useParams();
  const { user } = useAuth();
  const { showToast } = useToast();

  const stepStorageKey = React.useMemo(() => {
    if (!user?.id || !courseId || !lessonId) return null;
    return `lesson_step_${user.id}_${courseId}_${lessonId}`;
  }, [user?.id, courseId, lessonId]);

  const [activeStep, setActiveStep] = React.useState(0);
  const [materialization, setMaterialization] = React.useState<Materialization | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isRetryingLesson, setIsRetryingLesson] = React.useState(false);

  const [lessonProgress, setLessonProgress] = React.useState<LessonProgress | null>(null);

  const [quiz, setQuiz] = React.useState<MaterializationQuiz | null>(null);
  const [quizLoading, setQuizLoading] = React.useState(false);
  const [quizError, setQuizError] = React.useState<string | null>(null);
  const [answers, setAnswers] = React.useState<Record<string, string | string[]>>({});
  const [quizEvaluation, setQuizEvaluation] = React.useState<MaterializationQuizEvaluateResponse | null>(null);
  const [isSubmittingQuiz, setIsSubmittingQuiz] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  const [quizAttempts, setQuizAttempts] = React.useState<MaterializationQuizAttempt[]>([]);
  const [attemptsLoading, setAttemptsLoading] = React.useState(false);
  const [attemptsError, setAttemptsError] = React.useState<string | null>(null);
  const [selectedAttemptId, setSelectedAttemptId] = React.useState<string | null>(null);
  const [minMastery, setMinMastery] = React.useState<number | null>(null);
  const [lessonTitle, setLessonTitle] = React.useState<string | undefined>(undefined);
  const [nextLessonPath, setNextLessonPath] = React.useState<string | null>(null);

  const toPercent = React.useCallback((value?: number | null) => {
    if (value === undefined || value === null) return null;
    const raw = value > 1 ? value : value * 100;
    return Math.max(0, Math.min(100, raw));
  }, []);

  React.useEffect(() => {
    if (!stepStorageKey) return;
    try {
      const raw = localStorage.getItem(stepStorageKey);
      if (raw) {
        const idx = Number(raw);
        if (Number.isFinite(idx) && idx >= 0 && idx <= 2) setActiveStep(idx);
      }
    } catch {}
  }, [stepStorageKey]);

  React.useEffect(() => {
    if (!stepStorageKey) return;
    try { localStorage.setItem(stepStorageKey, String(activeStep)); } catch {}
  }, [activeStep, stepStorageKey]);

  React.useEffect(() => {
    (async () => {
      if (!lessonId) return;
      try {
        let p: LessonProgress | null = null;
        try { p = await apiService.getLessonProgress(lessonId); }
        catch (e: any) {
          if (e?.response?.status === 404) {
            p = await apiService.startLessonProgress(lessonId, lessonId);
          } else { throw e; }
        }
        if (p) setLessonProgress(p);
      } catch {}
    })();
  }, [lessonId]);

  const startPollingMaterialization = React.useCallback(() => {
    let poll: any = null;
    const fn = async () => {
      try {
        if (!user?.id || !lessonId) { clearInterval(poll); return; }
        const data = await apiService.getMaterialization(user.id!, lessonId);
        setMaterialization(data);
        if (data.generationStatus !== 'GENERATING') {
          clearInterval(poll);
          if (data.generationStatus === 'FINISHED') showToast('Lesson is ready!', 'success');
        }
      } catch { clearInterval(poll); }
    };
    poll = setInterval(fn, 3000);
    setTimeout(() => clearInterval(poll), 300000);
  }, [user?.id, lessonId, showToast]);

  React.useEffect(() => {
    let cancelled = false;
    if (!user?.id || !lessonId || !courseId) return;

    (async () => {
      try {
        setIsLoading(true); setError(null);
        const data = await apiService.getMaterialization(user.id, lessonId);
        if (cancelled) return;
        setMaterialization(data);
        if (data.generationStatus === 'GENERATING') startPollingMaterialization();
      } catch (e: any) {
        if (e?.response?.status === 404) {
          try {
            await apiService.startMaterialization({ courseId: courseId!, lessonId: lessonId! });
            showToast('Starting lesson preparation...', 'info');
            startPollingMaterialization();
          } catch { setError('Failed to start lesson preparation'); }
        } else {
          setError('Failed to load lesson content');
        }
      } finally { if (!cancelled) setIsLoading(false); }
    })();

    return () => { cancelled = true; };
  }, [user?.id, courseId, lessonId, showToast, startPollingMaterialization]);

  // Fetch course structure to get lesson metadata (minMastery, title)
  React.useEffect(() => {
    (async () => {
      if (!courseId || !lessonId) return;
      try {
        const course: BackendCourse = await apiService.getCourseById(courseId);
        let foundTitle: string | undefined;
        let foundMin: number | null = null;
        let nextId: string | null = null;
        // compute next lesson by traversing modules/lessons by position
        const modules = [...(course.modules || [])].sort((a,b) => (a.position||0)-(b.position||0));
        const flattened: Array<{ id: string; position: number }> = [];
        modules.forEach(m => {
          const lessons = [...(m.lessons || [])].sort((a,b) => (a.position||0)-(b.position||0));
          lessons.forEach(l => flattened.push({ id: String(l.id), position: l.position }));
        });
        for (const m of course.modules || []) {
          const lesson = (m.lessons || []).find(l => String(l.id) === String(lessonId));
          if (lesson) {
            foundTitle = lesson.title;
            foundMin = typeof lesson.minMastery === 'number' ? lesson.minMastery : null;
            // find next from flattened list
            const idx = flattened.findIndex(x => x.id === String(lessonId));
            if (idx >= 0 && idx + 1 < flattened.length) {
              nextId = flattened[idx + 1].id;
            }
            break;
          }
        }
        setLessonTitle(foundTitle);
        setMinMastery(foundMin);
        setNextLessonPath(nextId ? `/learn/${courseId}/${nextId}` : `/courses/${courseId}`);
      } catch {
        // ignore, sidebar will degrade gracefully
      }
    })();
  }, [courseId, lessonId]);

  const retryLessonGeneration = React.useCallback(async () => {
    if (!materialization?.lessonMaterialId || !courseId) return;
    setIsRetryingLesson(true);
    setError(null);
    try {
      await apiService.retryMaterializationLesson(materialization.lessonMaterialId, courseId);
      setMaterialization((prev) => prev ? { ...prev, generationStatus: 'GENERATING' } as Materialization : prev);
      showToast('Regenerating lesson content...', 'info');
      startPollingMaterialization();
    } catch { setError('Failed to restart lesson generation'); showToast('Failed to restart lesson generation', 'error'); }
    finally { setIsRetryingLesson(false); }
  }, [materialization?.lessonMaterialId, courseId, startPollingMaterialization, showToast]);

  const refetchQuiz = React.useCallback(async () => {
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
      // Immediately fetch attempts to populate sidebar/panels
      try {
        const qid = (q as any).id || (q as any).quizId;
        if (qid) {
          await fetchQuizAttempts(String(qid));
        }
      } catch { /* ignore attempts fetch error here */ }
    } catch { setQuizError('Failed to load quiz'); }
    finally { setQuizLoading(false); }
  }, [materialization?.lessonMaterialId]);

  // Auto-load quiz once lesson materialization is ready (to discover quizId and attempts)
  React.useEffect(() => {
    if (materialization?.lessonMaterialId && !quiz && !quizLoading) {
      void refetchQuiz();
    }
  }, [materialization?.lessonMaterialId, quiz, quizLoading, refetchQuiz]);

  const retryQuizGeneration = React.useCallback(async () => {
    if (!materialization?.lessonMaterialId || !courseId) return;
    try {
      await apiService.retryMaterializationQuiz(materialization.lessonMaterialId, courseId);
      await refetchQuiz();
    } catch { setQuizError('Failed to restart quiz generation'); }
  }, [materialization?.lessonMaterialId, courseId, refetchQuiz]);

  const fetchQuizAttempts = React.useCallback(async (quizId: string, selectId?: string) => {
    setAttemptsLoading(true); setAttemptsError(null);
    try {
      const data = await apiService.getMaterializationQuizAttempts(quizId);
      const sorted = [...data].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setQuizAttempts(sorted);
      if (selectId) setSelectedAttemptId(selectId); else setSelectedAttemptId(sorted[0]?.id || null);
    } catch { setAttemptsError('Failed to load attempt history'); }
    finally { setAttemptsLoading(false); }
  }, []);

  React.useEffect(() => {
    if (activeStep !== 2) return;
    const quizId = quiz?.id || quizEvaluation?.quizId;
    if (quizId) fetchQuizAttempts(quizId).catch(() => {});
  }, [activeStep, quiz?.id, quizEvaluation?.quizId, fetchQuizAttempts]);

  // Also fetch attempts once quiz is known (to allow defaulting to Results on re-entry)
  React.useEffect(() => {
    if (!quiz?.id) return;
    if (quizAttempts.length === 0 && !attemptsLoading) {
      fetchQuizAttempts(quiz.id).catch(() => {});
    }
  }, [quiz?.id, quizAttempts.length, attemptsLoading, fetchQuizAttempts]);

  // If there are past attempts, prefer showing Results on re-entry
  React.useEffect(() => {
    if (!stepStorageKey) return;
    let saved: number | null = null;
    try {
      const raw = localStorage.getItem(stepStorageKey);
      saved = raw != null ? Number(raw) : null;
    } catch {}
    if ((saved === null || saved === 0 || saved === 1) && quizAttempts.length > 0) {
      setActiveStep(2);
    }
  }, [quizAttempts.length, stepStorageKey]);

  React.useEffect(() => { setQuizEvaluation(null); setSubmitError(null); setAnswers({}); }, [quiz?.id]);

  // Mastery and quiz visibility
  const masteryPercent: number | null = React.useMemo(
    () => toPercent(lessonProgress?.mastery ?? null),
    [lessonProgress?.mastery, toPercent]
  );
  const minPct = React.useMemo(
    () => (minMastery == null ? null : Math.round(minMastery * 100)),
    [minMastery]
  );
  const quizHidden: boolean = React.useMemo(() => {
    if (minPct == null || masteryPercent == null) return false;
    return masteryPercent > minPct; // hide quiz step when mastery > minMastery
  }, [minPct, masteryPercent]);
  const needsRetake: boolean = React.useMemo(() => {
    if (minPct == null || masteryPercent == null) return false;
    return masteryPercent < minPct;
  }, [minPct, masteryPercent]);
  const canRetake: boolean = needsRetake;

  const steps = React.useMemo(() => ([
    { id: 'content' as StepId, label: 'Lesson Content', completed: true },
    { id: 'quiz' as StepId, label: 'Quiz', completed: !!quizEvaluation },
    { id: 'results' as StepId, label: 'Results', completed: !!quizEvaluation },
  ]), [quizEvaluation]);

  const canNavigateTo = React.useCallback((id: StepId) => {
    if (id === 'content') return true;
    if (id === 'quiz') return !quizHidden && !!quiz;
    if (id === 'results') return !!quizEvaluation || quizAttempts.length > 0;
    return false;
  }, [quizHidden, quiz, quizEvaluation, quizAttempts.length]);

  const onStartQuiz = React.useCallback(async () => {
    setActiveStep(1);
    if (!quiz) await refetchQuiz();
  }, [quiz, refetchQuiz]);

  const onBackToLesson = React.useCallback(() => {
    setActiveStep(0);
    setQuizEvaluation(null);
    setSubmitError(null);
  }, []);

  const formatAnswerText = React.useCallback((question: MaterializationQuizQuestion | undefined, value: string | string[] | undefined) => {
    if (!value || (Array.isArray(value) && value.length === 0)) return '-';
    const toLabel = (valRaw: string) => {
      const val = String(valRaw).trim();
      if (!question?.options?.length) return val;
      const options = question.options || [];
      // Try direct id/optionRef match first
      let found = options.find((opt) => String(opt.id || opt.optionRef) === val);
      if (found) return found.text || found.optionRef || val;
      // Letter mapping: a,b,c -> 0,1,2
      const lower = val.toLowerCase();
      if (/^[a-z]$/.test(lower)) {
        const idx = lower.charCodeAt(0) - 97;
        if (idx >= 0 && idx < options.length) return options[idx].text || options[idx].optionRef || val;
      }
      // Numeric index mapping
      const n = Number(val);
      if (!Number.isNaN(n) && n >= 0 && n < options.length) return options[n].text || options[n].optionRef || val;
      // Fallback: return as-is
      return val;
    };
    if (Array.isArray(value)) {
      const mapped = value.map((v) => toLabel(String(v))).filter((t) => t && t.trim().length > 0);
      return mapped.length ? mapped.join(', ') : '-';
    }
    return toLabel(String(value)) || '-';
  }, []);

  const submitQuizFinal = React.useCallback(async () => {
    if (!quiz || !lessonId) { setSubmitError('Quiz is not ready yet.'); return; }
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
            const candidates = [ opt.id, opt.optionRef, String(optionIndex), getOptionLetter(optionIndex), (opt.text || '').toString() ]
              .filter(Boolean).map((val) => String(val).trim().toLowerCase());
            if (candidates.includes(normalized.toLowerCase())) letter = getOptionLetter(optionIndex);
          });
          if (!letter) {
            const indexFromValue = Number(normalized);
            if (!Number.isNaN(indexFromValue) && indexFromValue >= 0 && indexFromValue < options.length) {
              letter = getOptionLetter(indexFromValue);
            }
          }
          if (!letter) letter = normalized.toLowerCase();
          if (!letters.includes(letter)) letters.push(letter);
        });
        return letters;
      };

      let answer: string[] = [];
      if (qType === 'mcq_single' || qType === 'mcq_multi') {
        if (Array.isArray(raw)) answer = collectAnswerLetters(raw as string[]);
        else { const value = String(raw || '').trim(); answer = collectAnswerLetters(value ? [value] : []); }
      } else if (Array.isArray(raw)) {
        answer = (raw as string[]).map((v) => String(v || '').trim()).filter((v) => v.length > 0);
      } else {
        const value = String(raw || '').trim(); if (value) answer = [value];
      }

      return { question: questionText || `Question ${idx + 1}`, answer };
    });

    const payload = { quizId: (quiz as any).quizId || quiz.id, items };
    setIsSubmittingQuiz(true); setSubmitError(null);
    try {
      const evaluation = await apiService.evaluateMaterializationQuiz(lessonId, payload);
      setQuizEvaluation(evaluation);
      setActiveStep(2);
      try { await fetchQuizAttempts(evaluation.quizId, evaluation.id); } catch {}
      try {
        if (user?.id) {
          const key = `quiz_answers_${user.id}_${evaluation.quizId}_${evaluation.id}`;
          localStorage.setItem(key, JSON.stringify(answers));
        }
      } catch {}
      showToast('Quiz submitted', 'success');
    } catch {
      setSubmitError('Failed to evaluate quiz. Please try again.');
      showToast('Failed to submit quiz', 'error');
    } finally { setIsSubmittingQuiz(false); }
  }, [answers, quiz, lessonId, fetchQuizAttempts, showToast]);

  const quizQuestionMap: Record<string, { question: MaterializationQuizQuestion; index: number; key: string }> = React.useMemo(() => {
    const map: Record<string, { question: MaterializationQuizQuestion; index: number; key: string }> = {};
    (quiz?.questions || []).forEach((question, idx) => {
      const key = getQuizQuestionKey(question, idx);
      const id = String(question.questionId || question.id || idx);
      map[id] = { question, index: idx, key };
    });
    return map;
  }, [quiz?.questions]);

  const displayAttempt: MaterializationQuizAttempt | MaterializationQuizEvaluateResponse | null = React.useMemo(() => {
    if (selectedAttemptId) return quizAttempts.find((a) => a.id === selectedAttemptId) || null;
    return quizEvaluation || null;
  }, [selectedAttemptId, quizAttempts, quizEvaluation]);

  const displayDetails: MaterializationQuizEvaluateDetail[] = React.useMemo(() => displayAttempt?.details || quizEvaluation?.details || [], [displayAttempt, quizEvaluation]);
  const displayContent: MaterializationQuizEvaluateContentItem[] = React.useMemo(() => displayAttempt?.content || quizEvaluation?.content || [], [displayAttempt, quizEvaluation]);

  const displayScorePercent: number | null = React.useMemo(() => {
    const score = toPercent(displayAttempt?.scorePercent ?? quizEvaluation?.scorePercent ?? null);
    return score;
  }, [displayAttempt?.scorePercent, quizEvaluation?.scorePercent, toPercent]);

  const answersForDisplay: Record<string, string | string[]> = React.useMemo(() => {
    // Use live answers for the evaluation just submitted in this session
    if (displayAttempt && quizEvaluation && displayAttempt.id === quizEvaluation.id) {
      return answers;
    }
    const attemptId = (displayAttempt as any)?.id;
    const quizId = (displayAttempt as any)?.quizId || quiz?.id;
    if (user?.id && attemptId && quizId) {
      try {
        const key = `quiz_answers_${user.id}_${quizId}_${attemptId}`;
        const raw = localStorage.getItem(key);
        if (raw) return JSON.parse(raw);
      } catch {}
    }
    return {};
  }, [displayAttempt, quizEvaluation?.id, answers, quiz?.id, user?.id]);

  const displayAttemptTimestamp: string = React.useMemo(() => {
    const ts = (displayAttempt as any)?.createdAt || (quizEvaluation as any)?.createdAt || '';
    if (!ts) return '';
    try { return new Date(ts).toLocaleString(); } catch { return String(ts); }
  }, [displayAttempt, quizEvaluation]);

  const latestScorePercent: number | null = React.useMemo(() => {
    const latest = quizAttempts[0]?.scorePercent; return toPercent(latest);
  }, [quizAttempts, toPercent]);

  // (removed duplicate mastery/quizHidden declarations; defined earlier)

  if (isLoading) {
    return (
      <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="400px">
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2 }}>Loading lesson...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="400px">
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        <Button variant="contained" onClick={() => window.location.reload()}>Try Again</Button>
      </Box>
    );
  }

  if (!materialization || materialization.generationStatus !== 'FINISHED') {
    return (
      <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="400px">
        {materialization?.generationStatus === 'FAILED' ? (
          <>
            <Typography variant="h6" color="error" sx={{ mb: 2 }}>Failed to generate lesson</Typography>
            <Button variant="contained" onClick={() => void retryLessonGeneration()} disabled={isRetryingLesson}>
              {isRetryingLesson ? 'Retrying…' : 'Try Again'}
            </Button>
          </>
        ) : (
          <Typography variant="h6" color="text.secondary">No lesson content available</Typography>
        )}
      </Box>
    );
  }

  return (
    <Box sx={{ px: { xs: 1.5, md: 3 }, pb: { xs: 3, md: 4 } }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: { xs: 1.5, md: 2.5 } }}>
        <Button startIcon={<ArrowBack />} component={Link} to={`/courses/${courseId}`}>Back to Course</Button>
        <Typography variant="h5" sx={{ textAlign: 'center' }}>{lessonTitle || 'Lesson'}</Typography>
        <Box width={120} />
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1fr 280px' },
          gridTemplateAreas: { xs: '"sidebar" "main"', md: '"main sidebar"' },
          alignItems: 'start',
          gap: { xs: 2, md: 3 },
        }}
      >
        <Box sx={{ gridArea: 'main' }}>
          <Box sx={{ mb: { xs: 1.5, md: 2 } }}>
        <StepHeader
          steps={[
            { id: 'content', label: 'Lesson Content', completed: quizAttempts.length > 0 },
            ...(!quizHidden ? [{ id: 'quiz' as StepId, label: 'Quiz', completed: quizAttempts.length > 0 }] : []),
            { id: 'results', label: 'Results', completed: quizAttempts.length > 0 },
          ]}
          activeIndex={activeStep}
          canNavigateTo={canNavigateTo}
          onChange={setActiveStep}
        />
          </Box>

          {activeStep === 0 && (
            <ContentPanel materialization={materialization} onStartQuiz={onStartQuiz} showStartQuiz={!quizHidden} />
          )}

          {!quizHidden && activeStep === 1 && (
            quiz ? (
              <QuizPanel
                quiz={quiz}
                loading={quizLoading}
                error={quizError}
                answers={answers}
                setAnswers={setAnswers}
                submitError={submitError}
                isSubmitting={isSubmittingQuiz}
                onSubmit={submitQuizFinal}
                onBackToLesson={onBackToLesson}
              />
            ) : (
              <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="300px">
                {quizLoading ? (
                  <>
                    <CircularProgress />
                    <Typography variant="body2" sx={{ mt: 2 }}>Loading quiz…</Typography>
                  </>
                ) : quizError ? (
                  <>
                    <Alert severity="error" sx={{ mb: 2 }}>{quizError}</Alert>
                    <Button variant="outlined" onClick={() => void refetchQuiz()}>Retry</Button>
                  </>
                ) : (
                  <Button variant="contained" onClick={() => void refetchQuiz()}>Load Quiz</Button>
                )}
              </Box>
            )
          )}

          {activeStep === 2 && (
            <ResultsPanel
              courseId={courseId}
              displayAttempt={displayAttempt}
              quizEvaluation={quizEvaluation}
              quizAttempts={quizAttempts}
              attemptsLoading={attemptsLoading}
              attemptsError={attemptsError}
              displayScorePercent={displayScorePercent}
              displayAttemptTimestamp={displayAttemptTimestamp}
              latestScorePercent={latestScorePercent}
              masteryPercent={masteryPercent}
              selectedAttemptId={selectedAttemptId}
              onSelectAttempt={setSelectedAttemptId}
              toPercent={toPercent}
              answers={answersForDisplay}
              formatAnswerText={formatAnswerText}
              quizQuestionMap={quizQuestionMap}
              displayDetails={displayDetails}
              displayContent={displayContent}
              onReviewLesson={() => setActiveStep(0)}
              onRetakeQuiz={retryQuizGeneration}
              minMasteryPercent={minMastery == null ? null : Math.round(minMastery * 100)}
            />
          )}
        </Box>
        <Box sx={{ gridArea: 'sidebar' }}>
          <LessonSidebar
            title={lessonTitle}
            masteryPercent={masteryPercent}
            minMastery={minMastery}
            attemptsCount={quizAttempts.length}
            latestScorePercent={latestScorePercent}
            onGoTo={(s) => setActiveStep(s === 'content' ? 0 : s === 'quiz' ? 1 : 2)}
            onRetake={retryQuizGeneration}
            needsRetake={needsRetake}
            canRetake={canRetake}
            nextLessonPath={nextLessonPath}
            quizAvailable={!quizHidden}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default StudentLessonPage;
