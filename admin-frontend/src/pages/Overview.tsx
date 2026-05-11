import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { get } from '../api';
import { palette } from '../theme';
import { useT, gradeLabel as glabel } from '../i18n';
import { Users, Brain, FileQuestion, Activity, TrendingUp, Bell, Globe } from 'lucide-react';

const { NAVY, TEAL, CREAM, CARD, TEXT_MUTED } = palette;

type Overview = {
  totalUsers: number; activeUsers7d: number; overallAccuracy: number;
  totalAttempts: number; attemptsLast7d: number; attemptsLast30d: number;
  totalProblems: number; totalUnits: number;
  totalWrongNotes: number; masteredWrongNotes: number;
  totalMockResults: number; totalAnalyticsEvents: number;
  recentSignups: Array<{ id: string; email: string; name: string; gradeLevel: string | null; createdAt: string }>;
};
type Dau = Array<{ date: string; dau: number }>;
type ByCountry = Array<{ country: string; _count: number }>;
type Coverage = { summary: Array<{ grade: string; problems: number; target: number; coverage: number }> };
type PushHealth = { total: number; active: number; disabled: number };

const COUNTRY_FLAG: Record<string, string> = {
  IN: '🇮🇳', KR: '🇰🇷', US: '🇺🇸', UK: '🇬🇧', AU: '🇦🇺', SG: '🇸🇬', GLOBAL: '🌐',
};

