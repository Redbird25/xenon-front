import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
  ExpandMore,
  Save,
  Cancel,
} from '@mui/icons-material';
import { Add, Delete } from '@mui/icons-material';
import { useToast } from '../../contexts/ToastContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api, { BackendCourse } from '../../services/api';

const TeacherCourseEditPage: React.FC = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const qc = useQueryClient();

  const [courseData, setCourseData] = useState({
    title: 'Introduction to Python Programming',
    description: 'Learn the fundamentals of Python programming language from basics to advanced concepts.',
    status: 'published',
    modules: [
      {
        id: '1',
        title: 'Getting Started with Python',
        description: 'Introduction to Python programming',
        order: 1,
        lessons: [
          {
            id: '1',
            title: 'What is Python?',
            description: 'Overview of Python programming language',
            order: 1,
            minMastery: 0.65
          }
        ]
      }
    ]
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch course details and poll while generating (DRAFT) up to 2 minutes
  const startedAtRef = useRef<number | null>(null);
  const { data: course, isLoading } = useQuery<BackendCourse>({
    queryKey: ['course', courseId],
    queryFn: () => api.getCourseById(courseId || ''),
    enabled: !!courseId,
    refetchInterval: (query) => {
      if (!startedAtRef.current) startedAtRef.current = Date.now();
      const elapsed = Date.now() - startedAtRef.current;
      // Увеличить таймаут до 5 минут
      if (elapsed > 300000) return false;
      const current = (query.state.data as BackendCourse | undefined)?.status;
      // poll every 3s while generating or until first data arrives
      if (!current) return 3000;
      // Продолжать поллинг при всех промежуточных статусах
      const processingStatuses = ['DRAFT', 'INGESTING'];
      return processingStatuses.includes(current) ? 3000 : false;
    },
    staleTime: 30000,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (!course) return;
    const modulesSorted = [...(course.modules || [])]
      .sort((a, b) => (a.position || 0) - (b.position || 0))
      .map((m, mi) => ({
        id: m.id,
        title: m.title,
        description: (m as any).description || 'Module description',
        order: mi + 1,
        lessons: [...(m.lessons || [])]
          .sort((a, b) => (a.position || 0) - (b.position || 0))
          .map((l, li) => ({
            id: l.id,
            title: l.title,
            description: l.description || l.title || 'Lesson description',
            order: li + 1,
            minMastery: l.minMastery ?? 0.6,
          })),
      }));
    setCourseData((prev) => ({
      ...prev,
      title: course.title,
      description: course.description || 'Course description',
      status: (course.status || 'DRAFT').toLowerCase(),
      modules: modulesSorted,
    }));
  }, [course?.id, course?.status]);

  // Notify when generation completes or fails
  const lastStatusRef = useRef<string | null>(null);
  useEffect(() => {
    const cur = course?.status;
    const prev = lastStatusRef.current;
    
    if (cur && prev) {
      if (prev === 'DRAFT' && cur === 'INGESTING') {
        showToast('Processing course content...', 'info');
      }
      if (['DRAFT', 'INGESTING'].includes(prev) && cur === 'READY') {
        showToast('Course content is ready', 'success');
      }
      if (['DRAFT', 'INGESTING'].includes(prev) && cur === 'INGEST_FAILED') {
        showToast('Failed to generate course content', 'error');
      }
    }
    
    if (cur) lastStatusRef.current = cur;
  }, [course?.status]);

  const handleSave = async () => {
    if (!courseId) return;
    setError('');
    setSuccess('');
    setIsSubmitting(true);

    try {
      // Basic validation: titles must not be blank
      const hasEmptyTitles = (courseData.modules || []).some((m: any) => {
        const mt = String(m.title || '').trim();
        if (!mt) return true;
        return (m.lessons || []).some((l: any) => !String(l.title || '').trim());
      });
      if (hasEmptyTitles) {
        setIsSubmitting(false);
        setError('Module and lesson titles must not be blank');
        showToast('Please fill in all module and lesson titles', 'error');
        return;
      }
      // 1) Patch meta — send only changed fields
      const uiStatus = (courseData.status || '').toUpperCase();
      const metaPatch: any = {};
      if (!course || courseData.title !== course.title) metaPatch.title = courseData.title;
      if (!course || courseData.description !== course.description) metaPatch.description = courseData.description;
      if (!course || uiStatus !== course.status) metaPatch.status = uiStatus;
      if (Object.keys(metaPatch).length > 0) {
        await api.patchCourseMeta(courseId, metaPatch);
      }

      // 2) Put structure — always send full structure if present
      if (Array.isArray(courseData.modules) && courseData.modules.length > 0) {
        const origModuleIds = new Set((course?.modules || []).map(m => m.id));
        const origLessonIds = new Set((course?.modules || []).flatMap(m => (m.lessons || []).map(l => l.id)));
        const modulesPayload = [...courseData.modules]
          .sort((a:any,b:any)=> (a.order||0)-(b.order||0))
          .map((m:any, idx:number) => ({
            ...(m.id && origModuleIds.has(m.id) ? { id: m.id } : {}),
            title: (m.title && String(m.title).trim()) || `Module ${idx + 1}`,
            description: (m.description && String(m.description).trim()) || m.title || 'Module description',
            position: m.order || (idx + 1),
            lessons: [...(m.lessons||[])]
              .sort((a:any,b:any)=> (a.order||0)-(b.order||0))
              .map((l:any, j:number) => ({
                ...(l.id && origLessonIds.has(l.id) ? { id: l.id } : {}),
                title: (l.title && String(l.title).trim()) || `Lesson ${j + 1}`,
                description: (l.description && String(l.description).trim()) || l.title || 'Lesson description',
                position: l.order || (j + 1),
                minMastery: Number(l.minMastery) || 0,
              }))
          }));
        await api.putCourseStructure(courseId, { modules: modulesPayload });
      }

      await qc.invalidateQueries({ queryKey: ['course', courseId] });
      setSuccess('Course updated successfully!');
      showToast('Course updated', 'success');
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Failed to update course');
      showToast('Failed to update course', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Modules/Lessons helpers
  const addModule = () => {
    const newModuleId = Date.now().toString();
    setCourseData(prev => ({
      ...prev,
      modules: [
        ...prev.modules,
        {
          id: newModuleId,
          title: `New Module ${prev.modules.length + 1}`,
          description: '',
          order: prev.modules.length + 1,
          lessons: [
            { id: `${newModuleId}-1`, title: 'New Lesson', description: '', order: 1, minMastery: 0.6 }
          ]
        }
      ]
    }));
  };

  const removeModule = (moduleIndex: number) => {
    setCourseData(prev => ({
      ...prev,
      modules: prev.modules.filter((_, idx) => idx !== moduleIndex).map((m, idx) => ({ ...m, order: idx + 1 }))
    }));
  };

  const addLesson = (moduleIndex: number) => {
    setCourseData(prev => {
      const modules = [...prev.modules];
      const nextOrder = modules[moduleIndex].lessons.length + 1;
      modules[moduleIndex].lessons = [
        ...modules[moduleIndex].lessons,
        { id: `${modules[moduleIndex].id}-${nextOrder}`, title: `New Lesson ${nextOrder}`, description: '', order: nextOrder, minMastery: 0.6 }
      ];
      return { ...prev, modules };
    });
  };

  const removeLesson = (moduleIndex: number, lessonIndex: number) => {
    setCourseData(prev => {
      const modules = [...prev.modules];
      modules[moduleIndex].lessons = modules[moduleIndex].lessons
        .filter((_, idx) => idx !== lessonIndex)
        .map((l, idx) => ({ ...l, order: idx + 1 }));
      return { ...prev, modules };
    });
  };

  const handleDeleteCourse = async () => {
    if (!courseId) return;
    const confirmed = window.confirm('Delete this course? This action will mark it as deleted.');
    if (!confirmed) return;
    try {
      await api.deleteCourseSoft(courseId);
      showToast('Course deleted', 'success');
      navigate('/courses');
    } catch (e) {
      showToast('Failed to delete course', 'error');
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h4">
          Edit Course
        </Typography>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<Cancel />}
            onClick={() => navigate('/courses')}
          >
            Cancel
          </Button>
          <Button variant="outlined" onClick={() => navigate(`/teacher/courses/${courseId || '1'}/students`)}>
            Manage Students
          </Button>
          <Button color="error" variant="outlined" startIcon={<Delete />} onClick={handleDeleteCourse}>
            Delete Course
          </Button>
          <Button
            variant="contained"
            startIcon={<Save />}
            onClick={handleSave}
            disabled={isSubmitting || course?.status === 'PUBLISHED'}
          >
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <Grid container spacing={{ xs: 2, md: 3 }}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Course Information
            </Typography>

            {/* Skeleton when loading */}
            <Grid container spacing={2}>
              <Grid size={12}>
                <TextField
                  fullWidth
                  label="Course Title"
                  value={courseData.title}
                  onChange={(e) => setCourseData(prev => ({ ...prev, title: e.target.value }))}
                  disabled={course?.status === 'PUBLISHED'}
                />
              </Grid>

              <Grid size={12}>
                <TextField
                  fullWidth
                  label="Course Description"
                  value={courseData.description}
                  onChange={(e) => setCourseData(prev => ({ ...prev, description: e.target.value }))}
                  multiline
                  rows={3}
                  disabled={course?.status === 'PUBLISHED'}
                />
              </Grid>

               <Grid size={{ xs: 12, sm: 6 }}>
                 <TextField
                   fullWidth
                   label="Status"
                  value={courseData.status}
                  onChange={(e) => setCourseData(prev => ({ ...prev, status: e.target.value }))}
                  select
                  SelectProps={{
                    native: true,
                  }}
                  disabled={false}
                >
                  <option value="draft">Draft</option>
                  <option value="ready">Ready</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </TextField>
              </Grid>
            </Grid>
          </Paper>

          {/* Course Structure */}
          <Paper sx={{ p: 3, mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              Course Structure
            </Typography>

            {(courseData.modules.length === 0 && ['DRAFT', 'INGESTING'].includes(course?.status || '')) && (
              <Alert severity="info" sx={{ mb: 2 }}>
                {course?.status === 'INGESTING' 
                  ? 'Processing course content... Please wait while AI generates modules and lessons.'
                  : 'Generating course modules and lessons… Please wait a bit. We\'ll refresh automatically.'
                }
              </Alert>
            )}

            {(course?.status === 'INGEST_FAILED') && (
              <Alert severity="error" sx={{ mb: 2 }}>
                Generation failed. Please review your sources and try again.
              </Alert>
            )}

            {[...courseData.modules].sort((a,b)=> (a.order||0)-(b.order||0)).map((module, moduleIndex) => (
              <Accordion key={module.id} sx={{ mb: 2 }}>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Box display="flex" alignItems="center" gap={2} width="100%">
                    <Chip label={`Module ${module.order}`} color="primary" size="small" />
                    <Typography variant="subtitle1">{module.title}</Typography>
                    <Box ml="auto" display="flex" gap={1}>
                      <Button size="small" variant="outlined" startIcon={<Add />} onClick={(e) => { e.stopPropagation(); addLesson(moduleIndex); }} disabled={course?.status === 'PUBLISHED' || course?.status === 'DRAFT'}>Add Lesson</Button>
                      <Button size="small" color="error" variant="outlined" startIcon={<Delete />} onClick={(e) => { e.stopPropagation(); removeModule(moduleIndex); }} disabled={course?.status === 'PUBLISHED' || course?.status === 'DRAFT'}>Remove Module</Button>
                    </Box>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    <Grid size={12}>
                      <TextField
                        fullWidth
                        label="Module Title"
                        value={module.title}
                        onChange={(e) => {
                          const newModules = [...courseData.modules];
                          newModules[moduleIndex].title = e.target.value;
                          setCourseData(prev => ({ ...prev, modules: newModules }));
                        }}
                        disabled={course?.status === 'PUBLISHED' || course?.status === 'DRAFT'}
                      />
                    </Grid>

                    <Grid size={12}>
                      <TextField
                        fullWidth
                        label="Module Description"
                        value={module.description}
                        onChange={(e) => {
                          const newModules = [...courseData.modules];
                          newModules[moduleIndex].description = e.target.value;
                          setCourseData(prev => ({ ...prev, modules: newModules }));
                        }}
                        multiline
                        rows={2}
                        disabled={course?.status === 'PUBLISHED' || course?.status === 'DRAFT'}
                      />
                    </Grid>

                    {/* Lessons */}
                    <Grid size={12}>
                      <Typography variant="subtitle2" gutterBottom>
                        Lessons
                      </Typography>

                      {[...module.lessons].sort((a,b)=> (a.order||0)-(b.order||0)).map((lesson, lessonIndex) => (
                        <Paper
                          key={lesson.id}
                          sx={{
                            p: 2,
                            mb: 2,
                            bgcolor: (t) => (t.palette.mode === 'dark' ? 'rgba(255,255,255,0.04)' : 'grey.50'),
                            borderRadius: 2,
                          }}
                        >
                          <Grid container spacing={2}>
                            <Grid size={{ xs: 12, sm: 8 }}>
                              <TextField
                                fullWidth
                                label="Lesson Title"
                                value={lesson.title}
                                onChange={(e) => {
                                  const newModules = [...courseData.modules];
                                  newModules[moduleIndex].lessons[lessonIndex].title = e.target.value;
                                  setCourseData(prev => ({ ...prev, modules: newModules }));
                                }}
                                disabled={course?.status === 'PUBLISHED' || course?.status === 'DRAFT'}
                              />
                            </Grid>

                            <Grid size={{ xs: 12, sm: 4 }}>
                              <TextField
                                fullWidth
                                label="Min Mastery"
                                type="number"
                                value={lesson.minMastery}
                                onChange={(e) => {
                                  const newModules = [...courseData.modules];
                                  newModules[moduleIndex].lessons[lessonIndex].minMastery = parseFloat(e.target.value);
                                  setCourseData(prev => ({ ...prev, modules: newModules }));
                                }}
                                inputProps={{ min: 0, max: 1, step: 0.05 }}
                                disabled={course?.status === 'PUBLISHED' || course?.status === 'DRAFT'}
                              />
                            </Grid>

                            <Grid size={12}>
                              <TextField
                                fullWidth
                                label="Lesson Description"
                                value={lesson.description}
                                onChange={(e) => {
                                  const newModules = [...courseData.modules];
                                  newModules[moduleIndex].lessons[lessonIndex].description = e.target.value;
                                  setCourseData(prev => ({ ...prev, modules: newModules }));
                                }}
                                multiline
                                rows={2}
                                disabled={course?.status === 'PUBLISHED' || course?.status === 'DRAFT'}
                              />
                            </Grid>
                            <Grid size={12}>
                              <Box display="flex" justifyContent="flex-end">
                                <Button size="small" color="error" startIcon={<Delete />} onClick={() => removeLesson(moduleIndex, lessonIndex)} disabled={course?.status === 'PUBLISHED' || course?.status === 'DRAFT'}>
                                  Remove Lesson
                                </Button>
                              </Box>
                            </Grid>
                          </Grid>
                        </Paper>
                      ))}
                      <Box display="flex" justifyContent="flex-end">
                        <Button size="small" variant="outlined" startIcon={<Add />} onClick={() => addLesson(moduleIndex)} disabled={course?.status === 'PUBLISHED' || course?.status === 'DRAFT'}>
                          Add Lesson
                        </Button>
                      </Box>
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>
            ))}
            <Box display="flex" justifyContent="flex-end">
              <Button variant="contained" startIcon={<Add />} onClick={addModule} disabled={course?.status === 'PUBLISHED' || course?.status === 'DRAFT'}>
                Add Module
              </Button>
            </Box>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Course Statistics
            </Typography>

            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Total Modules
              </Typography>
              <Typography variant="h4">
                {courseData.modules.length}
              </Typography>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Total Lessons
              </Typography>
              <Typography variant="h4">
                {courseData.modules.reduce((total, module) => total + module.lessons.length, 0)}
              </Typography>
            </Box>

            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Average Mastery Required
              </Typography>
              <Typography variant="h4">
                {(() => {
                  const totalLessons = courseData.modules.reduce((total, module) => total + module.lessons.length, 0);
                  if (totalLessons === 0) return 0;
                  const sum = courseData.modules.reduce((total, module) => total + module.lessons.reduce((s, l) => s + (Number(l.minMastery) || 0), 0), 0);
                  return Math.round((sum / totalLessons) * 100);
                })()}%
              </Typography>
            </Box>
          </Paper>

          <Paper sx={{ p: 3, mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              Publishing Status
            </Typography>

            <Box sx={{ mb: 2 }}>
              <Chip
                label={courseData.status}
                color={
                  courseData.status === 'published' ? 'success' :
                  courseData.status === 'ready' ? 'primary' :
                  courseData.status === 'draft' ? 'warning' : 'default'
                }
                sx={{ mb: 2 }}
              />
            </Box>

            <Typography variant="body2" color="text.secondary">
              {courseData.status === 'published' && 'Course is live and available to students'}
              {courseData.status === 'ready' && 'Course is ready for publishing'}
              {courseData.status === 'draft' && 'Course is in draft mode - not visible to students'}
              {courseData.status === 'archived' && 'Course is archived - no longer available'}
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default TeacherCourseEditPage;


