import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { get } from '../api';
import { palette } from '../theme';
import { useT, gradeLabel } from '../i18n';

const { NAVY, TEAL, CARD, TEXT_MUTED } = palette;

type Detail = {
  user: any;
  mastery: any[];
  recentAttempts: any[];
  wrongNotes: any[];
  mockResults: any[];
  dailyActivity: any[];
  weeklyReports: any[];
  recentEvents: any[];
};

const TABS = ['Mastery', 'Attempts', 'Wrong notes', 'Mock results', 'Activity', 'Events'] as const;
type Tab = typeof TABS[number];

export default function UserDetail() {
  const { id } = useParams<{ id: string }>();
  const { t, lang } = useT();
  const [tab, setTab] = useState<Tab>('Mastery');
  const q = useQuery({ queryKey: ['admin-user', id, lang], queryFn: () => get<Detail>(`/admin/users/${id}`), enabled: !!id });

  if (q.isLoading) return <div style={{ color: TEXT_MUTED }}>{t('common.loading')}</div>;
  if (q.isError || !q.data) return <div style={{ color: '#C25E2E' }}>{t('common.failed')}</div>;

  const d = q.data;
  return (
    <div>
      <Link to="/users" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: TEXT_MUTED, textDecoration: 'none', marginBottom: 12 }}>
        <ArrowLeft size={12} /> {t('ud.back')}
      </Link>

      <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0 }}>{d.user.name}</h1>
      <div style={{ color: TEXT_MUTED, fontSize: 13, marginBottom: 8 }}>{d.user.email}</div>
      <div style={{ display: 'flex', gap: 14, color: TEXT_MUTED, fontSize: 11, marginBottom: 24, fontFamily: 'JetBrains Mono, monospace' }}>
        <span>{lang === 'ko' ? '학년' : 'Grade'}: <b style={{ color: NAVY }}>{d.user.gradeLevel ? gradeLabel(d.user.gradeLevel, lang) : '—'}</b></span>
        <span>{t('ud.target')}: <b style={{ color: NAVY }}>{d.user.targetGrade}</b></span>
        <span>{t('ud.exam')}: <b style={{ color: NAVY }}>{new Date(d.user.examDate).toISOString().slice(0, 10)}</b></span>
        <span>{t('ud.joined')}: <b style={{ color: NAVY }}>{new Date(d.user.createdAt).toISOString().slice(0, 10)}</b></span>
      </div>

      <div style={{ display: 'flex', gap: 4, borderBottom: `1px solid ${NAVY}15`, marginBottom: 20 }}>
        {TABS.map((tk) => {
          const label = ({
            'Mastery': t('ud.tab.mastery'), 'Attempts': t('ud.tab.attempts'),
            'Wrong notes': t('ud.tab.wrong'), 'Mock results': t('ud.tab.mock'),
            'Activity': t('ud.tab.activity'), 'Events': t('ud.tab.events'),
          } as Record<string, string>)[tk];
          return (
            <button key={tk} onClick={() => setTab(tk)} style={{
              padding: '10px 14px', fontSize: 12, fontWeight: tab === tk ? 700 : 500,
              color: tab === tk ? NAVY : TEXT_MUTED,
              borderBottom: `2px solid ${tab === tk ? TEAL : 'transparent'}`,
              background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
              marginBottom: -1,
            }}>{label}</button>
          );
        })}
      </div>

      {tab === 'Mastery' && <MasteryTable rows={d.mastery} />}
      {tab === 'Attempts' && <AttemptsTable rows={d.recentAttempts} />}
      {tab === 'Wrong notes' && <WrongNotesTable rows={d.wrongNotes} />}
      {tab === 'Mock results' && <MockTable rows={d.mockResults} />}
      {tab === 'Activity' && <ActivityTable rows={d.dailyActivity} weeks={d.weeklyReports} />}
      {tab === 'Events' && <EventsTable rows={d.recentEvents} />}
    </div>
  );
}

