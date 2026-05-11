import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useT } from '../lib/i18n';

export default function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { user, ready } = useAuth();
  const { t } = useT();
  const location = useLocation();
  if (!ready) return <FullPageMessage text={t('common.loading')} />;
  if (!user) {
    // 미인증 → /login 으로 (원래 경로 state 로 보존, 로그인 후 복귀).
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return children;
}

function FullPageMessage({ text }: { text: string }) {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', color: '#5C6B85', backgroundColor: '#EFEBDF',
      fontFamily: '"Pretendard", -apple-system, sans-serif',
    }}>{text}</div>
  );
}
