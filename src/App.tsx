import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline, Box } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeModeProvider } from './contexts/ThemeContext';
import { ToastProvider } from './contexts/ToastContext';
import { createXenonTheme } from './theme';

// Components
import Layout from './components/layout/Layout';
const LoginPage = React.lazy(() => import('./pages/auth/LoginPage'));
const DashboardPage = React.lazy(() => import('./pages/dashboard/DashboardPage'));
const CourseListPage = React.lazy(() => import('./pages/course/CourseListPage'));
const CourseDetailPage = React.lazy(() => import('./pages/course/CourseDetailPage'));
const StudentLessonPage = React.lazy(() => import('./pages/student/StudentLessonPage'));
const TeacherCourseCreatePage = React.lazy(() => import('./pages/teacher/TeacherCourseCreatePage'));
const TeacherCourseEditPage = React.lazy(() => import('./pages/teacher/TeacherCourseEditPage'));
const ManageStudentsPage = React.lazy(() => import('./pages/teacher/ManageStudentsPage'));

// Landing & marketing
const LandingPage = React.lazy(() => import('./pages/landing/LandingPage'));
const NotFoundPage = React.lazy(() => import('./pages/NotFoundPage'));
const RegisterPage = React.lazy(() => import('./pages/auth/RegisterPage'));
const PricingPage = React.lazy(() => import('./pages/marketing/PricingPage'));
const TrustPage = React.lazy(() => import('./pages/marketing/TrustPage'));
const FAQPage = React.lazy(() => import('./pages/marketing/FAQPage'));
const AdminTenantsPage = React.lazy(() => import('./pages/admin/AdminTenantsPage'));
const AdminSelfLearnersPage = React.lazy(() => import('./pages/admin/AdminSelfLearnersPage'));
const TenantUsersPage = React.lazy(() => import('./pages/manager/TenantUsersPage'));
const StudentOnboardingPage = React.lazy(() => import('./pages/student/StudentOnboardingPage'));
const StudentProfilePage = React.lazy(() => import('./pages/student/StudentProfilePage'));
import { AnimatePresence, motion } from 'framer-motion';
import PageLoader from './components/common/PageLoader';
import RouteProgressBar from './components/common/RouteProgressBar';
import OnboardingGate from './components/onboarding/OnboardingGate';
import { ProfileModalProvider, useProfileModal } from './contexts/ProfileModalContext';
import ProfileModal from './components/profile/ProfileModal';

// Query client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Protected Route component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <Box>Loading...</Box>;
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

// Role-based Route component
const RoleRoute: React.FC<{
  children: React.ReactNode;
  allowedRoles: string[]
}> = ({ children, allowedRoles }) => {
  const { user } = useAuth();

  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" />;
  }

  return <>{children}</>;
};

const AppShell: React.FC = () => {
  const [mode, setMode] = React.useState<'light' | 'dark'>(() =>
    (localStorage.getItem('xenon_theme_mode') as 'light' | 'dark') || 'dark'
  );
  const theme = React.useMemo(() => createXenonTheme(mode), [mode]);
  React.useEffect(() => {
    localStorage.setItem('xenon_theme_mode', mode);
    document.documentElement.setAttribute('data-color-scheme', mode);
  }, [mode]);

  const AnimatedRoutes: React.FC = () => {
    const location = useLocation();
    return (
      <Suspense fallback={<PageLoader /> }>
        <AnimatePresence mode="wait">
          <Routes location={location}>
            {/* Public routes */}
            <Route path="/landing" element={<motion.div key="landing" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}}><LandingPage /></motion.div>} />
            <Route path="/login" element={<motion.div key="login" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}}><LoginPage /></motion.div>} />
            <Route path="/register" element={<motion.div key="register" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}}><RegisterPage /></motion.div>} />
            <Route path="/pricing" element={<motion.div key="pricing" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}}><PricingPage /></motion.div>} />
            <Route path="/trust" element={<motion.div key="trust" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}}><TrustPage /></motion.div>} />
            <Route path="/faq" element={<motion.div key="faq" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}}><FAQPage /></motion.div>} />
            <Route path="/student/onboarding" element={<motion.div key="onboarding" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}}><StudentOnboardingPage /></motion.div>} />
            <Route path="/student/profile" element={<motion.div key="sprofile" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}}><StudentProfilePage /></motion.div>} />

            {/* Protected routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout onToggleMode={() => setMode((m) => (m === 'light' ? 'dark' : 'light'))} mode={mode} />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" />} />
              <Route path="dashboard" element={<motion.div key="dashboard" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}}><DashboardPage /></motion.div>} />
              <Route path="courses" element={<motion.div key="courses" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}}><CourseListPage /></motion.div>} />
              <Route path="courses/:courseId" element={<motion.div key="course-detail" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}}><CourseDetailPage /></motion.div>} />

              {/* Student routes */}
              <Route
                path="learn/:courseId/:lessonId"
                element={
                  <RoleRoute allowedRoles={["student","self-learner"]}>
                    <StudentLessonPage />
                  </RoleRoute>
                }
              />

              {/* Creator/Teacher routes */}
              <Route
                path="teacher/courses/create"
                element={
                  <RoleRoute allowedRoles={["teacher", "admin", "self-learner"]}>
                    <TeacherCourseCreatePage />
                  </RoleRoute>
                }
              />
              <Route
                path="teacher/courses/:courseId/edit"
                element={
                  <RoleRoute allowedRoles={["teacher", "admin", "self-learner"]}>
                    <TeacherCourseEditPage />
                  </RoleRoute>
                }
              />
              <Route
                path="manager/users"
                element={
                  <RoleRoute allowedRoles={["tenant-manager","admin"]}>
                    <TenantUsersPage />
                  </RoleRoute>
                }
              />
              <Route
                path="admin/tenants"
                element={
                  <RoleRoute allowedRoles={["admin"]}>
                    <AdminTenantsPage />
                  </RoleRoute>
                }
              />
              <Route
                path="admin/self-learners"
                element={
                  <RoleRoute allowedRoles={["admin"]}>
                    <AdminSelfLearnersPage />
                  </RoleRoute>
                }
              />
              <Route
                path="teacher/courses/:courseId/students"
                element={
                  <RoleRoute allowedRoles={["teacher", "admin", "self-learner"]}>
                    <ManageStudentsPage />
                  </RoleRoute>
                }
              />
            </Route>

            {/* 404 */}
            <Route path="*" element={<motion.div key="404" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}}><NotFoundPage /></motion.div>} />
          </Routes>
        </AnimatePresence>
      </Suspense>
    );
  };

  return (
    <ThemeModeProvider>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <ToastProvider>
        <ProfileModalProvider>
          <Router>
            <RouteProgressBar />
            <OnboardingGate />
            <ProfileModalHost />
            <AnimatedRoutes />
          </Router>
        </ProfileModalProvider>
        </ToastProvider>
      </ThemeProvider>
    </ThemeModeProvider>
  );
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;

const ProfileModalHost: React.FC = () => {
  const { open, closeProfile } = useProfileModal();
  return <ProfileModal open={open} onClose={closeProfile} />;
};