export default function Overview() {
  const { t, lang } = useT();
  const ov = useQuery({ queryKey: ['admin-overview'], queryFn: () => get<Overview>('/admin/overview') });
  const dau = useQuery({ queryKey: ['admin-dau'], queryFn: () => get<Dau>('/admin/dau', { days: 30 }) });
  const byCountry = useQuery({ queryKey: ['admin-by-country'], queryFn: () => get<ByCountry>('/admin/users-by-country') });
  const coverage = useQuery({ queryKey: ['admin-coverage-summary', lang], queryFn: () => get<Coverage>('/admin/content/coverage') });
  const push = useQuery({ queryKey: ['admin-push-overview'], queryFn: () => get<PushHealth>('/admin/push/health') });

  if (ov.isLoading) return <div style={{ color: TEXT_MUTED }}>{t('common.loading')}</div>;
  if (ov.isError || !ov.data) return <div style={{ color: '#C25E2E' }}>{t('common.failed')}</div>;
  const o = ov.data;

  return (
    <div>
      <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0, marginBottom: 4 }}>{t('ov.title')}</h1>
      <p style={{ color: TEXT_MUTED, marginTop: 0, marginBottom: 28, fontSize: 13 }}>
        {t('ov.subtitle')}
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 14, marginBottom: 28 }}>
        <Stat icon={Users}        label={t('ov.kpi.users')}     value={o.totalUsers}                    sub={t('ov.kpi.users.sub', { n: o.activeUsers7d })} accent={NAVY} />
        <Stat icon={TrendingUp}   label={t('ov.kpi.accuracy')}  value={`${o.overallAccuracy}%`}         sub={t('ov.kpi.accuracy.sub', { n: o.totalAttempts.toLocaleString() })} accent="#5A8A45" />
        <Stat icon={Activity}     label={t('ov.kpi.attempts')}  value={`${o.attemptsLast7d.toLocaleString()} / ${o.attemptsLast30d.toLocaleString()}`} sub={t('ov.kpi.attempts.sub')} accent={TEAL} />
        <Stat icon={FileQuestion} label={t('ov.kpi.problems')}  value={o.totalProblems}                 sub={t('ov.kpi.problems.sub', { n: o.totalUnits })} accent="#C7791F" />
        <Stat icon={Brain}        label={t('ov.kpi.wrong')}     value={o.totalWrongNotes}               sub={t('ov.kpi.wrong.sub', { n: o.masteredWrongNotes })} accent="#C25E2E" />
        <Stat icon={Bell}         label={t('ov.kpi.tokens')}    value={push.data?.active ?? 0}          sub={t('ov.kpi.tokens.sub', { n: push.data?.disabled ?? 0 })} accent={NAVY} />
      </div>

      {/* Phase 1 인도 launch 컨텍스트 — 국가 분포 + 콘텐츠 갭 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 28 }}>
        <Card title={t('ov.country')}>
          {(byCountry.data ?? []).map((c) => {
            const pct = o.totalUsers > 0 ? Math.round((c._count / o.totalUsers) * 100) : 0;
            return (
              <div key={c.country} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4, fontSize: 13 }}>
                  <span style={{ fontWeight: 600 }}>{COUNTRY_FLAG[c.country] ?? '🏳️'} {c.country}</span>
                  <span style={{ color: TEXT_MUTED, fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>{c._count.toLocaleString()} ({pct}%)</span>
                </div>
                <div style={{ height: 6, backgroundColor: `${NAVY}10`, borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, backgroundColor: TEAL }} />
                </div>
              </div>
            );
          })}
          <div style={{ marginTop: 14, padding: 10, fontSize: 11, color: TEXT_MUTED, backgroundColor: `${NAVY}08`, borderRadius: 4 }}>
            <Globe size={11} style={{ verticalAlign: -1, marginRight: 4 }} />
            {t('ov.country.note')}
          </div>
        </Card>

        <Card title={t('ov.coverage')}>
          {(coverage.data?.summary ?? []).map((s) => {
            const tone = s.coverage >= 80 ? '#5A8A45' : s.coverage >= 40 ? '#C7791F' : '#C25E2E';
            return (
              <div key={s.grade} style={{ marginBottom: 10, fontSize: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                  <span style={{ fontWeight: 600 }}>{glabel(s.grade, lang)}</span>
                  <span style={{ color: tone, fontFamily: 'JetBrains Mono, monospace', fontWeight: 600 }}>{s.problems}/{s.target} · {s.coverage}%</span>
                </div>
                <div style={{ height: 4, backgroundColor: `${NAVY}10`, borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${Math.min(100, s.coverage)}%`, backgroundColor: tone }} />
                </div>
              </div>
            );
          })}
          <Link to="/content" style={{ display: 'block', marginTop: 10, fontSize: 11, color: TEAL, fontWeight: 600, textDecoration: 'none' }}>
            {t('ov.coverage.full')}
          </Link>
        </Card>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 20 }}>
        <Card title={t('ov.dau')}>
          {dau.data && dau.data.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={dau.data}>
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: TEXT_MUTED }} interval={Math.max(1, Math.floor(dau.data.length / 8))} />
                <YAxis tick={{ fontSize: 10, fill: TEXT_MUTED }} />
                <Tooltip contentStyle={{ backgroundColor: CARD, border: `1px solid ${NAVY}20`, borderRadius: 4, fontSize: 12 }} />
                <Line type="monotone" dataKey="dau" stroke={TEAL} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ color: TEXT_MUTED, fontSize: 12, padding: 20 }}>{t('ov.dau.empty')}</div>
          )}
        </Card>

        <Card title={t('ov.signups')}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <tbody>
              {o.recentSignups.map((u) => (
                <tr key={u.id} style={{ borderBottom: `1px solid ${NAVY}10` }}>
                  <td style={{ padding: '10px 0', verticalAlign: 'top' }}>
                    <Link to={`/users/${u.id}`} style={{ color: NAVY, textDecoration: 'none', fontWeight: 600 }}>{u.name}</Link>
                    <div style={{ color: TEXT_MUTED, fontSize: 11 }}>{u.email}</div>
                  </td>
                  <td style={{ padding: '10px 0', textAlign: 'right', color: TEXT_MUTED, fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}>
                    {u.gradeLevel ? glabel(u.gradeLevel, lang) : '—'}
                    <div>{new Date(u.createdAt).toISOString().slice(0, 10)}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value, sub, accent }: any) {
  return (
    <div style={{
      padding: '18px 20px', backgroundColor: CARD, border: `1px solid ${NAVY}15`,
      borderRadius: 6, borderLeft: `3px solid ${accent}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, letterSpacing: '0.18em', color: TEXT_MUTED, textTransform: 'uppercase', marginBottom: 8 }}>
        <Icon size={12} />
        {label}
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, color: accent, lineHeight: 1, marginBottom: 4 }}>{value}</div>
      <div style={{ fontSize: 11, color: TEXT_MUTED }}>{sub}</div>
    </div>
  );
}

function Card({ title, children }: any) {
  return (
    <div style={{ backgroundColor: CARD, border: `1px solid ${NAVY}15`, borderRadius: 6, padding: 20 }}>
      <div style={{ fontSize: 11, letterSpacing: '0.18em', color: TEXT_MUTED, textTransform: 'uppercase', fontWeight: 600, marginBottom: 12 }}>{title}</div>
      {children}
    </div>
  );
}

// gradeLabel 은 ../i18n.tsx 의 glabel(g, lang) 으로 이전됨
