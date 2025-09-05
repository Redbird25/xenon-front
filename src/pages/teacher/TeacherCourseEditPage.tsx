import React, { useState } from 'react';
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

const TeacherCourseEditPage: React.FC = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

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

  const handleSave = async () => {
    setError('');
    setSuccess('');
    setIsSubmitting(true);

    try {
      // Mock save operation
      await new Promise(resolve => setTimeout(resolve, 1000));

      setSuccess('Course updated successfully!');

      setTimeout(() => {
        navigate('/courses');
      }, 1500);

    } catch (err: any) {
      setError('Failed to update course');
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

  const handleDeleteCourse = () => {
    const confirmed = window.confirm('Delete this course? This action cannot be undone.');
    if (!confirmed) return;
    showToast('Course deleted', 'success');
    navigate('/courses');
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
            disabled={isSubmitting}
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

      <Grid container spacing={3}>
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

            {courseData.modules.map((module, moduleIndex) => (
              <Accordion key={module.id} sx={{ mb: 2 }}>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Box display="flex" alignItems="center" gap={2} width="100%">
                    <Chip label={`Module ${module.order}`} color="primary" size="small" />
                    <Typography variant="subtitle1">{module.title}</Typography>
                    <Box ml="auto" display="flex" gap={1}>
                      <Button size="small" variant="outlined" startIcon={<Add />} onClick={(e) => { e.stopPropagation(); addLesson(moduleIndex); }}>Add Lesson</Button>
                      <Button size="small" color="error" variant="outlined" startIcon={<Delete />} onClick={(e) => { e.stopPropagation(); removeModule(moduleIndex); }}>Remove Module</Button>
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
                      />
                    </Grid>

                    {/* Lessons */}
                    <Grid size={12}>
                      <Typography variant="subtitle2" gutterBottom>
                        Lessons
                      </Typography>

                      {module.lessons.map((lesson, lessonIndex) => (
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
                              />
                            </Grid>
                            <Grid size={12}>
                              <Box display="flex" justifyContent="flex-end">
                                <Button size="small" color="error" startIcon={<Delete />} onClick={() => removeLesson(moduleIndex, lessonIndex)}>
                                  Remove Lesson
                                </Button>
                              </Box>
                            </Grid>
                          </Grid>
                        </Paper>
                      ))}
                      <Box display="flex" justifyContent="flex-end">
                        <Button size="small" variant="outlined" startIcon={<Add />} onClick={() => addLesson(moduleIndex)}>
                          Add Lesson
                        </Button>
                      </Box>
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>
            ))}
            <Box display="flex" justifyContent="flex-end">
              <Button variant="contained" startIcon={<Add />} onClick={addModule}>
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
                {Math.round(
                  courseData.modules.reduce((total, module) =>
                    total + module.lessons.reduce((sum, lesson) => sum + lesson.minMastery, 0), 0
                  ) / courseData.modules.reduce((total, module) => total + module.lessons.length, 0) * 100
                )}%
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


