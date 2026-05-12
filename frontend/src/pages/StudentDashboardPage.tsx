/**
 * StudentDashboardPage — 명세서 §6 학생용 UI.
 *
 *   필수 컴포넌트 (명세서 순):
 *     1. 오늘의 다음 문제 (next-problem, 1개)
 *     2. Mastery 상태 카드 (concept 별, 상태 메시지 중심)
 *     3. AI mentor nudge (mentor-message)
 *     4. 최근 개선된 개념 (MasteryEvent UP trend)
 *     5. 반복 실수 패턴 (ACTIVE ErrorPattern)
 *     6. 유사문제 5개 (최근 오답 attempt 기준)
 *     7. 주간 요약 (WeeklyReport.studentSummary)
 *
 *   명세서 §1 학생용 UI 원칙:
 *     - 숫자보다 상태 메시지 중심
 *     - "경고" 보다 "코칭" 표현
 *     - 자기효능감 보호
 *     - 다음 목표 1개만 제시
 */

import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Target, TrendingUp, AlertCircle, BookOpen, CheckCircle2, ArrowRight } from 'lucide-react';
import { TopNav, NAV_TO_HASH, NavKey } from '../components/TopNav';
import {
  fetchConceptMastery, fetchActivePatterns, fetchNextProblem, fetchWeeklyList,
  fetchMentorMessage, fetchSimilarForAttempt,
  type ConceptMastery, type ErrorPatternRow, type NextProblemRec, type WeeklyReportListItem,
  type SimilarProblemRec,
} from '../lib/queries';
import { get } from '../lib/api';
import { useT } from '../lib/i18n';

const COLORS = {
  bg: '#EFEBDF', ink: '#142850', sub: '#5C6B85', line: '#14285020', card: '#FAF7EF',
  good: '#4A5D3A', warn: '#B45309', bad: '#8B3A1F', accent: '#C7791F',
};

/**
 * masteryScore → 상태 메시지 (명세서 §4-2: evidenceCount < 3 이면 단정 금지).
 *   evidenceCount 가 낮으면 "데이터 부족" 표시. 그 외엔 코칭 톤.
 */
function masteryStatusMessage(score: number, trend: string, evidenceCount: number): string {
  if (evidenceCount < 3) return '아직 데이터가 부족해요 (판단 보류)';
  if (score >= 85) return '거의 안정적이에요';
  if (score >= 70) return '잘 가고 있어요';
  if (score >= 50) return '조금 더 다지면 좋겠어요';
  if (score >= 30) return '개념 재학습이 도움돼요';
  if (trend === 'UP') return '서서히 올라가고 있어요';
  return '함께 한 번 더 살펴봐요';
}

function masteryStatusColor(score: number): string {
  if (score >= 80) return COLORS.good;
  if (score >= 60) return '#A4B574';
  if (score >= 40) return COLORS.accent;
  return COLORS.bad;
}

