import { lazy, Suspense, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import { ToastHost } from './components/Toast';
import { trackPageView } from './lib/analytics';
import { useAuth } from './context/AuthContext';

/**
 * 명세서 §1 — 역할별 자동 라우팅.
 *   STUDENT → /student (Phase 4 신규 Dashboard, AI 처방 시스템 기반)
 *   PARENT  → /parent
 *   TEACHER → /teacher
 *   ADMIN   → /teacher
 *   (/app 옛 7탭 통합 화면은 직접 URL 입력으로만 접근)
 */
function RoleRedirect() {
  const { user } = useAuth();
  const role = (user as any)?.role as 'STUDENT' | 'PARENT' | 'TEACHER' | 'ADMIN' | undefined;
  if (role === 'PARENT')  return <Navigate to="/parent"  replace />;
  if (role === 'TEACHER' || role === 'ADMIN') return <Navigate to="/teacher" replace />;
  return <Navigate to="/student" replace />;
}

// 코드 스플리팅 — 페이지별 lazy import 로 초기 번들 경감.
// 인증·랜딩만 즉시 필요, 학습/설정은 인증 후에만 로드.
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));
const VerifyEmailPage = lazy(() => import('./pages/VerifyEmailPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const MathLearningApp = lazy(() => import('./pages/MathLearningApp'));
const ConceptHubPage = lazy(() => import('./pages/ConceptHubPage'));
const ConceptLessonPage = lazy(() => import('./pages/ConceptLessonPage'));
const StudentDashboardPage = lazy(() => import('./pages/StudentDashboardPage').then((m) => ({ default: m.StudentDashboardPage })));
const ParentDashboardPage  = lazy(() => import('./pages/ParentDashboardPage').then((m) => ({ default: m.ParentDashboardPage })));
const TeacherDashboardPage = lazy(() => import('./pages/TeacherDashboardPage').then((m) => ({ default: m.TeacherDashboardPage })));

function PageViewTracker() {
  const location = useLocation();
  useEffect(() => {
    trackPageView(location.pathname + location.search);
  }, [location.pathname, location.search]);
  return null;
}

function PageFallback() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      backgroundColor: '#EFEBDF', color: '#5C6B85',
      fontFamily: '"Pretendard", -apple-system, sans-serif', fontSize: 14,
    }}>—</div>
  );
}

export default function App() {
  return (
    <>
      <PageViewTracker />
      <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/learn"
            element={
              <ProtectedRoute>
                <ConceptHubPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/learn/:code"
            element={
              <ProtectedRoute>
                <ConceptLessonPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student"
            element={
              <ProtectedRoute>
                <StudentDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/parent"
            element={
              <ProtectedRoute>
                <ParentDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher"
            element={
              <ProtectedRoute>
                <TeacherDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <RoleRedirect />
              </ProtectedRoute>
            }
          />
          <Route
            path="/app"
            element={
              <ProtectedRoute>
                <MathLearningApp />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
      <ToastHost />
    </>
  );
}
