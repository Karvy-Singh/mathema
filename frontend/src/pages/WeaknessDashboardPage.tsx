/**
 * Weakness Dashboard — Phase 3.
 *
 *   - 단원별 공부 시간 균형 분석 (지니계수, 부족학습, 저효율)
 *   - 단원 × 마스터리 색상 그리드 (heatmap)
 *   - 단원별 공부 시간 막대 차트 (recharts)
 *   - LangChain adaptive plan (AI 생성 오늘 학습 계획)
 *
 * embedded=true 일 때 TopNav 생략 (MathLearningApp 내부 view 용).
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell, Legend,
} from 'recharts';
import { AlertTriangle, CheckCircle2, Clock, Sparkles, RefreshCw, BookOpen, PenLine, Repeat, FileText } from 'lucide-react';
import { TopNav, NAV_TO_HASH, NavKey } from '../components/TopNav';
import {
  fetchBalance, fetchAdaptive,
  type UnitBalance, type StudyBalanceResult, type AdaptiveResponse, type AdaptivePlan,
} from '../lib/queries';
import { useT } from '../lib/i18n';

const COLORS = {
  bg: '#EFEBDF',
  ink: '#142850',
  sub: '#5C6B85',
  line: '#14285020',
  card: '#FAF7EF',
  good: '#4A5D3A',
  warn: '#B45309',
  bad: '#8B3A1F',
};

/** mastery 점수 0~100 → 색상 (빨강→황→녹). */
function scoreToColor(score: number): string {
  const clamped = Math.max(0, Math.min(100, score));
  if (clamped < 40) return '#D97757';
  if (clamped < 60) return '#E0A458';
  if (clamped < 80) return '#A4B574';
  return '#4A5D3A';
}

const PLAN_LABELS: Record<string, { ko: string; en: string; hi: string; icon: any }> = {
  concept:     { ko: '개념',     en: 'Concept',     hi: 'अवधारणा',  icon: BookOpen },
  practice:    { ko: '문제풀이', en: 'Practice',    hi: 'अभ्यास',    icon: PenLine },
  review:      { ko: '복습',     en: 'Review',      hi: 'पुनरावलोकन', icon: Repeat },
  'mock-exam': { ko: '모의고사', en: 'Mock Exam',   hi: 'मॉक टेस्ट', icon: FileText },
};

const LABELS = {
  title:      { ko: '약점 분석 & 균형 진단', en: 'Weakness & Balance', hi: 'कमज़ोरी और संतुलन विश्लेषण' },
  subtitle:   {
    ko: '단원별 학습 시간과 숙련도를 비교해 균형을 진단하고, AI가 오늘의 학습 계획을 짜드립니다.',
    en: 'Compare study time vs mastery per unit, get balance diagnostics and an AI-curated plan.',
    hi: 'अध्यायवार समय बनाम दक्षता तुलना, संतुलन निदान और AI द्वारा बनाई दैनिक योजना।',
  },
  noData:     { ko: '아직 학습 데이터가 부족해요. 문제를 좀 더 풀어보세요.', en: 'Not enough study data yet. Solve more problems.', hi: 'अभी पर्याप्त डेटा नहीं है — कुछ और प्रश्न हल करें।' },
  gini:       { ko: '학습 시간 균형', en: 'Time Balance', hi: 'समय संतुलन' },
  totalTime:  { ko: '총 학습 시간', en: 'Total Study Time', hi: 'कुल समय' },
  minutes:    { ko: '분', en: 'min', hi: 'मिनट' },
  balanced:   { ko: '균형 잡힘', en: 'Balanced', hi: 'संतुलित' },
  skewed:     { ko: '편중됨',    en: 'Skewed',  hi: 'असंतुलित' },
  heatmap:    { ko: '단원별 숙련도 맵', en: 'Mastery Heatmap', hi: 'दक्षता हीटमैप' },
  timeChart:  { ko: '단원별 학습 시간', en: 'Study Time per Unit', hi: 'अध्यायवार समय' },
  underStudied: { ko: '학습 부족 단원', en: 'Under-studied Units', hi: 'कम अभ्यास वाले अध्याय' },
  lowEff:     { ko: '저효율 단원',     en: 'Low-Efficiency Units', hi: 'कम दक्षता वाले अध्याय' },
  adaptive:   { ko: '오늘의 AI 맞춤 학습', en: "Today's AI Plan", hi: 'आज की AI योजना' },
  adaptiveDesc:{ ko: 'AI가 약점 + 시간 균형을 동시에 고려해 오늘 60분 학습을 설계합니다.',
                 en: 'AI designs your study session considering weakness and time balance together.',
                 hi: 'AI कमज़ोरी और समय संतुलन को साथ देखकर आज की योजना बनाता है।' },
  loadingAI:  { ko: 'AI 분석 중...', en: 'AI thinking...', hi: 'AI सोच रहा है...' },
  refresh:    { ko: '다시 받기', en: 'Refresh', hi: 'फिर लें' },
  availTime:  { ko: '오늘 가능 시간', en: 'Time available', hi: 'उपलब्ध समय' },
  tip:        { ko: '학습 균형 팁', en: 'Balance Tip', hi: 'संतुलन सुझाव' },
  fallbackNote:{ ko: '데이터가 더 모이면 AI 맞춤 플랜이 활성화됩니다.',
                 en: 'AI plan will activate once more data is collected.',
                 hi: 'अधिक डेटा एकत्र होने पर AI योजना सक्रिय होगी।' },
  giniHint:   { ko: '0에 가까울수록 균형, 1에 가까울수록 편중', en: 'Closer to 0 = balanced, closer to 1 = skewed', hi: '0 के पास = संतुलित, 1 के पास = असंतुलित' },
  noStudyYet: { ko: '아직 시작 안 함', en: 'Not started', hi: 'शुरू नहीं किया' },
  score:      { ko: '숙련도', en: 'Mastery', hi: 'दक्षता' },
  time:       { ko: '시간', en: 'Time', hi: 'समय' },
} as const;

