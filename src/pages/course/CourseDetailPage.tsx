import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
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
import OnboardingDialog from '../../components/onboarding/OnboardingDialog';

const CourseDetailPage: React.FC = () => {
  const { courseId } = useParams();
  const { user } = useAuth();
  const [enrolled, setEnrolled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const { showToast } = useToast();

  // Mock course data
  const course = {
    id: courseId,
    title: 'Introduction to Python Programming',
    description: 'Learn the fundamentals of Python programming language from basics to advanced concepts. This comprehensive course covers everything you need to start your journey in programming.',
    teacher: {
      name: 'Dr. Sarah Johnson',
      avatar: '',
      bio: 'Senior Software Engineer with 10+ years of experience in Python development'
    },
    stats: {
      enrolled: 156,
      rating: 4.8,
      duration: '8 weeks',
      level: 'Beginner',
      language: 'English'
    },
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
            completed: true,
            duration: '15 min'
          },
          {
            id: '2',
            title: 'Installing Python',
            description: 'Setting up your development environment',
            order: 2,
            completed: true,
            duration: '10 min'
          },
          {
            id: '3',
            title: 'Your First Python Program',
            description: 'Writing and running your first script',
            order: 3,
            completed: false,
            duration: '20 min'
          }
        ]
      },
      {
        id: '2',
        title: 'Variables and Data Types',
        description: 'Understanding Python data types and variables',
        order: 2,
        lessons: [
          {
            id: '4',
            title: 'Variables',
            description: 'Creating and using variables',
            order: 1,
            completed: false,
            duration: '25 min'
          },
          {
            id: '5',
            title: 'Data Types',
            description: 'Numbers, strings, and booleans',
            order: 2,
            completed: false,
            duration: '30 min'
          }
        ]
      }
    ]
  };

  const handleEnroll = () => {
    setEnrolled(true);
    showToast('Enrolled successfully. Welcome!','success');
    const globalKey = 'onboarding_first_seen';
    const flagKey = `onboarding_seen_${courseId}`;
    const seenGlobal = localStorage.getItem(globalKey);
    const seenCourse = localStorage.getItem(flagKey);
    if (!seenGlobal || !seenCourse) {
      setShowOnboarding(true);
      if (!seenGlobal) localStorage.setItem(globalKey, '1');
      if (!seenCourse) localStorage.setItem(flagKey, '1');
    }
  };

  const getLessonStatus = (lesson: any) => {
    if (lesson.completed) return { label: 'Completed', color: 'success' as const };
    return { label: 'Not Started', color: 'default' as const };
  };

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 450);
    return () => clearTimeout(t);
  }, []);

  return (
    <Box>
      {/* Course Header */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 8 }}>
            {loading ? (
              <Box>
                <Box sx={{ height: 36, bgcolor: (t)=>t.palette.action.hover, borderRadius: 1, mb:2 }} />
                <Box sx={{ height: 18, width: '70%', bgcolor: (t)=>t.palette.action.hover, borderRadius: 1, mb:1 }} />
                <Box sx={{ height: 18, width: '50%', bgcolor: (t)=>t.palette.action.hover, borderRadius: 1, mb:3 }} />
              </Box>
            ) : (
              <>
                <Typography variant="h4" gutterBottom>
                  {course.title}
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                  {course.description}
                </Typography>
              </>
            )}

            <Box display="flex" alignItems="center" gap={2} sx={{ mb: 2 }}>
              <Avatar src={course.teacher.avatar}>
                {course.teacher.name.charAt(0)}
              </Avatar>
              <Box>
                <Typography variant="subtitle1">
                  {course.teacher.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {course.teacher.bio}
                </Typography>
              </Box>
            </Box>

            <Box display="flex" gap={2} flexWrap="wrap">
              <Chip icon={<People />} label={`${course.stats.enrolled} enrolled`} />
              <Chip icon={<Star />} label={`${course.stats.rating} rating`} />
              <Chip icon={<AccessTime />} label={course.stats.duration} />
              <Chip label={course.stats.level} color="primary" />
              <Chip label={course.stats.language} variant="outlined" />
            </Box>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <Box textAlign="center">
              {user?.role === 'student' && (
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<PlayArrow />}
                  onClick={handleEnroll}
                  disabled={enrolled}
                  fullWidth
                  sx={{ mb: 2 }}
                >
                  {enrolled ? 'Enrolled' : 'Enroll Now'}
                </Button>
              )}

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
                  value={enrolled ? 25 : 0}
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
                  {enrolled ? '25% complete' : 'Not enrolled'}
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Paper>
      <OnboardingDialog open={showOnboarding} onClose={() => setShowOnboarding(false)} />

      {/* Course Content */}
      <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
        Course Content
      </Typography>

      {loading ? (
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
        course.modules.map((module) => (
          <Card key={module.id} sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Module {module.order}: {module.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {module.description}
              </Typography>

              <Box>
                {module.lessons.map((lesson) => (
                  <Box key={lesson.id} sx={{ mb: 2 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                      <Box display="flex" alignItems="center" gap={2}>
                        <Book color="action" />
                        <Box>
                          <Typography variant="subtitle2">
                            Lesson {lesson.order}: {lesson.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {lesson.description}
                          </Typography>
                        </Box>
                      </Box>
                      <Box display="flex" alignItems="center" gap={2}>
                        <Chip
                          label={getLessonStatus(lesson).label}
                          color={getLessonStatus(lesson).color}
                          size="small"
                        />
                        <Typography variant="body2" color="text.secondary">
                          {lesson.duration}
                        </Typography>
                      </Box>
                    </Box>

                    {lesson.id !== module.lessons[module.lessons.length - 1].id && (
                      <Divider sx={{ mt: 2 }} />
                    )}
                  </Box>
                ))}
              </Box>

              <Box sx={{ mt: 2 }}>
                <Button
                  component={Link}
                  to={`/learn/${courseId}/${module.lessons[0].id}`}
                  variant="outlined"
                  startIcon={<PlayArrow />}
                  disabled={!enrolled}
                >
                  {enrolled ? 'Continue Module' : 'Enroll to Start'}
                </Button>
              </Box>
            </CardContent>
          </Card>
        ))
      )}

      {/* Course Stats */}
      <Grid container spacing={3} sx={{ mt: 2 }}>
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

