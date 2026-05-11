import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { get } from '../api';
import { palette } from '../theme';
import { useT, gradeLabel } from '../i18n';

const { NAVY, CARD, TEXT_MUTED } = palette;

type Row = {
  id: string; email: string; name: string;
  examDate: string; targetGrade: number; gradeLevel: string | null;
  createdAt: string; updatedAt: string;
  attemptsTotal: number; attemptsCorrect: number; accuracy: number;
  masteryAvg: number | null; masteryCount: number;
  wrongNotesTotal: number; wrongNotesMastered: number;
  mockExamCount: number; mockExamAvgScore: number | null;
  lastActivityAt: string | null;
};

export default function Users() {
  const { t, lang } = useT();
  const q = useQuery({ queryKey: ['admin-users'], queryFn: () => get<Row[]>('/admin/users', { limit: 100 }) });

  return (
    <div>
      <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0, marginBottom: 4 }}>{t('users.title')}</h1>
      <p style={{ color: TEXT_MUTED, marginTop: 0, marginBottom: 24, fontSize: 13 }}>
        {t('users.subtitle', { n: q.data?.length ?? 0 })}
      </p>

      <div style={{ backgroundColor: CARD, border: `1px solid ${NAVY}15`, borderRadius: 6, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ backgroundColor: `${NAVY}08`, color: TEXT_MUTED }}>
              <Th>{t('users.col.name')}</Th><Th>{t('users.col.email')}</Th><Th>{t('users.col.grade')}</Th>
              <Th align="right">{t('users.col.attempts')}</Th>
              <Th align="right">{t('users.col.accuracy')}</Th>
              <Th align="right">{t('users.col.mastery')}</Th>
              <Th align="right">{t('users.col.wrong')}</Th>
              <Th align="right">{t('users.col.mock')}</Th>
              <Th align="right">{t('users.col.last')}</Th>
            </tr>
          </thead>
          <tbody>
            {q.isLoading && (<tr><td colSpan={9} style={{ padding: 24, textAlign: 'center', color: TEXT_MUTED }}>{t('common.loading')}</td></tr>)}
            {q.data?.map((u) => (
              <tr key={u.id} style={{ borderTop: `1px solid ${NAVY}10` }}>
                <Td><Link to={`/users/${u.id}`} style={{ color: NAVY, textDecoration: 'none', fontWeight: 600 }}>{u.name}</Link></Td>
                <Td muted>{u.email}</Td>
                <Td>{u.gradeLevel ? gradeLabel(u.gradeLevel, lang) : '—'}</Td>
                <Td align="right" mono>{u.attemptsTotal.toLocaleString()}</Td>
                <Td align="right" mono accent={u.accuracy >= 80 ? '#5A8A45' : u.accuracy >= 60 ? '#C7791F' : '#C25E2E'}>{u.accuracy}%</Td>
                <Td align="right" mono>{u.masteryAvg != null ? `${u.masteryAvg}%` : '—'}<span style={{ color: TEXT_MUTED, fontSize: 10 }}> ({u.masteryCount})</span></Td>
                <Td align="right" mono>{u.wrongNotesTotal} <span style={{ color: '#5A8A45', fontSize: 10 }}>({u.wrongNotesMastered}✓)</span></Td>
                <Td align="right" mono>{u.mockExamCount > 0 ? `${u.mockExamCount} (${u.mockExamAvgScore ?? '–'}점)` : '—'}</Td>
                <Td align="right" mono muted>{u.lastActivityAt ? new Date(u.lastActivityAt).toISOString().slice(0, 10) : '—'}</Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Th({ children, align }: any) {
  return <th style={{ padding: '10px 14px', textAlign: align ?? 'left', fontWeight: 600, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{children}</th>;
}
function Td({ children, align, mono, muted, accent }: any) {
  return <td style={{
    padding: '10px 14px', textAlign: align ?? 'left',
    fontFamily: mono ? 'JetBrains Mono, monospace' : undefined,
    color: accent ?? (muted ? TEXT_MUTED : NAVY),
    whiteSpace: 'nowrap',
  }}>{children}</td>;
}