function L(k: keyof typeof LABELS, lang: 'ko' | 'en' | 'hi'): string {
  return (LABELS[k] as any)[lang] ?? (LABELS[k] as any).en;
}

export function WeaknessDashboardPage({ embedded = false }: { embedded?: boolean } = {}) {
  const { lang } = useT();
  const navigate = useNavigate();
  const [minutes, setMinutes] = useState(45);

  const balanceQ = useQuery({
    queryKey: ['recommendations', 'balance'],
    queryFn: fetchBalance,
  });

  const adaptiveQ = useQuery({
    queryKey: ['recommendations', 'adaptive', minutes],
    queryFn: () => fetchAdaptive(minutes),
    // LLM 호출 비용 절감 — 같은 minutes 에 5분간 캐시
    staleTime: 1000 * 60 * 5,
    enabled: !!balanceQ.data && balanceQ.data.perUnit.length > 0,
  });

  const handleNav = (k: NavKey) => navigate(`/#/${NAV_TO_HASH[k]}`);

  const data = balanceQ.data;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: COLORS.bg, color: COLORS.ink, fontFamily: 'Inter, system-ui, sans-serif' }}>
      {!embedded && <TopNav activeNav="약점분석" setActiveNav={handleNav} />}
      <main style={{ maxWidth: 1400, margin: '0 auto', padding: '40px 40px' }}>
        <header style={{ marginBottom: 32 }}>
          <h1 style={{ fontFamily: 'serif', fontWeight: 600, fontSize: 32, letterSpacing: '-0.02em', margin: 0 }}>
            {L('title', lang)}
          </h1>
          <p style={{ marginTop: 8, fontSize: 14, color: COLORS.sub, lineHeight: 1.5, maxWidth: 720 }}>
            {L('subtitle', lang)}
          </p>
        </header>

        {balanceQ.isLoading && (
          <Card><p style={{ color: COLORS.sub, fontSize: 13 }}>{L('loadingAI', lang)}</p></Card>
        )}

        {data && data.perUnit.length === 0 && (
          <Card>
            <p style={{ color: COLORS.sub, fontSize: 13 }}>{L('noData', lang)}</p>
          </Card>
        )}

        {data && data.perUnit.length > 0 && (
          <>
            <BalanceSummary data={data} lang={lang} />
            <Section title={L('timeChart', lang)} subtitle={`${L('totalTime', lang)}: ${data.totalStudyMin}${L('minutes', lang)}`}>
              <UnitTimeBar perUnit={data.perUnit} lang={lang} />
            </Section>
            <Section title={L('heatmap', lang)}>
              <MasteryHeatmap perUnit={data.perUnit} lang={lang} />
            </Section>
            <AlertLists data={data} lang={lang} />
            <AdaptiveSection
              adaptive={adaptiveQ.data}
              isLoading={adaptiveQ.isLoading}
              minutes={minutes}
              setMinutes={setMinutes}
              refetch={() => adaptiveQ.refetch()}
              lang={lang}
            />
          </>
        )}
      </main>
    </div>
  );
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      backgroundColor: COLORS.card, border: `1px solid ${COLORS.line}`,
      borderRadius: 8, padding: '20px 24px', marginBottom: 16, ...style,
    }}>
      {children}
    </div>
  );
}

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section style={{ marginTop: 32 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 }}>
        <h2 style={{ fontFamily: 'serif', fontSize: 20, fontWeight: 600, margin: 0 }}>{title}</h2>
        {subtitle && <span style={{ fontSize: 12, color: COLORS.sub }}>{subtitle}</span>}
      </div>
      {children}
    </section>
  );
}

