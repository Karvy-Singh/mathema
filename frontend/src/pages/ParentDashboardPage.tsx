/**
 * ParentDashboardPage — 명세서 §6 학부모용 UI.
 *
 *   필수 컴포넌트:
 *     1. 이번 주 학습 요약 (WeeklyReport.parentSummary + 4 stat)
 *     2. 평균 집중 시간 (avg session duration)
 *     3. 개선된 개념 (mastery trend UP)
 *     4. 반복 실수 패턴 (ACTIVE ErrorPattern — 학습 습관 신호로 표현)
 *     5. 다음 주 목표 (WeeklyReport.recommendedNextGoals)
 *     6. 학부모용 설명 요약 (parentSummary 전체)
 *
 *   명세서 §1 학부모 UI: 학습량 + 집중도 + 개선 여부 + 관리 포인트.
 *   학생 UI 와 다르게 "구체 데이터" 가 중심 (몇 시간/몇 문제/몇 % 회복 등).
 */

import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Clock, TrendingUp, AlertTriangle, Target } from 'lucide-react';
import { TopNav, NAV_TO_HASH, NavKey } from '../components/TopNav';
import {
  fetchConceptMastery, fetchActivePatterns, fetchWeeklyList,
  type ConceptMastery, type ErrorPatternRow, type WeeklyReportListItem,
} from '../lib/queries';
import { useT } from '../lib/i18n';

const COLORS = {
  bg: '#EFEBDF', ink: '#142850', sub: '#5C6B85', line: '#14285020', card: '#FAF7EF',
  good: '#4A5D3A', warn: '#B45309', bad: '#8B3A1F',
};

export function ParentDashboardPage({ embedded = false }: { embedded?: boolean } = {}) {
  const { lang } = useT();
  const navigate = useNavigate();
  const mastery   = useQuery({ queryKey: ['parent','mastery'],   queryFn: fetchConceptMastery });
  const patterns  = useQuery({ queryKey: ['parent','patterns'],  queryFn: fetchActivePatterns });
  const weekly    = useQuery({ queryKey: ['parent','weekly'],    queryFn: fetchWeeklyList });

  const latest = weekly.data?.[0];
  const handleNav = (k: NavKey) => navigate(`/#/${NAV_TO_HASH[k]}`);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: COLORS.bg, color: COLORS.ink, fontFamily: 'Inter, system-ui, sans-serif' }}>
      {!embedded && <TopNav activeNav="대시보드" setActiveNav={handleNav} />}
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 32px 80px' }}>
        <header style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, color: COLORS.sub, letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: 6 }}>
            {lang === 'ko' ? '학부모 대시보드' : 'Parent dashboard'}
          </div>
          <h1 style={{ fontFamily: 'serif', fontWeight: 600, fontSize: 30, letterSpacing: '-0.02em', margin: 0 }}>
            {lang === 'ko' ? '이번 주 학습 요약' : 'This week\'s study summary'}
          </h1>
        </header>

        {!latest && (
          <Card>
            <Sub>{lang === 'ko' ? '이번 주 데이터가 없습니다. 학생이 한 문제 풀면 자동으로 분석됩니다.' : 'No data yet — analysis activates after first attempt.'}</Sub>
          </Card>
        )}

        {latest && (
          <>
            {/* (6) parentSummary — 본문 */}
            <Card>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.7, color: COLORS.ink }}>
                {weekly.data?.[0] && (weekly.data![0] as any).parentSummary || lang === 'ko' ? '리포트 생성 중입니다.' : 'Report generating.'}
              </p>
            </Card>

            {/* (1) 4 stat */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px,1fr))', gap: 12, marginTop: 24 }}>
              <StatCard icon={Clock} label={lang === 'ko' ? '총 학습 시간' : 'Total study'}
                value={`${latest.totalHours}h`} sub={`${latest.totalSessions} ${lang === 'ko' ? '회 세션' : 'sessions'}`} accent={COLORS.ink} />
              <StatCard icon={Target} label={lang === 'ko' ? '푼 문제' : 'Problems solved'}
                value={`${latest.totalAttempts}`} sub={`${lang === 'ko' ? '정답률' : 'Accuracy'} ${Math.round(latest.accuracyPct)}%`} accent={COLORS.good} />
              <StatCard icon={TrendingUp} label={lang === 'ko' ? 'AI 종합 점수' : 'AI score'}
                value={`${latest.aiScore}/10`} sub={lang === 'ko' ? '학습 패턴 종합' : 'pattern-weighted'} accent={'#C7791F'} />
              <StatCard icon={AlertTriangle} label={lang === 'ko' ? '주의 신호' : 'Attention'}
                value={`${patterns.data?.length ?? 0}`} sub={lang === 'ko' ? '반복 실수 패턴' : 'repeated patterns'} accent={COLORS.warn} />
            </div>
          </>
        )}

        {/* (3) 개선된 개념 */}
        {(mastery.data?.some((m) => m.trend === 'UP')) && (
          <>
            <SectionTitle no="01" title={lang === 'ko' ? '이번 주 좋아진 개념' : 'Improved this week'} />
            <ImprovedList rows={(mastery.data ?? []).filter((m) => m.trend === 'UP')} />
          </>
        )}

        {/* (4) 반복 실수 패턴 — 학부모 톤으로 */}
        {(patterns.data?.length ?? 0) > 0 && (
          <>
            <SectionTitle no="02" title={lang === 'ko' ? '학습 습관 신호' : 'Habit signals'} />
            <Card>
              {(patterns.data ?? []).slice(0, 5).map((p) => (
                <PatternRow key={p.id} p={p} lang={lang} />
              ))}
            </Card>
          </>
        )}

        {/* (5) 다음 주 목표 */}
        {latest && (latest as any).recommendedNextGoals?.length > 0 && (
          <>
            <SectionTitle no="03" title={lang === 'ko' ? '다음 주 관리 포인트' : 'Next-week focus'} />
            <Card>
              {((weekly.data?.[0] as any).recommendedNextGoals as string[]).map((g, i) => (
                <div key={i} style={{ padding: '10px 0', borderBottom: `1px dashed ${COLORS.line}`, fontSize: 14, display: 'flex', gap: 8 }}>
                  <span style={{ color: COLORS.warn, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace' }}>{i + 1}</span>
                  <span>{g}</span>
                </div>
              ))}
            </Card>
          </>
        )}
      </main>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub, accent }: any) {
  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <Icon size={14} color={accent} />
        <span style={{ fontSize: 10, color: COLORS.sub, letterSpacing: '0.15em', textTransform: 'uppercase' }}>{label}</span>
      </div>
      <div style={{ fontSize: 26, fontFamily: 'JetBrains Mono, monospace', fontWeight: 600, color: COLORS.ink }}>{value}</div>
      <div style={{ fontSize: 11, color: COLORS.sub, marginTop: 2 }}>{sub}</div>
    </div>
  );
}

