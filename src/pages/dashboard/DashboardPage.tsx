import React, { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  LinearProgress,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
  School,
  Book,
  TrendingUp,
  People,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();

  const stats = [
    {
      title: 'Courses Enrolled',
      value: '3',
      icon: <School color="primary" />,
      color: 'primary.main'
    },
    {
      title: 'Lessons Completed',
      value: '12',
      icon: <Book color="secondary" />,
      color: 'secondary.main'
    },
    {
      title: 'Average Mastery',
      value: '78%',
      icon: <TrendingUp color="success" />,
      color: 'success.main'
    },
    {
      title: 'Study Streak',
      value: '5 days',
      icon: <People color="warning" />,
      color: 'warning.main'
    },
  ];

  const recentCourses = [
    {
      id: '1',
      title: 'Introduction to Python',
      progress: 75,
      status: 'in_progress',
      lastAccessed: '2 hours ago'
    },
    {
      id: '2',
      title: 'Data Structures & Algorithms',
      progress: 45,
      status: 'in_progress',
      lastAccessed: '1 day ago'
    },
    {
      id: '3',
      title: 'Machine Learning Basics',
      progress: 100,
      status: 'completed',
      lastAccessed: '3 days ago'
    },
  ];

  return (
    <Box>
      {/* Onboarding is enforced globally via OnboardingGate */}
      <Typography variant="h4" gutterBottom>
        Welcome back, {user?.name}!
      </Typography>

      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Continue your learning journey
      </Typography>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {stats.map((stat, index) => (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={index}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="text.secondary" gutterBottom variant="body2">
                      {stat.title}
                    </Typography>
                    <Typography variant="h5" component="div">
                      {stat.value}
                    </Typography>
                  </Box>
                  <Box sx={{ color: stat.color }}>
                    {stat.icon}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Recent Courses */}
      <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
        Recent Courses
      </Typography>

      <Grid container spacing={3}>
        {recentCourses.map((course) => (
          <Grid size={{ xs: 12, md: 6, lg: 4 }} key={course.id}>
            <Card sx={{ cursor: 'pointer' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {course.title}
                </Typography>

                <Box sx={{ mb: 2 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Progress
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {course.progress}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={course.progress}
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                </Box>

                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Chip
                    label={course.status === 'completed' ? 'Completed' : 'In Progress'}
                    color={course.status === 'completed' ? 'success' : 'primary'}
                    size="small"
                  />
                  <Typography variant="body2" color="text.secondary">
                    {course.lastAccessed}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Quick Actions */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h5" gutterBottom>
          Quick Actions
        </Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Card sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}>
              <CardContent>
                <Typography variant="h6">Continue Learning</Typography>
                <Typography variant="body2" color="text.secondary">
                  Pick up where you left off
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Card sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}>
              <CardContent>
                <Typography variant="h6">Browse Courses</Typography>
                <Typography variant="body2" color="text.secondary">
                  Discover new learning paths
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Card sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}>
              <CardContent>
                <Typography variant="h6">View Progress</Typography>
                <Typography variant="body2" color="text.secondary">
                  Track your achievements
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default DashboardPage;
