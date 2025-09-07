import React, { useMemo, useState } from 'react';
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
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';

const CourseListPage: React.FC = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  const { data: myCourses, isLoading } = useQuery({
    queryKey: ['student_my_courses'],
    queryFn: () => api.getStudentMyCourses(),
    enabled: !!user,
    staleTime: 120000, // 2 minutes
    refetchOnWindowFocus: false,
  });

  const courses = useMemo(() => {
    return (myCourses || []).map((item) => ({
      id: item.courseResponse.id,
      title: item.courseResponse.title,
      description: item.courseResponse.description,
      status: item.courseResponse.status, // Backend uppercase
      teacher: item.createdBy || item.courseResponse.ownerUserId || '',
      enrolled: item.totalStudents,
      rating: 0,
      duration: '',
      level: '',
    }));
  }, [myCourses]);

  const filteredCourses = courses.filter(course =>
    course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PUBLISHED': return 'success';
      case 'READY': return 'primary';
      case 'DRAFT': return 'warning';
      case 'INGEST_FAILED': return 'error';
      case 'ARCHIVED': return 'default';
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
        <Typography variant="h4">My Courses</Typography>
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
                {course.status === 'PUBLISHED' ? (
                  <Button size="small" startIcon={<PlayArrow />} component={Link} to={`/courses/${course.id}`}>
                    Start / Continue
                  </Button>
                ) : (
                  <Button size="small" startIcon={<Edit />} component={Link} to={`/teacher/courses/${course.id}/edit`}>
                    Edit Course
                  </Button>
                )}
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {(filteredCourses.length === 0 && !isLoading) && (
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