function ImprovedList({ rows }: { rows: ConceptMastery[] }) {
  return (
    <Card>
      {rows.slice(0, 5).map((m) => (
        <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px dashed ${COLORS.line}`, fontSize: 13 }}>
          <span>{m.concept.name}</span>
          <span style={{ color: COLORS.good, fontFamily: 'JetBrains Mono, monospace' }}>
            ↑ {Math.round(m.masteryScore)}/100
          </span>
        </div>
      ))}
    </Card>
  );
}

function PatternRow({ p, lang }: { p: ErrorPatternRow; lang: 'ko' | 'en' | 'hi' }) {
  const sevColor = p.severity === 'high' ? COLORS.bad : p.severity === 'medium' ? COLORS.warn : COLORS.sub;
  return (
    <div style={{ padding: '10px 0', borderBottom: `1px dashed ${COLORS.line}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 13, fontWeight: 600 }}>{p.concept.name}</span>
        <span style={{ fontSize: 11, padding: '2px 8px', backgroundColor: COLORS.bg, color: sevColor, border: `1px solid ${sevColor}30`, borderRadius: 2 }}>
          {p.severity}
        </span>
      </div>
      <div style={{ fontSize: 12, color: COLORS.sub, lineHeight: 1.5 }}>
        {lang === 'ko'
          ? `최근 ${p.recentFrequency}회 같은 유형의 실수가 보였습니다. 학습 시 단계별 확인이 도움이 됩니다.`
          : `${p.recentFrequency} similar mistakes recently — step-by-step review helps.`}
      </div>
    </div>
  );
}

function SectionTitle({ no, title }: { no: string; title: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 36, marginBottom: 12 }}>
      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: COLORS.sub, letterSpacing: '0.15em' }}>No {no}</span>
      <h2 style={{ fontSize: 17, fontWeight: 600, margin: 0 }}>{title}</h2>
    </div>
  );
}

const cardStyle: React.CSSProperties = { backgroundColor: COLORS.card, border: `1px solid ${COLORS.line}`, borderRadius: 6, padding: '18px 20px' };
function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div style={{ ...cardStyle, marginBottom: 12, ...style }}>{children}</div>;
}
function Sub({ children }: { children: React.ReactNode }) {
  return <p style={{ margin: 0, color: COLORS.sub, fontSize: 13, fontStyle: 'italic' }}>{children}</p>;
}