export function StudentDashboardPage({ embedded = false }: { embedded?: boolean } = {}) {
  const { lang } = useT();
  const navigate = useNavigate();

  const mastery   = useQuery({ queryKey: ['student','mastery'],   queryFn: fetchConceptMastery });
  const patterns  = useQuery({ queryKey: ['student','patterns'],  queryFn: fetchActivePatterns });
  const nextProb  = useQuery({ queryKey: ['student','next'],      queryFn: () => fetchNextProblem(), staleTime: 60_000 });
  const weekly    = useQuery({ queryKey: ['student','weekly'],    queryFn: fetchWeeklyList });
  const mentor    = useQuery({ queryKey: ['student','mentor'],    queryFn: fetchMentorMessage });

  // 명세서 §6 학생 UI 6번 — 유사문제 5개. 가장 최근 오답 attempt 기준.
  const latestWrong = useQuery({
    queryKey: ['student','latestWrong'],
    queryFn: async () => {
      const r = await get<Array<{ id: string; isCorrect: boolean }>>('/wrong-notes/recent', { limit: 1 });
      return (r as any)?.[0]?.id ?? null;
    },
    staleTime: 60_000,
  });
  const similar = useQuery({
    queryKey: ['student','similar', latestWrong.data],
    queryFn: () => latestWrong.data ? fetchSimilarForAttempt(latestWrong.data) : Promise.resolve({ items: [], requested: 5, returned: 0 } as any),
    enabled: !!latestWrong.data,
  });

  const handleNav = (k: NavKey) => navigate(`/#/${NAV_TO_HASH[k]}`);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: COLORS.bg, color: COLORS.ink, fontFamily: 'Inter, system-ui, sans-serif' }}>
      {!embedded && <TopNav activeNav="대시보드" setActiveNav={handleNav} />}
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 32px 80px' }}>
        <header style={{ marginBottom: 32 }}>
          <h1 style={{ fontFamily: 'serif', fontWeight: 600, fontSize: 32, letterSpacing: '-0.02em', margin: 0 }}>
            {lang === 'ko' ? '오늘의 학습' : lang === 'hi' ? 'आज की पढ़ाई' : 'Today\'s study'}
          </h1>
        </header>

        {/* (1) 오늘의 다음 문제 */}
        <SectionTitle no="01" title={lang === 'ko' ? '오늘의 다음 문제' : 'Next problem'} />
        <NextProblemCard data={nextProb.data ?? null} loading={nextProb.isLoading} lang={lang}
          onStart={(pid) => { window.location.hash = `#/study?problemId=${pid}`; }} />

        {/* (3) AI mentor nudge */}
        {mentor.data?.message && (
          <>
            <SectionTitle no="02" title={lang === 'ko' ? 'AI 멘토 한 마디' : 'AI mentor'} />
            <MentorCard message={mentor.data.message} />
          </>
        )}

        {/* (2) Mastery 상태 카드 */}
        <SectionTitle no="03" title={lang === 'ko' ? '개념별 상태' : 'Concept status'} />
        <MasteryGrid rows={mastery.data ?? []} loading={mastery.isLoading} lang={lang} />

        {/* (4) 최근 개선된 개념 */}
        {(mastery.data?.filter((m) => m.trend === 'UP').length ?? 0) > 0 && (
          <>
            <SectionTitle no="04" title={lang === 'ko' ? '최근 좋아진 개념' : 'Recently improved'} />
            <ImprovedList rows={(mastery.data ?? []).filter((m) => m.trend === 'UP')} />
          </>
        )}

        {/* (5) 반복 실수 패턴 */}
        {(patterns.data?.length ?? 0) > 0 && (
          <>
            <SectionTitle no="05" title={lang === 'ko' ? '반복 실수 패턴' : 'Repeated patterns'} />
            <PatternList rows={patterns.data ?? []} lang={lang} />
          </>
        )}

        {/* (6) 유사문제 5개 — 가장 최근 오답 기준 */}
        {((similar.data?.items?.length ?? 0) > 0 || similar.data?.shortfallReason) && (
          <>
            <SectionTitle no="06" title={lang === 'ko' ? '유사문제 5개 — 보강 연습' : 'Similar problems'} />
            <SimilarList rows={similar.data?.items ?? []} shortfall={similar.data?.shortfallReason} />
          </>
        )}

        {/* (7) 주간 요약 */}
        {(weekly.data?.[0]) && (
          <>
            <SectionTitle no="07" title={lang === 'ko' ? '이번 주 요약' : 'This week'} />
            <WeeklyCard row={weekly.data[0]} />
          </>
        )}
      </main>
    </div>
  );
}

function SectionTitle({ no, title }: { no: string; title: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 40, marginBottom: 14 }}>
      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: COLORS.sub, letterSpacing: '0.15em' }}>No {no}</span>
      <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0, color: COLORS.ink }}>{title}</h2>
    </div>
  );
}

