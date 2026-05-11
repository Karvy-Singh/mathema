import { FormEvent, useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { post } from '../lib/api';
import { useT } from '../lib/i18n';
import { AuthShell, Field } from './LoginPage';

export default function ResetPasswordPage() {
  const { t } = useT();
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const navigate = useNavigate();
  const [pw, setPw] = useState('');
  const [confirm, setConfirm] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (pw.length < 8) { setErr(t('settings.new')); return; }
    if (pw !== confirm) { setErr(t('settings.passwordMismatch')); return; }
    setBusy(true);
    try {
      await post('/auth/reset-password', { token, password: pw });
      setDone(true);
      setTimeout(() => navigate('/login'), 1500);
    } catch (e: any) {
      setErr(e?.response?.data?.error?.message ?? t('reset.invalidToken'));
    } finally { setBusy(false); }
  };

  if (!token) {
    return (
      <AuthShell title={t('reset.title')} subtitle={t('app.brand')}>
        <div style={{ padding: 14, fontSize: 13, color: '#C25E2E', backgroundColor: '#C25E2E15', borderRadius: 4 }}>
          {t('reset.invalidToken')}
        </div>
        <div style={{ marginTop: 12, textAlign: 'center' }}>
          <Link to="/login" style={{ color: '#142850', fontWeight: 600, fontSize: 13 }}>{t('forgot.backToLogin')}</Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell title={t('reset.title')} subtitle={t('app.brand')}>
      {done ? (
        <div style={{ padding: 14, fontSize: 13, color: '#142850', backgroundColor: '#5A8A4520', borderRadius: 4 }}>
          {t('reset.success')}
        </div>
      ) : (
        <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label={t('reset.password')} type="password" value={pw} onChange={setPw} />
          <Field label={t('reset.confirm')} type="password" value={confirm} onChange={setConfirm} />
          {err && <div style={{ color: '#C25E2E', fontSize: 13 }}>{err}</div>}
          <button disabled={busy} type="submit" style={{
            padding: '14px', backgroundColor: '#142850', color: '#EFEBDF',
            border: 'none', borderRadius: 4, fontSize: 14, fontWeight: 600, cursor: 'pointer',
          }}>{busy ? t('auth.login.busy') : t('reset.submit')}</button>
        </form>
      )}
    </AuthShell>
  );
}
