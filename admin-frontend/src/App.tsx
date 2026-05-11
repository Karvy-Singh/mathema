import { useState } from 'react';
import { Routes, Route, Link, NavLink, Navigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { tokens, login } from './api';
import { palette } from './theme';
import { useT } from './i18n';
import Overview from './pages/Overview';
import Users from './pages/Users';
import UserDetail from './pages/UserDetail';
import Events from './pages/Events';
import Content from './pages/Content';
import Insights from './pages/Insights';
import Push from './pages/Push';
import AuditLogs from './pages/AuditLogs';
import { LayoutDashboard, Users as UsersIcon, Activity, LogOut, BookOpen, Sparkles, Bell, ShieldCheck } from 'lucide-react';

const { NAVY, TEAL, CREAM, CARD, TEXT_MUTED } = palette;

export default function App() {
  const [authed, setAuthed] = useState<boolean>(!!tokens.get());

  if (!authed) return <LoginScreen onLogin={() => setAuthed(true)} />;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', backgroundColor: CREAM, color: NAVY }}>
      <Sidebar onLogout={() => { tokens.clear(); setAuthed(false); }} />
      <main style={{ flex: 1, padding: '40px 48px', maxWidth: 1280, margin: '0 auto', overflowX: 'hidden' }}>
        <Routes>
          <Route path="/" element={<Overview />} />
          <Route path="/content" element={<Content />} />
          <Route path="/insights" element={<Insights />} />
          <Route path="/users" element={<Users />} />
          <Route path="/users/:id" element={<UserDetail />} />
          <Route path="/push" element={<Push />} />
          <Route path="/events" element={<Events />} />
          <Route path="/audit" element={<AuditLogs />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

function Sidebar({ onLogout }: { onLogout: () => void }) {
  const { t, lang, setLang } = useT();
  const qc = useQueryClient();
  const items = [
    { to: '/', label: t('nav.overview'), Icon: LayoutDashboard, end: true },
    { to: '/content', label: t('nav.content'), Icon: BookOpen, end: false },
    { to: '/insights', label: t('nav.insights'), Icon: Sparkles, end: false },
    { to: '/users', label: t('nav.users'), Icon: UsersIcon, end: false },
    { to: '/push', label: t('nav.push'), Icon: Bell, end: false },
    { to: '/events', label: t('nav.events'), Icon: Activity, end: false },
    { to: '/audit',  label: t('nav.audit'),  Icon: ShieldCheck, end: false },
  ];
  return (
    <aside style={{
      width: 220, padding: '32px 20px', borderRight: `1px solid ${NAVY}18`,
      backgroundColor: CARD, position: 'sticky', top: 0, height: '100vh', boxSizing: 'border-box',
      display: 'flex', flexDirection: 'column', gap: 4,
    }}>
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24, textDecoration: 'none', color: NAVY }}>
        <img src="/matheo-logo.png" alt="matheo" style={{ height: 38, mixBlendMode: 'multiply' }} />
        <span style={{ fontSize: 11, letterSpacing: '0.22em', color: TEAL, textTransform: 'uppercase', fontWeight: 700 }}>{t('nav.adminBadge')}</span>
      </Link>

      {/* KO/EN 토글 */}
      <div style={{
        display: 'flex', gap: 0, marginBottom: 16,
        padding: 2, backgroundColor: `${NAVY}08`, borderRadius: 4,
        border: `1px solid ${NAVY}18`,
      }}>
        {(['ko', 'en'] as const).map((l) => (
          <button key={l} onClick={() => {
            setLang(l);
            // lang 바뀌면 백엔드 응답이 달라지므로 모든 admin-* 쿼리 invalidate
            qc.invalidateQueries({ predicate: (q) => String(q.queryKey[0] ?? '').startsWith('admin-') });
          }} style={{
            flex: 1, padding: '5px 8px', fontSize: 11, fontWeight: 600,
            letterSpacing: '0.1em', textTransform: 'uppercase',
            backgroundColor: lang === l ? NAVY : 'transparent',
            color: lang === l ? CREAM : TEXT_MUTED,
            border: 'none', borderRadius: 3, cursor: 'pointer',
            fontFamily: 'JetBrains Mono, monospace',
          }}>{l}</button>
        ))}
      </div>

      {items.map(({ to, label, Icon, end }) => (
        <NavLink key={to} to={to} end={end}
          style={({ isActive }) => ({
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 12px', borderRadius: 6,
            fontSize: 13, fontWeight: isActive ? 700 : 500,
            color: isActive ? NAVY : TEXT_MUTED,
            backgroundColor: isActive ? `${NAVY}10` : 'transparent',
            textDecoration: 'none', transition: 'all .15s',
          })}
        >
          <Icon size={16} />
          {label}
        </NavLink>
      ))}
      <div style={{ flex: 1 }} />
      <button onClick={onLogout} style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 12px', borderRadius: 6, fontSize: 13, color: TEXT_MUTED,
        background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
      }}>
        <LogOut size={16} /> {t('nav.logout')}
      </button>
    </aside>
  );
}