function NextProblemCard({ data, loading, lang, onStart }: {
  data: NextProblemRec | null;
  loading: boolean;
  lang: 'ko' | 'en' | 'hi';
  onStart: (problemId: string) => void;
}) {
  if (loading) return <Card><Sub>{lang === 'ko' ? '추천을 준비 중이에요…' : 'Loading…'}</Sub></Card>;
  if (!data) {
    return <Card><Sub>{lang === 'ko' ? '몇 문제 풀면 AI가 다음 문제를 추천해드릴게요.' : 'Solve a few problems so AI can recommend next.'}</Sub></Card>;
  }
  return (
    <Card style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 11, color: COLORS.accent, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 6, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <Target size={12} /> {lang === 'ko' ? '맞춤 추천' : 'For you'}
        </div>
        <div style={{ fontSize: 15, lineHeight: 1.5, color: COLORS.ink, marginBottom: 8 }}>{data.reason}</div>
        <div style={{ fontSize: 12, color: COLORS.sub }}>
          {lang === 'ko' ? '예상 난이도' : 'Difficulty'} · {data.expectedDifficulty}/5
          {data.targetErrorCode && <> · {lang === 'ko' ? '집중' : 'focus'}: {data.targetErrorCode}</>}
        </div>
      </div>
      <button onClick={() => onStart(data.problemId)} style={btnPrimary}>
        {lang === 'ko' ? '풀어보기' : 'Start'} <ArrowRight size={14} />
      </button>
    </Card>
  );
}

function MentorCard({ message }: { message: string }) {
  return (
    <Card style={{ backgroundColor: '#14285008', borderLeft: `3px solid ${COLORS.ink}` }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <Sparkles size={16} color={COLORS.ink} style={{ marginTop: 3, flexShrink: 0 }} />
        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.65, color: COLORS.ink }}>{message}</p>
      </div>
    </Card>
  );
}

