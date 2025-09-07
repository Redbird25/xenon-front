import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Chip,
  IconButton,
  Alert,
  Collapse,
  Stack,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
  Add,
  Delete,
  Save,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import apiService from '../../services/api';
import { useToast } from '../../contexts/ToastContext';

const TeacherCourseCreatePage: React.FC = () => {
  const navigate = useNavigate();

  const [courseData, setCourseData] = useState({
    title: '',
    description: '',
    resources: [] as string[],
    lang: 'en',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { showToast } = useToast();
  const [showResources, setShowResources] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setCourseData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleResourceChange = (index: number, value: string) => {
    const newResources = [...courseData.resources];
    newResources[index] = value;
    setCourseData(prev => ({
      ...prev,
      resources: newResources
    }));
  };

  const addResource = () => {
    setCourseData(prev => ({
      ...prev,
      resources: [...prev.resources, '']
    }));
    setShowResources(true);
  };

  const removeResource = (index: number) => {
    if (courseData.resources.length > 1) {
      const newResources = courseData.resources.filter((_, i) => i !== index);
      setCourseData(prev => ({
        ...prev,
        resources: newResources
      }));
    }
  };

  const isHttpsUrl = (s: string) => {
    try { const u = new URL(s); return u.protocol === 'https:'; } catch { return false; }
  };

  const cleanedSources = useMemo(() =>
    courseData.resources.map(s => s.trim()).filter(Boolean),
    [courseData.resources]
  );

  const validHttpsSources = useMemo(() => cleanedSources.filter(isHttpsUrl), [cleanedSources]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setIsSubmitting(true);

    try {
      if (!courseData.title.trim()) {
        throw new Error('Course title is required');
      }
      const payload = {
        title: courseData.title.trim(),
        description: courseData.description.trim(),
        lang: courseData.lang,
      };

      let resp;
      if (validHttpsSources.length === 0) {
        resp = await apiService.createCourse(payload);
      } else {
        resp = await apiService.createCourseWithUri({ ...payload, sourceUris: validHttpsSources });
      }

      setSuccess(`Course created. Status: ${resp.status}`);
      showToast('Course created. Opening editor…', 'success');
      // Warm up cache (best-effort)
      try { await apiService.getCourseById(resp.courseId); } catch {}
      navigate(`/teacher/courses/${resp.courseId}/edit`);

    } catch (err: any) {
      setError(err.message || 'Failed to create course');
      showToast(err.message || 'Failed to create course', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Create New Course
      </Typography>

      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        You can start with just a title and description. Add sources later if needed.
      </Typography>

      <Paper sx={{ p: 3 }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid size={12}>
              <TextField
                fullWidth
                label="Course Title"
                value={courseData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                required
                placeholder="e.g., Introduction to Python Programming"
              />
            </Grid>

            <Grid size={12}>
              <TextField
                fullWidth
                label="Course Description"
                value={courseData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                multiline
                rows={3}
                placeholder="Describe what students will learn in this course"
              />
            </Grid>

            <Grid size={12}>
              <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 1 }}>
                <Typography variant="h6">Sources (optional)</Typography>
                {!showResources && (
                  <Button size="small" variant="outlined" startIcon={<Add />} onClick={() => setShowResources(true)}>Add sources</Button>
                )}
              </Stack>
              <Collapse in={showResources}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Add https:// links. If left empty, the course will be created without sources.
                </Typography>
                {courseData.resources.map((resource, index) => (
                  <Box key={index} display="flex" alignItems="center" sx={{ mb: 2 }}>
                    <TextField
                      fullWidth
                      label={`Source ${index + 1}`}
                      value={resource}
                      onChange={(e) => handleResourceChange(index, e.target.value)}
                      placeholder="https://example.com/tutorial"
                      type="url"
                      error={Boolean(resource) && !isHttpsUrl(resource)}
                      helperText={Boolean(resource) && !isHttpsUrl(resource) ? 'Only https links are allowed' : ' '}
                    />
                    <IconButton onClick={() => removeResource(index)} sx={{ ml: 1 }}>
                      <Delete />
                    </IconButton>
                  </Box>
                ))}
                <Button startIcon={<Add />} onClick={addResource} variant="outlined" size="small">
                  Add another source
                </Button>
              </Collapse>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Language"
                value={courseData.lang}
                onChange={(e) => handleInputChange('lang', e.target.value)}
                select
                SelectProps={{
                  native: true,
                }}
              >
                <option value="en">English</option>
                <option value="ru">Russian</option>
                <option value="uz">Uzbek</option>
              </TextField>
            </Grid>

            <Grid size={12}>
              <Box display="flex" gap={2}>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={<Save />}
                  disabled={isSubmitting}
                  size="large"
                >
                  {isSubmitting ? 'Creating Course...' : 'Create Course'}
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/courses')}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mt: 2 }}>
          {success}
        </Alert>
      )}

      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          Supported Resource Types
        </Typography>
        <Box display="flex" gap={1} flexWrap="wrap">
          <Chip label="Web Pages" variant="outlined" />
          <Chip label="PDF Documents" variant="outlined" />
          <Chip label="Markdown Files" variant="outlined" />
          <Chip label="Documentation Sites" variant="outlined" />
          <Chip label="Video Tutorials" variant="outlined" />
        </Box>
      </Box>
    </Box>
  );
};

export default TeacherCourseCreatePage;