function MasteryTable({ rows }: { rows: any[] }) {
  return (
    <Wrap>
      <table style={tStyle}>
        <thead><tr style={trH}><Th>Unit</Th><Th align="right">Score</Th><Th align="right">Updated</Th></tr></thead>
        <tbody>{rows.map((m) => (
          <tr key={m.id} style={trB}>
            <Td>{m.unit?.name}</Td>
            <Td align="right" mono accent={m.score >= 80 ? '#5A8A45' : m.score >= 60 ? '#C7791F' : '#C25E2E'}>{Math.round(m.score)}%</Td>
            <Td align="right" mono muted>{new Date(m.updatedAt).toISOString().slice(0, 10)}</Td>
          </tr>
        ))}</tbody>
      </table>
      {rows.length === 0 && <Empty>아직 mastery 기록이 없습니다.</Empty>}
    </Wrap>
  );
}

function AttemptsTable({ rows }: { rows: any[] }) {
  return (
    <Wrap>
      <table style={tStyle}>
        <thead><tr style={trH}>
          <Th>Time</Th><Th>Problem</Th><Th>Unit</Th>
          <Th align="right">Step</Th><Th align="right">Correct?</Th>
          <Th align="right">Confidence</Th><Th align="right">Distractor</Th>
        </tr></thead>
        <tbody>{rows.map((a) => (
          <tr key={a.id} style={trB}>
            <Td mono muted>{new Date(a.createdAt).toISOString().slice(0, 16).replace('T', ' ')}</Td>
            <Td>{a.problem?.source}</Td>
            <Td muted>{a.problem?.unit?.name}</Td>
            <Td align="right" mono>{a.stepIndex ?? '—'}</Td>
            <Td align="right" mono accent={a.isCorrect ? '#5A8A45' : '#C25E2E'}>{a.isCorrect ? '✓' : '✗'}</Td>
            <Td align="right" mono>{a.confidence != null ? `${a.confidence}%` : '—'}</Td>
            <Td align="right" mono muted>{a.choice?.distractorType ?? (a.isCorrect ? '—' : '?')}</Td>
          </tr>
        ))}</tbody>
      </table>
      {rows.length === 0 && <Empty>최근 attempts 없음.</Empty>}
    </Wrap>
  );
}

