import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { post, del, downloadExport, tokens } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useT } from '../lib/i18n';
import { toast } from '../components/Toast';

const NAVY = '#142850';
const BG = '#EFEBDF';
const CARD = '#F8F4E9';
const TEXT_MUTED = '#5C6B85';
const DANGER = '#C25E2E';
const OK = '#5A8A45';

export default function SettingsPage() {
  const { t } = useT();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', backgroundColor: BG, fontFamily: '"Pretendard", -apple-system, sans-serif', color: NAVY }}>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 24 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>{t('settings.title')}</h1>
          <button onClick={() => navigate('/')} style={linkBtn}>{t('common.close')}</button>
        </div>
        {user && (
          <div style={{ fontSize: 13, color: TEXT_MUTED, marginBottom: 28 }}>
            <strong style={{ color: NAVY }}>{user.name}</strong> · {user.email}
          </div>
        )}

        <Section title={t('settings.section.account')}>
          <ChangePasswordForm />
          <ResendVerification />
        </Section>

        <Section title={t('settings.section.data')}>
          <ExportData />
        </Section>

        <Section title={t('settings.section.danger')} tone={DANGER}>
          <DeleteAccount onDeleted={() => { tokens.clear(); navigate('/login'); }} />
          <div style={{ marginTop: 12 }}>
            <button onClick={logout} style={{ ...linkBtn, color: TEXT_MUTED }}>{t('nav.logout')}</button>
          </div>
        </Section>
      </div>
    </div>
  );
}

function Section({ title, tone, children }: { title: string; tone?: string; children: React.ReactNode }) {
  return (
    <section style={{
      backgroundColor: CARD, border: `1px solid ${(tone ?? NAVY) + '20'}`, borderRadius: 6,
      padding: 24, marginBottom: 20,
      borderLeft: `3px solid ${tone ?? NAVY}`,
    }}>
      <h2 style={{
        fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase',
        color: tone ?? TEXT_MUTED, margin: 0, marginBottom: 16, fontWeight: 600,
      }}>{title}</h2>
      {children}
    </section>
  );
}

function ChangePasswordForm() {
  const { t } = useT();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (next.length < 8) { setErr(t('settings.new')); return; }
    if (next !== confirm) { setErr(t('settings.passwordMismatch')); return; }
    setBusy(true);
    try {
      await post('/users/me/password', { current, next });
      toast(t('settings.passwordChanged'));
      setCurrent(''); setNext(''); setConfirm('');
    } catch (e: any) {
      setErr(e?.response?.data?.error?.message ?? t('auth.login.failed'));
    } finally { setBusy(false); }
  };

  return (
    <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <strong style={{ fontSize: 14 }}>{t('settings.changePassword')}</strong>
      <Input label={t('settings.current')} type="password" value={current} onChange={setCurrent} />
      <Input label={t('settings.new')} type="password" value={next} onChange={setNext} />
      <Input label={t('settings.confirmNew')} type="password" value={confirm} onChange={setConfirm} />
      {err && <div style={{ color: DANGER, fontSize: 12 }}>{err}</div>}
      <button disabled={busy} type="submit" style={{
        ...primaryBtn,
        opacity: busy || !current || !next ? 0.6 : 1,
        cursor: busy ? 'wait' : 'pointer',
        alignSelf: 'flex-start',
      }}>{busy ? t('auth.login.busy') : t('settings.changePassword')}</button>
    </form>
  );
}

function ResendVerification() {
  const { t } = useT();
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const onClick = async () => {
    setBusy(true);
    try {
      await post('/auth/resend-verification', {});
      setSent(true);
      toast(t('settings.verification.sent'));
    } catch {/* ignore */}
    finally { setBusy(false); }
  };
  return (
    <div style={{ marginTop: 20, paddingTop: 20, borderTop: `1px dashed ${NAVY}20` }}>
      <strong style={{ fontSize: 14 }}>{t('settings.verification.title')}</strong>
      <div style={{ marginTop: 8 }}>
        <button onClick={onClick} disabled={busy || sent} style={{ ...secondaryBtn, opacity: busy || sent ? 0.6 : 1 }}>
          {sent ? t('settings.verification.sent') : t('settings.verification.send')}
        </button>
      </div>
    </div>
  );
}

