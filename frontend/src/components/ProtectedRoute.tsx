import { useAuth } from '../context/AuthContext';
import { useT } from '../lib/i18n';

export default function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { user, ready } = useAuth();
  const { t } = useT();
  if (!ready) return <FullPageMessage text={t('common.loading')} />;
  // 데모 모드: 자동 로그인이 실패하면 백엔드 연결 안내 메시지를 그대로 표시.
  if (!user) return <FullPageMessage text={t('demo.backendDown')} />;
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
