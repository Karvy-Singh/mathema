import { useQuery } from '@tanstack/react-query';
import { get } from '../api';
import { palette } from '../theme';
import { useT } from '../i18n';

const { NAVY, CARD, TEXT_MUTED } = palette;

type Health = {
  total: number;
  active: number;
  disabled: number;
  byPlatform: Array<{ platform: string; _count: number }>;
  recentSent: Array<{
    id: string; token: string; platform: string;
    appVersion: string | null; createdAt: string; lastSentAt: string | null;
    user: { email: string; name: string } | null;
  }>;
};

export default function Push() {
  const { t } = useT();
  const q = useQuery({ queryKey: ['admin-push'], queryFn: () => get<Health>('/admin/push/health') });
  const healthyPct = q.data && q.data.total > 0 ? Math.round((q.data.active / q.data.total) * 100) : 0;

  return (
    <div>
      <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0, marginBottom: 4 }}>{t('push.title')}</h1>
      <p style={{ color: TEXT_MUTED, marginTop: 0, marginBottom: 24, fontSize: 13 }}>
        {t('push.subtitle')}
      </p>

      {q.isLoading && <div style={{ color: TEXT_MUTED }}>{t('common.loading')}</div>}
      {q.data && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 24 }}>
            <Stat label={t('push.kpi.total')} value={q.data.total} accent={NAVY} />
            <Stat label={t('push.kpi.active')} value={q.data.active} accent="#5A8A45" sub={t('push.kpi.active.sub', { p: healthyPct })} />
            <Stat label={t('push.kpi.disabled')} value={q.data.disabled} accent="#C25E2E" sub={t('push.kpi.disabled.sub')} />
            <Stat label={t('push.kpi.platforms')} value={q.data.byPlatform.map((p) => `${p.platform}:${p._count}`).join(' · ') || '—'} accent="#C7791F" small />
          </div>

          <div style={{ backgroundColor: CARD, border: `1px solid ${NAVY}15`, borderRadius: 6, overflow: 'hidden' }}>
            <div style={{ padding: '10px 14px', fontSize: 10, letterSpacing: '0.18em', color: TEXT_MUTED, textTransform: 'uppercase', fontWeight: 600, backgroundColor: `${NAVY}08`, borderBottom: `1px solid ${NAVY}10` }}>
              {t('push.recent')}
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ backgroundColor: `${NAVY}05`, color: TEXT_MUTED }}>
                  <Th>User</Th><Th>Platform</Th><Th>App ver</Th>
                  <Th>Token</Th><Th align="right">Registered</Th><Th align="right">Last sent</Th>
                </tr>
              </thead>
              <tbody>
                {q.data.recentSent.length === 0 && (
                  <tr><td colSpan={6} style={{ padding: 20, textAlign: 'center', color: TEXT_MUTED }}>{t('push.empty')}</td></tr>
                )}
                {q.data.recentSent.map((t) => (
                  <tr key={t.id} style={{ borderTop: `1px solid ${NAVY}10` }}>
                    <Td>{t.user ? <span><b>{t.user.name}</b><span style={{ color: TEXT_MUTED, fontSize: 11 }}> · {t.user.email}</span></span> : '—'}</Td>
                    <Td mono>{t.platform}</Td>
                    <Td mono muted>{t.appVersion ?? '—'}</Td>
                    <Td mono muted style={{ fontSize: 11 }}>{t.token.slice(0, 18)}…</Td>
                    <Td align="right" mono muted>{new Date(t.createdAt).toISOString().slice(0, 10)}</Td>
                    <Td align="right" mono muted>{t.lastSentAt ? new Date(t.lastSentAt).toISOString().slice(0, 16).replace('T', ' ') : '—'}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

function Stat({ label, value, sub, accent, small }: any) {
  return (
    <div style={{
      padding: '18px 20px', backgroundColor: CARD, border: `1px solid ${NAVY}15`,
      borderRadius: 6, borderLeft: `3px solid ${accent}`,
    }}>
      <div style={{ fontSize: 10, letterSpacing: '0.18em', color: TEXT_MUTED, textTransform: 'uppercase', marginBottom: 8, fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: small ? 14 : 28, fontWeight: 700, color: accent, lineHeight: 1, marginBottom: 4, fontFamily: 'JetBrains Mono, monospace' }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: TEXT_MUTED }}>{sub}</div>}
    </div>
  );
}

function Th({ children, align }: any) {
  return <th style={{ padding: '10px 14px', textAlign: align ?? 'left', fontWeight: 600, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{children}</th>;
}
function Td({ children, align, mono, muted, style }: any) {
  return <td style={{
    padding: '10px 14px', textAlign: align ?? 'left',
    fontFamily: mono ? 'JetBrains Mono, monospace' : undefined,
    color: muted ? TEXT_MUTED : NAVY,
    whiteSpace: 'nowrap',
    ...(style ?? {}),
  }}>{children}</td>;
}
