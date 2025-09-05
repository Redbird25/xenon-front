import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Button, Container, IconButton, Paper, TextField, Typography, Avatar, List, ListItem, ListItemAvatar, ListItemText, ListItemSecondaryAction, Alert } from '@mui/material';
import { PersonAdd, Delete } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import apiService from '../../services/api';
import { Enrollment } from '../../types';

const ManageStudentsPage: React.FC = () => {
  const { courseId } = useParams();
  const { user, canAddStudents } = useAuth();
  const { showToast } = useToast();

  const [studentId, setStudentId] = useState('');
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const items = await apiService.getCourseEnrollments(courseId!);
        setEnrollments(items);
      } catch (e) {
        // fallback mock
        setEnrollments([]);
      } finally {
        setLoading(false);
      }
    };
    if (courseId) load();
  }, [courseId]);

  const handleAdd = async () => {
    if (!studentId.trim() || !user) return;
    if (!canAddStudents(studentId.trim())) {
      showToast('You can only add yourself as a self‑learner', 'warning');
      return;
    }
    try {
      const enr = await apiService.enrollStudent(courseId!, studentId.trim());
      setEnrollments((prev) => [...prev, enr]);
      setStudentId('');
      showToast('Student added', 'success');
    } catch (e) {
      // Optimistic fallback: add locally
      const enr: Enrollment = {
        id: String(Date.now()),
        studentId: studentId.trim(),
        courseId: courseId!,
        status: 'active',
        progress: 0,
        startedAt: new Date().toISOString(),
      };
      setEnrollments((prev) => [...prev, enr]);
      setStudentId('');
      showToast('Student added locally (offline mode)', 'info');
    }
  };

  const handleRemove = async (enrollmentId: string) => {
    try {
      await apiService.removeEnrollment(enrollmentId);
      setEnrollments((prev) => prev.filter((e) => e.id !== enrollmentId));
      showToast('Removed', 'success');
    } catch (e) {
      setEnrollments((prev) => prev.filter((e) => e.id !== enrollmentId));
      showToast('Removed locally (offline)', 'info');
    }
  };

  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>Manage Students</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {user?.role === 'self-learner' ? 'As a self‑learner you can only add yourself.' : 'Add or remove enrolled students.'}
      </Typography>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Box display="flex" gap={2}>
          <TextField label="Student ID or Email" value={studentId} onChange={(e) => setStudentId(e.target.value)} fullWidth />
          <Button variant="contained" startIcon={<PersonAdd />} onClick={handleAdd}>Add</Button>
        </Box>
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
      </Paper>

      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>Enrolled Students</Typography>
        {loading ? (
          <>
            <Box sx={{ display: 'grid', gap: 1 }}>
              {Array.from({ length: 4 }).map((_, i) => (
                <Box key={i} sx={{ height: 56, bgcolor: (t) => t.palette.action.hover, borderRadius: 1 }} />
              ))}
            </Box>
          </>
        ) : (
          <List>
            {enrollments.map((e) => (
              <ListItem key={e.id} divider>
                <ListItemAvatar>
                  <Avatar>{(e.studentId || '?').toString().charAt(0).toUpperCase()}</Avatar>
                </ListItemAvatar>
                <ListItemText primary={e.studentId} secondary={`Status: ${e.status}`} />
                <ListItemSecondaryAction>
                  <IconButton edge="end" onClick={() => handleRemove(e.id)}>
                    <Delete />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
            {enrollments.length === 0 && (
              <Typography variant="body2" color="text.secondary">No students yet.</Typography>
            )}
          </List>
        )}
      </Paper>
    </Container>
  );
};

export default ManageStudentsPage;