function WrongNotesTable({ rows }: { rows: any[] }) {
  return (
    <Wrap>
      <table style={tStyle}>
        <thead><tr style={trH}>
          <Th>Status</Th><Th>Source</Th><Th>Body (excerpt)</Th>
          <Th align="right">EF / Rep</Th><Th align="right">Next review</Th>
        </tr></thead>
        <tbody>{rows.map((w) => (
          <tr key={w.id} style={trB}>
            <Td mono accent={w.status === 'MASTERED' ? '#5A8A45' : w.status === 'PENDING' ? '#C7791F' : NAVY}>{w.status}</Td>
            <Td>{w.problem?.source}</Td>
            <Td muted style={{ maxWidth: 360, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{w.problem?.body?.slice(0, 80)}</Td>
            <Td align="right" mono>{(w.easinessFactor ?? 2.5).toFixed(2)} / {w.repetitionCount}</Td>
            <Td align="right" mono muted>{w.nextReviewAt ? new Date(w.nextReviewAt).toISOString().slice(0, 10) : '—'}</Td>
          </tr>
        ))}</tbody>
      </table>
      {rows.length === 0 && <Empty>오답노트 없음.</Empty>}
    </Wrap>
  );
}

function MockTable({ rows }: { rows: any[] }) {
  return (
    <Wrap>
      <table style={tStyle}>
        <thead><tr style={trH}>
          <Th>Exam</Th><Th>Type</Th><Th align="right">Score</Th>
          <Th align="right">Grade</Th><Th align="right">Percentile</Th>
          <Th align="right">Duration</Th><Th align="right">Taken at</Th>
        </tr></thead>
        <tbody>{rows.map((m) => (
          <tr key={m.id} style={trB}>
            <Td>{m.mockExam?.name}</Td>
            <Td muted>{m.mockExam?.type}</Td>
            <Td align="right" mono accent={m.score >= 80 ? '#5A8A45' : m.score >= 60 ? '#C7791F' : '#C25E2E'}>{m.score}</Td>
            <Td align="right" mono>{m.grade}</Td>
            <Td align="right" mono>{m.percentile}</Td>
            <Td align="right" mono>{m.durationMin}분</Td>
            <Td align="right" mono muted>{new Date(m.takenAt).toISOString().slice(0, 10)}</Td>
          </tr>
        ))}</tbody>
      </table>
      {rows.length === 0 && <Empty>응시 기록 없음.</Empty>}
    </Wrap>
  );
}

function ActivityTable({ rows, weeks }: { rows: any[]; weeks: any[] }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16 }}>
      <Wrap>
        <div style={subhead}>Daily activity (last 90 days)</div>
        <table style={tStyle}>
          <thead><tr style={trH}><Th>Date</Th><Th align="right">Min</Th><Th align="right">Problems</Th><Th align="right">Accuracy</Th><Th align="right">Intensity</Th></tr></thead>
          <tbody>{rows.map((d) => (
            <tr key={d.id} style={trB}>
              <Td mono muted>{new Date(d.date).toISOString().slice(0, 10)}</Td>
              <Td align="right" mono>{d.durationMin}</Td>
              <Td align="right" mono>{d.problemsSolved}</Td>
              <Td align="right" mono>{Math.round(d.accuracyPct)}%</Td>
              <Td align="right" mono>{d.intensity}</Td>
            </tr>
          ))}</tbody>
        </table>
        {rows.length === 0 && <Empty>활동 없음.</Empty>}
      </Wrap>
      <Wrap>
        <div style={subhead}>Weekly reports (last 12)</div>
        <table style={tStyle}>
          <thead><tr style={trH}><Th>Week</Th><Th align="right">Hours</Th><Th align="right">Problems</Th><Th align="right">Accuracy</Th><Th align="right">AI score</Th></tr></thead>
          <tbody>{weeks.map((w) => (
            <tr key={w.id} style={trB}>
              <Td mono>{w.isoWeek}</Td>
              <Td align="right" mono>{w.totalHours}h</Td>
              <Td align="right" mono>{w.problemsSolved}</Td>
              <Td align="right" mono>{Math.round(w.accuracyPct)}%</Td>
              <Td align="right" mono>{w.aiScore.toFixed(1)}</Td>
            </tr>
          ))}</tbody>
        </table>
        {weeks.length === 0 && <Empty>리포트 없음.</Empty>}
      </Wrap>
    </div>
  );
}

function EventsTable({ rows }: { rows: any[] }) {
  return (
    <Wrap>
      <table style={tStyle}>
        <thead><tr style={trH}><Th>Time</Th><Th>Type</Th><Th>Payload</Th><Th>Source</Th></tr></thead>
        <tbody>{rows.map((e) => (
          <tr key={e.id} style={trB}>
            <Td mono muted>{new Date(e.createdAt).toISOString().slice(0, 16).replace('T', ' ')}</Td>
            <Td><span style={{ padding: '2px 8px', backgroundColor: `${TEAL}20`, color: NAVY, borderRadius: 2, fontSize: 11, fontWeight: 600 }}>{e.eventType}</span></Td>
            <Td mono muted style={{ maxWidth: 420, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 11 }}>{JSON.stringify(e.payload)}</Td>
            <Td muted>{e.source ?? '—'}</Td>
          </tr>
        ))}</tbody>
      </table>
      {rows.length === 0 && <Empty>이벤트 없음.</Empty>}
    </Wrap>
  );
}

function Wrap({ children }: any) { return <div style={{ backgroundColor: CARD, border: `1px solid ${NAVY}15`, borderRadius: 6, overflow: 'hidden' }}>{children}</div>; }
function Empty({ children }: any) { return <div style={{ padding: 20, color: TEXT_MUTED, fontSize: 12 }}>{children}</div>; }
const tStyle: React.CSSProperties = { width: '100%', borderCollapse: 'collapse', fontSize: 12 };
const trH: React.CSSProperties = { backgroundColor: `${NAVY}08`, color: TEXT_MUTED };
const trB: React.CSSProperties = { borderTop: `1px solid ${NAVY}10` };
const subhead: React.CSSProperties = { padding: '10px 14px', fontSize: 10, letterSpacing: '0.18em', color: TEXT_MUTED, textTransform: 'uppercase', fontWeight: 600, backgroundColor: `${NAVY}08`, borderBottom: `1px solid ${NAVY}10` };

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
