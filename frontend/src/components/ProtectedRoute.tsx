import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { user, ready } = useAuth();
  if (!ready) return <FullPageMessage text="불러오는 중..." />;
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