function ExportData() {
  const { t } = useT();
  const [busy, setBusy] = useState(false);
  const onClick = async () => {
    setBusy(true);
    try { await downloadExport(); }
    catch { /* ignore */ }
    finally { setBusy(false); }
  };
  return (
    <div>
      <p style={{ margin: 0, marginBottom: 12, fontSize: 13, color: TEXT_MUTED }}>{t('settings.exportHint')}</p>
      <button onClick={onClick} disabled={busy} style={{ ...primaryBtn, backgroundColor: OK }}>
        {busy ? t('settings.exporting') : t('settings.export')}
      </button>
    </div>
  );
}

function DeleteAccount({ onDeleted }: { onDeleted: () => void }) {
  const { t } = useT();
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState('');
  const [busy, setBusy] = useState(false);

  const onConfirm = async () => {
    if (typed !== t('settings.deleteConfirmInput')) return;
    setBusy(true);
    try {
      await del('/users/me');
      onDeleted();
    } catch { setBusy(false); }
  };

  return (
    <div>
      <p style={{ margin: 0, marginBottom: 12, fontSize: 13, color: TEXT_MUTED }}>{t('settings.deleteWarn')}</p>
      {!open ? (
        <button onClick={() => setOpen(true)} style={dangerBtn}>{t('settings.delete')}</button>
      ) : (
        <div style={{ padding: 14, backgroundColor: `${DANGER}10`, borderRadius: 4, border: `1px solid ${DANGER}40` }}>
          <strong style={{ color: DANGER, fontSize: 14, display: 'block', marginBottom: 8 }}>
            {t('settings.deleteConfirmTitle')}
          </strong>
          <p style={{ margin: 0, marginBottom: 10, fontSize: 12, color: TEXT_MUTED }}>
            {t('settings.deleteConfirmType')}
          </p>
          <input value={typed} onChange={(e) => setTyped(e.target.value)} placeholder={t('settings.deleteConfirmInput')}
            style={{ padding: '10px 12px', width: '100%', fontSize: 14, border: `1px solid ${DANGER}50`,
              borderRadius: 4, backgroundColor: BG, outline: 'none', fontFamily: 'JetBrains Mono, monospace' }} />
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <button onClick={() => { setOpen(false); setTyped(''); }} style={secondaryBtn}>
              {t('common.cancel')}
            </button>
            <button onClick={onConfirm} disabled={busy || typed !== t('settings.deleteConfirmInput')} style={{
              ...dangerBtn, opacity: typed !== t('settings.deleteConfirmInput') ? 0.4 : 1,
              cursor: busy ? 'wait' : 'pointer',
            }}>{t('settings.deleteCta')}</button>
          </div>
        </div>
      )}
    </div>
  );
}

function Input({ label, type, value, onChange }: any) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ fontSize: 11, color: TEXT_MUTED, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{label}</span>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)}
        style={{ padding: '10px 12px', fontSize: 14, border: `1px solid ${NAVY}30`,
          borderRadius: 4, backgroundColor: BG, outline: 'none', fontFamily: 'inherit' }} />
    </label>
  );
}

const primaryBtn: React.CSSProperties = {
  padding: '10px 16px', backgroundColor: NAVY, color: BG,
  border: 'none', borderRadius: 4, fontSize: 13, fontWeight: 600, cursor: 'pointer',
};
const secondaryBtn: React.CSSProperties = {
  padding: '10px 16px', backgroundColor: 'transparent', color: NAVY,
  border: `1px solid ${NAVY}30`, borderRadius: 4, fontSize: 13, fontWeight: 600, cursor: 'pointer',
};
const dangerBtn: React.CSSProperties = {
  padding: '10px 16px', backgroundColor: DANGER, color: BG,
  border: 'none', borderRadius: 4, fontSize: 13, fontWeight: 600, cursor: 'pointer',
};
const linkBtn: React.CSSProperties = {
  background: 'none', border: 'none', color: NAVY, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
};
