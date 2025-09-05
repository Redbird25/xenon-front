import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Box,
  Chip,
  TextField,
  InputAdornment,
} from '@mui/material';
import {
  Search,
  PlayArrow,
  Edit,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import Grid from '@mui/material/Grid';
import { Link } from 'react-router-dom';

const CourseListPage: React.FC = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  // Mock course data
  const courses = [
    {
      id: '1',
      title: 'Introduction to Python Programming',
      description: 'Learn the fundamentals of Python programming language',
      teacher: 'Dr. Sarah Johnson',
      status: 'published',
      enrolled: 156,
      rating: 4.8,
      duration: '8 weeks',
      level: 'Beginner',
    },
    {
      id: '2',
      title: 'Data Structures & Algorithms',
      description: 'Master essential data structures and algorithms',
      teacher: 'Prof. Michael Chen',
      status: 'published',
      enrolled: 89,
      rating: 4.9,
      duration: '12 weeks',
      level: 'Intermediate',
    },
    {
      id: '3',
      title: 'Machine Learning Fundamentals',
      description: 'Explore the world of machine learning and AI',
      teacher: 'Dr. Emily Davis',
      status: 'draft',
      enrolled: 0,
      rating: 0,
      duration: '10 weeks',
      level: 'Advanced',
    },
  ];

  const filteredCourses = courses.filter(course =>
    course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'success';
      case 'draft': return 'warning';
      case 'archived': return 'default';
      default: return 'default';
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'Beginner': return 'success';
      case 'Intermediate': return 'warning';
      case 'Advanced': return 'error';
      default: return 'default';
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h4">
          {user?.role === 'teacher' ? 'My Courses' : 'Available Courses'}
        </Typography>
        {user?.role === 'teacher' && (
          <Button variant="contained" component={Link} to="/teacher/courses/create">
            Create New Course
          </Button>
        )}
      </Box>

      {/* Search */}
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Search courses..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {/* Course Grid */}
      <Grid container spacing={3}>
        {filteredCourses.map((course) => (
          <Grid size={{ xs: 12, md: 6, lg: 4 }} key={course.id}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
                  <Typography variant="h6" component="h2" gutterBottom>
                    {course.title}
                  </Typography>
                  <Chip
                    label={course.status}
                    color={getStatusColor(course.status) as any}
                    size="small"
                  />
                </Box>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {course.description}
                </Typography>

                <Box sx={{ mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Instructor: {course.teacher}
                  </Typography>
                </Box>

                <Box display="flex" gap={1} sx={{ mb: 2 }}>
                  <Chip
                    label={course.level}
                    color={getLevelColor(course.level) as any}
                    size="small"
                    variant="outlined"
                  />
                  <Chip
                    label={course.duration}
                    size="small"
                    variant="outlined"
                  />
                </Box>

                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2" color="text.secondary">
                    {course.enrolled} enrolled
                  </Typography>
                  {course.rating > 0 && (
                    <Typography variant="body2" color="text.secondary">
                      ⭐ {course.rating}
                    </Typography>
                  )}
                </Box>
              </CardContent>

              <CardActions>
                {user?.role === 'student' ? (
                  <Button
                    size="small"
                    startIcon={<PlayArrow />}
                    component={Link}
                    to={`/courses/${course.id}`}
                    disabled={course.status !== 'published'}
                  >
                    {course.status === 'published' ? 'Start Learning' : 'Coming Soon'}
                  </Button>
                ) : (
                  <Button
                    size="small"
                    startIcon={<Edit />}
                    component={Link}
                    to={`/teacher/courses/${course.id}/edit`}
                  >
                    Edit Course
                  </Button>
                )}
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {filteredCourses.length === 0 && (
        <Box textAlign="center" sx={{ mt: 4 }}>
          <Typography variant="h6" color="text.secondary">
            No courses found matching your search.
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default CourseListPage;
