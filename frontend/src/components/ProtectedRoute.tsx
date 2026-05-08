import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useT } from '../lib/i18n';

export default function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { user, ready } = useAuth();
  const { t } = useT();
  if (!ready) return <FullPageMessage text={t('common.loading')} />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function FullPageMessage({ text }: { text: string }) {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', color: '#6B6354', backgroundColor: '#F2EDE2',
      fontFamily: '"Pretendard", -apple-system, sans-serif',
    }}>{text}</div>
  );
}