function MasteryGrid({ rows, loading, lang }: { rows: ConceptMastery[]; loading: boolean; lang: 'ko' | 'en' | 'hi' }) {
  if (loading) return <Card><Sub>…</Sub></Card>;
  if (rows.length === 0) {
    return <Card><Sub>{lang === 'ko' ? '아직 데이터가 없어요. 한 문제부터 시작해 봐요.' : 'No data yet — solve one problem.'}</Sub></Card>;
  }
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
      {rows.slice(0, 12).map((m) => {
        const lowEvidence = m.evidenceCount < 3;
        // 명세서 §9-1: evidenceCount 낮으면 흐리게 표시
        const color = lowEvidence ? '#AAB4C5' : masteryStatusColor(m.masteryScore);
        const msg = masteryStatusMessage(m.masteryScore, m.trend, m.evidenceCount);
        return (
          <div key={m.id} style={{
            ...cardStyle, padding: 16, borderLeft: `3px solid ${color}`,
            opacity: lowEvidence ? 0.65 : 1,
          }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.ink, marginBottom: 6 }}>{m.concept.name}</div>
            <div style={{ fontSize: 12, color, marginBottom: 6 }}>{msg}</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 22, fontWeight: 600, color: lowEvidence ? '#8B95AB' : COLORS.ink }}>
                {lowEvidence ? '—' : Math.round(m.masteryScore)}
              </span>
              <span style={{ fontSize: 11, color: COLORS.sub }}>/100</span>
              {m.trend === 'UP' && !lowEvidence && <TrendingUp size={12} color={COLORS.good} style={{ marginLeft: 4 }} />}
            </div>
            <div style={{ fontSize: 10, color: COLORS.sub, marginTop: 4, fontFamily: 'JetBrains Mono, monospace' }}>
              근거 attempt {m.evidenceCount}건
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ImprovedList({ rows }: { rows: ConceptMastery[] }) {
  return (
    <Card>
      {rows.slice(0, 4).map((m) => (
        <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: `1px dashed ${COLORS.line}`, fontSize: 13 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><CheckCircle2 size={14} color={COLORS.good} />{m.concept.name}</span>
          <span style={{ color: COLORS.sub, fontFamily: 'JetBrains Mono, monospace' }}>{Math.round(m.masteryScore)}/100</span>
        </div>
      ))}
    </Card>
  );
}

function PatternList({ rows, lang }: { rows: ErrorPatternRow[]; lang: 'ko' | 'en' | 'hi' }) {
  return (
    <Card>
      {rows.slice(0, 5).map((p) => (
        <div key={p.id} style={{ padding: '12px 0', borderBottom: `1px dashed ${COLORS.line}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600 }}>
              <AlertCircle size={14} color={p.severity === 'high' ? COLORS.bad : COLORS.warn} />
              {p.concept.name}
            </span>
            <span style={{ fontSize: 11, padding: '2px 8px', backgroundColor: COLORS.bg, border: `1px solid ${COLORS.line}`, borderRadius: 2, fontFamily: 'JetBrains Mono, monospace' }}>
              {p.errorCode} · {p.recentFrequency}회
            </span>
          </div>
          {p.llmSummary && (
            <div style={{ fontSize: 12, color: COLORS.sub, lineHeight: 1.5, marginTop: 4 }}>{p.llmSummary}</div>
          )}
          {!p.llmSummary && (
            <div style={{ fontSize: 12, color: COLORS.sub, fontStyle: 'italic' }}>
              {lang === 'ko' ? '같은 실수가 반복돼요. 다음 문제는 풀이 단계를 하나씩 확인하면서 풀어볼게요.' : 'Same mistake repeats — solve step-by-step next.'}
            </div>
          )}
        </div>
      ))}
    </Card>
  );
}

function SimilarList({ rows, shortfall }: { rows: SimilarProblemRec[]; shortfall?: string }) {
  return (
    <Card>
      {shortfall && rows.length < 5 && (
        <div style={{ fontSize: 12, color: COLORS.sub, fontStyle: 'italic', marginBottom: 10 }}>
          {rows.length}/5 — {shortfall}
        </div>
      )}
      {rows.slice(0, 5).map((s, i) => (
        <div key={s.recommendationLogId} style={{ padding: '10px 0', borderBottom: `1px dashed ${COLORS.line}`, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: COLORS.sub, fontWeight: 600 }}>0{i + 1}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, color: COLORS.ink, marginBottom: 4 }}>{s.reason}</div>
            <button
              onClick={() => { window.location.hash = `#/study?problemId=${s.problemId}`; }}
              style={{ fontSize: 11, padding: '4px 10px', border: `1px solid ${COLORS.line}`, borderRadius: 3, background: 'transparent', cursor: 'pointer', color: COLORS.ink, fontFamily: 'inherit' }}
            >
              풀어보기 →
            </button>
          </div>
        </div>
      ))}
    </Card>
  );
}

function WeeklyCard({ row }: { row: WeeklyReportListItem }) {
  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ fontSize: 11, color: COLORS.sub, letterSpacing: '0.15em' }}>{row.isoWeek}</span>
        <span style={{ fontSize: 11, color: COLORS.sub }}>{new Date(row.weekStart).toLocaleDateString()}</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        <Stat label="문제" value={String(row.problemsSolved)} />
        <Stat label="정답률" value={`${Math.round(row.accuracyPct)}%`} />
        <Stat label="세션" value={String(row.totalSessions)} />
        <Stat label="AI 점수" value={`${row.aiScore}/10`} />
      </div>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: 10, letterSpacing: '0.15em', color: COLORS.sub, textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontSize: 20, fontFamily: 'JetBrains Mono, monospace', fontWeight: 600, color: COLORS.ink }}>{value}</div>
    </div>
  );
}

// ===== Shared styles =====
const cardStyle: React.CSSProperties = {
  backgroundColor: COLORS.card, border: `1px solid ${COLORS.line}`, borderRadius: 6,
};
function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div style={{ ...cardStyle, padding: '18px 20px', marginBottom: 12, ...style }}>{children}</div>;
}
function Sub({ children }: { children: React.ReactNode }) {
  return <p style={{ margin: 0, color: COLORS.sub, fontSize: 13, fontStyle: 'italic' }}>{children}</p>;
}
const btnPrimary: React.CSSProperties = {
  padding: '10px 16px', backgroundColor: COLORS.ink, color: COLORS.bg, border: 'none',
  borderRadius: 4, fontSize: 13, fontWeight: 600, cursor: 'pointer',
  display: 'inline-flex', alignItems: 'center', gap: 6,
};
