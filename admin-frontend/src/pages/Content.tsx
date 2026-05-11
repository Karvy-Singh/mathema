import { useQuery } from '@tanstack/react-query';
import { get } from '../api';
import { palette } from '../theme';
import { useT, gradeLabel } from '../i18n';

const { NAVY, CARD, TEXT_MUTED } = palette;

type Coverage = {
  units: Array<{
    unitId: string; unitName: string; gradeLevels: string[]; order: number;
    problems: number; stepped: number; withConcept: number; withFormula: number;
    byDifficulty: Record<string, number>; gapToTarget: number;
  }>;
  summary: Array<{ grade: string; units: number; problems: number; stepped: number; target: number; coverage: number }>;
};

export default function Content() {
  const { t, lang } = useT();
  const q = useQuery({ queryKey: ['admin-coverage', lang], queryFn: () => get<Coverage>('/admin/content/coverage') });

  if (q.isLoading) return <div style={{ color: TEXT_MUTED }}>{t('common.loading')}</div>;
  if (q.isError || !q.data) return <div style={{ color: '#C25E2E' }}>{t('common.failed')}</div>;
  const d = q.data;

  return (
    <div>
      <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0, marginBottom: 4 }}>{t('content.title')}</h1>
      <p style={{ color: TEXT_MUTED, marginTop: 0, marginBottom: 24, fontSize: 13 }}>
        {t('content.subtitle')}
      </p>

      {/* 학년별 요약 — bar chart 대신 progress bar + 숫자 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginBottom: 28 }}>
        {d.summary.map((s) => {
          const tone = s.coverage >= 80 ? '#5A8A45' : s.coverage >= 40 ? '#C7791F' : '#C25E2E';
          return (
            <div key={s.grade} style={{
              padding: 16, backgroundColor: CARD, border: `1px solid ${NAVY}15`,
              borderRadius: 6, borderLeft: `3px solid ${tone}`,
            }}>
              <div style={{ fontSize: 10, letterSpacing: '0.18em', color: TEXT_MUTED, textTransform: 'uppercase', marginBottom: 6 }}>
                {gradeLabel(s.grade, lang)}
              </div>
              <div style={{ fontSize: 24, fontWeight: 700, color: tone, lineHeight: 1, marginBottom: 4 }}>
                {s.problems} <span style={{ fontSize: 12, color: TEXT_MUTED, fontWeight: 500 }}>/ {s.target}</span>
              </div>
              <div style={{ fontSize: 11, color: TEXT_MUTED, marginBottom: 8 }}>
                {t('content.units', { n: s.units })} · {t('content.stepped', { n: s.stepped })}
              </div>
              <div style={{ height: 6, backgroundColor: `${NAVY}10`, borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${Math.min(100, s.coverage)}%`, backgroundColor: tone, transition: 'width 0.3s' }} />
              </div>
              <div style={{ fontSize: 11, color: tone, fontWeight: 600, marginTop: 4, fontFamily: 'JetBrains Mono, monospace' }}>
                {t('content.coveragePct', { p: s.coverage })}
              </div>
            </div>
          );
        })}
      </div>

      {/* 단원별 상세 — 갭이 큰 순서로 정렬 */}
      <div style={{ backgroundColor: CARD, border: `1px solid ${NAVY}15`, borderRadius: 6, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ backgroundColor: `${NAVY}08`, color: TEXT_MUTED }}>
              <Th>{t('content.col.grade')}</Th><Th>{t('content.col.unit')}</Th>
              <Th align="right">{t('content.col.problems')}</Th>
              <Th align="right">{t('content.col.stepped')}</Th>
              <Th align="right">{t('content.col.concept')}</Th>
              <Th align="right">{t('content.col.formula')}</Th>
              <Th align="right">{t('content.col.diff')}</Th>
              <Th align="right">{t('content.col.gap')}</Th>
            </tr>
          </thead>
          <tbody>
            {[...d.units]
              .sort((a, b) => b.gapToTarget - a.gapToTarget)
              .map((u) => {
                const grades = u.gradeLevels.map((g) => gradeLabel(g, lang)).join(' / ') || '—';
                const diffMix = Object.entries(u.byDifficulty)
                  .map(([k, v]) => `${k.slice(0, 3)}:${v}`).join(' · ') || '—';
                const gapTone = u.gapToTarget === 0 ? '#5A8A45' : u.gapToTarget >= 15 ? '#C25E2E' : '#C7791F';
                return (
                  <tr key={u.unitId} style={{ borderTop: `1px solid ${NAVY}10` }}>
                    <Td muted>{grades}</Td>
                    <Td>{u.unitName}</Td>
                    <Td align="right" mono>{u.problems}</Td>
                    <Td align="right" mono accent={u.stepped < u.problems ? '#C7791F' : '#5A8A45'}>{u.stepped}</Td>
                    <Td align="right" mono>{u.withConcept}</Td>
                    <Td align="right" mono>{u.withFormula}</Td>
                    <Td align="right" mono muted style={{ fontSize: 11 }}>{diffMix}</Td>
                    <Td align="right" mono accent={gapTone}>{u.gapToTarget === 0 ? '✓' : `+${u.gapToTarget}`}</Td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
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
    whiteSpace: 'nowrap',
    ...(style ?? {}),
  }}>{children}</td>;
}