function BalanceSummary({ data, lang }: { data: StudyBalanceResult; lang: 'ko' | 'en' | 'hi' }) {
  const StatusIcon = data.balanced ? CheckCircle2 : AlertTriangle;
  const statusColor = data.balanced ? COLORS.good : COLORS.warn;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginTop: 24 }}>
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <StatusIcon size={16} color={statusColor} />
          <span style={{ fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', color: COLORS.sub }}>
            {L('gini', lang)}
          </span>
        </div>
        <div style={{ fontSize: 28, fontWeight: 600, fontFamily: 'JetBrains Mono, monospace', color: COLORS.ink }}>
          {data.gini.toFixed(2)}
        </div>
        <div style={{ marginTop: 4, fontSize: 13, color: statusColor, fontWeight: 500 }}>
          {data.balanced ? L('balanced', lang) : L('skewed', lang)}
        </div>
        <div style={{ marginTop: 8, fontSize: 11, color: COLORS.sub }}>{L('giniHint', lang)}</div>
      </Card>

      <Card>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <Clock size={16} color={COLORS.sub} />
          <span style={{ fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', color: COLORS.sub }}>
            {L('totalTime', lang)}
          </span>
        </div>
        <div style={{ fontSize: 28, fontWeight: 600, fontFamily: 'JetBrains Mono, monospace' }}>
          {data.totalStudyMin}
          <span style={{ fontSize: 13, color: COLORS.sub, marginLeft: 4 }}>{L('minutes', lang)}</span>
        </div>
        <div style={{ marginTop: 4, fontSize: 13, color: COLORS.sub }}>
          {data.perUnit.length} {lang === 'ko' ? '단원' : lang === 'hi' ? 'अध्याय' : 'units'}
        </div>
      </Card>

      {data.warnings.length > 0 && (
        <Card style={{ gridColumn: 'span 2', backgroundColor: '#FFF8EE', borderColor: '#B4530940' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <AlertTriangle size={16} color={COLORS.warn} />
            <span style={{ fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', color: COLORS.warn, fontWeight: 600 }}>
              {lang === 'ko' ? '경고' : lang === 'hi' ? 'चेतावनी' : 'Warnings'}
            </span>
          </div>
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: COLORS.ink, lineHeight: 1.7 }}>
            {data.warnings.map((w, i) => <li key={i}>{w}</li>)}
          </ul>
        </Card>
      )}
    </div>
  );
}

function UnitTimeBar({ perUnit, lang }: { perUnit: UnitBalance[]; lang: 'ko' | 'en' | 'hi' }) {
  // 단원명 너무 길면 잘림 → 12자 축약
  const chartData = perUnit.map((u) => ({
    name: u.unitName.length > 14 ? u.unitName.slice(0, 12) + '…' : u.unitName,
    fullName: u.unitName,
    minutes: u.studyTimeMin,
    score: u.score,
    samples: u.samples,
  }));

  return (
    <Card>
      <ResponsiveContainer width="100%" height={Math.max(240, chartData.length * 32)}>
        <BarChart data={chartData} layout="vertical" margin={{ top: 4, right: 20, left: 8, bottom: 4 }}>
          <CartesianGrid strokeDasharray="2 4" stroke={COLORS.line} horizontal={false} />
          <XAxis type="number" stroke={COLORS.sub} fontSize={11} unit={L('minutes', lang) === '분' ? '분' : ''} />
          <YAxis dataKey="name" type="category" stroke={COLORS.sub} fontSize={11} width={120} />
          <Tooltip
            cursor={{ fill: '#14285008' }}
            contentStyle={{ backgroundColor: COLORS.card, border: `1px solid ${COLORS.line}`, fontSize: 12 }}
            formatter={((value: any, _name: any, props: any) => [
              `${value} ${L('minutes', lang)}`,
              `${L('score', lang)} ${props?.payload?.score ?? ''}`,
            ]) as any}
            labelFormatter={((_l: any, payload: any) => payload?.[0]?.payload?.fullName ?? '') as any}
          />
          <Bar dataKey="minutes" radius={[0, 4, 4, 0]}>
            {chartData.map((entry, i) => (
              <Cell key={i} fill={scoreToColor(entry.score)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div style={{ marginTop: 8, fontSize: 11, color: COLORS.sub, display: 'flex', gap: 16, justifyContent: 'center' }}>
        {[40, 60, 80, 100].map((threshold) => (
          <span key={threshold} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 10, height: 10, backgroundColor: scoreToColor(threshold - 1), borderRadius: 2, display: 'inline-block' }} />
            &lt;{threshold} {L('score', lang)}
          </span>
        ))}
      </div>
    </Card>
  );
}

function MasteryHeatmap({ perUnit, lang }: { perUnit: UnitBalance[]; lang: 'ko' | 'en' | 'hi' }) {
  return (
    <Card>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 8 }}>
        {perUnit.map((u) => {
          const studied = u.studyTimeMin > 0;
          return (
            <div
              key={u.unitId}
              title={`${u.unitName}\n${L('score', lang)}: ${u.score}\n${L('time', lang)}: ${u.studyTimeMin}${L('minutes', lang)}\n${lang === 'ko' ? '표본' : lang === 'hi' ? 'नमूने' : 'samples'}: ${u.samples}`}
              style={{
                backgroundColor: studied ? scoreToColor(u.score) : '#D8D2C2',
                color: studied ? '#FAF7EF' : COLORS.sub,
                padding: '10px 12px', borderRadius: 6,
                fontSize: 12, lineHeight: 1.3,
                display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                minHeight: 64,
              }}
            >
              <div style={{ fontWeight: 500, marginBottom: 4, fontSize: 11, opacity: 0.95 }}>
                {u.unitName.length > 18 ? u.unitName.slice(0, 16) + '…' : u.unitName}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontSize: 16, fontFamily: 'JetBrains Mono, monospace', fontWeight: 600 }}>
                  {studied ? u.score : '—'}
                </span>
                <span style={{ fontSize: 10, opacity: 0.85 }}>
                  {studied ? `${u.studyTimeMin}${L('minutes', lang)}` : L('noStudyYet', lang)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function AlertLists({ data, lang }: { data: StudyBalanceResult; lang: 'ko' | 'en' | 'hi' }) {
  if (data.underStudied.length === 0 && data.lowEfficiency.length === 0) return null;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16, marginTop: 32 }}>
      {data.underStudied.length > 0 && (
        <Card>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: COLORS.warn, display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertTriangle size={14} /> {L('underStudied', lang)}
          </h3>
          <ul style={{ margin: '12px 0 0', paddingLeft: 0, listStyle: 'none' }}>
            {data.underStudied.map((u) => (
              <li key={u.unitId} style={{ padding: '8px 0', borderBottom: `1px dashed ${COLORS.line}`, display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: COLORS.ink }}>{u.unitName}</span>
                <span style={{ color: COLORS.sub, fontFamily: 'JetBrains Mono, monospace' }}>
                  {u.score}/100 · {u.studyTimeMin}m
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}
      {data.lowEfficiency.length > 0 && (
        <Card>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: COLORS.bad, display: 'flex', alignItems: 'center', gap: 8 }}>
            <RefreshCw size={14} /> {L('lowEff', lang)}
          </h3>
          <ul style={{ margin: '12px 0 0', paddingLeft: 0, listStyle: 'none' }}>
            {data.lowEfficiency.map((u) => (
              <li key={u.unitId} style={{ padding: '8px 0', borderBottom: `1px dashed ${COLORS.line}`, display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: COLORS.ink }}>{u.unitName}</span>
                <span style={{ color: COLORS.sub, fontFamily: 'JetBrains Mono, monospace' }}>
                  {u.score}/100 · {u.studyTimeMin}m
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}

function AdaptiveSection({
  adaptive, isLoading, minutes, setMinutes, refetch, lang,
}: {
  adaptive: AdaptiveResponse | undefined;
  isLoading: boolean;
  minutes: number;
  setMinutes: (m: number) => void;
  refetch: () => void;
  lang: 'ko' | 'en' | 'hi';
}) {
  return (
    <Section
      title={L('adaptive', lang)}
      subtitle={L('adaptiveDesc', lang)}
    >
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Sparkles size={16} color={COLORS.ink} />
            <span style={{ fontSize: 12, color: COLORS.sub }}>{L('availTime', lang)}:</span>
            {[30, 45, 60, 90].map((m) => (
              <button key={m} onClick={() => setMinutes(m)} style={{
                padding: '6px 12px', fontSize: 12,
                fontFamily: 'JetBrains Mono, monospace',
                backgroundColor: minutes === m ? COLORS.ink : 'transparent',
                color: minutes === m ? COLORS.bg : COLORS.sub,
                border: `1px solid ${COLORS.line}`, borderRadius: 4, cursor: 'pointer',
              }}>
                {m}m
              </button>
            ))}
          </div>
          <button onClick={refetch} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '6px 12px', fontSize: 12,
            background: 'none', border: `1px solid ${COLORS.line}`, borderRadius: 4, cursor: 'pointer',
            color: COLORS.sub,
          }}>
            <RefreshCw size={12} /> {L('refresh', lang)}
          </button>
        </div>

        {isLoading && <p style={{ color: COLORS.sub, fontSize: 13 }}>{L('loadingAI', lang)}</p>}

        {adaptive && 'fallback' in adaptive && adaptive.fallback && (
          <p style={{ color: COLORS.sub, fontSize: 13, fontStyle: 'italic' }}>
            {L('fallbackNote', lang)}
          </p>
        )}

        {adaptive && !('fallback' in adaptive && adaptive.fallback) && (
          <AdaptivePlanView plan={adaptive as AdaptivePlan} lang={lang} />
        )}
      </Card>
    </Section>
  );
}

function AdaptivePlanView({ plan, lang }: { plan: AdaptivePlan; lang: 'ko' | 'en' | 'hi' }) {
  return (
    <div>
      <div style={{ marginBottom: 16, padding: '12px 16px', backgroundColor: '#14285008', borderLeft: `3px solid ${COLORS.ink}`, borderRadius: 4 }}>
        <p style={{ margin: 0, fontSize: 14, color: COLORS.ink, lineHeight: 1.6 }}>{plan.summary}</p>
        <p style={{ marginTop: 6, marginBottom: 0, fontSize: 12, color: COLORS.sub }}>
          {lang === 'ko' ? '총' : lang === 'hi' ? 'कुल' : 'Total'} {plan.totalMinutes}{L('minutes', lang)}
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
        {plan.tasks.map((task, i) => {
          const def = PLAN_LABELS[task.type] ?? PLAN_LABELS.practice;
          const Icon = def.icon;
          const typeLabel = (def as any)[lang] ?? def.en;
          return (
            <div key={i} style={{
              backgroundColor: COLORS.bg, border: `1px solid ${COLORS.line}`,
              borderRadius: 6, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 8,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: COLORS.sub, fontWeight: 600 }}>
                  <Icon size={12} /> {typeLabel}
                </span>
                <span style={{ fontSize: 12, color: COLORS.ink, fontFamily: 'JetBrains Mono, monospace' }}>
                  {task.durationMin}{L('minutes', lang)}
                </span>
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.ink, lineHeight: 1.4 }}>{task.task}</div>
              <div style={{ fontSize: 11, color: COLORS.sub }}>{task.unitName}</div>
              <div style={{ fontSize: 12, color: COLORS.sub, lineHeight: 1.5, fontStyle: 'italic', marginTop: 4 }}>
                {task.reason}
              </div>
            </div>
          );
        })}
      </div>

      {plan.balanceTip && (
        <div style={{ marginTop: 16, padding: '10px 14px', backgroundColor: '#FAF7EF', border: `1px solid ${COLORS.line}`, borderRadius: 4, fontSize: 12, color: COLORS.sub, fontStyle: 'italic' }}>
          <strong style={{ color: COLORS.ink, fontStyle: 'normal' }}>{L('tip', lang)}:</strong> {plan.balanceTip}
        </div>
      )}
    </div>
  );
}
