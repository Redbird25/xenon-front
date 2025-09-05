import React, { useState } from 'react';
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
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
  Add,
  Delete,
  Save,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import apiService from '../../services/api';

const TeacherCourseCreatePage: React.FC = () => {
  const navigate = useNavigate();

  const [courseData, setCourseData] = useState({
    title: '',
    description: '',
    resources: [''],
    lang: 'en',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setIsSubmitting(true);

    try {
      // Filter out empty resources
      const filteredResources = courseData.resources.filter(url => url.trim() !== '');

      if (!courseData.title.trim()) {
        throw new Error('Course title is required');
      }

      if (filteredResources.length === 0) {
        throw new Error('At least one resource URL is required');
      }

      const requestData = {
        course_id: `course_${Date.now()}`, // Generate temporary ID
        title: courseData.title.trim(),
        description: courseData.description.trim() || undefined,
        resources: filteredResources,
        lang: courseData.lang,
      };

      // Call the AI ingest service
      const response = await apiService.ingestResources(requestData);

      setSuccess(`Course created successfully! Job ID: ${response.job_id}`);

      // Navigate back to courses list after a delay
      setTimeout(() => {
        navigate('/courses');
      }, 2000);

    } catch (err: any) {
      setError(err.message || 'Failed to create course');
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
        Set up your course with learning resources. Our AI will process them and create a structured learning path.
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
              <Typography variant="h6" gutterBottom>
                Learning Resources
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Add URLs to tutorials, documentation, videos, or other learning materials.
                Our AI will analyze and structure these into lessons.
              </Typography>

              {courseData.resources.map((resource, index) => (
                <Box key={index} display="flex" alignItems="center" sx={{ mb: 2 }}>
                  <TextField
                    fullWidth
                    label={`Resource ${index + 1}`}
                    value={resource}
                    onChange={(e) => handleResourceChange(index, e.target.value)}
                    placeholder="https://example.com/tutorial"
                    type="url"
                  />
                  <IconButton
                    onClick={() => removeResource(index)}
                    disabled={courseData.resources.length === 1}
                    sx={{ ml: 1 }}
                  >
                    <Delete />
                  </IconButton>
                </Box>
              ))}

              <Button
                startIcon={<Add />}
                onClick={addResource}
                variant="outlined"
                size="small"
              >
                Add Another Resource
              </Button>
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
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
                <option value="ru">Russian</option>
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
