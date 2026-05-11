import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { get } from '../api';
import { palette } from '../theme';
import { useT } from '../i18n';

const { NAVY, TEAL, CARD, TEXT_MUTED } = palette;

type Insights = {
  windowDays: number;
  totalWrong: number;
  byType: Array<{ key: string; count: number; share: number }>;
  byStepType: Array<{ key: string; count: number }>;
  byUnit: Array<{ unit: string; total: number; byType: Record<string, number> }>;
  topDistractors: Array<{
    choiceId: string; text: string; distractorType: string | null; rationale: string | null;
    unit: string; source: string; stepType: string; count: number;
  }>;
};

const TYPE_COLORS: Record<string, string> = {
  CONCEPT_CONFUSION:   '#C25E2E',
  CALC_ERROR:          '#C7791F',
  PROCESS_SKIP:        '#5A8A45',
  TIME_PRESSURE_GUESS: '#142850',
  UNCLASSIFIED:        '#8B95AB',
};

export default function Insights() {
  const { t, lang } = useT();
  const [days, setDays] = useState(30);
  const q = useQuery({ queryKey: ['admin-insights', days, lang], queryFn: () => get<Insights>('/admin/insights/distractors', { days }) });

  return (
    <div>
      <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0, marginBottom: 4 }}>{t('insights.title')}</h1>
      <p style={{ color: TEXT_MUTED, marginTop: 0, marginBottom: 16, fontSize: 13 }}>
        {t('insights.subtitle', { d: days, n: q.data?.totalWrong ?? 0 })}
      </p>

      <div style={{ marginBottom: 20, display: 'flex', gap: 6 }}>
        {[7, 30, 90].map((d) => (
          <button key={d} onClick={() => setDays(d)} style={{
            padding: '6px 12px', fontSize: 12, fontFamily: 'JetBrains Mono, monospace',
            backgroundColor: days === d ? NAVY : 'transparent',
            color: days === d ? '#EFEBDF' : TEXT_MUTED,
            border: `1px solid ${days === d ? NAVY : NAVY + '30'}`,
            borderRadius: 4, cursor: 'pointer',
          }}>{d}d</button>
        ))}
      </div>

      {q.isLoading && <div style={{ color: TEXT_MUTED }}>{t('common.loading')}</div>}
      {q.data && q.data.totalWrong === 0 && (
        <div style={{ padding: 24, textAlign: 'center', color: TEXT_MUTED, backgroundColor: CARD, border: `1px solid ${NAVY}15`, borderRadius: 6 }}>
          {t('insights.empty')}
        </div>
      )}

      {q.data && q.data.totalWrong > 0 && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
            <Card title={t('insights.byType')}>
              {q.data.byType.map((t) => (
                <div key={t.key} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: TYPE_COLORS[t.key] ?? NAVY }}>{t.key}</span>
                    <span style={{ fontSize: 11, color: TEXT_MUTED, fontFamily: 'JetBrains Mono, monospace' }}>{t.count} ({t.share}%)</span>
                  </div>
                  <div style={{ height: 6, backgroundColor: `${NAVY}10`, borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${t.share}%`, backgroundColor: TYPE_COLORS[t.key] ?? NAVY, transition: 'width 0.3s' }} />
                  </div>
                </div>
              ))}
            </Card>
            <Card title={t('insights.byUnit')}>
              {q.data.byUnit.slice(0, 8).map((u) => (
                <div key={u.unit} style={{ marginBottom: 10, fontSize: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                    <span style={{ fontWeight: 600 }}>{u.unit}</span>
                    <span style={{ color: TEXT_MUTED, fontFamily: 'JetBrains Mono, monospace' }}>{u.total} wrong</span>
                  </div>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {Object.entries(u.byType).map(([k, v]) => (
                      <span key={k} style={{
                        padding: '1px 6px', fontSize: 10,
                        backgroundColor: `${TYPE_COLORS[k] ?? NAVY}25`,
                        color: TYPE_COLORS[k] ?? NAVY,
                        borderRadius: 2, fontFamily: 'JetBrains Mono, monospace', fontWeight: 600,
                      }}>{k.slice(0, 8)}:{v}</span>
                    ))}
                  </div>
                </div>
              ))}
            </Card>
          </div>

          {/* 가장 많이 선택된 distractor 보기들 — 콘텐츠 검수 */}
          <Card title={t('insights.top')}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ backgroundColor: `${NAVY}08`, color: TEXT_MUTED }}>
                  <Th>{t('insights.col.source')}</Th><Th>{t('insights.col.step')}</Th><Th>{t('insights.col.type')}</Th>
                  <Th>{t('insights.col.text')}</Th><Th>{t('insights.col.rationale')}</Th><Th align="right">{t('insights.col.picks')}</Th>
                </tr>
              </thead>
              <tbody>
                {q.data.topDistractors.map((d) => (
                  <tr key={d.choiceId} style={{ borderTop: `1px solid ${NAVY}10` }}>
                    <Td muted style={{ fontSize: 11 }}>{d.source}</Td>
                    <Td mono muted>{d.stepType}</Td>
                    <Td><span style={{ padding: '1px 6px', fontSize: 10, backgroundColor: `${TYPE_COLORS[d.distractorType ?? ''] ?? NAVY}25`, color: TYPE_COLORS[d.distractorType ?? ''] ?? NAVY, borderRadius: 2, fontFamily: 'JetBrains Mono, monospace', fontWeight: 600 }}>{d.distractorType ?? '?'}</span></Td>
                    <Td mono style={{ maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.text}</Td>
                    <Td muted style={{ maxWidth: 280, fontSize: 11, whiteSpace: 'normal' }}>{d.rationale ?? '—'}</Td>
                    <Td align="right" mono>{d.count}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </>
      )}
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
function Th({ children, align }: any) {
  return <th style={{ padding: '10px 14px', textAlign: align ?? 'left', fontWeight: 600, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{children}</th>;
}
function Td({ children, align, mono, muted, accent, style }: any) {
  return <td style={{
    padding: '10px 14px', textAlign: align ?? 'left',
    fontFamily: mono ? 'JetBrains Mono, monospace' : undefined,
    color: accent ?? (muted ? TEXT_MUTED : NAVY),
    ...(style ?? {}),
  }}>{children}</td>;
}
