import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { post } from '../lib/api';
import { useT } from '../lib/i18n';
import { AuthShell, Field } from './LoginPage';

export default function ForgotPasswordPage() {
  const { t } = useT();
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await post('/auth/forgot-password', { email });
      setSent(true);
    } catch {
      // 백엔드는 항상 200 반환 — 여기 도달은 네트워크 오류일 때만.
      setSent(true);
    } finally { setBusy(false); }
  };

  return (
    <AuthShell title={t('forgot.title')} subtitle={t('app.brand')}>
      {sent ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ padding: 14, fontSize: 13, color: '#142850', backgroundColor: '#5A8A4520', borderRadius: 4 }}>
            {t('forgot.sent')}
          </div>
          <Link to="/login" style={{ textAlign: 'center', color: '#142850', fontWeight: 600, fontSize: 13 }}>
            {t('forgot.backToLogin')}
          </Link>
        </div>
      ) : (
        <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <p style={{ margin: 0, fontSize: 13, color: '#5C6B85' }}>{t('forgot.hint')}</p>
          <Field label={t('auth.email')} type="email" value={email} onChange={setEmail} />
          <button disabled={busy || !email} type="submit" style={{
            padding: '14px', backgroundColor: '#142850', color: '#EFEBDF',
            border: 'none', borderRadius: 4, fontSize: 14, fontWeight: 600,
            cursor: busy ? 'wait' : 'pointer', opacity: busy || !email ? 0.6 : 1,
          }}>
            {busy ? t('auth.login.busy') : t('forgot.submit')}
          </button>
          <Link to="/login" style={{ textAlign: 'center', color: '#5C6B85', fontSize: 12 }}>
            {t('forgot.backToLogin')}
          </Link>
        </form>
      )}
    </AuthShell>
  );
}
