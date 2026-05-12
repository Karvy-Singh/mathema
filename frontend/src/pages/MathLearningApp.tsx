import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, AreaChart, Area,
} from 'recharts';
import {
  Flame, ChevronRight, Sparkles, AlertCircle, Lightbulb,
  Eye, Layers, Zap, Camera, Plus, Filter, Clock, Pause, Play,
  RotateCcw, ArrowLeft, ArrowRight, Award, Target,
  ChevronDown, FileText, Image as ImageIcon, TrendingUp,
  Brain, CheckCircle2, Hash, LogOut, LucideIcon, Settings as SettingsIcon,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import * as Q from '../lib/queries';
import * as M from '../lib/mutations';
import { get } from '../lib/api';
import { toast } from '../components/Toast';
import { trackClick, trackUi, track } from '../lib/analytics';
import { useT } from '../lib/i18n';
import WrongNoteDetailModal from '../components/WrongNoteDetailModal';
import RegisterWrongNoteModal from '../components/RegisterWrongNoteModal';
import MockExamResultModal from '../components/MockExamResultModal';
import ExamTakingScreen from '../components/ExamTakingScreen';
import ConfidenceSlider from '../components/ConfidenceSlider';
import { UnitPicker } from '../components/UnitPicker';
import MathText from '../components/MathText';
import ConceptHubPage from './ConceptHubPage';
import { WeaknessDashboardPage } from './WeaknessDashboardPage';
import { TopNav } from '../components/TopNav';

const SESSION_KEY = 'mathema.activeSession';

type NavKey = '대시보드' | '오답노트' | '학습' | '개념학습' | '모의고사' | '리포트' | '약점분석';

// ============ ICON MAP (백엔드가 문자열로 반환) ============
const ICONS: Record<string, LucideIcon> = {
  Flame, Sparkles, Eye, Layers, Zap, Camera, Plus, FileText,
  TrendingUp, Target, CheckCircle2, Hash, RotateCcw, Award,
  AlertCircle, Lightbulb, Brain,
};
const Icon = (name: string, size = 14, color?: string) => {
  const C = ICONS[name] ?? Sparkles;
  return <C size={size} color={color} />;
};

// ============ SHARED STYLES ============
const sectionLabelStyle: React.CSSProperties = {
  fontSize: '11px', letterSpacing: '0.2em', color: '#8B95AB',
  textTransform: 'uppercase', marginBottom: '6px',
};
const baseText: React.CSSProperties = { wordBreak: 'keep-all', overflowWrap: 'break-word' };

// ============ NAV ↔ URL 동기화 ============
// 브라우저 히스토리에 각 탭/시험 진입 상태를 push 해서, 뒤로가기 시 사이트 안에서 이동하도록 함.
const NAV_TO_HASH: Record<NavKey, string> = {
  '대시보드': 'dashboard',
  '오답노트': 'wrong-notes',
  '학습': 'study',
  '개념학습': 'concept',
  '모의고사': 'mock-exam',
  '리포트': 'report',
  '약점분석': 'weakness',
};
const HASH_TO_NAV: Record<string, NavKey> = Object.fromEntries(
  Object.entries(NAV_TO_HASH).map(([k, v]) => [v, k as NavKey]),
) as Record<string, NavKey>;

const readHash = (): { nav: NavKey; exam: boolean } => {
  const raw = window.location.hash.replace(/^#\/?/, '');
  const exam = raw.endsWith('/exam');
  const navHash = exam ? raw.replace(/\/exam$/, '') : raw;
  const nav = HASH_TO_NAV[navHash] ?? '대시보드';
  return { nav, exam };
};

const writeHash = (nav: NavKey, exam: boolean, replace = false) => {
  const next = '#/' + NAV_TO_HASH[nav] + (exam ? '/exam' : '');
  if (window.location.hash === next) return;
  if (replace) window.history.replaceState(null, '', next);
  else window.history.pushState(null, '', next);
};

// ============ MAIN APP ============
const FOCUS_PROBLEM_KEY = 'mathema.focusProblemId';

export default function MathLearningApp() {
  const initial = readHash();
  const [activeNav, setActiveNavState] = useState<NavKey>(initial.nav);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(
    () => sessionStorage.getItem(SESSION_KEY),
  );
  const [focusProblemId, setFocusProblemId] = useState<string | null>(
    () => sessionStorage.getItem(FOCUS_PROBLEM_KEY),
  );
  const [activeExam, setActiveExam] = useState<M.ExamPackage | null>(null);

  // popstate (뒤로/앞으로) → 해시에 맞춰 nav/exam 복원
  useEffect(() => {
    const onPop = () => {
      const { nav, exam } = readHash();
      setActiveNavState(nav);
      if (!exam) setActiveExam(null); // 뒤로 누르면 exam 닫힘
    };
    window.addEventListener('popstate', onPop);
    // 첫 진입 시 해시 보정 (해시 없는 상태로 들어오면 #/dashboard 로)
    if (!window.location.hash) writeHash(initial.nav, false, true);
    return () => window.removeEventListener('popstate', onPop);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // setActiveNav 호출 시 history 에 push.
  // 시험 중이라면 시험을 자동 종료(abandon)하고 새 탭으로 이동 — 사용자 요청.
  const setActiveNav = (n: NavKey) => {
    if (activeExam) setActiveExam(null);
    setActiveNavState(n);
    writeHash(n, false);
  };

  const enterStudy = (sessionId: string, focus?: string | null) => {
    sessionStorage.setItem(SESSION_KEY, sessionId);
    setActiveSessionId(sessionId);
    if (focus) {
      sessionStorage.setItem(FOCUS_PROBLEM_KEY, focus);
      setFocusProblemId(focus);
    } else {
      sessionStorage.removeItem(FOCUS_PROBLEM_KEY);
      setFocusProblemId(null);
    }
    setActiveNav('학습');
  };
  const clearSession = () => {
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(FOCUS_PROBLEM_KEY);
    setActiveSessionId(null);
    setFocusProblemId(null);
  };
  const enterExam = (exam: M.ExamPackage) => {
    setActiveExam(exam);
    writeHash(activeNav, true);
  };
  const exitExam = () => {
    setActiveExam(null);
    // 시험 진입 때 push 한 한 단계를 되돌림 — 시험 직전 페이지로 복귀
    if (window.location.hash.endsWith('/exam')) window.history.back();
  };

  return (
    <div style={{
      minHeight: '100vh', backgroundColor: '#EFEBDF',
      fontFamily: '"Pretendard", -apple-system, BlinkMacSystemFont, sans-serif',
      color: '#142850', ...baseText,
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300;9..144,400;9..144,500;9..144,600;9..144,700;9..144,900&family=JetBrains+Mono:wght@400;500;700&display=swap');
        @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css');

        * { word-break: keep-all; }
        .serif { font-family: 'Fraunces', 'Noto Serif KR', serif; font-feature-settings: 'ss01', 'ss02'; word-break: keep-all; }
        .mono { font-family: 'JetBrains Mono', monospace; }

        .grain { position: relative; }
        .grain::before {
          content: ''; position: absolute; inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.4'/%3E%3C/svg%3E");
          opacity: 0.06; pointer-events: none; mix-blend-mode: multiply; border-radius: inherit;
        }
        .deco-line { background-image: linear-gradient(to right, #142850 50%, transparent 50%); background-size: 8px 1px; background-repeat: repeat-x; }
        @keyframes pulse-warm { 0%,100% { box-shadow: 0 0 0 0 rgba(180,83,9,0.4); } 50% { box-shadow: 0 0 0 8px rgba(180,83,9,0); } }
        .pulse-warm { animation: pulse-warm 2.5s ease-in-out infinite; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .fade-up { animation: fadeUp 0.6s ease-out backwards; }
        .hover-lift { transition: all 0.2s; }
        .hover-lift:hover { transform: translateY(-2px); border-color: #14285040 !important; }
      `}</style>

      <TopNav activeNav={activeNav} setActiveNav={setActiveNav} />

      <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '48px 40px 80px' }}>
        {/* 시험 응시 중 — 메인 영역에 인라인으로 렌더 (TopNav 그대로 노출, 학습 페이지와 동일한 레이아웃) */}
        {activeExam ? (
          <ExamTakingScreen exam={activeExam} onClose={() => exitExam()} />
        ) : (
          <>
            {activeNav === '대시보드' && <DashboardPage onStartStudy={enterStudy} onGotoWrongNotes={() => setActiveNav('오답노트')} />}
            {activeNav === '오답노트' && <WrongNotesPage onStartStudy={enterStudy} />}
            {activeNav === '학습' && <StudyPage sessionId={activeSessionId} focusProblemId={focusProblemId} onClear={clearSession} onStartStudy={enterStudy} />}
            {activeNav === '개념학습' && <ConceptHubPage embedded />}
            {activeNav === '약점분석' && <WeaknessDashboardPage embedded />}
            {activeNav === '모의고사' && <MockExamPage onStartExam={enterExam} />}
            {activeNav === '리포트' && <ReportPage />}
          </>
        )}
      </main>
    </div>
  );
}

// ============ DASHBOARD ============
function DashboardPage({ onStartStudy, onGotoWrongNotes }: { onStartStudy: (sessionId: string, focus?: string) => void; onGotoWrongNotes: () => void }) {
  const { t } = useT();
  const summary = useQuery({ queryKey: ['dashboard'], queryFn: Q.fetchDashboardSummary });
  const mastery = useQuery({ queryKey: ['mastery'], queryFn: Q.fetchMastery });
  const today = useQuery({ queryKey: ['today'], queryFn: Q.fetchToday });
  const recent = useQuery({ queryKey: ['wn-recent'], queryFn: () => Q.fetchRecentMistakes(3) });
  const heatmap = useQuery({ queryKey: ['heatmap'], queryFn: () => Q.fetchHeatmap(12) });
  const errorDna = useQuery({ queryKey: ['error-dna'], queryFn: Q.fetchErrorDna });
  const diagnosis = useQuery({ queryKey: ['diagnosis'], queryFn: Q.fetchDiagnosis });
  const actStats = useQuery({ queryKey: ['act-stats'], queryFn: Q.fetchActivityStats });

  const [detailNoteId, setDetailNoteId] = useState<string | null>(null);

  const startSessionMut = useMutation({
    mutationFn: (unitId: string) => M.startStudySession({ unitId }),
    onSuccess: (s) => {
      toast(t('toast.session.started'), 'success');
      onStartStudy(s.id);
    },
    onError: () => toast(t('toast.session.startFailed'), 'error'),
  });

  // 유사문제 "풀어보기" — 해당 문제의 단원으로 세션 시작 + focus 설정
  const practiceSimilarMut = useMutation({
    mutationFn: (problemId: string) => M.startStudySessionFromProblem(problemId),
    onSuccess: (s) => {
      setDetailNoteId(null);
      toast(t('toast.session.started'), 'success');
      onStartStudy(s.id, s.focusProblemId);
    },
    onError: () => toast(t('toast.session.startFailed'), 'error'),
  });

  const handleRecommendClick = (unitId: string | null, tag: string) => {
    trackClick('start_study_from_recommend', { unitId, tag });
    if (!unitId) {
      toast(t('toast.session.unitMissing'), 'error');
      return;
    }
    startSessionMut.mutate(unitId);
  };

  const stats = summary.data;

  return (
    <>
      <section style={{ marginBottom: '64px' }} className="fade-up">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#C7791F' }} className="pulse-warm" />
          <span style={{ fontSize: '11px', letterSpacing: '0.25em', color: '#8B95AB', textTransform: 'uppercase' }}>{t('dashboard.diagnosis.label')}</span>
        </div>
        <h1 className="serif" style={{ fontSize: '48px', lineHeight: 1.15, letterSpacing: '-0.025em', fontWeight: 400, margin: 0, maxWidth: '880px' }}>
          {diagnosis.data?.headline ?? t('dashboard.headline.fallback')}
        </h1>

        <div className="deco-line" style={{ height: '1px', marginTop: '32px', marginBottom: '24px' }} />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', borderTop: '1px solid #14285015', borderBottom: '1px solid #14285015' }}>
          {[
            { label: t('dashboard.stat.todayStudy'), value: String(stats?.todayMinutes ?? 0), unit: t('common.minute'),
              sub: t('dashboard.stat.todayGoal', { goal: stats?.todayGoalMinutes ?? 180, pct: Math.round(((stats?.todayMinutes ?? 0) / (stats?.todayGoalMinutes ?? 180)) * 100) }),
              accent: '#C7791F', icon: undefined as undefined | string },
            { label: t('dashboard.stat.streak'), value: String(stats?.streakDays ?? 0), unit: t('common.day'),
              sub: t('dashboard.stat.streakBest'), accent: '#5A8A45', icon: 'Flame' },
            { label: t('dashboard.stat.weeklyAccuracy'), value: String(stats?.weeklyAccuracy ?? 0), unit: t('common.percent'),
              sub: t('dashboard.stat.weeklyDelta', { delta: stats?.weeklyAccuracyDelta ?? 0 }), accent: '#5A8A45', icon: undefined },
            { label: t('dashboard.stat.expectedGrade'), value: String(stats?.expectedGrade ?? '–'), unit: t('common.grade'),
              sub: t('dashboard.stat.gradeFrom', { from: stats?.expectedGradeFrom ?? 3 }), accent: '#142850', icon: undefined },
          ].map((stat, i) => (
            <div key={i} style={{ padding: '24px 28px', borderRight: i < 3 ? '1px solid #14285015' : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
                {stat.icon && Icon(stat.icon, 12, stat.accent)}
                <span style={{ fontSize: '11px', letterSpacing: '0.18em', color: '#8B95AB', textTransform: 'uppercase' }}>{stat.label}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '8px' }}>
                <span className="serif mono" style={{ fontSize: '44px', fontWeight: 500, letterSpacing: '-0.04em', color: stat.accent }}>{stat.value}</span>
                <span style={{ fontSize: '14px', color: '#5C6B85', fontWeight: 500 }}>{stat.unit}</span>
              </div>
              <div style={{ fontSize: '12px', color: '#5C6B85' }}>{stat.sub}</div>
            </div>
          ))}
        </div>
      </section>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '32px', marginBottom: '48px' }}>
        <div className="grain" style={{ backgroundColor: '#F8F4E9', border: '1px solid #14285015', borderRadius: '4px', padding: '32px', position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
            <div>
              <div style={sectionLabelStyle}>No 01 — Mastery Map</div>
              <h2 className="serif" style={{ fontSize: '28px', fontWeight: 500, letterSpacing: '-0.02em', margin: 0 }}>{t('dashboard.section.masteryMap')}</h2>
            </div>
            {diagnosis.data?.weakUnit && (
              <div style={{ fontSize: '11px', padding: '6px 10px', backgroundColor: '#C25E2E', color: '#EFEBDF', borderRadius: '2px', letterSpacing: '0.05em' }}>{t('dashboard.weakDetected')}</div>
            )}
          </div>
          <div style={{ height: '320px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={mastery.data ?? []}>
                <PolarGrid stroke="#14285025" />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12, fill: '#142850', fontWeight: 500 }} />
                <Radar name={t('dashboard.section.masteryMap')} dataKey="value" stroke="#C25E2E" fill="#C25E2E" fillOpacity={0.25} strokeWidth={1.5} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          {diagnosis.data?.weakUnit && (
            <div style={{ marginTop: '16px', padding: '16px', backgroundColor: '#14285008', borderRadius: '4px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <AlertCircle size={16} color="#C25E2E" style={{ marginTop: '2px', flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>{t('dashboard.weakUnit', { unit: diagnosis.data.weakUnit ?? '', score: diagnosis.data.weakScore })}</div>
                <div style={{ fontSize: '12px', color: '#5C6B85', lineHeight: 1.55 }}>{t('dashboard.weakUnit.desc')}</div>
              </div>
            </div>
          )}
        </div>

        <div>
          <div style={{ marginBottom: '20px' }}>
            <div style={sectionLabelStyle}>No 02 — Today</div>
            <h2 className="serif" style={{ fontSize: '28px', fontWeight: 500, letterSpacing: '-0.02em', margin: 0 }}>{t('dashboard.section.today')}</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {(today.data ?? []).map((item, i) => (
              <button
                key={i}
                className="hover-lift"
                disabled={startSessionMut.isPending}
                onClick={() => handleRecommendClick(item.unitId, item.tag)}
                style={{
                  backgroundColor: '#F8F4E9', border: '1px solid #14285015', borderRadius: '4px',
                  padding: '20px', textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit',
                }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', backgroundColor: item.tagColor + '15', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {Icon(item.icon, 18, item.tagColor)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <span style={{ fontSize: '10px', fontWeight: 600, color: item.tagColor, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{item.tag}</span>
                      <span style={{ fontSize: '11px', color: '#AAB4C5' }}>·</span>
                      <span style={{ fontSize: '11px', color: '#5C6B85' }}>{item.unit}</span>
                    </div>
                    <div className="serif" style={{ fontSize: '17px', fontWeight: 500, marginBottom: '8px', letterSpacing: '-0.01em' }}>{item.title}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: '#8B95AB' }}>
                      <span>{item.reason}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>{item.type} <ChevronRight size={12} /></span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>

          <UnitPicker
            disabled={startSessionMut.isPending}
            onPick={(unitId) => {
              trackClick('start_study_from_unitpicker', { unitId });
              startSessionMut.mutate(unitId);
            }}
          />
        </div>
      </div>

      <section style={{ marginBottom: '48px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div>
            <div style={sectionLabelStyle}>No 03 — Wrong Notes</div>
            <h2 className="serif" style={{ fontSize: '28px', fontWeight: 500, letterSpacing: '-0.02em', margin: 0 }}>
              {t('dashboard.section.wrongNotes')}
              <span style={{ fontSize: '14px', color: '#5C6B85', marginLeft: '12px', fontFamily: '"Pretendard", sans-serif', fontWeight: 400 }}>{t('dashboard.section.wrongNotes.sub')}</span>
            </h2>
          </div>
          <button
            onClick={() => { trackClick('view_all_wrongnotes', { from: 'dashboard' }); onGotoWrongNotes(); }}
            style={{
              padding: '8px 14px', fontSize: 12, fontWeight: 600,
              backgroundColor: 'transparent', border: '1px solid #14285030',
              borderRadius: 4, cursor: 'pointer', color: '#142850', fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            {t('dashboard.viewAllWrongNotes')} <ChevronRight size={12} />
          </button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          {(recent.data ?? []).map((m, i) => (
            <div
              key={i}
              className="hover-lift"
              onClick={() => { trackClick('open_wrongnote_detail', { from: 'dashboard_card', noteId: m.id }); setDetailNoteId(m.id); }}
              style={{ backgroundColor: '#F8F4E9', border: '1px solid #14285015', borderRadius: '4px', padding: '20px', cursor: 'pointer' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ fontSize: '10px', color: '#8B95AB', letterSpacing: '0.05em' }}>{m.problem}</span>
                <span style={{ fontSize: '10px', padding: '2px 6px', backgroundColor: m.diff === '준킬러' ? '#C25E2E' : '#C7791F', color: '#EFEBDF', borderRadius: '2px' }}>{m.diff}</span>
              </div>
              <div className="serif" style={{ fontSize: '13px', color: '#8B95AB', marginBottom: '8px', fontStyle: 'italic' }}>{m.unit} · {m.errorType}</div>
              {m.problemBody && (
                <div className="serif" style={{
                  fontSize: '14px', lineHeight: 1.55, color: '#142850', marginBottom: '12px',
                  padding: '10px 12px', backgroundColor: '#14285006', border: '1px solid #14285018',
                  borderRadius: 4,
                  display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                }}>{m.problemBody}</div>
              )}
              <div style={{ fontSize: '13px', lineHeight: 1.55, color: '#5C6B85', marginBottom: '16px' }}>{m.insight}</div>
              <button
                onClick={() => { trackClick('open_wrongnote_detail', { from: 'dashboard', noteId: m.id }); setDetailNoteId(m.id); }}
                style={{ width: '100%', padding: '8px', backgroundColor: 'transparent', border: '1px solid #14285030', borderRadius: '2px', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontFamily: 'inherit', color: '#142850' }}
              >
                <Sparkles size={12} /> {t('dashboard.aiInsight')}
              </button>
            </div>
          ))}
        </div>
      </section>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '32px' }}>
        <div className="grain" style={{ backgroundColor: '#F8F4E9', border: '1px solid #14285015', borderRadius: '4px', padding: '32px', position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
            <div>
              <div style={sectionLabelStyle}>No 04 — Consistency</div>
              <h2 className="serif" style={{ fontSize: '28px', fontWeight: 500, letterSpacing: '-0.02em', margin: 0 }}>{t('dashboard.section.consistency')}</h2>
              <div style={{ fontSize: '12px', color: '#5C6B85', marginTop: '4px' }}>{t('dashboard.heatmap.weeksAgo')} · <span style={{ color: '#5A8A45', fontWeight: 600 }}>{t('dashboard.streakNow', { days: stats?.streakDays ?? 0 })}</span></div>
            </div>
            <Flame size={20} color="#C7791F" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '4px', marginBottom: '20px' }}>
            {(heatmap.data ?? Array.from({ length: 84 }, (_, i) => ({ day: i, intensity: 0 }))).map((d, i) => {
              const colors = ['#14285008', '#C25E2E40', '#C25E2E80', '#C25E2E'];
              return <div key={i} style={{ aspectRatio: '1', backgroundColor: colors[d.intensity] || colors[0], borderRadius: '2px' }} />;
            })}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: '#8B95AB' }}>
            <span>{t('dashboard.heatmap.weeksAgo')}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>{t('dashboard.heatmap.legend.less')}</span>
              {['#14285008', '#C25E2E40', '#C25E2E80', '#C25E2E'].map((c, i) => (
                <div key={i} style={{ width: '10px', height: '10px', backgroundColor: c, borderRadius: '2px' }} />
              ))}
              <span>{t('dashboard.heatmap.legend.more')}</span>
            </div>
            <span>{t('dashboard.heatmap.today')}</span>
          </div>
          <div className="deco-line" style={{ height: '1px', margin: '24px 0' }} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
            {[
              { label: t('dashboard.stats.avgTime'), value: `${actStats.data?.avgMinutesPerDay ?? 0}${t('common.minute')}`, sub: t('dashboard.stats.perDay') },
              { label: t('dashboard.stats.totalProblems'), value: actStats.data?.totalProblems?.toLocaleString() ?? '0', sub: t('common.problem') },
              { label: t('dashboard.stats.avgAccuracy'), value: String(actStats.data?.avgAccuracy ?? 0), sub: t('common.percent') },
            ].map((s, i) => (
              <div key={i}>
                <div style={{ fontSize: '10px', letterSpacing: '0.15em', color: '#8B95AB', textTransform: 'uppercase', marginBottom: '4px' }}>{s.label}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                  <span className="serif mono" style={{ fontSize: '24px', fontWeight: 500, letterSpacing: '-0.02em' }}>{s.value}</span>
                  <span style={{ fontSize: '11px', color: '#5C6B85' }}>{s.sub}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ backgroundColor: '#142850', color: '#EFEBDF', borderRadius: '4px', padding: '32px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '200px', height: '200px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(180,83,9,0.2) 0%, transparent 70%)' }} />
          <div style={{ position: 'relative' }}>
            <div style={{ fontSize: '11px', letterSpacing: '0.2em', color: '#AAB4C5', textTransform: 'uppercase', marginBottom: '6px' }}>No 05 — Error DNA</div>
            <h2 className="serif" style={{ fontSize: '28px', fontWeight: 500, letterSpacing: '-0.02em', margin: 0, marginBottom: '4px' }}>{t('dashboard.section.errorDna')}</h2>
            <div style={{ fontSize: '12px', color: '#AAB4C5', marginBottom: '28px' }}>{t('dashboard.section.errorDna.sub')}</div>
            <div style={{ marginBottom: '24px' }}>
              {(errorDna.data?.distribution ?? []).map((e, i) => (
                <div key={i} style={{ marginBottom: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '13px' }}>
                    <span>{e.name}</span>
                    <span className="mono" style={{ color: '#AAB4C5' }}>{e.value}%</span>
                  </div>
                  <div style={{ height: '4px', backgroundColor: '#EFEBDF20', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${e.value}%`, backgroundColor: e.color, borderRadius: '2px' }} />
                  </div>
                </div>
              ))}
            </div>
            <div style={{ padding: '16px', backgroundColor: '#EFEBDF10', borderLeft: '2px solid #C7791F', borderRadius: '0 2px 2px 0' }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                <Lightbulb size={14} color="#D9A055" style={{ marginTop: '2px', flexShrink: 0 }} />
                <div style={{ fontSize: '12px', lineHeight: 1.65, color: '#E0D8C8' }}>
                  {errorDna.data?.insight ?? t('common.loading')}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: '64px', paddingTop: '32px', borderTop: '1px solid #14285015', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '11px', color: '#8B95AB', letterSpacing: '0.05em' }}>
          {t('dashboard.lastUpdate', { ago: diagnosis.data?.updatedAgo ?? '—', version: diagnosis.data?.version ?? 'v2.4.1' })}
        </div>
        <div className="serif" style={{ fontSize: '13px', fontStyle: 'italic', color: '#5C6B85' }}>"Excellence is a habit not an act" — Aristotle</div>
      </div>

      <WrongNoteDetailModal
        noteId={detailNoteId}
        onClose={() => setDetailNoteId(null)}
        onPracticeSimilar={(pid) => practiceSimilarMut.mutate(pid)}
      />
    </>
  );
}

// ============ WRONG NOTES PAGE ============
function WrongNotesPage({ onStartStudy }: { onStartStudy: (sessionId: string, focus?: string) => void }) {
  const { t, lang } = useT();
  const [filter, setFilter] = useState<string>('전체');
  const [sort, setSort] = useState<'newest' | 'oldest'>('newest');
  const [sortOpen, setSortOpen] = useState(false);
  const [detailNoteId, setDetailNoteId] = useState<string | null>(null);
  const [registerMode, setRegisterMode] = useState<'text' | 'photo' | 'pdf' | null>(null);
  const qc = useQueryClient();

  const practiceSimilarMut = useMutation({
    mutationFn: (problemId: string) => M.startStudySessionFromProblem(problemId),
    onSuccess: (s) => {
      setDetailNoteId(null);
      toast(t('toast.session.started'), 'success');
      onStartStudy(s.id, s.focusProblemId);
    },
    onError: () => toast(t('toast.session.startFailed'), 'error'),
  });

  const stats = useQuery({ queryKey: ['wn-stats'], queryFn: Q.fetchWrongNotesStats });
  const list = useQuery({
    queryKey: ['wn-list', filter, sort],
    queryFn: () => Q.fetchWrongNotes({ unitName: filter === '전체' ? undefined : filter, sort }),
  });
  const patterns = useQuery({ queryKey: ['patterns'], queryFn: Q.fetchPatterns });

  const masterMut = useMutation({
    mutationFn: (id: string) => M.updateWrongNoteStatus(id, 'MASTERED'),
    onSuccess: () => {
      toast(t('toast.master.success'), 'success');
      qc.invalidateQueries({ queryKey: ['wn-list'] });
      qc.invalidateQueries({ queryKey: ['wn-stats'] });
      qc.invalidateQueries({ queryKey: ['wn-recent'] });
    },
    onError: () => toast(t('toast.master.failed'), 'error'),
  });

  return (
    <>
      <section style={{ marginBottom: '48px' }} className="fade-up">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#C25E2E' }} className="pulse-warm" />
          <span style={{ fontSize: '11px', letterSpacing: '0.25em', color: '#8B95AB', textTransform: 'uppercase' }}>{t('wn.label')}</span>
        </div>
        <h1 className="serif" style={{ fontSize: '48px', lineHeight: 1.15, letterSpacing: '-0.025em', fontWeight: 400, margin: 0, maxWidth: '880px' }}>
          <em style={{ color: '#C25E2E', fontStyle: 'italic', fontWeight: 500 }}>
            {t('wn.headline.count', { n: stats.data?.total ?? 0 })}
          </em><br />
          <span style={{ color: '#5C6B85' }}>{t('wn.headline.suffix')}</span>
        </h1>

        <div className="deco-line" style={{ height: '1px', marginTop: '32px', marginBottom: '24px' }} />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', borderTop: '1px solid #14285015', borderBottom: '1px solid #14285015' }}>
          {[
            { label: t('wn.stat.total'), value: String(stats.data?.total ?? 0), unit: t('common.problem'), accent: '#142850' },
            { label: t('wn.stat.analyzed'), value: String(stats.data?.analyzed ?? 0), unit: t('common.problem'), accent: '#C7791F' },
            { label: t('wn.stat.mastered'), value: String(stats.data?.mastered ?? 0), unit: t('common.problem'),
              sub: t('wn.stat.masteredPct', { pct: stats.data?.masteredPct ?? 0 }), accent: '#5A8A45' },
            { label: t('wn.stat.retry'), value: String(stats.data?.retryAccuracy ?? 0), unit: t('common.percent'),
              sub: t('wn.stat.retrySub'), accent: '#5A8A45' },
          ].map((stat, i) => (
            <div key={i} style={{ padding: '24px 28px', borderRight: i < 3 ? '1px solid #14285015' : 'none' }}>
              <div style={{ fontSize: '11px', letterSpacing: '0.18em', color: '#8B95AB', textTransform: 'uppercase', marginBottom: '12px' }}>{stat.label}</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '8px' }}>
                <span className="serif mono" style={{ fontSize: '44px', fontWeight: 500, letterSpacing: '-0.04em', color: stat.accent }}>{stat.value}</span>
                <span style={{ fontSize: '14px', color: '#5C6B85', fontWeight: 500 }}>{stat.unit}</span>
              </div>
              {(stat as any).sub && <div style={{ fontSize: '12px', color: '#5C6B85' }}>{(stat as any).sub}</div>}
            </div>
          ))}
        </div>
      </section>

      <section style={{ marginBottom: '48px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          {[
            { icon: Camera, label: t('wn.register.photo'), sub: t('wn.register.photoSub'), color: '#C25E2E' },
            { icon: FileText, label: t('wn.register.text'), sub: t('wn.register.textSub'), color: '#C7791F' },
            { icon: ImageIcon, label: t('wn.register.pdf'), sub: t('wn.register.pdfSub'), color: '#5A8A45' },
          ].map((item, i) => {
            const I = item.icon;
            const modes: Array<'photo' | 'text' | 'pdf'> = ['photo', 'text', 'pdf'];
            return (
              <button
                key={i}
                className="hover-lift"
                onClick={() => setRegisterMode(modes[i])}
                style={{
                  backgroundColor: '#F8F4E9', border: '1px dashed #14285030', borderRadius: '4px',
                  padding: '24px', display: 'flex', alignItems: 'center', gap: '16px',
                  cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
                }}>
                <div style={{ width: '48px', height: '48px', backgroundColor: item.color + '15', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <I size={22} color={item.color} />
                </div>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 600, color: '#142850', marginBottom: '4px' }}>{item.label}</div>
                  <div style={{ fontSize: '12px', color: '#5C6B85' }}>{item.sub}</div>
                </div>
                <Plus size={18} color="#142850" style={{ marginLeft: 'auto', flexShrink: 0 }} />
              </button>
            );
          })}
        </div>
      </section>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid #14285015' }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <Filter size={14} color="#8B95AB" />
          {(() => {
            // NCERT Class 11 핵심 단원 필터 (PoC 페르소나 = Class 11 JEE 준비).
            const ko = ['전체', '삼각함수 (일반각)', '관계와 함수', '극한과 미분 입문', '복소수와 이차방정식'];
            const enMap: Record<string, string> = {
              '전체': 'All',
              '삼각함수 (일반각)': 'Trigonometric Functions',
              '관계와 함수': 'Relations and Functions',
              '극한과 미분 입문': 'Limits and Derivatives',
              '복소수와 이차방정식': 'Complex Numbers',
            };
            const display = (f: string) => lang === 'en' ? (enMap[f] ?? f) : f;
            return ko.map(f => (
              <button key={f} onClick={() => setFilter(f)} style={{
                padding: '6px 12px', fontSize: '13px',
                fontWeight: filter === f ? 600 : 400,
                color: filter === f ? '#EFEBDF' : '#5C6B85',
                backgroundColor: filter === f ? '#142850' : 'transparent',
                border: '1px solid ' + (filter === f ? '#142850' : '#14285030'),
                borderRadius: '999px', cursor: 'pointer', fontFamily: 'inherit',
              }}>{display(f)}</button>
            ));
          })()}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#5C6B85', position: 'relative' }}>
          <span>{t('wn.sort.label')}</span>
          <button
            onClick={() => setSortOpen((v) => !v)}
            style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', color: '#142850', fontWeight: 600, fontFamily: 'inherit' }}
          >
            {sort === 'newest' ? t('wn.sort.newest') : t('wn.sort.oldest')} <ChevronDown size={12} />
          </button>
          {sortOpen && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 10,
              backgroundColor: '#F8F4E9', border: '1px solid #14285030', borderRadius: 4,
              boxShadow: '0 8px 20px rgba(31,26,20,0.12)', minWidth: 120,
              fontFamily: 'inherit',
            }}>
              {(['newest', 'oldest'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => { setSort(s); setSortOpen(false); }}
                  style={{
                    display: 'block', width: '100%', padding: '10px 14px',
                    background: sort === s ? '#14285008' : 'transparent',
                    border: 'none', textAlign: 'left', cursor: 'pointer',
                    fontSize: 13, fontFamily: 'inherit',
                    color: sort === s ? '#142850' : '#5C6B85',
                    fontWeight: sort === s ? 600 : 400,
                  }}
                >
                  {s === 'newest' ? t('wn.sort.newest') : t('wn.sort.oldest')}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px', marginBottom: '48px' }}>
        {(list.data ?? []).map((note) => (
          <div
            key={note.id}
            className="hover-lift"
            onClick={() => setDetailNoteId(note.id)}
            style={{
              backgroundColor: '#F8F4E9', border: '1px solid #14285015',
              borderRadius: '4px', padding: '24px', position: 'relative', cursor: 'pointer',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <div style={{ fontSize: '11px', color: '#8B95AB', marginBottom: '6px', letterSpacing: '0.05em' }}>{note.problem}</div>
                <div className="serif" style={{ fontSize: '17px', fontWeight: 500, letterSpacing: '-0.01em' }}>
                  {note.unit} <span style={{ color: '#8B95AB', fontStyle: 'italic' }}>· {note.subUnit}</span>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                <span style={{
                  fontSize: '10px', padding: '3px 8px',
                  backgroundColor: note.diff === '킬러' ? '#142850' : note.diff === '준킬러' ? '#C25E2E' : '#C7791F',
                  color: '#EFEBDF', borderRadius: '2px', letterSpacing: '0.05em',
                }}>{note.diff}</span>
                {note.status === 'mastered' && (
                  <span style={{ fontSize: '10px', color: '#5A8A45', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <CheckCircle2 size={11} /> {t('wn.master.completed')}
                  </span>
                )}
                {note.status !== 'mastered' && note.dueIn && (
                  <span style={{
                    fontSize: '10px',
                    color: note.isDue ? '#C25E2E' : '#5C6B85',
                    fontWeight: note.isDue ? 600 : 400,
                    display: 'flex', alignItems: 'center', gap: '3px',
                    fontFamily: 'JetBrains Mono, monospace',
                  }}>
                    <Clock size={10} /> {note.dueIn}
                  </span>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <span style={{ fontSize: '10px', padding: '2px 8px', backgroundColor: '#C25E2E15', color: '#C25E2E', borderRadius: '2px', fontWeight: 600 }}>{note.errorType}</span>
              <span style={{ fontSize: '11px', color: '#AAB4C5' }}>· {note.date}</span>
            </div>

            {note.problemBody && (
              <div className="serif" style={{
                padding: '12px 14px', backgroundColor: '#F8F4E9',
                border: '1px solid #14285018', borderRadius: 4, marginBottom: '12px',
                fontSize: '14px', lineHeight: 1.6, color: '#142850',
                display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
              }}>{note.problemBody}</div>
            )}

            <div style={{ padding: '14px', backgroundColor: '#14285008', borderLeft: '2px solid #14285030', borderRadius: '0 2px 2px 0', marginBottom: '16px' }}>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
                <Sparkles size={12} color="#C25E2E" style={{ marginTop: '3px', flexShrink: 0 }} />
                <div style={{ fontSize: '13px', color: '#142850', lineHeight: 1.6 }}>{note.insight}</div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', color: '#5C6B85' }}>{t('wn.similar', { n: note.similarCount })}</span>
              <button
                disabled={note.status === 'mastered' || masterMut.isPending}
                onClick={(e) => { e.stopPropagation(); masterMut.mutate(note.id); }}
                style={{
                  fontSize: '12px', padding: '6px 12px',
                  backgroundColor: note.status === 'mastered' ? '#5A8A45' : '#142850',
                  color: '#EFEBDF', border: 'none', borderRadius: '2px',
                  cursor: note.status === 'mastered' ? 'default' : 'pointer',
                  display: 'flex', alignItems: 'center', gap: '4px', fontFamily: 'inherit',
                  opacity: masterMut.isPending ? 0.6 : 1,
                }}
              >
                {note.status === 'mastered' ? t('wn.master.completed') : t('wn.master')} <ArrowRight size={12} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div style={{ backgroundColor: '#142850', color: '#EFEBDF', borderRadius: '4px', padding: '40px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-80px', right: '-80px', width: '300px', height: '300px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(180,83,9,0.15) 0%, transparent 70%)' }} />
        <div style={{ position: 'relative' }}>
          <div style={{ fontSize: '11px', letterSpacing: '0.2em', color: '#AAB4C5', textTransform: 'uppercase', marginBottom: '6px' }}>AI Pattern Analysis</div>
          <h2 className="serif" style={{ fontSize: '32px', fontWeight: 500, letterSpacing: '-0.02em', margin: 0, marginBottom: '32px' }}>
            {t('wn.aiPattern.title')}
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
            {(patterns.data ?? []).map((p) => (
              <div key={p.num} style={{ borderTop: '1px solid #EFEBDF20', paddingTop: '20px' }}>
                <div className="serif mono" style={{ fontSize: '32px', color: '#D9A055', fontWeight: 400, marginBottom: '12px', letterSpacing: '-0.04em' }}>{p.num}</div>
                <div className="serif" style={{ fontSize: '20px', fontWeight: 500, marginBottom: '12px', letterSpacing: '-0.01em' }}>{p.title}</div>
                <div style={{ fontSize: '13px', color: '#E0D8C8', lineHeight: 1.65, marginBottom: '16px' }}>{p.desc}</div>
                <div style={{ fontSize: '11px', color: '#AAB4C5', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{t('wn.aiPattern.foundCount', { n: p.count })}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <WrongNoteDetailModal
        noteId={detailNoteId}
        onClose={() => setDetailNoteId(null)}
        onPracticeSimilar={(pid) => practiceSimilarMut.mutate(pid)}
      />
      <RegisterWrongNoteModal
        open={registerMode !== null}
        initialMode={registerMode ?? 'text'}
        onClose={() => setRegisterMode(null)}
      />
    </>
  );
}

// ============ STUDY PAGE (동적: 활성 세션이 있으면 데이터 연결, 없으면 안내) ============
function StudyPage({ sessionId, focusProblemId, onClear, onStartStudy }: {
  sessionId: string | null;
  focusProblemId?: string | null;
  onClear: () => void;
  onStartStudy?: (id: string, focus?: string) => void;
}) {
  if (!sessionId) return <StudyPlaceholder onStartStudy={onStartStudy} />;
  return <StudySession sessionId={sessionId} focusProblemId={focusProblemId} onClear={onClear} />;
}

function StudyPlaceholder({ onStartStudy }: { onStartStudy?: (id: string) => void }) {
  const { t } = useT();
  const navigate = useNavigate();
  const [recGrade, setRecGrade] = useState<string>('__mine__');
  const startSessionMut = useMutation({
    mutationFn: (unitId: string) => M.startStudySession({ unitId }),
    onSuccess: (s) => {
      toast(t('toast.session.started'), 'success');
      onStartStudy?.(s.id);
    },
    onError: () => toast(t('toast.session.startFailed'), 'error'),
  });

  /**
   * 단원 학습 진입 게이팅:
   * 추천 단원 카드 클릭 시 — 해당 unit 에 매핑된 NCERT ConceptLesson 중 mastered=false 가
   * 하나라도 있으면 그 첫 챕터의 개념학습으로 먼저 이동.
   * 모두 mastered 거나 단원에 매핑된 ConceptLesson 이 없으면 곧바로 학습 세션 시작.
   *
   * 이 게이팅이 없으면 사용자가 개념 없이 문제풀이로 직행할 수 있어 "사전 개념학습" 흐름이 강제되지 않는다.
   */
  const enterUnit = async (unitId: string) => {
    try {
      const lessons = await Q.fetchConceptLessonsForUnit(unitId);
      const unmastered = lessons.find((l) => !l.mastered);
      if (unmastered) {
        toast(t('study.gate.toConcept', { title: unmastered.title }), 'success');
        navigate(`/learn/${unmastered.chapterCode}`);
        return;
      }
    } catch {
      // ConceptLesson API 실패해도 학습은 계속 가능하도록 fallthrough
    }
    startSessionMut.mutate(unitId);
  };
  const recommended = useQuery({
    queryKey: ['study-recommended-units', recGrade],
    queryFn: () => get<Array<{
      unitId: string; unit: string; mastery: number; wrongCount: number;
      attemptCount: number; studyMinutes: number; weight: number; reason: string;
    }>>('/study-sessions/recommended-units', { count: 3, grade: recGrade }),
  });
  return (
    <div className="fade-up" style={{
      maxWidth: 720, margin: '0 auto', padding: '40px 24px',
    }}>
      <div style={{ fontSize: '11px', letterSpacing: '0.25em', color: '#8B95AB', textTransform: 'uppercase', marginBottom: '12px' }}>
        {t('study.placeholder.label')}
      </div>
      <h2 className="serif" style={{ fontSize: '32px', fontWeight: 500, letterSpacing: '-0.02em', margin: 0, marginBottom: '12px' }}>
        {t('study.placeholder.title')}
      </h2>
      <div style={{ fontSize: '14px', color: '#5C6B85', lineHeight: 1.65, marginBottom: 20 }}>
        {t('study.placeholder.desc')}
      </div>

      {/* 사전 개념학습 진입 배너 — 문제풀기 전, 인지심리 6원칙으로 짧게 빅 아이디어를 잡는다 */}
      <button
        onClick={() => { trackClick('open_concept_hub'); navigate('/learn'); }}
        className="hover-lift"
        style={{
          display: 'block', width: '100%', textAlign: 'left',
          padding: '18px 20px', marginBottom: 28,
          background: 'linear-gradient(135deg, #142850 0%, #1FB8C4 100%)',
          color: '#fff', borderRadius: 8, border: 'none', cursor: 'pointer',
          fontFamily: 'inherit',
        }}
      >
        <div style={{ fontSize: 11, letterSpacing: '0.22em', textTransform: 'uppercase', opacity: 0.7, marginBottom: 6 }}>
          {t('study.concept.banner.label')}
        </div>
        <div className="serif" style={{ fontSize: 20, fontWeight: 600, marginBottom: 4 }}>
          {t('study.concept.banner.title')}
        </div>
        <div style={{ fontSize: 13, lineHeight: 1.55, opacity: 0.85 }}>
          {t('study.concept.banner.desc')}
        </div>
      </button>

      {/* 가중치 기반 추천 단원 카드 */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ fontSize: '11px', letterSpacing: '0.18em', color: '#8B95AB', textTransform: 'uppercase', fontWeight: 600 }}>
            {t('study.recommend.title')}
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#5C6B85' }}>
            <span style={{ letterSpacing: '0.1em', textTransform: 'uppercase' }}>{t('unitPicker.gradeFilter')}</span>
            <select
              value={recGrade}
              onChange={(e) => setRecGrade(e.target.value)}
              style={{
                padding: '6px 10px', fontSize: 12,
                border: '1px solid #14285030', borderRadius: 4,
                backgroundColor: '#EFEBDF', outline: 'none', fontFamily: 'inherit',
              }}
            >
              {(['__mine__', 'G_MIDDLE_1', 'G_MIDDLE_2', 'G_MIDDLE_3', 'G_HIGH_1', 'G_HIGH_2', 'G_HIGH_3', '__all__'] as const).map((g) => (
                <option key={g} value={g}>
                  {g === '__mine__' ? t('unitPicker.gradeMine') : g === '__all__' ? t('unitPicker.allGrades') : t(`grade.${g}`)}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
          {(recommended.data ?? []).map((r) => (
            <button
              key={r.unitId}
              className="hover-lift"
              disabled={startSessionMut.isPending}
              onClick={() => {
                trackClick('start_study_from_recommend', { unitId: r.unitId, weight: r.weight });
                enterUnit(r.unitId);
              }}
              style={{
                padding: 16, textAlign: 'left',
                backgroundColor: '#F8F4E9', border: '1px solid #14285020',
                borderLeft: '3px solid #1FB8C4', borderRadius: '0 4px 4px 0',
                cursor: 'pointer', fontFamily: 'inherit', color: '#142850',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
                <span className="serif" style={{ fontSize: 17, fontWeight: 600 }}>{r.unit}</span>
                <span style={{ fontSize: 10, padding: '2px 6px', backgroundColor: '#1FB8C4', color: '#142850', borderRadius: 2, fontWeight: 700 }}>
                  {t('study.recommend.weight', { w: r.weight })}
                </span>
              </div>
              <div style={{ fontSize: 11, color: '#5C6B85', lineHeight: 1.55 }}>{r.reason}</div>
            </button>
          ))}
          {(recommended.data ?? []).length === 0 && (
            <div style={{ fontSize: 12, color: '#8B95AB', padding: 16 }}>
              {t('study.recommend.empty')}
            </div>
          )}
        </div>
      </div>

      {/* 수동 학년·단원 선택 */}
      <UnitPicker
        disabled={startSessionMut.isPending}
        onPick={(unitId) => {
          trackClick('start_study_from_studyplaceholder', { unitId });
          startSessionMut.mutate(unitId);
        }}
      />
    </div>
  );
}

function StudySession({ sessionId, focusProblemId, onClear }: { sessionId: string; focusProblemId?: string | null; onClear: () => void }) {
  const qc = useQueryClient();
  const { t } = useT();
  const session = useQuery({
    queryKey: ['study-session', sessionId],
    queryFn: () => Q.fetchStudySession(sessionId),
    retry: false,
  });
  useEffect(() => {
    if (session.isError) {
      toast(t('toast.session.expired'), 'info');
      onClear();
    }
  }, [session.isError, onClear]);
  // 적정 난이도 매칭 (Vygotsky ZPD): 사용자의 단원 숙련도에 맞는 난이도 문제만
  const problems = useQuery({
    queryKey: ['problems-recommended', session.data?.unitId],
    queryFn: () => get<Q.Problem[]>('/problems/recommended', { unitId: session.data!.unitId }),
    enabled: !!session.data?.unitId,
  });
  const [perspective, setPerspective] = useState<'공식 중심' | '단계별' | '시각화' | '실생활 예시'>('단계별');
  const [confidence, setConfidence] = useState(50);
  const [showHint, setShowHint] = useState(false);
  const [paused, setPaused] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const startedAt = useRef<number>(Date.now());

  // 3단계 객관식 상태
  const [problemStep, setProblemStep] = useState<1 | 2 | 3>(1);
  const [selectedChoiceId, setSelectedChoiceId] = useState<string | null>(null);
  const [stepResults, setStepResults] = useState<Record<number, { correct: boolean; choiceId: string }>>({});
  // 같은 step에서 이미 시도한 오답 choiceId 모음 (재선택 방지)
  const [wrongChoiceIds, setWrongChoiceIds] = useState<Set<string>>(new Set());
  // 최근 제출 피드백 (정답이면 성공, 오답이면 distractor 설명)
  const [lastFeedback, setLastFeedback] = useState<{
    isCorrect: boolean; choiceId: string; choiceText: string;
    distractorType?: string | null; rationale?: string | null;
  } | null>(null);

  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [paused]);

  const step = session.data?.currentStep ?? 1;
  const total = session.data?.totalSessions ?? 5;
  // focusProblemId 가 지정된 경우 해당 문제를 맨 앞으로 이동 — 유사문제 "풀어보기" 동선
  const problemListRaw = problems.data ?? [];
  const problemList = focusProblemId
    ? [...problemListRaw].sort((a, b) => (a.id === focusProblemId ? -1 : b.id === focusProblemId ? 1 : 0))
    : problemListRaw;
  const currentProblem = problemList[Math.min(step - 1, problemList.length - 1)] ?? problemList[0];
  const problemsEmpty = problems.isSuccess && problemList.length === 0;
  const currentStep = currentProblem?.steps?.find((s) => s.stepIndex === problemStep);
  const totalSteps = currentProblem?.steps?.length ?? 3;

  // 문제가 바뀌면 객관식 상태 리셋
  useEffect(() => {
    setProblemStep(1);
    setSelectedChoiceId(null);
    setStepResults({});
    setWrongChoiceIds(new Set());
    setLastFeedback(null);
    setConfidence(50);
    startedAt.current = Date.now();
  }, [currentProblem?.id]);

  const guide = useQuery({
    queryKey: ['guide', sessionId, perspective],
    queryFn: () => Q.fetchSessionGuide(sessionId, perspective),
    enabled: !!sessionId,
  });

  const hintQuery = useQuery({
    queryKey: ['hint', currentProblem?.id],
    queryFn: () => Q.fetchProblemHint(currentProblem!.id),
    enabled: !!currentProblem?.id && showHint,
  });

  const submitStepMut = useMutation({
    mutationFn: (choiceId: string) => M.submitStudyAnswer(sessionId, {
      problemId: currentProblem!.id, answer: '',
      durationSec: Math.max(1, Math.floor((Date.now() - startedAt.current) / 1000)),
      // 첫 시도에만 confidence 보냄 (재시도엔 메타인지 의미 흐려짐)
      confidence: wrongChoiceIds.size === 0 ? confidence : undefined,
      stepIndex: problemStep,
      choiceId,
    }),
    onSuccess: (r) => {
      const feedback = {
        isCorrect: r.isCorrect,
        choiceId: r.choice?.id ?? selectedChoiceId!,
        choiceText: r.choice?.text ?? '',
        distractorType: r.choice?.distractorType,
        rationale: r.choice?.rationale,
      };
      setLastFeedback(feedback);

      if (r.isCorrect) {
        // 정답 → 단계 잠금
        setStepResults((prev) => ({ ...prev, [problemStep]: { correct: true, choiceId: feedback.choiceId } }));
        toast(t('toast.step.correct', { n: problemStep }), 'success');
      } else {
        // 오답 → wrongChoiceIds에 추가, selection만 해제 (다른 선택지로 재시도)
        setWrongChoiceIds((prev) => new Set([...prev, feedback.choiceId]));
        setSelectedChoiceId(null);
        toast(t('toast.step.wrong', { n: problemStep }), 'info');
      }
    },
    onError: () => toast(t('toast.step.submitFailed'), 'error'),
  });

  const nextMut = useMutation({
    mutationFn: () => M.advanceStudyStep(sessionId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['study-session', sessionId] });
      setShowHint(false); startedAt.current = Date.now();
    },
    onError: () => toast(t('toast.session.endFailed'), 'error'),
  });

  const goNextStep = () => {
    if (problemStep < totalSteps) {
      setProblemStep((s) => (s + 1) as 1 | 2 | 3);
      setSelectedChoiceId(null);
      setWrongChoiceIds(new Set());
      setLastFeedback(null);
      setConfidence(50);
      startedAt.current = Date.now();
    } else {
      // 모든 단계 완료 → 다음 문제
      nextMut.mutate();
    }
  };

  const endMut = useMutation({
    mutationFn: () => M.endStudySession(sessionId),
    onSuccess: () => {
      toast(t('toast.session.ended'), 'success');
      onClear();
    },
    onError: () => toast(t('toast.session.endFailed'), 'error'),
  });

  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');

  return (
    <>
      <div style={{ marginBottom: '32px' }} className="fade-up">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <div style={sectionLabelStyle}>Session {String(session.data?.sessionNumber ?? 1).padStart(2, '0')} of {String(total).padStart(2, '0')}</div>
            <h1 className="serif" style={{ fontSize: '32px', fontWeight: 500, letterSpacing: '-0.02em', margin: 0, marginTop: '4px' }}>
              {currentProblem?.source ?? t('study.problem.loading')}
            </h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', backgroundColor: '#F8F4E9', border: '1px solid #14285015', borderRadius: '4px' }}>
              <Clock size={14} color="#8B95AB" />
              <span className="mono" style={{ fontSize: '14px', fontWeight: 600 }}>{mm}:{ss}</span>
              <button onClick={() => setPaused((v) => !v)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#5C6B85', display: 'flex' }}>
                {paused ? <Play size={14} /> : <Pause size={14} />}
              </button>
            </div>
            <button
              onClick={() => endMut.mutate()}
              disabled={endMut.isPending}
              style={{ padding: '10px 16px', backgroundColor: 'transparent', border: '1px solid #14285030', borderRadius: '4px', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' }}
            >
              {endMut.isPending ? t('study.session.endBusy') : t('study.session.endBtn')}
            </button>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
          {Array.from({ length: total }).map((_, i) => {
            const n = i + 1;
            return <div key={n} style={{
              flex: 1, height: '4px',
              backgroundColor: n < step ? '#5A8A45' : n === step ? '#C7791F' : '#14285018',
              borderRadius: '2px',
            }} />;
          })}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: '32px', marginBottom: '32px' }}>
        <div className="grain" style={{ backgroundColor: '#F8F4E9', border: '1px solid #14285015', borderRadius: '4px', padding: '40px', position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
            <div>
              <div style={sectionLabelStyle}>Problem {String(step).padStart(2, '0')}</div>
              <div className="serif" style={{ fontSize: '14px', color: '#8B95AB', fontStyle: 'italic' }}>
                {currentProblem?.source ?? '—'}
              </div>
            </div>
            {currentProblem && (
              <span style={{ fontSize: '11px', padding: '4px 10px', backgroundColor: '#C25E2E', color: '#EFEBDF', borderRadius: '2px' }}>
                {currentProblem.difficulty}
              </span>
            )}
          </div>
          <div className="serif" style={{ fontSize: '18px', lineHeight: 1.7, color: '#142850', marginBottom: '24px', whiteSpace: 'pre-wrap' }}>
            {problemsEmpty ? (
              <span style={{ color: '#8B95AB', fontStyle: 'italic', fontSize: 15 }}>
                {t('study.problem.empty')}
              </span>
            ) : currentProblem?.body ? <MathText text={currentProblem.body} /> : t('study.problem.loading')}
          </div>
          {/* 공식은 정답 스포일러가 되므로 여기서는 표시하지 않음 — 풀이 후 핵심 개념 패널에서만 노출 */}
          {/* 3단계 객관식 — CONCEPT → PROCESS → ANSWER */}
          {currentStep ? (
            <>
              {/* 단계 표시 */}
              <div style={{ marginBottom: '14px' }}>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 8 }}>
                  {[1, 2, 3].map((n) => {
                    const result = stepResults[n];
                    const isCurrent = n === problemStep;
                    const bg = result?.correct ? '#5A8A45' :
                               result && !result.correct ? '#C25E2E' :
                               isCurrent ? '#C7791F' : '#14285018';
                    const label = n === 1 ? t('study.step.concept') : n === 2 ? t('study.step.process') : t('study.step.answer');
                    return (
                      <div key={n} style={{
                        flex: 1, padding: '6px 10px',
                        backgroundColor: bg,
                        color: result || isCurrent ? '#EFEBDF' : '#5C6B85',
                        borderRadius: 4, fontSize: 11, fontWeight: 600,
                        textAlign: 'center', letterSpacing: '0.05em',
                      }}>
                        {`${n}/3`} · {label} {result?.correct ? '✓' : result && !result.correct ? '✗' : ''}
                      </div>
                    );
                  })}
                </div>
                <div style={{ fontSize: 14, color: '#142850', fontWeight: 600, marginTop: 12, lineHeight: 1.5 }}>
                  Q{problemStep}. {currentStep.prompt}
                </div>
              </div>

              {/* 5지선다 — mastery learning 모드 (정답까지 재시도). 표시 번호는 배열 순서 기준 (백엔드가 매 요청마다 셔플). */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
                {currentStep.choices.map((c, idx) => {
                  const stepLocked = !!stepResults[problemStep];   // 정답 맞춰서 잠김
                  const isAlreadyWrong = wrongChoiceIds.has(c.id); // 이미 틀린 선택지
                  const isCurrentSelection = !stepLocked && selectedChoiceId === c.id;
                  const isFinalCorrect = stepLocked && stepResults[problemStep].choiceId === c.id;
                  const disabled = stepLocked || isAlreadyWrong;

                  // 색상 결정
                  let bgColor = '#F8F4E9';
                  let borderColor = '#14285030';
                  let icon: string | null = null;
                  let textColor = '#142850';
                  if (isFinalCorrect) {
                    bgColor = '#5A8A4518'; borderColor = '#5A8A45'; icon = '✓';
                  } else if (isAlreadyWrong) {
                    bgColor = '#C25E2E12'; borderColor = '#C25E2E'; icon = '✗';
                    textColor = '#8B95AB';
                  } else if (stepLocked) {
                    // 단계 종료 — 정답이 아니었던 다른 선택지: 회색 처리
                    bgColor = '#14285005'; borderColor = '#14285018';
                    textColor = '#AAB4C5';
                  } else if (isCurrentSelection) {
                    bgColor = '#14285008'; borderColor = '#142850';
                  }

                  return (
                    <button
                      key={c.id}
                      onClick={() => !disabled && setSelectedChoiceId(c.id)}
                      disabled={disabled}
                      style={{
                        padding: '10px 14px', textAlign: 'left',
                        border: '1px solid ' + borderColor,
                        backgroundColor: bgColor, color: textColor,
                        borderRadius: 4, fontSize: 14, fontFamily: 'inherit',
                        cursor: disabled ? 'default' : 'pointer',
                        display: 'flex', alignItems: 'flex-start', gap: 10,
                        transition: 'all 0.15s',
                      }}
                    >
                      <span style={{
                        flexShrink: 0, width: 22, height: 22, borderRadius: '50%',
                        backgroundColor:
                          isFinalCorrect ? '#5A8A45' :
                          isAlreadyWrong ? '#C25E2E' :
                          isCurrentSelection ? '#142850' : '#14285010',
                        color: isFinalCorrect || isAlreadyWrong || isCurrentSelection ? '#EFEBDF' : '#5C6B85',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 11, fontWeight: 600,
                      }}>
                        {icon ?? (idx + 1)}
                      </span>
                      <span style={{ flex: 1, fontFamily: 'JetBrains Mono, monospace', fontSize: 13, lineHeight: 1.5 }}>{c.text}</span>
                    </button>
                  );
                })}
              </div>

              {/* 즉시 피드백 — 정답이면 초록 성공, 오답이면 distractor 설명 */}
              {lastFeedback && (
                <div style={{
                  padding: 14,
                  backgroundColor: lastFeedback.isCorrect ? '#5A8A4512' : '#C25E2E0E',
                  border: `1px solid ${lastFeedback.isCorrect ? '#5A8A4540' : '#C25E2E40'}`,
                  borderRadius: 4, marginBottom: 12,
                  fontSize: 13, lineHeight: 1.65,
                }}>
                  {lastFeedback.isCorrect ? (
                    <div>
                      <div style={{ fontWeight: 600, color: '#5A8A45', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <CheckCircle2 size={14} /> {t('study.feedback.correct.title', { next: problemStep < totalSteps ? t('study.feedback.correct.continue') : t('study.feedback.correct.lastStep') })}
                      </div>
                      <div style={{ color: '#142850' }}>
                        {problemStep === 1 ? t('study.feedback.correct.step1') :
                         problemStep === 2 ? t('study.feedback.correct.step2') :
                         t('study.feedback.correct.step3')}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div style={{ fontWeight: 600, color: '#C25E2E', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <AlertCircle size={14} />
                        {lastFeedback.distractorType === 'CONCEPT_CONFUSION' ? t('study.feedback.distractor.concept') :
                         lastFeedback.distractorType === 'CALC_ERROR' ? t('study.feedback.distractor.calc') :
                         lastFeedback.distractorType === 'PROCESS_SKIP' ? t('study.feedback.distractor.process') :
                         lastFeedback.distractorType === 'TIME_PRESSURE_GUESS' ? t('study.feedback.distractor.time') : t('study.feedback.distractor.other')}
                      </div>
                      {lastFeedback.rationale && (
                        <div style={{ color: '#142850', marginBottom: 6 }}>{lastFeedback.rationale}</div>
                      )}
                      <div style={{ fontSize: 12, color: '#5C6B85' }}>
                        {t('study.feedback.wrong.tryAgain')}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 핵심 개념 + 관련 공식 — 한 번이라도 틀렸거나 마지막 단계까지 정답 도달 시 노출 */}
              {currentProblem?.concept && (lastFeedback || (stepResults[3]?.correct)) && (
                <div style={{
                  padding: 14, marginBottom: 12,
                  backgroundColor: '#14285008',
                  border: '1px solid #14285020', borderLeft: '3px solid #C25E2E',
                  borderRadius: '0 4px 4px 0',
                }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase',
                    color: '#C25E2E', fontWeight: 600, marginBottom: 8,
                  }}>
                    <Lightbulb size={13} /> {t('study.concept.label')}
                  </div>
                  <div style={{ fontSize: 13, lineHeight: 1.7, color: '#142850', whiteSpace: 'pre-wrap' }}>
                    <MathText text={currentProblem.concept} />
                  </div>
                  {currentProblem.formula && (
                    <div style={{
                      marginTop: 10, padding: '10px 12px',
                      backgroundColor: '#F8F4E9', border: '1px solid #14285020', borderRadius: 4,
                    }}>
                      <div style={{ fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#1FB8C4', fontWeight: 700, marginBottom: 4 }}>
                        {t('study.formula.label')}
                      </div>
                      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, color: '#142850' }}>
                        {currentProblem.formula}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 액션 영역 — 정답까지 재시도 흐름 */}
              {!stepResults[problemStep] ? (
                <>
                  {/* 첫 시도일 때만 confidence 슬라이더 (재시도 시 메타인지 의미 흐려짐) */}
                  {wrongChoiceIds.size === 0 && (
                    <ConfidenceSlider value={confidence} onChange={setConfidence} />
                  )}
                  <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                    <button
                      onClick={() => selectedChoiceId && submitStepMut.mutate(selectedChoiceId)}
                      disabled={!selectedChoiceId || submitStepMut.isPending}
                      style={{
                        flex: 1, padding: '14px',
                        backgroundColor: '#142850', color: '#EFEBDF', border: 'none',
                        borderRadius: 4, fontSize: 14, fontWeight: 600,
                        cursor: 'pointer', fontFamily: 'inherit',
                        opacity: (!selectedChoiceId || submitStepMut.isPending) ? 0.55 : 1,
                      }}
                    >
                      {submitStepMut.isPending ? t('study.submit.busy') :
                       wrongChoiceIds.size > 0 ? t('study.submit.retry', { n: wrongChoiceIds.size }) :
                       t('study.submit.firstAttempt', { n: problemStep })}
                    </button>
                    <button
                      onClick={() => setShowHint((v) => !v)}
                      style={{
                        padding: '14px 20px', backgroundColor: 'transparent', color: '#142850',
                        border: '1px solid #14285030', borderRadius: 4, fontSize: 14,
                        cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6,
                      }}
                    >
                      <Lightbulb size={14} /> {showHint ? t('study.hint.hide') : t('study.hint.show')}
                    </button>
                  </div>
                </>
              ) : (
                <button
                  onClick={goNextStep}
                  style={{
                    width: '100%', padding: '14px',
                    backgroundColor: '#5A8A45', color: '#EFEBDF', border: 'none', borderRadius: 4,
                    fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  }}
                >
                  {problemStep < totalSteps ? t('study.next.step', { next: problemStep + 1, total: totalSteps }) : t('study.next.problem')}
                  <ArrowRight size={14} />
                </button>
              )}
              {showHint && (
                <div style={{ marginTop: 14, padding: 14, backgroundColor: '#C7791F10', border: '1px solid #C7791F30', borderRadius: 4, fontSize: 13, color: '#142850', lineHeight: 1.6 }}>
                  {hintQuery.isLoading ? t('study.hint.loading') : hintQuery.data?.hint ?? t('study.hint.empty')}
                </div>
              )}
            </>
          ) : (
            <div style={{ padding: 24, textAlign: 'center', color: '#8B95AB', fontSize: 14, fontStyle: 'italic' }}>
              {t('study.problem.empty')}
            </div>
          )}
        </div>

        <div>
          <div style={{ marginBottom: '20px' }}>
            <div style={sectionLabelStyle}>AI Multi-Modal Guide</div>
            <h2 className="serif" style={{ fontSize: '24px', fontWeight: 500, letterSpacing: '-0.02em', margin: 0 }}>{t('study.aiGuide.title')}</h2>
          </div>
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '11px', color: '#8B95AB', marginBottom: '8px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{t('study.aiGuide.perspective')}</div>
            <div style={{ display: 'flex', gap: '4px', padding: '4px', backgroundColor: '#14285010', borderRadius: '4px' }}>
              {(['공식 중심', '단계별', '시각화', '실생활 예시'] as const).map((p) => {
                const label = p === '공식 중심' ? t('study.aiGuide.perspective.formula')
                  : p === '단계별' ? t('study.aiGuide.perspective.steps')
                  : p === '시각화' ? t('study.aiGuide.perspective.visual')
                  : t('study.aiGuide.perspective.real');
                return (
                <button key={p} onClick={() => { track('perspective.change', { from: perspective, to: p, sessionId }); setPerspective(p); }} style={{
                  flex: 1, padding: '8px', fontSize: '12px', fontWeight: perspective === p ? 600 : 400,
                  backgroundColor: perspective === p ? '#F8F4E9' : 'transparent',
                  color: perspective === p ? '#142850' : '#5C6B85',
                  border: 'none', borderRadius: '2px', cursor: 'pointer', fontFamily: 'inherit',
                }}>{label}</button>
                );
              })}
            </div>
          </div>
          <div style={{ backgroundColor: '#F8F4E9', border: '1px solid #14285015', borderRadius: '4px', padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid #14285015' }}>
              <Brain size={16} color="#C25E2E" />
              <span style={{ fontSize: '13px', fontWeight: 600 }}>{
                perspective === '공식 중심' ? t('study.aiGuide.perspective.formula') :
                perspective === '단계별' ? t('study.aiGuide.perspective.steps') :
                perspective === '시각화' ? t('study.aiGuide.perspective.visual') :
                t('study.aiGuide.perspective.real')
              }</span>
              <span style={{ fontSize: '11px', color: '#5C6B85', marginLeft: 'auto' }}>{t('study.aiGuide.autoAdjust')}</span>
            </div>
            <div style={{ fontSize: 13, lineHeight: 1.75, color: '#142850', whiteSpace: 'pre-wrap', minHeight: 120 }}>
              {guide.isLoading ? t('study.aiGuide.loading') :
               guide.data?.text ?? t('study.aiGuide.error')}
            </div>
            {guide.data && (guide.data.inputTokens > 0 || guide.data.outputTokens > 0) && (
              <div style={{ marginTop: 12, fontSize: 11, color: '#AAB4C5', fontFamily: 'JetBrains Mono, monospace' }}>
                tokens · in {guide.data.inputTokens} / out {guide.data.outputTokens}
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '24px', borderTop: '1px solid #14285015' }}>
        <button
          onClick={() => toast(t('toast.prev.disabled'), 'info')}
          disabled
          title={t('toast.prev.disabled')}
          style={{ padding: '12px 20px', backgroundColor: 'transparent', border: '1px solid #14285018', borderRadius: '4px', fontSize: '13px', cursor: 'not-allowed', opacity: 0.4, display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'inherit', color: '#5C6B85' }}
        >
          <ArrowLeft size={14} /> {t('common.previous')}
        </button>
        <button
          onClick={() => nextMut.mutate()}
          disabled={nextMut.isPending || step >= total}
          style={{
            padding: '12px 20px', backgroundColor: '#142850', color: '#EFEBDF',
            border: 'none', borderRadius: '4px', fontSize: '13px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'inherit',
            opacity: (nextMut.isPending || step >= total) ? 0.55 : 1,
          }}
        >
          {step >= total ? t('study.feedback.correct.lastStep') : (nextMut.isPending ? t('common.loading') : t('study.next.problem'))} <ArrowRight size={14} />
        </button>
      </div>
    </>
  );
}

// ============ MOCK EXAM PAGE ============
function MockExamPage({ onStartExam }: { onStartExam: (exam: M.ExamPackage) => void }) {
  const { t } = useT();
  const summary = useQuery({ queryKey: ['mock-summary'], queryFn: Q.fetchMockSummary });
  const trajectory = useQuery({ queryKey: ['mock-trajectory'], queryFn: Q.fetchTrajectory });
  const results = useQuery({ queryKey: ['mock-results'], queryFn: Q.fetchExamResults });
  const [detailResult, setDetailResult] = useState<Q.ExamResult | null>(null);

  const handleStarted = (label: string) => (r: M.ExamPackage) => {
    if (!r.problems?.length) {
      toast(t('toast.exam.empty', { label }), 'info');
      return;
    }
    onStartExam(r);
  };

  const recMut = useMutation({
    mutationFn: () => { trackClick('start_exam', { kind: 'recommended' }); return M.startRecommendedExam(); },
    onSuccess: handleStarted(t('mock.aiRec.title')),
    onError: () => toast(t('toast.exam.startFailed'), 'error'),
  });

  const typedMut = useMutation({
    mutationFn: (kind: 'mini' | 'wrong-redo' | 'real') => { trackClick('start_exam', { kind }); return M.startTypedExam(kind); },
    onSuccess: (r) => {
      const labels: Record<string, string> = { mini: t('mock.kind.mini'), 'wrong-redo': t('mock.kind.wrongRedo'), real: t('mock.kind.real') };
      handleStarted(labels[r.name] ?? r.name)(r);
    },
    onError: () => toast(t('toast.exam.startFailed'), 'error'),
  });

  return (
    <>
      <section style={{ marginBottom: '48px' }} className="fade-up">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#5A8A45' }} className="pulse-warm" />
          <span style={{ fontSize: '11px', letterSpacing: '0.25em', color: '#8B95AB', textTransform: 'uppercase' }}>Mock Exam Trajectory</span>
        </div>
        <h1 className="serif" style={{ fontSize: '48px', lineHeight: 1.15, letterSpacing: '-0.025em', fontWeight: 400, margin: 0, maxWidth: '880px' }}>
          {t('mock.headline.up')} <em style={{ color: '#5A8A45', fontStyle: 'italic', fontWeight: 500 }}>{t('mock.headline.gain')}</em><br />
          <span style={{ color: '#5C6B85' }}>{t('mock.headline.expected')}</span> <em style={{ fontStyle: 'italic', fontWeight: 500 }}>{t('mock.headline.gradeStable', { grade: summary.data?.expectedGrade ?? '–' })}</em>
        </h1>

        <div className="deco-line" style={{ height: '1px', marginTop: '32px', marginBottom: '24px' }} />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', borderTop: '1px solid #14285015', borderBottom: '1px solid #14285015' }}>
          {[
            { label: t('mock.stat.lastScore'), value: String(summary.data?.lastScore ?? 0), unit: t('common.score'), sub: t('mock.stat.recent'), accent: '#142850' },
            { label: t('mock.stat.expectedGrade'), value: String(summary.data?.expectedGrade ?? 0), unit: t('common.grade'), sub: t('mock.stat.reliability', { pct: summary.data?.reliability ?? 87 }), accent: '#5A8A45' },
            { label: t('mock.stat.toTarget'), value: String(summary.data?.pointsToNextGrade ?? 0), unit: t('common.score'), sub: t('mock.stat.targetGrade', { from: 2, to: 1 }), accent: '#C7791F' },
            { label: t('mock.stat.peerPercentile'), value: String(summary.data?.percentile ?? 0), unit: 'p', sub: t('mock.stat.topPercent', { pct: 100 - (summary.data?.percentile ?? 0) }), accent: '#142850' },
          ].map((stat, i) => (
            <div key={i} style={{ padding: '24px 28px', borderRight: i < 3 ? '1px solid #14285015' : 'none' }}>
              <div style={{ fontSize: '11px', letterSpacing: '0.18em', color: '#8B95AB', textTransform: 'uppercase', marginBottom: '12px' }}>{stat.label}</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '8px' }}>
                <span className="serif mono" style={{ fontSize: '44px', fontWeight: 500, letterSpacing: '-0.04em', color: stat.accent }}>{stat.value}</span>
                <span style={{ fontSize: '14px', color: '#5C6B85', fontWeight: 500 }}>{stat.unit}</span>
              </div>
              <div style={{ fontSize: '12px', color: '#5C6B85' }}>{stat.sub}</div>
            </div>
          ))}
        </div>
      </section>

      <div className="grain" style={{ backgroundColor: '#F8F4E9', border: '1px solid #14285015', borderRadius: '4px', padding: '32px', marginBottom: '32px', position: 'relative' }}>
        <div style={{ marginBottom: '24px' }}>
          <div style={sectionLabelStyle}>No 01 — Score Trajectory</div>
          <h2 className="serif" style={{ fontSize: '28px', fontWeight: 500, letterSpacing: '-0.02em', margin: 0 }}>{t('mock.section.trajectory')}</h2>
        </div>
        <div style={{ height: '320px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trajectory.data ?? []} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#C25E2E" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#C25E2E" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="2 4" stroke="#14285018" vertical={false} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#5C6B85', fontSize: 12 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#5C6B85', fontSize: 11 }} domain={[40, 100]} />
              <Tooltip contentStyle={{ backgroundColor: '#142850', border: 'none', borderRadius: '4px', color: '#EFEBDF', fontSize: '12px' }} />
              <Area type="monotone" dataKey="target" stroke="#5A8A45" strokeDasharray="4 4" strokeWidth={1.5} fill="none" />
              <Area type="monotone" dataKey="score" stroke="#C25E2E" strokeWidth={2.5} fill="url(#scoreGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '32px' }}>
        <div>
          <div style={{ marginBottom: '20px' }}>
            <div style={sectionLabelStyle}>No 02 — Recent Exams</div>
            <h2 className="serif" style={{ fontSize: '28px', fontWeight: 500, letterSpacing: '-0.02em', margin: 0 }}>{t('mock.section.recent')}</h2>
          </div>
          <div style={{ borderTop: '1px solid #14285015' }}>
            {(results.data ?? []).map((exam) => (
              <div key={exam.id} style={{
                display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr auto',
                alignItems: 'center', padding: '20px 0',
                borderBottom: '1px solid #14285015', gap: '16px',
              }}>
                <div>
                  <div className="serif" style={{ fontSize: '17px', fontWeight: 500, marginBottom: '4px', letterSpacing: '-0.01em' }}>{exam.name}</div>
                  <div style={{ fontSize: '11px', color: '#8B95AB' }}>{exam.date} · {exam.time}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', color: '#8B95AB', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '4px' }}>{t('mock.list.col.score')}</div>
                  <div className="serif mono" style={{ fontSize: '22px', fontWeight: 500 }}>{exam.score}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', color: '#8B95AB', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '4px' }}>{t('mock.list.col.grade')}</div>
                  <div className="serif mono" style={{ fontSize: '22px', fontWeight: 500, color: exam.grade <= 2 ? '#5A8A45' : '#C7791F' }}>{exam.grade}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', color: '#8B95AB', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '4px' }}>{t('mock.list.col.percentile')}</div>
                  <div className="serif mono" style={{ fontSize: '22px', fontWeight: 500 }}>{exam.percentile}</div>
                </div>
                <button
                  onClick={() => { trackClick('open_exam_result', { resultId: exam.id }); setDetailResult(exam); }}
                  style={{ padding: '8px 14px', backgroundColor: 'transparent', border: '1px solid #14285030', borderRadius: '2px', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '4px', color: '#142850' }}
                >
                  {t('mock.list.col.analyze')} <ChevronRight size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div style={{ marginBottom: '20px' }}>
            <div style={sectionLabelStyle}>No 03 — Take Exam</div>
            <h2 className="serif" style={{ fontSize: '28px', fontWeight: 500, letterSpacing: '-0.02em', margin: 0 }}>{t('mock.section.take')}</h2>
          </div>
          <div style={{ backgroundColor: '#142850', color: '#EFEBDF', borderRadius: '4px', padding: '32px', marginBottom: '16px' }}>
            <div style={{ fontSize: '11px', color: '#D9A055', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '8px' }}>{t('mock.aiRec.label')}</div>
            <h3 className="serif" style={{ fontSize: '22px', fontWeight: 500, marginBottom: '12px' }}>{t('mock.aiRec.title')}</h3>
            <div style={{ fontSize: '13px', color: '#E0D8C8', lineHeight: 1.65, marginBottom: '20px' }}>
              {t('mock.aiRec.desc')}
            </div>
            <button
              onClick={() => recMut.mutate()}
              disabled={recMut.isPending}
              style={{
                width: '100%', padding: '14px', backgroundColor: '#D9A055', color: '#142850',
                border: 'none', borderRadius: '4px', fontSize: '14px', fontWeight: 600,
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontFamily: 'inherit',
                opacity: recMut.isPending ? 0.6 : 1,
              }}
            >
              <Play size={14} /> {recMut.isPending ? t('mock.aiRec.busy') : t('mock.aiRec.start')}
            </button>
          </div>
          {[
            { name: t('mock.kind.mini'), sub: t('mock.kind.miniSub'), icon: Hash, kind: 'mini' as const },
            { name: t('mock.kind.wrongRedo'), sub: t('mock.kind.wrongRedoSub'), icon: RotateCcw, kind: 'wrong-redo' as const },
            { name: t('mock.kind.real'), sub: t('mock.kind.realSub'), icon: Award, kind: 'real' as const },
          ].map((opt, i) => {
            const I = opt.icon;
            return (
              <button
                key={i}
                className="hover-lift"
                onClick={() => typedMut.mutate(opt.kind)}
                disabled={typedMut.isPending}
                style={{
                  width: '100%', padding: '16px', backgroundColor: '#F8F4E9', border: '1px solid #14285015',
                  borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '14px',
                  cursor: 'pointer', marginBottom: '8px', fontFamily: 'inherit', textAlign: 'left',
                  opacity: typedMut.isPending ? 0.6 : 1,
                }}
              >
                <I size={18} color="#8B95AB" />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#142850', marginBottom: '2px' }}>{opt.name}</div>
                  <div style={{ fontSize: '11px', color: '#5C6B85' }}>{opt.sub}</div>
                </div>
                <ChevronRight size={14} color="#5C6B85" />
              </button>
            );
          })}
        </div>
      </div>

      <MockExamResultModal result={detailResult} onClose={() => setDetailResult(null)} />
    </>
  );
}

// ============ REPORT PAGE ============
function ReportPage() {
  const { t } = useT();
  const current = useQuery({ queryKey: ['report-current'], queryFn: Q.fetchReportCurrent });
  const tva = useQuery({ queryKey: ['report-tva'], queryFn: Q.fetchTimeVsAccuracy });
  const mastery = useQuery({ queryKey: ['mastery'], queryFn: Q.fetchMastery });
  const focus = useQuery({ queryKey: ['report-focus'], queryFn: Q.fetchNextFocus });
  const ach = useQuery({ queryKey: ['report-ach'], queryFn: Q.fetchAchievements });
  const mentor = useQuery({ queryKey: ['report-mentor'], queryFn: Q.fetchMentorMessage });
  const cal = useQuery({ queryKey: ['report-calibration'], queryFn: Q.fetchCalibration });

  return (
    <>
      <section style={{ marginBottom: '48px' }} className="fade-up">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#142850' }} className="pulse-warm" />
          <span style={{ fontSize: '11px', letterSpacing: '0.25em', color: '#8B95AB', textTransform: 'uppercase' }}>Weekly Performance Report</span>
        </div>
        <h1 className="serif" style={{ fontSize: '48px', lineHeight: 1.15, letterSpacing: '-0.025em', fontWeight: 400, margin: 0, maxWidth: '880px' }}>
          {t('report.headline.line1')}<br />
          <span style={{ color: '#5C6B85' }}>{t('report.headline.line2')}</span>
        </h1>
        <div style={{ marginTop: '16px', fontSize: '14px', color: '#5C6B85', maxWidth: '680px', lineHeight: 1.6 }}>
          {t('report.subtitle', { week: mentor.data?.week ?? '—' })}
        </div>

        <div className="deco-line" style={{ height: '1px', marginTop: '32px', marginBottom: '24px' }} />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', borderTop: '1px solid #14285015', borderBottom: '1px solid #14285015' }}>
          {[
            { label: t('report.stat.weeklyHours'), value: String(current.data?.totalHours ?? 0), unit: 'h', sub: t('report.stat.hoursDelta', { delta: current.data?.hoursDelta ?? 0 }), accent: '#142850' },
            { label: t('report.stat.weeklyProblems'), value: String(current.data?.problemsSolved ?? 0), unit: t('common.problem'), sub: t('report.stat.problemsPerDay', { n: current.data?.problemsPerDay ?? 0 }), accent: '#142850' },
            { label: t('report.stat.weeklyAccuracy'), value: String(current.data?.accuracyPct ?? 0), unit: t('common.percent'), sub: t('report.stat.accuracyDelta', { delta: current.data?.accuracyDelta ?? 0 }), accent: '#5A8A45' },
            { label: t('report.stat.aiScore'), value: String(current.data?.aiScore ?? 0), unit: '/ 10', sub: t('report.stat.topPercent', { pct: current.data?.topPercentile ?? 14 }), accent: '#C7791F' },
          ].map((stat, i) => (
            <div key={i} style={{ padding: '24px 28px', borderRight: i < 3 ? '1px solid #14285015' : 'none' }}>
              <div style={{ fontSize: '11px', letterSpacing: '0.18em', color: '#8B95AB', textTransform: 'uppercase', marginBottom: '12px' }}>{stat.label}</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '8px' }}>
                <span className="serif mono" style={{ fontSize: '44px', fontWeight: 500, letterSpacing: '-0.04em', color: stat.accent }}>{stat.value}</span>
                <span style={{ fontSize: '14px', color: '#5C6B85', fontWeight: 500 }}>{stat.unit}</span>
              </div>
              <div style={{ fontSize: '12px', color: '#5C6B85' }}>{stat.sub}</div>
            </div>
          ))}
        </div>
      </section>

      <div style={{ backgroundColor: '#142850', color: '#EFEBDF', borderRadius: '4px', padding: '40px', marginBottom: '32px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '40px', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '11px', letterSpacing: '0.2em', color: '#D9A055', textTransform: 'uppercase', marginBottom: '12px' }}>AI Mentor Message</div>
            <div className="serif mono" style={{ fontSize: '72px', fontWeight: 400, lineHeight: 1, color: '#D9A055', marginBottom: '12px' }}>"</div>
            <div style={{ fontSize: '11px', color: '#AAB4C5', letterSpacing: '0.05em' }}>
              {mentor.data?.generatedAt ? new Date(mentor.data.generatedAt).toLocaleDateString() : ''} · {t('report.mentor.weeklyDone')}
            </div>
          </div>
          <div>
            <p className="serif" style={{ fontSize: '24px', lineHeight: 1.55, fontWeight: 400, margin: 0, marginBottom: '24px', letterSpacing: '-0.01em', fontStyle: 'italic' }}>
              {mentor.data?.message ?? t('common.loading')}
            </p>
            <div style={{ display: 'flex', gap: '16px' }}>
              <div style={{ flex: 1, paddingLeft: '16px', borderLeft: '2px solid #5A8A45' }}>
                <div style={{ fontSize: '10px', color: '#AAB4C5', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '4px' }}>{t('report.mentor.strength')}</div>
                <div style={{ fontSize: '13px' }}>{mentor.data?.strength ?? '–'}</div>
              </div>
              <div style={{ flex: 1, paddingLeft: '16px', borderLeft: '2px solid #C7791F' }}>
                <div style={{ fontSize: '10px', color: '#AAB4C5', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '4px' }}>{t('report.mentor.nextGoal')}</div>
                <div style={{ fontSize: '13px' }}>{mentor.data?.nextGoal ?? '–'}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '32px', marginBottom: '32px' }}>
        <div className="grain" style={{ backgroundColor: '#F8F4E9', border: '1px solid #14285015', borderRadius: '4px', padding: '32px' }}>
          <div style={{ marginBottom: '24px' }}>
            <div style={sectionLabelStyle}>No 01 — Time vs Accuracy</div>
            <h2 className="serif" style={{ fontSize: '28px', fontWeight: 500, letterSpacing: '-0.02em', margin: 0 }}>{t('report.section.timeAcc')}</h2>
          </div>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={tva.data ?? []} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="2 4" stroke="#14285018" vertical={false} />
                <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fill: '#5C6B85', fontSize: 11 }} />
                <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fill: '#5C6B85', fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fill: '#5C6B85', fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: '#142850', border: 'none', borderRadius: '4px', color: '#EFEBDF', fontSize: '12px' }} />
                <Line yAxisId="left" type="monotone" dataKey="time" stroke="#C25E2E" strokeWidth={2} dot={{ fill: '#C25E2E', r: 4 }} name={t('report.stat.weeklyHours')} />
                <Line yAxisId="right" type="monotone" dataKey="accuracy" stroke="#5A8A45" strokeWidth={2} dot={{ fill: '#5A8A45', r: 4 }} name={t('report.stat.weeklyAccuracy')} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={{ backgroundColor: '#F8F4E9', border: '1px solid #14285015', borderRadius: '4px', padding: '32px' }}>
          <div style={{ marginBottom: '24px' }}>
            <div style={sectionLabelStyle}>No 02 — Unit Mastery</div>
            <h2 className="serif" style={{ fontSize: '28px', fontWeight: 500, letterSpacing: '-0.02em', margin: 0 }}>{t('report.section.unitMastery')}</h2>
          </div>
          {(mastery.data ?? []).map((u, i) => (
            <div key={i} style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '13px' }}>
                <span style={{ color: '#142850', fontWeight: 500 }}>{u.subject}</span>
                <span className="mono" style={{ color: '#5C6B85' }}>{u.value}%</span>
              </div>
              <div style={{ height: '6px', backgroundColor: '#14285010', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{
                  height: '100%', width: `${u.value}%`,
                  backgroundColor: u.value >= 80 ? '#5A8A45' : u.value >= 60 ? '#C7791F' : '#C25E2E',
                  borderRadius: '3px',
                }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
        <div style={{ backgroundColor: '#F8F4E9', border: '1px solid #14285015', borderRadius: '4px', padding: '32px' }}>
          <div style={{ marginBottom: '24px' }}>
            <div style={sectionLabelStyle}>No 03 — Next Focus</div>
            <h2 className="serif" style={{ fontSize: '24px', fontWeight: 500, letterSpacing: '-0.02em', margin: 0 }}>{t('report.section.nextFocus')}</h2>
          </div>
          {(focus.data ?? []).map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', padding: '16px 0', borderBottom: i < (focus.data!.length - 1) ? '1px solid #14285015' : 'none' }}>
              <div className="serif mono" style={{ fontSize: '24px', color: item.color, fontWeight: 500, letterSpacing: '-0.02em' }}>0{i+1}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '11px', color: '#8B95AB', marginBottom: '4px' }}>{item.unit}</div>
                <div className="serif" style={{ fontSize: '17px', fontWeight: 500, marginBottom: '6px', letterSpacing: '-0.01em' }}>{item.area}</div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <span style={{ fontSize: '10px', padding: '2px 8px', backgroundColor: item.color + '15', color: item.color, borderRadius: '2px', fontWeight: 600 }}>{item.priority}</span>
                  <span style={{ fontSize: '10px', padding: '2px 8px', backgroundColor: '#5A8A4515', color: '#5A8A45', borderRadius: '2px', fontWeight: 600 }}>{item.impact}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ backgroundColor: '#F8F4E9', border: '1px solid #14285015', borderRadius: '4px', padding: '32px' }}>
          <div style={{ marginBottom: '24px' }}>
            <div style={sectionLabelStyle}>No 04 — Achievements</div>
            <h2 className="serif" style={{ fontSize: '24px', fontWeight: 500, letterSpacing: '-0.02em', margin: 0 }}>{t('report.section.achievements')}</h2>
          </div>
          {(ach.data ?? []).map((a, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 0', borderBottom: i < (ach.data!.length - 1) ? '1px solid #14285015' : 'none' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '4px', backgroundColor: a.color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {Icon(a.icon, 18, a.color)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '2px' }}>{a.title}</div>
                <div style={{ fontSize: '11px', color: '#5C6B85' }}>{a.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* No 05 — 메타인지 캘리브레이션 */}
      <div className="grain" style={{ marginTop: '32px', backgroundColor: '#F8F4E9', border: '1px solid #14285015', borderRadius: '4px', padding: '32px', position: 'relative' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
          <div>
            <div style={sectionLabelStyle}>No 05 — Metacognitive Calibration</div>
            <h2 className="serif" style={{ fontSize: '28px', fontWeight: 500, letterSpacing: '-0.02em', margin: 0 }}>{t('report.section.calibration')}</h2>
            <div style={{ fontSize: '12px', color: '#5C6B85', marginTop: '4px' }}>
              {cal.data && cal.data.attemptCount > 0
                ? t('report.calibration.brier', { brier: cal.data.brier?.toFixed(3) ?? '–', n: cal.data.attemptCount })
                : t('report.calibration.empty')}
            </div>
          </div>
          <Brain size={20} color="#C25E2E" />
        </div>

        {cal.data && cal.data.attemptCount > 0 ? (
          <>
            <div style={{ height: '220px', marginBottom: '20px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={cal.data.buckets.map(b => ({
                  bucket: b.bucket,
                  conf: b.meanConfidence ?? null,
                  acc: b.meanAccuracy ?? null,
                  ideal: b.meanConfidence ?? null,
                }))} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="2 4" stroke="#14285018" vertical={false} />
                  <XAxis dataKey="bucket" axisLine={false} tickLine={false} tick={{ fill: '#5C6B85', fontSize: 11 }} />
                  <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fill: '#5C6B85', fontSize: 11 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#142850', border: 'none', borderRadius: '4px', color: '#EFEBDF', fontSize: '12px' }} />
                  <Line type="monotone" dataKey="ideal" stroke="#5A8A45" strokeDasharray="4 4" strokeWidth={1.5} dot={false} name="ideal (y=x)" />
                  <Line type="monotone" dataKey="conf" stroke="#AAB4C5" strokeWidth={2} dot={{ fill: '#AAB4C5', r: 4 }} name={t('study.confidence.label')} />
                  <Line type="monotone" dataKey="acc" stroke="#C25E2E" strokeWidth={2.5} dot={{ fill: '#C25E2E', r: 5 }} name={t('report.stat.weeklyAccuracy')} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div style={{ padding: '16px', backgroundColor: '#14285008', borderLeft: '2px solid #C7791F', borderRadius: '0 4px 4px 0', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
              <Lightbulb size={14} color="#D9A055" style={{ marginTop: '2px', flexShrink: 0 }} />
              <div style={{ fontSize: '13px', lineHeight: 1.65, color: '#142850' }}>{cal.data.insight}</div>
            </div>
          </>
        ) : (
          <div style={{ padding: '40px', textAlign: 'center', color: '#8B95AB', fontSize: '13px' }}>
            {cal.data?.insight ?? t('common.loading')}
          </div>
        )}
      </div>
    </>
  );
}
