import { lazy, Suspense, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import { ToastHost } from './components/Toast';
import { trackPageView } from './lib/analytics';

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
            path="/"
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
