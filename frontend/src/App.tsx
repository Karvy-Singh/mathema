import { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import MathLearningApp from './pages/MathLearningApp';
import ProtectedRoute from './components/ProtectedRoute';
import { ToastHost } from './components/Toast';
import { trackPageView } from './lib/analytics';

function PageViewTracker() {
  const location = useLocation();
  useEffect(() => {
    trackPageView(location.pathname + location.search);
  }, [location.pathname, location.search]);
  return null;
}

export default function App() {
  // 데모 모드 — 로그인/회원가입 화면 생략. 모든 경로를 대시보드로 모음.
  return (
    <>
      <PageViewTracker />
      <Routes>
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
      <ToastHost />
    </>
  );
}
