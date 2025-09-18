import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Button,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  Avatar,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { Link } from 'react-router-dom';
import {
  PlayArrow,
  Book,
  AccessTime,
  People,
  Star,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { useQuery } from '@tanstack/react-query';
import api, { BackendCourse } from '../../services/api';
import ExpandMore from '@mui/icons-material/ExpandMore';
import type { LessonProgress } from '../../types';

const CourseDetailPage: React.FC = () => {
  const { courseId } = useParams();
  const { user } = useAuth();
  const location = useLocation() as any;
  const { showToast } = useToast();
  const navigate = useNavigate();

  const { data: course, isLoading } = useQuery<BackendCourse>({
    queryKey: ['course_detail', courseId],
    queryFn: () => api.getCourseById(courseId || ''),
    enabled: !!courseId,
    staleTime: 120000,
    refetchOnWindowFocus: false,
  });

  const teacherName: string = location?.state?.teacher || course?.ownerUserId || 'Instructor';
  const [progressByLesson, setProgressByLesson] = useState<Record<string, LessonProgress | null>>({});

  const lessonsFlat = useMemo(() => {
    if (!course) return [] as Array<{ id: string; position: number; title: string; description?: string }>;
    const modulesSorted = [...(course.modules || [])].sort((a,b)=> (a.position||0)-(b.position||0));
    const lessons = modulesSorted.flatMap((m) =>
      [...(m.lessons || [])]
        .sort((a,b)=> (a.position||0)-(b.position||0))
        .map(l => ({ id: l.id, position: l.position, title: l.title, description: l.description }))
    );
    return lessons;
  }, [course?.id]);

  const totalLessons = lessonsFlat.length;
  const firstLessonId = lessonsFlat[0]?.id;

  const [loadingProgress, setLoadingProgress] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!course || totalLessons === 0) return;
      setLoadingProgress(true);
      try {
        const results = await Promise.allSettled(
          lessonsFlat.map(async (l) => {
            try {
              const p = await api.getLessonProgress(l.id);
              return { id: l.id, progress: p as LessonProgress };
            } catch (e: any) {
              if (e?.response?.status === 404) return { id: l.id, progress: null };
              throw e;
            }
          })
        );
        if (cancelled) return;
        const map: Record<string, LessonProgress | null> = {};
        for (const r of results) {
          if (r.status === 'fulfilled') {
            map[r.value.id] = r.value.progress;
          }
        }
        setProgressByLesson(map);
      } catch {
        // ignore network errors; keep empty map
      } finally {
        if (!cancelled) setLoadingProgress(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [course?.id, totalLessons]);

  const finishedCount = useMemo(() =>
    Object.values(progressByLesson).filter((p) => p?.status === 'FINISHED').length,
    [progressByLesson]
  );
  const courseStarted = !!(firstLessonId && progressByLesson[firstLessonId]);
  const progressPct = totalLessons ? Math.round((finishedCount / totalLessons) * 100) : 0;

  const lastFinishedOverall = useMemo(() => {
    let last: string | null = null;
    lessonsFlat.forEach((lesson) => {
      if (progressByLesson[lesson.id]?.status === 'FINISHED') {
        last = lesson.id;
      }
    });
    return last;
  }, [lessonsFlat, progressByLesson]);

  const resolvePrevLessonId = useCallback(
    (lessonId: string, index: number): string => {
      if (index < 0) return lastFinishedOverall || lessonId;
      for (let i = index - 1; i >= 0; i--) {
        const candidate = lessonsFlat[i];
        if (candidate && progressByLesson[candidate.id]?.status === 'FINISHED') {
          return candidate.id;
        }
      }
      return lastFinishedOverall || lessonId;
    },
    [lessonsFlat, progressByLesson, lastFinishedOverall]
  );

  const handleStartCourse = async () => {
    if (!firstLessonId) return;
    try {
      const index = lessonsFlat.findIndex(l => l.id === firstLessonId);
      const prevId = resolvePrevLessonId(firstLessonId, index);
      const p = await api.startLessonProgress(firstLessonId, prevId !== firstLessonId ? prevId : undefined);
      setProgressByLesson((prev) => ({ ...prev, [firstLessonId]: p }));
      showToast('Course started', 'success');
    } catch (e) {
      showToast('Failed to start course', 'error');
    }
  };

  const computeButton = (lessonId: string, index: number) => {
    const cur = progressByLesson[lessonId];
    const prev = index > 0 ? progressByLesson[lessonsFlat[index - 1].id] : undefined;
    const allowed = courseStarted && (index === 0 || prev?.status === 'FINISHED');
    let label: 'Start' | 'Resume' | 'Review' = 'Start';
    if (cur?.status === 'STARTED') label = 'Resume';
    if (cur?.status === 'FINISHED') label = 'Review';
    return { allowed, label };
  };

  return (
    <Box>
      {/* Course Header */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={{ xs: 2, md: 3 }}>
          <Grid size={{ xs: 12, md: 8 }}>
            {isLoading ? (
              <Box>
                <Box sx={{ height: 36, bgcolor: (t)=>t.palette.action.hover, borderRadius: 1, mb:2 }} />
                <Box sx={{ height: 18, width: '70%', bgcolor: (t)=>t.palette.action.hover, borderRadius: 1, mb:1 }} />
                <Box sx={{ height: 18, width: '50%', bgcolor: (t)=>t.palette.action.hover, borderRadius: 1, mb:3 }} />
              </Box>
            ) : (
              <>
                <Typography variant="h4" gutterBottom>
                  {course?.title}
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                  {course?.description}
                </Typography>
              </>
            )}

            <Box display="flex" alignItems="center" gap={2} sx={{ mb: 2 }}>
              <Avatar>{(teacherName || '?').charAt(0).toUpperCase()}</Avatar>
              <Box>
                <Typography variant="subtitle1">
                  {teacherName}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Instructor
                </Typography>
              </Box>
            </Box>

            <Box display="flex" gap={2} flexWrap="wrap">
              <Chip icon={<AccessTime />} label={course?.createdAt ? new Date(course.createdAt).toLocaleDateString() : ''} />
              <Chip label={course?.lang?.toUpperCase()} variant="outlined" />
              <Chip label={course?.status} color={course?.status === 'PUBLISHED' ? 'success' : (course?.status === 'READY' ? 'primary' : 'default')} />
            </Box>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <Box textAlign="center">
              <Box sx={{
                p: 2,
                borderRadius: 2,
                bgcolor: (t) => t.palette.mode === 'dark'
                  ? 'rgba(124,58,237,0.08)'
                  : 'rgba(124,58,237,0.06)'
              }}>
                <Typography variant="h6" gutterBottom color="text.primary">
                  Course Progress
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={progressPct}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    mb: 1,
                    '& .MuiLinearProgress-bar': {
                      backgroundImage: 'linear-gradient(90deg, #7C3AED, #00E5FF)'
                    }
                  }}
                />
                <Typography variant="body2" color="text.secondary">
                  {courseStarted
                    ? (finishedCount === totalLessons && totalLessons > 0
                        ? 'Completed'
                        : `${finishedCount} of ${totalLessons} lessons (${progressPct}%)`)
                    : 'Not started'}
                </Typography>
                {!courseStarted && (
                  <Button sx={{ mt: 1 }} variant="contained" onClick={handleStartCourse} disabled={loadingProgress || !firstLessonId}>
                    Start Course
                  </Button>
                )}
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Course Content */}
      <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
        Course Content
      </Typography>

      {isLoading ? (
        <>
          {Array.from({ length: 2 }).map((_, idx) => (
            <Card key={idx} sx={{ mb: 3 }}>
              <CardContent>
                <Box sx={{ height: 24, width: '40%', bgcolor: (t)=>t.palette.action.hover, borderRadius: 1, mb: 1 }} />
                <Box sx={{ height: 16, width: '80%', bgcolor: (t)=>t.palette.action.hover, borderRadius: 1, mb: 2 }} />
                <Box sx={{ display:'grid', gap: 1 }}>
                  {Array.from({ length: 3 }).map((__, i) => (
                    <Box key={i} sx={{ height: 44, bgcolor: (t)=>t.palette.action.hover, borderRadius: 1 }} />
                  ))}
                </Box>
              </CardContent>
            </Card>
          ))}
        </>

      ) : (
        ([...(course?.modules || [])]
          .sort((a,b)=> (a.position||0)-(b.position||0))
        ).map((module, idx) => (
          <Accordion key={module.id} defaultExpanded={idx === 0} sx={{ mb: 2 }}>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Box display="flex" alignItems="center" gap={2}>
                <Chip label={`Module ${module.position}`} size="small" color="primary" />
                <Typography variant="subtitle1">{module.title}</Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Box>
                {[...(module.lessons || [])].sort((a,b)=> (a.position||0)-(b.position||0)).map((lesson) => (
                  <Box key={lesson.id} sx={{ mb: 2 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                      <Box display="flex" alignItems="center" gap={2}>
                        <Book color="action" />
                        <Box>
                          <Typography variant="subtitle2">
                            Lesson {lesson.position}: {lesson.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {lesson.description}
                          </Typography>
                        </Box>
                      </Box>
                      <Box display="flex" alignItems="center" gap={2}>
                        {(() => {
                          const index = lessonsFlat.findIndex(l=>l.id===lesson.id);
                          const { allowed, label } = computeButton(lesson.id, index);
                          const mastery = progressByLesson[lesson.id]?.mastery ?? null;
                          const tip = !allowed ? (!courseStarted ? 'Start the course to unlock' : 'Finish previous lesson to unlock') : '';
                          const prevLessonIdForNav = resolvePrevLessonId(lesson.id, index);
                          return (
                            <>
                              {mastery !== null && <Chip size="small" label={`Mastery ${Math.round(mastery*100)}%`} />}
                              <Button
                                size="small"
                                variant="outlined"
                                startIcon={<PlayArrow />}
                                disabled={!allowed}
                                title={tip}
                                onClick={async () => {
                                  if (!allowed) return;
                                  try {
                                    if (label === 'Start') {
                                      await api.startLessonProgress(String(lesson.id), prevLessonIdForNav !== lesson.id ? prevLessonIdForNav : undefined);
                                    }
                                  } catch {}
                                  navigate(`/learn/${courseId}/${lesson.id}`, { state: { prevLessonId: prevLessonIdForNav } });
                                }}
                              >
                                {label}
                              </Button>
                            </>
                          );
                        })()}
                      </Box>
                    </Box>
                    <Divider />
                  </Box>
                ))}
              </Box>
            </AccordionDetails>
          </Accordion>
        ))
      )}

      {/* Course Stats */}
      <Grid container spacing={{ xs: 2, md: 3 }} sx={{ mt: 2 }}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                What You'll Learn
              </Typography>
              <Box component="ul" sx={{ pl: 2 }}>
                <li>Python fundamentals and syntax</li>
                <li>Variables and data types</li>
                <li>Control structures and loops</li>
                <li>Functions and modules</li>
                <li>File handling and exceptions</li>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Prerequisites
              </Typography>
              <Box component="ul" sx={{ pl: 2 }}>
                <li>No prior programming experience required</li>
                <li>Basic computer skills</li>
                <li>Access to a computer with internet</li>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Course Features
              </Typography>
              <Box component="ul" sx={{ pl: 2 }}>
                <li>Interactive coding exercises</li>
                <li>Video lectures and demonstrations</li>
                <li>Quizzes and assessments</li>
                <li>Community discussion forums</li>
                <li>Certificate of completion</li>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default CourseDetailPage;
