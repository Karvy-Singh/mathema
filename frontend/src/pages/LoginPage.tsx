import { FormEvent, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useT } from '../lib/i18n';

const GOOGLE_CLIENT_ID = (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID ?? '';

export default function LoginPage() {
  const { login, loginWithGoogle } = useAuth();
  const { t, lang, setLang } = useT();
  const [email, setEmail] = useState('polopot123@gmail.com');
  const [password, setPassword] = useState('password1234');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const gsiRef = useRef<HTMLDivElement | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErr(null); setBusy(true);
    try { await login(email, password); }
    catch (e: any) { setErr(e?.response?.data?.error?.message ?? t('auth.login.failed')); }
    finally { setBusy(false); }
  };

  // Google Identity Services — VITE_GOOGLE_CLIENT_ID 가 설정된 경우만 활성화.
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || !gsiRef.current) return;
    const init = () => {
      const g = (window as any).google;
      if (!g?.accounts?.id) return;
      g.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: async (resp: { credential: string }) => {
          setErr(null); setBusy(true);
          try { await loginWithGoogle(resp.credential); }
          catch (e: any) { setErr(e?.response?.data?.error?.message ?? 'Google sign-in failed'); }
          finally { setBusy(false); }
        },
      });
      g.accounts.id.renderButton(gsiRef.current, {
        theme: 'outline', size: 'large', width: 316, text: 'continue_with',
      });
    };
    if ((window as any).google?.accounts?.id) { init(); return; }
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client';
    s.async = true; s.defer = true;
    s.onload = init;
    document.body.appendChild(s);
  }, [loginWithGoogle]);

  return <AuthShell title={t('auth.login.title')} subtitle={t('app.brand') + ' ' + t('app.tagline')}>
    {/* 언어 토글 */}
    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 0, marginBottom: 12,
                  padding: 2, backgroundColor: '#14285008', borderRadius: 4, border: '1px solid #14285018', width: 'fit-content', marginLeft: 'auto' }}>
      {(['ko', 'en'] as const).map((l) => (
        <button key={l} type="button" onClick={() => setLang(l)} style={{
          padding: '4px 10px', fontSize: 11, fontWeight: 600,
          letterSpacing: '0.1em', textTransform: 'uppercase',
          backgroundColor: lang === l ? '#142850' : 'transparent',
          color: lang === l ? '#EFEBDF' : '#5C6B85',
          border: 'none', borderRadius: 3, cursor: 'pointer', fontFamily: 'JetBrains Mono, monospace',
        }}>{l === 'ko' ? 'KO' : 'EN'}</button>
      ))}
    </div>

    {/* Google Sign-In — VITE_GOOGLE_CLIENT_ID 설정 시 자동 노출 */}
    {GOOGLE_CLIENT_ID && (
      <>
        <div ref={gsiRef} style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <span style={{ flex: 1, height: 1, backgroundColor: '#14285018' }} />
          <span style={{ fontSize: 10, color: '#8B95AB', letterSpacing: '0.18em', textTransform: 'uppercase' }}>or</span>
          <span style={{ flex: 1, height: 1, backgroundColor: '#14285018' }} />
        </div>
      </>
    )}

    <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <Field label={t('auth.email')} type="email" value={email} onChange={setEmail} />
      <Field label={t('auth.password')} type="password" value={password} onChange={setPassword} />
      {err && <div style={{ color: '#C25E2E', fontSize: 13 }}>{err}</div>}
      <button disabled={busy} type="submit" style={btnPrimary}>{busy ? t('auth.login.busy') : t('auth.login.submit')}</button>
      <div style={{ textAlign: 'center', fontSize: 13, color: '#5C6B85' }}>
        {t('auth.login.noAccount')} <Link to="/register" style={{ color: '#142850', fontWeight: 600 }}>{t('auth.login.goRegister')}</Link>
      </div>
      <div style={{ textAlign: 'center', fontSize: 12, color: '#8B95AB', marginTop: -4 }}>
        <Link to="/forgot-password" style={{ color: '#5C6B85' }}>{t('forgot.title')}</Link>
      </div>
      {import.meta.env.DEV && (
        <div style={{ marginTop: 8, padding: 12, fontSize: 12, color: '#8B95AB', backgroundColor: '#14285008', borderRadius: 4 }}>
          {t('auth.seedHint')}
        </div>
      )}
    </form>
  </AuthShell>;
}

export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      backgroundColor: '#EFEBDF',
      fontFamily: '"Pretendard", -apple-system, sans-serif', color: '#142850',
    }}>
      <div style={{ width: 380, padding: 32, backgroundColor: '#F8F4E9', border: '1px solid #14285015', borderRadius: 4 }}>
        <div style={{ fontSize: 11, letterSpacing: '0.25em', color: '#8B95AB', textTransform: 'uppercase', marginBottom: 8 }}>{subtitle}</div>
        <h1 style={{ fontSize: 28, margin: 0, marginBottom: 24, fontWeight: 500, letterSpacing: '-0.02em' }}>{title}</h1>
        {children}
      </div>
    </div>
  );
}

export function Field({ label, type = 'text', value, onChange }: any) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={{ fontSize: 11, color: '#8B95AB', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{label}</span>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)}
        style={{ padding: '12px 14px', fontSize: 14, border: '1px solid #14285030', borderRadius: 4, backgroundColor: '#EFEBDF', outline: 'none', fontFamily: 'inherit' }} />
    </label>
  );
}

const btnPrimary: React.CSSProperties = {
  padding: '14px', backgroundColor: '#142850', color: '#EFEBDF',
  border: 'none', borderRadius: 4, fontSize: 14, fontWeight: 600,
  cursor: 'pointer', fontFamily: 'inherit',
};