function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const { t, lang, setLang } = useT();
  const [email, setEmail] = useState('polopot123@gmail.com');
  const [password, setPassword] = useState('password1234');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null); setBusy(true);
    try { await login(email, password); onLogin(); }
    catch (e: any) { setErr(e?.response?.data?.error?.message ?? t('auth.signFailed')); }
    finally { setBusy(false); }
  };
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      backgroundColor: CREAM,
    }}>
      <form onSubmit={submit} style={{
        width: 380, padding: 32, backgroundColor: CARD, border: `1px solid ${NAVY}15`, borderRadius: 6,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <img src="/matheo-logo.png" alt="matheo" style={{ height: 36, mixBlendMode: 'multiply' }} />
            <span style={{ fontSize: 11, letterSpacing: '0.22em', color: TEAL, textTransform: 'uppercase', fontWeight: 700 }}>{t('nav.adminBadge')}</span>
          </div>
          <div style={{ display: 'flex', gap: 0, padding: 2, backgroundColor: `${NAVY}08`, borderRadius: 4, border: `1px solid ${NAVY}18` }}>
            {(['ko', 'en'] as const).map((l) => (
              <button key={l} type="button" onClick={() => setLang(l)} style={{
                padding: '3px 8px', fontSize: 10, fontWeight: 600, letterSpacing: '0.1em',
                backgroundColor: lang === l ? NAVY : 'transparent',
                color: lang === l ? CREAM : TEXT_MUTED,
                border: 'none', borderRadius: 3, cursor: 'pointer',
                fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase',
              }}>{l}</button>
            ))}
          </div>
        </div>
        <h1 style={{ fontSize: 22, margin: 0, marginBottom: 20, fontWeight: 600 }}>{t('auth.signIn')}</h1>
        <Field label={t('auth.email')} type="email" value={email} onChange={setEmail} />
        <Field label={t('auth.password')} type="password" value={password} onChange={setPassword} />
        {err && <div style={{ color: '#C25E2E', fontSize: 12, marginBottom: 10 }}>{err}</div>}
        <button disabled={busy} type="submit" style={{
          width: '100%', padding: 12, marginTop: 4,
          backgroundColor: NAVY, color: CREAM, border: 'none', borderRadius: 4,
          fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
          opacity: busy ? 0.6 : 1,
        }}>
          {busy ? t('auth.signing') : t('auth.signIn')}
        </button>
        <div style={{ marginTop: 14, padding: 10, fontSize: 11, color: TEXT_MUTED, backgroundColor: `${NAVY}08`, borderRadius: 4 }}>
          {t('auth.allowlist')}
        </div>
      </form>
    </div>
  );
}

function Field({ label, type = 'text', value, onChange }: any) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 12 }}>
      <span style={{ fontSize: 10, color: TEXT_MUTED, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{label}</span>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)}
        style={{ padding: '10px 12px', fontSize: 13, border: `1px solid ${NAVY}30`, borderRadius: 4, backgroundColor: CREAM, outline: 'none', fontFamily: 'inherit' }} />
    </label>
  );
}

