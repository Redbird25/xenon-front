import React from 'react';
import { useParams, useLocation } from 'react-router-dom';
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

const CourseDetailPage: React.FC = () => {
  const { courseId } = useParams();
  const { user } = useAuth();
  const location = useLocation() as any;
  const { showToast } = useToast();

  const { data: course, isLoading } = useQuery<BackendCourse>({
    queryKey: ['course_detail', courseId],
    queryFn: () => api.getCourseById(courseId || ''),
    enabled: !!courseId,
    staleTime: 120000,
    refetchOnWindowFocus: false,
  });

  const teacherName: string = location?.state?.teacher || course?.ownerUserId || 'Instructor';

  // no-op helpers for now

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
                  value={0}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    mb: 1,
                    '& .MuiLinearProgress-bar': {
                      backgroundImage: 'linear-gradient(90deg, #7C3AED, #00E5FF)'
                    }
                  }}
                />
                <Typography variant="body2" color="text.secondary">Not started</Typography>
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
                        <Button size="small" variant="outlined" startIcon={<PlayArrow />} disabled>
                          Start
                        </Button>
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

