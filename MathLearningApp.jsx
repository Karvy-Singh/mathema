import { useState } from 'react';
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, AreaChart, Area,
  BarChart, Bar, Cell
} from 'recharts';
import {
  Flame, ChevronRight, Sparkles, AlertCircle, ArrowUpRight, Lightbulb,
  Eye, Layers, Zap, Camera, Plus, Filter, Search, Clock, Pause, Play,
  RotateCcw, ArrowLeft, ArrowRight, BookOpen, Award, Target,
  ChevronDown, FileText, Image as ImageIcon, BarChart3, TrendingUp,
  Brain, CheckCircle2, X, Hash
} from 'lucide-react';

// ============ DATA ============
const masteryData = [
  { subject: '수와 식', value: 85 },
  { subject: '함수', value: 72 },
  { subject: '미적분 I', value: 91 },
  { subject: '미적분 II', value: 48 },
  { subject: '확률·통계', value: 67 },
  { subject: '기하·벡터', value: 79 },
];

const errorTypes = [
  { name: '개념 오해', value: 41, color: '#8B3A1F' },
  { name: '계산 실수', value: 34, color: '#B5552B' },
  { name: '시간 부족', value: 18, color: '#C97B4A' },
  { name: '기타', value: 7, color: '#A89684' },
];

const studyHeatmap = Array.from({ length: 84 }, (_, i) => ({
  day: i,
  intensity: i < 60 ? Math.floor(Math.random() * 4) : Math.floor(Math.random() * 3) + 1
}));

const recommendedContent = [
  { tag: '오답 집중', tagColor: '#8B3A1F', unit: '미적분 II · 정적분의 활용', title: '회전체의 부피 한 번에 끝내기', reason: '최근 3주간 5문제 연속 오답', time: '23분', type: '인터랙티브 학습', icon: Layers },
  { tag: '약점 보강', tagColor: '#B45309', unit: '확률·통계 · 정규분포', title: '표준화 변환의 직관적 이해', reason: '같은 단원 3회 반복 오답', time: '15분', type: '시각화 영상', icon: Eye },
  { tag: '강점 유지', tagColor: '#4A5D3A', unit: '미적분 I · 도함수', title: '실전 모의고사 30번 도전', reason: '숙련도 91% 유지를 위해', time: '45분', type: '실전 문제', icon: Zap },
];

const recentMistakes = [
  { problem: '2024 9월 모의평가 · 30번', unit: '미적분 II', errorType: '개념 오해', insight: '치환적분의 미분 구간 변환에서 dx 처리를 누락', diff: '준킬러' },
  { problem: '수능특강 · 미적분 III-2-15', unit: '미적분 II', errorType: '계산 실수', insight: '부분적분 공식 적용 후 부호 오류 반복 (3회)', diff: '중상' },
  { problem: '2024 6월 모의평가 · 28번', unit: '확률·통계', errorType: '개념 오해', insight: '조건부확률에서 표본공간 재정의를 놓침', diff: '준킬러' },
];

const allWrongNotes = [
  { id: 1, problem: '2024 9월 모의평가 · 30번', unit: '미적분 II', subUnit: '정적분의 활용', errorType: '개념 오해', insight: '회전체 부피 공식에서 회전축에 따른 적분구간 설정을 혼동', diff: '준킬러', date: '5일 전', similarCount: 8, status: 'analyzing' },
  { id: 2, problem: '수능특강 · 확률 II-3-12', unit: '확률·통계', subUnit: '조건부확률', errorType: '개념 오해', insight: '베이즈 정리 적용 시 사전확률과 사후확률의 위치 혼동', diff: '중상', date: '1주 전', similarCount: 5, status: 'mastered' },
  { id: 3, problem: '2024 6월 모의평가 · 21번', unit: '함수', subUnit: '지수·로그함수', errorType: '계산 실수', insight: '로그의 밑 변환 공식에서 분자·분모 위치를 잘못 적용', diff: '중상', date: '2주 전', similarCount: 12, status: 'analyzing' },
  { id: 4, problem: '교육청 학평 · 18번', unit: '미적분 II', subUnit: '치환적분', errorType: '계산 실수', insight: 'du 변환 시 dx와의 관계식에서 상수항 누락 반복', diff: '중', date: '3주 전', similarCount: 6, status: 'mastered' },
  { id: 5, problem: '2024 9월 모의평가 · 21번', unit: '기하·벡터', subUnit: '공간벡터', errorType: '시간 부족', insight: '공간좌표 설정에서 좌표축 회전 시각화 부족', diff: '준킬러', date: '5일 전', similarCount: 4, status: 'pending' },
  { id: 6, problem: '수능기출 · 2023 · 22번', unit: '미적분 II', subUnit: '정적분', errorType: '개념 오해', insight: '구분구적법과 정적분의 정의 사이 직관적 연결 부족', diff: '킬러', date: '1주 전', similarCount: 3, status: 'analyzing' },
];

const examScores = [
  { name: '3월 학평', score: 62, grade: 4, target: 80 },
  { name: '4월 학평', score: 68, grade: 3, target: 80 },
  { name: '6월 모평', score: 71, grade: 3, target: 80 },
  { name: '7월 학평', score: 76, grade: 2, target: 80 },
  { name: '9월 모평', score: 79, grade: 2, target: 80 },
  { name: '10월 학평', score: 84, grade: 2, target: 80 },
];

const recentExams = [
  { name: '2024 10월 학력평가', date: '2024년 10월 15일', score: 84, grade: 2, percentile: 88, time: '98분/100분' },
  { name: '2024 9월 모의평가', date: '2024년 9월 4일', score: 79, grade: 2, percentile: 82, time: '100분/100분' },
  { name: '2024 7월 학력평가', date: '2024년 7월 8일', score: 76, grade: 2, percentile: 78, time: '95분/100분' },
  { name: '2024 6월 모의평가', date: '2024년 6월 4일', score: 71, grade: 3, percentile: 71, time: '100분/100분' },
];

const reportData = [
  { week: 'W1', time: 12, accuracy: 65 },
  { week: 'W2', time: 14, accuracy: 68 },
  { week: 'W3', time: 11, accuracy: 64 },
  { week: 'W4', time: 16, accuracy: 71 },
  { week: 'W5', time: 18, accuracy: 73 },
  { week: 'W6', time: 17, accuracy: 75 },
  { week: 'W7', time: 19, accuracy: 76 },
  { week: 'W8', time: 21, accuracy: 79 },
];

// ============ SHARED STYLES ============
const sectionLabelStyle = {
  fontSize: '11px',
  letterSpacing: '0.2em',
  color: '#8B7E6A',
  textTransform: 'uppercase',
  marginBottom: '6px',
};

const baseText = {
  wordBreak: 'keep-all',
  overflowWrap: 'break-word',
};

// ============ MAIN APP ============
export default function MathLearningApp() {
  const [activeNav, setActiveNav] = useState('대시보드');

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#F2EDE2',
      fontFamily: '"Pretendard", -apple-system, BlinkMacSystemFont, sans-serif',
      color: '#1F1A14',
      ...baseText,
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300;9..144,400;9..144,500;9..144,600;9..144,700;9..144,900&family=JetBrains+Mono:wght@400;500;700&display=swap');
        @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css');
        
        * { word-break: keep-all; }
        .serif { font-family: 'Fraunces', 'Noto Serif KR', serif; font-feature-settings: 'ss01', 'ss02'; word-break: keep-all; }
        .mono { font-family: 'JetBrains Mono', monospace; }
        
        .grain { position: relative; }
        .grain::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.4'/%3E%3C/svg%3E");
          opacity: 0.06; pointer-events: none; mix-blend-mode: multiply; border-radius: inherit;
        }
        
        .deco-line {
          background-image: linear-gradient(to right, #1F1A14 50%, transparent 50%);
          background-size: 8px 1px; background-repeat: repeat-x;
        }
        
        @keyframes pulse-warm {
          0%, 100% { box-shadow: 0 0 0 0 rgba(180, 83, 9, 0.4); }
          50% { box-shadow: 0 0 0 8px rgba(180, 83, 9, 0); }
        }
        .pulse-warm { animation: pulse-warm 2.5s ease-in-out infinite; }
        
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fadeUp 0.6s ease-out backwards; }
        
        .hover-lift { transition: all 0.2s; }
        .hover-lift:hover { transform: translateY(-2px); border-color: #1F1A1440 !important; }
      `}</style>

      <TopNav activeNav={activeNav} setActiveNav={setActiveNav} />

      <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '48px 40px 80px' }}>
        {activeNav === '대시보드' && <DashboardPage />}
        {activeNav === '오답노트' && <WrongNotesPage />}
        {activeNav === '학습' && <StudyPage />}
        {activeNav === '모의고사' && <MockExamPage />}
        {activeNav === '리포트' && <ReportPage />}
      </main>
    </div>
  );
}

// ============ TOP NAV ============
function TopNav({ activeNav, setActiveNav }) {
  return (
    <nav style={{
      borderBottom: '1px solid #1F1A1420',
      backgroundColor: '#F2EDE2',
      position: 'sticky', top: 0, zIndex: 50,
      backdropFilter: 'blur(8px)',
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '20px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '48px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span className="serif" style={{ fontSize: '26px', fontWeight: 600, letterSpacing: '-0.03em', fontStyle: 'italic' }}>Mathēma</span>
            <span style={{ fontSize: '11px', letterSpacing: '0.2em', color: '#8B7E6A', textTransform: 'uppercase' }}>· 입시 수학</span>
          </div>
          <div style={{ display: 'flex', gap: '4px' }}>
            {['대시보드', '오답노트', '학습', '모의고사', '리포트'].map(item => (
              <button key={item} onClick={() => setActiveNav(item)}
                style={{
                  padding: '8px 16px', fontSize: '14px',
                  fontWeight: activeNav === item ? 600 : 400,
                  color: activeNav === item ? '#1F1A14' : '#6B6354',
                  backgroundColor: activeNav === item ? '#1F1A1410' : 'transparent',
                  border: 'none', borderRadius: '4px', cursor: 'pointer',
                  transition: 'all 0.2s', fontFamily: 'inherit',
                }}
              >{item}</button>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '10px', letterSpacing: '0.2em', color: '#8B7E6A', textTransform: 'uppercase', marginBottom: '2px' }}>수능까지</div>
            <div className="serif mono" style={{ fontSize: '20px', fontWeight: 600, letterSpacing: '-0.02em' }}>D-287</div>
          </div>
          <div style={{
            width: '40px', height: '40px', borderRadius: '50%',
            backgroundColor: '#1F1A14', color: '#F2EDE2',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '14px', fontWeight: 600,
          }}>민준</div>
        </div>
      </div>
    </nav>
  );
}

// ============ PAGE: DASHBOARD ============
function DashboardPage() {
  return (
    <>
      <section style={{ marginBottom: '64px' }} className="fade-up">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#B45309' }} className="pulse-warm" />
          <span style={{ fontSize: '11px', letterSpacing: '0.25em', color: '#8B7E6A', textTransform: 'uppercase' }}>AI 진단 · 실시간 업데이트</span>
        </div>
        <h1 className="serif" style={{
          fontSize: '48px', lineHeight: 1.15, letterSpacing: '-0.025em',
          fontWeight: 400, margin: 0, maxWidth: '880px',
        }}>
          오늘 <em style={{ color: '#8B3A1F', fontStyle: 'italic', fontWeight: 500 }}>23분</em>만 더 투자하면<br />
          <span style={{ color: '#6B6354' }}>지난주 놓친 </span>
          <em style={{ fontStyle: 'italic', fontWeight: 500 }}>8점</em>
          <span style={{ color: '#6B6354' }}>을 회복할 수 있어요</span>
        </h1>

        <div className="deco-line" style={{ height: '1px', marginTop: '32px', marginBottom: '24px' }} />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', borderTop: '1px solid #1F1A1415', borderBottom: '1px solid #1F1A1415' }}>
          {[
            { label: '오늘 학습', value: '124', unit: '분', sub: '목표 180분 · 69% 달성', accent: '#B45309' },
            { label: '연속 학습', value: '23', unit: '일', sub: '개인 최고 기록 갱신 중', accent: '#4A5D3A', icon: Flame },
            { label: '주간 정답률', value: '76', unit: '%', sub: '지난주 대비 +4%p ↑', accent: '#4A5D3A' },
            { label: '예상 등급', value: '2', unit: '등급', sub: '3주 전 3등급 → 상승', accent: '#1F1A14' },
          ].map((stat, i) => (
            <div key={i} style={{ padding: '24px 28px', borderRight: i < 3 ? '1px solid #1F1A1415' : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
                {stat.icon && <stat.icon size={12} color={stat.accent} strokeWidth={2.5} />}
                <span style={{ fontSize: '11px', letterSpacing: '0.18em', color: '#8B7E6A', textTransform: 'uppercase' }}>{stat.label}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '8px' }}>
                <span className="serif mono" style={{ fontSize: '44px', fontWeight: 500, letterSpacing: '-0.04em', color: stat.accent }}>{stat.value}</span>
                <span style={{ fontSize: '14px', color: '#6B6354', fontWeight: 500 }}>{stat.unit}</span>
              </div>
              <div style={{ fontSize: '12px', color: '#6B6354' }}>{stat.sub}</div>
            </div>
          ))}
        </div>
      </section>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '32px', marginBottom: '48px' }}>
        <div className="grain" style={{ backgroundColor: '#FAF6EB', border: '1px solid #1F1A1415', borderRadius: '4px', padding: '32px', position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
            <div>
              <div style={sectionLabelStyle}>No 01 — Mastery Map</div>
              <h2 className="serif" style={{ fontSize: '28px', fontWeight: 500, letterSpacing: '-0.02em', margin: 0 }}>단원별 숙련도</h2>
            </div>
            <div style={{ fontSize: '11px', padding: '6px 10px', backgroundColor: '#8B3A1F', color: '#F2EDE2', borderRadius: '2px', letterSpacing: '0.05em' }}>약점 1개 감지</div>
          </div>
          <div style={{ height: '320px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={masteryData}>
                <PolarGrid stroke="#1F1A1425" />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12, fill: '#1F1A14', fontWeight: 500 }} />
                <Radar name="숙련도" dataKey="value" stroke="#8B3A1F" fill="#B5552B" fillOpacity={0.25} strokeWidth={1.5} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ marginTop: '16px', padding: '16px', backgroundColor: '#1F1A1408', borderRadius: '4px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <AlertCircle size={16} color="#8B3A1F" style={{ marginTop: '2px', flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>미적분 II 숙련도 48% — 즉시 보강 필요</div>
              <div style={{ fontSize: '12px', color: '#6B6354', lineHeight: 1.55 }}>같은 백분위 학생들의 평균 숙련도는 71%입니다 회전체 부피와 치환적분 영역에서 반복 오답이 누적되고 있어요</div>
            </div>
          </div>
        </div>

        <div>
          <div style={{ marginBottom: '20px' }}>
            <div style={sectionLabelStyle}>No 02 — Today</div>
            <h2 className="serif" style={{ fontSize: '28px', fontWeight: 500, letterSpacing: '-0.02em', margin: 0 }}>오늘의 맞춤 학습</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {recommendedContent.map((item, i) => {
              const Icon = item.icon;
              return (
                <button key={i} className="hover-lift" style={{
                  backgroundColor: '#FAF6EB', border: '1px solid #1F1A1415', borderRadius: '4px',
                  padding: '20px', textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit',
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <div style={{ width: '40px', height: '40px', backgroundColor: item.tagColor + '15', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon size={18} color={item.tagColor} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                        <span style={{ fontSize: '10px', fontWeight: 600, color: item.tagColor, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{item.tag}</span>
                        <span style={{ fontSize: '11px', color: '#A89684' }}>·</span>
                        <span style={{ fontSize: '11px', color: '#6B6354' }}>{item.unit}</span>
                      </div>
                      <div className="serif" style={{ fontSize: '17px', fontWeight: 500, marginBottom: '8px', letterSpacing: '-0.01em' }}>{item.title}</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: '#8B7E6A' }}>
                        <span>{item.reason}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>{item.type} <ChevronRight size={12} /></span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <section style={{ marginBottom: '48px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div>
            <div style={sectionLabelStyle}>No 03 — Wrong Notes</div>
            <h2 className="serif" style={{ fontSize: '28px', fontWeight: 500, letterSpacing: '-0.02em', margin: 0 }}>
              최근 오답 인사이트
              <span style={{ fontSize: '14px', color: '#6B6354', marginLeft: '12px', fontFamily: '"Pretendard", sans-serif', fontWeight: 400 }}>AI가 분석한 핵심 오류 패턴</span>
            </h2>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          {recentMistakes.map((m, i) => (
            <div key={i} style={{ backgroundColor: '#FAF6EB', border: '1px solid #1F1A1415', borderRadius: '4px', padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ fontSize: '10px', color: '#8B7E6A', letterSpacing: '0.05em' }}>{m.problem}</span>
                <span style={{ fontSize: '10px', padding: '2px 6px', backgroundColor: m.diff === '준킬러' ? '#8B3A1F' : '#B45309', color: '#F2EDE2', borderRadius: '2px' }}>{m.diff}</span>
              </div>
              <div className="serif" style={{ fontSize: '13px', color: '#8B7E6A', marginBottom: '8px', fontStyle: 'italic' }}>{m.unit} · {m.errorType}</div>
              <div style={{ fontSize: '14px', lineHeight: 1.55, color: '#1F1A14', marginBottom: '16px' }}>{m.insight}</div>
              <button style={{ width: '100%', padding: '8px', backgroundColor: 'transparent', border: '1px solid #1F1A1430', borderRadius: '2px', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontFamily: 'inherit', color: '#1F1A14' }}>
                <Sparkles size={12} /> AI 맞춤 해설 보기
              </button>
            </div>
          ))}
        </div>
      </section>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '32px' }}>
        <div className="grain" style={{ backgroundColor: '#FAF6EB', border: '1px solid #1F1A1415', borderRadius: '4px', padding: '32px', position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
            <div>
              <div style={sectionLabelStyle}>No 04 — Consistency</div>
              <h2 className="serif" style={{ fontSize: '28px', fontWeight: 500, letterSpacing: '-0.02em', margin: 0 }}>학습 캘린더</h2>
              <div style={{ fontSize: '12px', color: '#6B6354', marginTop: '4px' }}>지난 12주 · <span style={{ color: '#4A5D3A', fontWeight: 600 }}>현재 23일 연속</span></div>
            </div>
            <Flame size={20} color="#B45309" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '4px', marginBottom: '20px' }}>
            {studyHeatmap.map((d, i) => {
              const colors = ['#1F1A1408', '#B5552B40', '#B5552B80', '#8B3A1F'];
              return <div key={i} style={{ aspectRatio: '1', backgroundColor: colors[d.intensity] || colors[0], borderRadius: '2px' }} />;
            })}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: '#8B7E6A' }}>
            <span>12주 전</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>적음</span>
              {['#1F1A1408', '#B5552B40', '#B5552B80', '#8B3A1F'].map((c, i) => (
                <div key={i} style={{ width: '10px', height: '10px', backgroundColor: c, borderRadius: '2px' }} />
              ))}
              <span>많음</span>
            </div>
            <span>오늘</span>
          </div>
          <div className="deco-line" style={{ height: '1px', margin: '24px 0' }} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
            {[
              { label: '평균 학습시간', value: '142분', sub: '/일' },
              { label: '총 푼 문제', value: '1,847', sub: '문제' },
              { label: '평균 정답률', value: '73.2', sub: '%' },
            ].map((s, i) => (
              <div key={i}>
                <div style={{ fontSize: '10px', letterSpacing: '0.15em', color: '#8B7E6A', textTransform: 'uppercase', marginBottom: '4px' }}>{s.label}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                  <span className="serif mono" style={{ fontSize: '24px', fontWeight: 500, letterSpacing: '-0.02em' }}>{s.value}</span>
                  <span style={{ fontSize: '11px', color: '#6B6354' }}>{s.sub}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ backgroundColor: '#1F1A14', color: '#F2EDE2', borderRadius: '4px', padding: '32px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '200px', height: '200px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(180,83,9,0.2) 0%, transparent 70%)' }} />
          <div style={{ position: 'relative' }}>
            <div style={{ fontSize: '11px', letterSpacing: '0.2em', color: '#A89684', textTransform: 'uppercase', marginBottom: '6px' }}>No 05 — Error DNA</div>
            <h2 className="serif" style={{ fontSize: '28px', fontWeight: 500, letterSpacing: '-0.02em', margin: 0, marginBottom: '4px' }}>나의 오답 유형</h2>
            <div style={{ fontSize: '12px', color: '#A89684', marginBottom: '28px' }}>최근 30일 분석</div>
            <div style={{ marginBottom: '24px' }}>
              {errorTypes.map((e, i) => (
                <div key={i} style={{ marginBottom: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '13px' }}>
                    <span>{e.name}</span>
                    <span className="mono" style={{ color: '#A89684' }}>{e.value}%</span>
                  </div>
                  <div style={{ height: '4px', backgroundColor: '#F2EDE220', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${e.value}%`, backgroundColor: e.color, borderRadius: '2px' }} />
                  </div>
                </div>
              ))}
            </div>
            <div style={{ padding: '16px', backgroundColor: '#F2EDE210', borderLeft: '2px solid #B45309', borderRadius: '0 2px 2px 0' }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                <Lightbulb size={14} color="#D97706" style={{ marginTop: '2px', flexShrink: 0 }} />
                <div style={{ fontSize: '12px', lineHeight: 1.65, color: '#E8DFD0' }}>
                  <strong style={{ color: '#F2EDE2' }}>개념 오해</strong>가 41%로 가장 높아요 AI가 추천하는 <em style={{ color: '#D97706', fontStyle: 'normal', fontWeight: 600 }}>개념 재구조화 학습</em>으로 2주 안에 정답률 +12% 향상이 가능합니다
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: '64px', paddingTop: '32px', borderTop: '1px solid #1F1A1415', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '11px', color: '#8B7E6A', letterSpacing: '0.05em' }}>마지막 업데이트 · 2분 전 · AI 진단 모델 v2.4.1</div>
        <div className="serif" style={{ fontSize: '13px', fontStyle: 'italic', color: '#6B6354' }}>"Excellence is a habit not an act" — Aristotle</div>
      </div>
    </>
  );
}

// ============ PAGE: WRONG NOTES ============
function WrongNotesPage() {
  const [filter, setFilter] = useState('전체');
  
  return (
    <>
      <section style={{ marginBottom: '48px' }} className="fade-up">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#8B3A1F' }} className="pulse-warm" />
          <span style={{ fontSize: '11px', letterSpacing: '0.25em', color: '#8B7E6A', textTransform: 'uppercase' }}>Wrong Notes Archive</span>
        </div>
        <h1 className="serif" style={{ fontSize: '48px', lineHeight: 1.15, letterSpacing: '-0.025em', fontWeight: 400, margin: 0, maxWidth: '880px' }}>
          <em style={{ color: '#8B3A1F', fontStyle: 'italic', fontWeight: 500 }}>미적분 II</em>에서<br />
          <em style={{ fontStyle: 'italic', fontWeight: 500 }}>17개</em>의<span style={{ color: '#6B6354' }}> 오답 패턴이 발견됐어요</span>
        </h1>

        <div className="deco-line" style={{ height: '1px', marginTop: '32px', marginBottom: '24px' }} />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', borderTop: '1px solid #1F1A1415', borderBottom: '1px solid #1F1A1415' }}>
          {[
            { label: '전체 오답', value: '247', unit: '문제', accent: '#1F1A14' },
            { label: '분석 완료', value: '231', unit: '문제', accent: '#B45309' },
            { label: '마스터 완료', value: '94', unit: '문제', sub: '38% 진행', accent: '#4A5D3A' },
            { label: '재출제 정답률', value: '82', unit: '%', sub: '같은 유형 재도전', accent: '#4A5D3A' },
          ].map((stat, i) => (
            <div key={i} style={{ padding: '24px 28px', borderRight: i < 3 ? '1px solid #1F1A1415' : 'none' }}>
              <div style={{ fontSize: '11px', letterSpacing: '0.18em', color: '#8B7E6A', textTransform: 'uppercase', marginBottom: '12px' }}>{stat.label}</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '8px' }}>
                <span className="serif mono" style={{ fontSize: '44px', fontWeight: 500, letterSpacing: '-0.04em', color: stat.accent }}>{stat.value}</span>
                <span style={{ fontSize: '14px', color: '#6B6354', fontWeight: 500 }}>{stat.unit}</span>
              </div>
              {stat.sub && <div style={{ fontSize: '12px', color: '#6B6354' }}>{stat.sub}</div>}
            </div>
          ))}
        </div>
      </section>

      {/* QUICK ADD */}
      <section style={{ marginBottom: '48px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          {[
            { icon: Camera, label: '사진으로 등록', sub: 'AI가 자동으로 문제 인식', color: '#8B3A1F' },
            { icon: FileText, label: '직접 입력하기', sub: '문제와 풀이 텍스트 입력', color: '#B45309' },
            { icon: ImageIcon, label: '문제집 업로드', sub: 'PDF에서 일괄 추출', color: '#4A5D3A' },
          ].map((item, i) => {
            const Icon = item.icon;
            return (
              <button key={i} className="hover-lift" style={{
                backgroundColor: '#FAF6EB', border: '1px dashed #1F1A1430', borderRadius: '4px',
                padding: '24px', display: 'flex', alignItems: 'center', gap: '16px',
                cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
              }}>
                <div style={{ width: '48px', height: '48px', backgroundColor: item.color + '15', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={22} color={item.color} />
                </div>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 600, color: '#1F1A14', marginBottom: '4px' }}>{item.label}</div>
                  <div style={{ fontSize: '12px', color: '#6B6354' }}>{item.sub}</div>
                </div>
                <Plus size={18} color="#1F1A14" style={{ marginLeft: 'auto', flexShrink: 0 }} />
              </button>
            );
          })}
        </div>
      </section>

      {/* FILTERS */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid #1F1A1415' }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <Filter size={14} color="#8B7E6A" />
          {['전체', '미적분 II', '확률·통계', '함수', '기하·벡터'].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: '6px 12px', fontSize: '13px',
              fontWeight: filter === f ? 600 : 400,
              color: filter === f ? '#F2EDE2' : '#6B6354',
              backgroundColor: filter === f ? '#1F1A14' : 'transparent',
              border: '1px solid ' + (filter === f ? '#1F1A14' : '#1F1A1430'),
              borderRadius: '999px', cursor: 'pointer', fontFamily: 'inherit',
            }}>{f}</button>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#6B6354' }}>
          <span>정렬</span>
          <button style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', color: '#1F1A14', fontWeight: 600, fontFamily: 'inherit' }}>
            최신순 <ChevronDown size={12} />
          </button>
        </div>
      </div>

      {/* WRONG NOTES GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px', marginBottom: '48px' }}>
        {allWrongNotes.map((note, i) => (
          <div key={i} className="hover-lift" style={{
            backgroundColor: '#FAF6EB', border: '1px solid #1F1A1415',
            borderRadius: '4px', padding: '24px', position: 'relative', cursor: 'pointer',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <div style={{ fontSize: '11px', color: '#8B7E6A', marginBottom: '6px', letterSpacing: '0.05em' }}>{note.problem}</div>
                <div className="serif" style={{ fontSize: '17px', fontWeight: 500, letterSpacing: '-0.01em' }}>
                  {note.unit} <span style={{ color: '#8B7E6A', fontStyle: 'italic' }}>· {note.subUnit}</span>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                <span style={{
                  fontSize: '10px', padding: '3px 8px',
                  backgroundColor: note.diff === '킬러' ? '#1F1A14' : note.diff === '준킬러' ? '#8B3A1F' : '#B45309',
                  color: '#F2EDE2', borderRadius: '2px', letterSpacing: '0.05em',
                }}>{note.diff}</span>
                {note.status === 'mastered' && (
                  <span style={{ fontSize: '10px', color: '#4A5D3A', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <CheckCircle2 size={11} /> 마스터
                  </span>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <span style={{ fontSize: '10px', padding: '2px 8px', backgroundColor: '#8B3A1F15', color: '#8B3A1F', borderRadius: '2px', fontWeight: 600 }}>{note.errorType}</span>
              <span style={{ fontSize: '11px', color: '#A89684' }}>· {note.date}</span>
            </div>

            <div style={{ padding: '14px', backgroundColor: '#1F1A1408', borderLeft: '2px solid #1F1A1430', borderRadius: '0 2px 2px 0', marginBottom: '16px' }}>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
                <Sparkles size={12} color="#8B3A1F" style={{ marginTop: '3px', flexShrink: 0 }} />
                <div style={{ fontSize: '13px', color: '#1F1A14', lineHeight: 1.6 }}>{note.insight}</div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', color: '#6B6354' }}>유사 문제 <strong style={{ color: '#1F1A14' }}>{note.similarCount}개</strong> 제안됨</span>
              <button style={{ fontSize: '12px', padding: '6px 12px', backgroundColor: '#1F1A14', color: '#F2EDE2', border: 'none', borderRadius: '2px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontFamily: 'inherit' }}>
                마스터하기 <ArrowRight size={12} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* PATTERN ANALYSIS */}
      <div style={{ backgroundColor: '#1F1A14', color: '#F2EDE2', borderRadius: '4px', padding: '40px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-80px', right: '-80px', width: '300px', height: '300px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(180,83,9,0.15) 0%, transparent 70%)' }} />
        <div style={{ position: 'relative' }}>
          <div style={{ fontSize: '11px', letterSpacing: '0.2em', color: '#A89684', textTransform: 'uppercase', marginBottom: '6px' }}>AI Pattern Analysis</div>
          <h2 className="serif" style={{ fontSize: '32px', fontWeight: 500, letterSpacing: '-0.02em', margin: 0, marginBottom: '32px' }}>
            당신의 오답에서 발견된 <em style={{ fontStyle: 'italic', color: '#D97706' }}>3가지 패턴</em>
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
            {[
              { num: '01', title: '치환 단계 누락', desc: '치환적분에서 du의 변환 과정을 자주 생략하여 부호 오류로 이어집니다', count: '8회 발견' },
              { num: '02', title: '시각화 부족', desc: '입체도형 회전체 문제에서 단면을 그리지 않고 풀이를 시작합니다', count: '6회 발견' },
              { num: '03', title: '조건 재진술 미흡', desc: '확률 문제에서 표본공간을 명시적으로 재정의하지 않고 풉니다', count: '5회 발견' },
            ].map((p, i) => (
              <div key={i} style={{ borderTop: '1px solid #F2EDE220', paddingTop: '20px' }}>
                <div className="serif mono" style={{ fontSize: '32px', color: '#D97706', fontWeight: 400, marginBottom: '12px', letterSpacing: '-0.04em' }}>{p.num}</div>
                <div className="serif" style={{ fontSize: '20px', fontWeight: 500, marginBottom: '12px', letterSpacing: '-0.01em' }}>{p.title}</div>
                <div style={{ fontSize: '13px', color: '#E8DFD0', lineHeight: 1.65, marginBottom: '16px' }}>{p.desc}</div>
                <div style={{ fontSize: '11px', color: '#A89684', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{p.count}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

// ============ PAGE: STUDY ============
function StudyPage() {
  const [step, setStep] = useState(2);
  const [perspective, setPerspective] = useState('단계별');
  
  return (
    <>
      {/* Session header */}
      <div style={{ marginBottom: '32px' }} className="fade-up">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <div style={sectionLabelStyle}>Session 03 of 05 — 미적분 II</div>
            <h1 className="serif" style={{ fontSize: '32px', fontWeight: 500, letterSpacing: '-0.02em', margin: 0, marginTop: '4px' }}>
              회전체의 부피 마스터하기
            </h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', backgroundColor: '#FAF6EB', border: '1px solid #1F1A1415', borderRadius: '4px' }}>
              <Clock size={14} color="#8B7E6A" />
              <span className="mono" style={{ fontSize: '14px', fontWeight: 600 }}>14:32</span>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B6354', display: 'flex' }}><Pause size={14} /></button>
            </div>
            <button style={{ padding: '10px 16px', backgroundColor: 'transparent', border: '1px solid #1F1A1430', borderRadius: '4px', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' }}>세션 종료</button>
          </div>
        </div>
        
        {/* Progress bar */}
        <div style={{ display: 'flex', gap: '4px' }}>
          {[1,2,3,4,5].map(n => (
            <div key={n} style={{
              flex: 1, height: '4px',
              backgroundColor: n < step ? '#4A5D3A' : n === step ? '#B45309' : '#1F1A1418',
              borderRadius: '2px',
            }} />
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: '32px', marginBottom: '32px' }}>
        {/* PROBLEM */}
        <div className="grain" style={{ backgroundColor: '#FAF6EB', border: '1px solid #1F1A1415', borderRadius: '4px', padding: '40px', position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
            <div>
              <div style={sectionLabelStyle}>Problem 03</div>
              <div className="serif" style={{ fontSize: '14px', color: '#8B7E6A', fontStyle: 'italic' }}>2024 9월 모의평가 30번 변형</div>
            </div>
            <span style={{ fontSize: '11px', padding: '4px 10px', backgroundColor: '#8B3A1F', color: '#F2EDE2', borderRadius: '2px' }}>준킬러</span>
          </div>

          <div className="serif" style={{ fontSize: '18px', lineHeight: 1.7, color: '#1F1A14', marginBottom: '24px' }}>
            함수 <em style={{ fontStyle: 'italic' }}>f(x) = √x</em> 와 <em style={{ fontStyle: 'italic' }}>x</em>축 그리고 직선 <em style={{ fontStyle: 'italic' }}>x = 4</em>로 둘러싸인 영역을 <em style={{ fontStyle: 'italic' }}>x</em>축 둘레로 회전시켜 생기는 회전체의 부피를 구하시오
          </div>

          <div style={{ padding: '24px', backgroundColor: '#1F1A1408', borderRadius: '4px', textAlign: 'center', marginBottom: '24px' }}>
            <div className="serif mono" style={{ fontSize: '28px', color: '#1F1A14', letterSpacing: '-0.02em' }}>
              V = π ∫₀⁴ <span style={{ color: '#8B3A1F' }}>(√x)²</span> dx
            </div>
            <div style={{ fontSize: '11px', color: '#8B7E6A', marginTop: '12px', letterSpacing: '0.1em' }}>회전체 부피 공식 적용</div>
          </div>

          <div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#6B6354', marginBottom: '12px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>당신의 답</div>
            <input type="text" placeholder="답을 입력하세요" style={{
              width: '100%', padding: '16px', fontSize: '18px', border: '1px solid #1F1A1430',
              borderRadius: '4px', backgroundColor: '#F2EDE2', fontFamily: 'JetBrains Mono, monospace',
              outline: 'none', boxSizing: 'border-box',
            }} />
            <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
              <button style={{ flex: 1, padding: '14px', backgroundColor: '#1F1A14', color: '#F2EDE2', border: 'none', borderRadius: '4px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>제출하기</button>
              <button style={{ padding: '14px 20px', backgroundColor: 'transparent', color: '#1F1A14', border: '1px solid #1F1A1430', borderRadius: '4px', fontSize: '14px', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Lightbulb size={14} /> 힌트 보기
              </button>
            </div>
          </div>
        </div>

        {/* AI GUIDE */}
        <div>
          <div style={{ marginBottom: '20px' }}>
            <div style={sectionLabelStyle}>AI Multi-Modal Guide</div>
            <h2 className="serif" style={{ fontSize: '24px', fontWeight: 500, letterSpacing: '-0.02em', margin: 0 }}>맞춤 학습 가이드</h2>
          </div>

          {/* Perspective toggle */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '11px', color: '#8B7E6A', marginBottom: '8px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>관점 변환</div>
            <div style={{ display: 'flex', gap: '4px', padding: '4px', backgroundColor: '#1F1A1410', borderRadius: '4px' }}>
              {['공식 중심', '단계별', '시각화', '실생활 예시'].map(p => (
                <button key={p} onClick={() => setPerspective(p)} style={{
                  flex: 1, padding: '8px', fontSize: '12px', fontWeight: perspective === p ? 600 : 400,
                  backgroundColor: perspective === p ? '#FAF6EB' : 'transparent',
                  color: perspective === p ? '#1F1A14' : '#6B6354',
                  border: 'none', borderRadius: '2px', cursor: 'pointer', fontFamily: 'inherit',
                }}>{p}</button>
              ))}
            </div>
          </div>

          {/* AI Steps */}
          <div style={{ backgroundColor: '#FAF6EB', border: '1px solid #1F1A1415', borderRadius: '4px', padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid #1F1A1415' }}>
              <Brain size={16} color="#8B3A1F" />
              <span style={{ fontSize: '13px', fontWeight: 600 }}>AI가 단계별로 안내합니다</span>
              <span style={{ fontSize: '11px', color: '#6B6354', marginLeft: 'auto' }}>난이도 자동조정</span>
            </div>
            
            {[
              { num: '1', title: '회전체 공식 떠올리기', desc: 'V = π ∫ [f(x)]² dx — 단면적이 원이라는 점에서 출발', done: true },
              { num: '2', title: '적분구간 설정', desc: '0부터 4까지 회전축 위의 구간을 명확히 설정합니다', done: true },
              { num: '3', title: '피적분 함수 변환', desc: '(√x)² 를 단순화하면 x가 됩니다 — 여기서 자주 실수해요', done: false, current: true },
              { num: '4', title: '정적분 계산', desc: '∫x dx 적용 후 구간 대입', done: false },
              { num: '5', title: '최종 답 도출', desc: 'π를 곱해 부피의 최종값을 얻습니다', done: false },
            ].map((s, i) => (
              <div key={i} style={{
                display: 'flex', gap: '12px', padding: '12px', marginBottom: '4px',
                backgroundColor: s.current ? '#B4530912' : 'transparent',
                borderRadius: '4px', alignItems: 'flex-start',
              }}>
                <div style={{
                  width: '24px', height: '24px', borderRadius: '50%',
                  backgroundColor: s.done ? '#4A5D3A' : s.current ? '#B45309' : '#1F1A1420',
                  color: s.done || s.current ? '#F2EDE2' : '#6B6354',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '11px', fontWeight: 600, flexShrink: 0,
                }}>
                  {s.done ? '✓' : s.num}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', fontWeight: s.current ? 600 : 500, marginBottom: '4px', color: s.done ? '#6B6354' : '#1F1A14' }}>{s.title}</div>
                  {s.current && <div style={{ fontSize: '12px', color: '#6B6354', lineHeight: 1.55 }}>{s.desc}</div>}
                </div>
              </div>
            ))}
          </div>

          {/* Multimodal options */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '16px' }}>
            {[
              { icon: Eye, label: '시각화 보기' },
              { icon: Layers, label: '비슷한 예제' },
            ].map((b, i) => {
              const Icon = b.icon;
              return (
                <button key={i} style={{
                  padding: '12px', backgroundColor: '#FAF6EB', border: '1px solid #1F1A1415',
                  borderRadius: '4px', fontSize: '12px', cursor: 'pointer', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', gap: '6px', fontFamily: 'inherit', color: '#1F1A14',
                }}>
                  <Icon size={14} /> {b.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '24px', borderTop: '1px solid #1F1A1415' }}>
        <button style={{ padding: '12px 20px', backgroundColor: 'transparent', border: '1px solid #1F1A1430', borderRadius: '4px', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'inherit', color: '#1F1A14' }}>
          <ArrowLeft size={14} /> 이전 문제
        </button>
        <div style={{ fontSize: '12px', color: '#6B6354' }}>현재 정답률 <strong style={{ color: '#1F1A14' }}>67%</strong> · 평균 소요시간 <strong style={{ color: '#1F1A14' }}>3분 24초</strong></div>
        <button style={{ padding: '12px 20px', backgroundColor: '#1F1A14', color: '#F2EDE2', border: 'none', borderRadius: '4px', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'inherit' }}>
          다음 문제 <ArrowRight size={14} />
        </button>
      </div>
    </>
  );
}

// ============ PAGE: MOCK EXAM ============
function MockExamPage() {
  return (
    <>
      <section style={{ marginBottom: '48px' }} className="fade-up">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#4A5D3A' }} className="pulse-warm" />
          <span style={{ fontSize: '11px', letterSpacing: '0.25em', color: '#8B7E6A', textTransform: 'uppercase' }}>Mock Exam Trajectory</span>
        </div>
        <h1 className="serif" style={{ fontSize: '48px', lineHeight: 1.15, letterSpacing: '-0.025em', fontWeight: 400, margin: 0, maxWidth: '880px' }}>
          7개월간 <em style={{ color: '#4A5D3A', fontStyle: 'italic', fontWeight: 500 }}>22점</em><span style={{ color: '#6B6354' }}> 상승</span><br />
          <span style={{ color: '#6B6354' }}>예상 수능 등급</span> <em style={{ fontStyle: 'italic', fontWeight: 500 }}>2등급 안정권</em>
        </h1>

        <div className="deco-line" style={{ height: '1px', marginTop: '32px', marginBottom: '24px' }} />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', borderTop: '1px solid #1F1A1415', borderBottom: '1px solid #1F1A1415' }}>
          {[
            { label: '최근 점수', value: '84', unit: '점', sub: '10월 학평', accent: '#1F1A14' },
            { label: '예상 수능 등급', value: '2', unit: '등급', sub: '신뢰도 87%', accent: '#4A5D3A' },
            { label: '목표까지', value: '6', unit: '점', sub: '2등급 → 1등급', accent: '#B45309' },
            { label: '동급 백분위', value: '88', unit: 'p', sub: '상위 12%', accent: '#1F1A14' },
          ].map((stat, i) => (
            <div key={i} style={{ padding: '24px 28px', borderRight: i < 3 ? '1px solid #1F1A1415' : 'none' }}>
              <div style={{ fontSize: '11px', letterSpacing: '0.18em', color: '#8B7E6A', textTransform: 'uppercase', marginBottom: '12px' }}>{stat.label}</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '8px' }}>
                <span className="serif mono" style={{ fontSize: '44px', fontWeight: 500, letterSpacing: '-0.04em', color: stat.accent }}>{stat.value}</span>
                <span style={{ fontSize: '14px', color: '#6B6354', fontWeight: 500 }}>{stat.unit}</span>
              </div>
              <div style={{ fontSize: '12px', color: '#6B6354' }}>{stat.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* SCORE TRAJECTORY */}
      <div className="grain" style={{ backgroundColor: '#FAF6EB', border: '1px solid #1F1A1415', borderRadius: '4px', padding: '32px', marginBottom: '32px', position: 'relative' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
          <div>
            <div style={sectionLabelStyle}>No 01 — Score Trajectory</div>
            <h2 className="serif" style={{ fontSize: '28px', fontWeight: 500, letterSpacing: '-0.02em', margin: 0 }}>점수 변화 추이</h2>
          </div>
          <div style={{ display: 'flex', gap: '16px', fontSize: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '12px', height: '2px', backgroundColor: '#8B3A1F' }} />
              <span style={{ color: '#6B6354' }}>실제 점수</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '12px', height: '2px', backgroundColor: '#4A5D3A', borderTop: '1px dashed' }} />
              <span style={{ color: '#6B6354' }}>목표 점수</span>
            </div>
          </div>
        </div>
        <div style={{ height: '320px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={examScores} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8B3A1F" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#8B3A1F" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="2 4" stroke="#1F1A1418" vertical={false} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B6354', fontSize: 12 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B6354', fontSize: 11 }} domain={[40, 100]} />
              <Tooltip contentStyle={{ backgroundColor: '#1F1A14', border: 'none', borderRadius: '4px', color: '#F2EDE2', fontSize: '12px' }} />
              <Area type="monotone" dataKey="target" stroke="#4A5D3A" strokeDasharray="4 4" strokeWidth={1.5} fill="none" />
              <Area type="monotone" dataKey="score" stroke="#8B3A1F" strokeWidth={2.5} fill="url(#scoreGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* RECENT EXAMS LIST + CTA */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '32px' }}>
        <div>
          <div style={{ marginBottom: '20px' }}>
            <div style={sectionLabelStyle}>No 02 — Recent Exams</div>
            <h2 className="serif" style={{ fontSize: '28px', fontWeight: 500, letterSpacing: '-0.02em', margin: 0 }}>응시한 모의고사</h2>
          </div>
          <div style={{ borderTop: '1px solid #1F1A1415' }}>
            {recentExams.map((exam, i) => (
              <div key={i} style={{
                display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr auto',
                alignItems: 'center', padding: '20px 0',
                borderBottom: '1px solid #1F1A1415', gap: '16px',
              }}>
                <div>
                  <div className="serif" style={{ fontSize: '17px', fontWeight: 500, marginBottom: '4px', letterSpacing: '-0.01em' }}>{exam.name}</div>
                  <div style={{ fontSize: '11px', color: '#8B7E6A' }}>{exam.date} · {exam.time}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', color: '#8B7E6A', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '4px' }}>점수</div>
                  <div className="serif mono" style={{ fontSize: '22px', fontWeight: 500 }}>{exam.score}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', color: '#8B7E6A', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '4px' }}>등급</div>
                  <div className="serif mono" style={{ fontSize: '22px', fontWeight: 500, color: exam.grade <= 2 ? '#4A5D3A' : '#B45309' }}>{exam.grade}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', color: '#8B7E6A', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '4px' }}>백분위</div>
                  <div className="serif mono" style={{ fontSize: '22px', fontWeight: 500 }}>{exam.percentile}</div>
                </div>
                <button style={{
                  padding: '8px 14px', backgroundColor: 'transparent', border: '1px solid #1F1A1430',
                  borderRadius: '2px', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit',
                  display: 'flex', alignItems: 'center', gap: '4px', color: '#1F1A14',
                }}>분석 <ChevronRight size={12} /></button>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div style={{ marginBottom: '20px' }}>
            <div style={sectionLabelStyle}>No 03 — Take Exam</div>
            <h2 className="serif" style={{ fontSize: '28px', fontWeight: 500, letterSpacing: '-0.02em', margin: 0 }}>실전 응시</h2>
          </div>
          
          <div style={{ backgroundColor: '#1F1A14', color: '#F2EDE2', borderRadius: '4px', padding: '32px', marginBottom: '16px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '160px', height: '160px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(217,119,6,0.25) 0%, transparent 70%)' }} />
            <div style={{ position: 'relative' }}>
              <div style={{ fontSize: '11px', color: '#D97706', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '8px' }}>AI 추천</div>
              <h3 className="serif" style={{ fontSize: '22px', fontWeight: 500, marginBottom: '12px', letterSpacing: '-0.01em' }}>맞춤 진단 모의고사</h3>
              <div style={{ fontSize: '13px', color: '#E8DFD0', lineHeight: 1.65, marginBottom: '20px' }}>
                약점 단원 위주로 구성된 30문제 진단 시험으로 현재 실력을 정확히 측정하세요
              </div>
              <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
                <div>
                  <div style={{ fontSize: '10px', color: '#A89684', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '2px' }}>문제 수</div>
                  <div className="serif mono" style={{ fontSize: '20px', fontWeight: 500 }}>30</div>
                </div>
                <div>
                  <div style={{ fontSize: '10px', color: '#A89684', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '2px' }}>예상 시간</div>
                  <div className="serif mono" style={{ fontSize: '20px', fontWeight: 500 }}>60분</div>
                </div>
              </div>
              <button style={{ width: '100%', padding: '14px', backgroundColor: '#D97706', color: '#1F1A14', border: 'none', borderRadius: '4px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontFamily: 'inherit' }}>
                <Play size={14} /> 지금 시작하기
              </button>
            </div>
          </div>

          {[
            { name: '단원별 미니 테스트', sub: '10문제 · 20분', icon: Hash },
            { name: '오답 재출제 시험', sub: '내가 틀린 문제 모음', icon: RotateCcw },
            { name: '실전 모의고사', sub: '30문제 · 100분', icon: Award },
          ].map((opt, i) => {
            const Icon = opt.icon;
            return (
              <button key={i} className="hover-lift" style={{
                width: '100%', padding: '16px', backgroundColor: '#FAF6EB', border: '1px solid #1F1A1415',
                borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '14px',
                cursor: 'pointer', marginBottom: '8px', fontFamily: 'inherit', textAlign: 'left',
              }}>
                <Icon size={18} color="#8B7E6A" />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#1F1A14', marginBottom: '2px' }}>{opt.name}</div>
                  <div style={{ fontSize: '11px', color: '#6B6354' }}>{opt.sub}</div>
                </div>
                <ChevronRight size={14} color="#6B6354" />
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}

// ============ PAGE: REPORT ============
function ReportPage() {
  return (
    <>
      <section style={{ marginBottom: '48px' }} className="fade-up">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#1F1A14' }} className="pulse-warm" />
          <span style={{ fontSize: '11px', letterSpacing: '0.25em', color: '#8B7E6A', textTransform: 'uppercase' }}>Weekly Performance Report</span>
        </div>
        <h1 className="serif" style={{ fontSize: '48px', lineHeight: 1.15, letterSpacing: '-0.025em', fontWeight: 400, margin: 0, maxWidth: '880px' }}>
          이번 주 <em style={{ color: '#4A5D3A', fontStyle: 'italic', fontWeight: 500 }}>꾸준함</em>이<br />
          <span style={{ color: '#6B6354' }}>당신의 가장 강력한 무기예요</span>
        </h1>
        <div style={{ marginTop: '16px', fontSize: '14px', color: '#6B6354', maxWidth: '680px', lineHeight: 1.6 }}>
          11월 1주차 — AI가 분석한 학습 패턴과 실력 변화를 정리했어요
        </div>

        <div className="deco-line" style={{ height: '1px', marginTop: '32px', marginBottom: '24px' }} />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', borderTop: '1px solid #1F1A1415', borderBottom: '1px solid #1F1A1415' }}>
          {[
            { label: '주간 학습시간', value: '21.4', unit: '시간', sub: '지난주 대비 +18%', accent: '#1F1A14' },
            { label: '주간 푼 문제', value: '342', unit: '문제', sub: '하루 평균 49문제', accent: '#1F1A14' },
            { label: '평균 정답률', value: '76', unit: '%', sub: '지난주 대비 +4%p', accent: '#4A5D3A' },
            { label: 'AI 종합 점수', value: '8.4', unit: '/ 10', sub: '상위 14%', accent: '#B45309' },
          ].map((stat, i) => (
            <div key={i} style={{ padding: '24px 28px', borderRight: i < 3 ? '1px solid #1F1A1415' : 'none' }}>
              <div style={{ fontSize: '11px', letterSpacing: '0.18em', color: '#8B7E6A', textTransform: 'uppercase', marginBottom: '12px' }}>{stat.label}</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '8px' }}>
                <span className="serif mono" style={{ fontSize: '44px', fontWeight: 500, letterSpacing: '-0.04em', color: stat.accent }}>{stat.value}</span>
                <span style={{ fontSize: '14px', color: '#6B6354', fontWeight: 500 }}>{stat.unit}</span>
              </div>
              <div style={{ fontSize: '12px', color: '#6B6354' }}>{stat.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* AI COACH MESSAGE */}
      <div style={{ backgroundColor: '#1F1A14', color: '#F2EDE2', borderRadius: '4px', padding: '40px', marginBottom: '32px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-100px', right: '-100px', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(217,119,6,0.18) 0%, transparent 70%)' }} />
        <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '40px', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '11px', letterSpacing: '0.2em', color: '#D97706', textTransform: 'uppercase', marginBottom: '12px' }}>AI Mentor Message</div>
            <div className="serif mono" style={{ fontSize: '72px', fontWeight: 400, lineHeight: 1, color: '#D97706', marginBottom: '12px' }}>"</div>
            <div style={{ fontSize: '11px', color: '#A89684', letterSpacing: '0.05em' }}>2024년 11월 8일 · 주간 분석 완료</div>
          </div>
          <div>
            <p className="serif" style={{ fontSize: '24px', lineHeight: 1.55, fontWeight: 400, margin: 0, marginBottom: '24px', letterSpacing: '-0.01em', fontStyle: 'italic' }}>
              지난주보다 학습시간을 18% 늘렸고 정답률도 4%p 올랐어요 특히 미적분 II에서 보였던 치환적분 약점이 65% → 78%로 회복되고 있습니다 이 페이스를 유지하면 12월 모의고사에서 1등급권 진입이 충분히 가능해요
            </p>
            <div style={{ display: 'flex', gap: '16px' }}>
              <div style={{ flex: 1, paddingLeft: '16px', borderLeft: '2px solid #4A5D3A' }}>
                <div style={{ fontSize: '10px', color: '#A89684', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '4px' }}>강점</div>
                <div style={{ fontSize: '13px' }}>꾸준한 학습 패턴과 오답 복기</div>
              </div>
              <div style={{ flex: 1, paddingLeft: '16px', borderLeft: '2px solid #B45309' }}>
                <div style={{ fontSize: '10px', color: '#A89684', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '4px' }}>다음 목표</div>
                <div style={{ fontSize: '13px' }}>준킬러 문제의 시간 단축 훈련</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CHARTS */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '32px', marginBottom: '32px' }}>
        <div className="grain" style={{ backgroundColor: '#FAF6EB', border: '1px solid #1F1A1415', borderRadius: '4px', padding: '32px', position: 'relative' }}>
          <div style={{ marginBottom: '24px' }}>
            <div style={sectionLabelStyle}>No 01 — Time vs Accuracy</div>
            <h2 className="serif" style={{ fontSize: '28px', fontWeight: 500, letterSpacing: '-0.02em', margin: 0 }}>학습시간과 정답률의 관계</h2>
            <div style={{ fontSize: '12px', color: '#6B6354', marginTop: '4px' }}>주당 학습시간이 늘수록 정답률이 동반 상승하는 패턴</div>
          </div>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={reportData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="2 4" stroke="#1F1A1418" vertical={false} />
                <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fill: '#6B6354', fontSize: 11 }} />
                <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fill: '#6B6354', fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fill: '#6B6354', fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: '#1F1A14', border: 'none', borderRadius: '4px', color: '#F2EDE2', fontSize: '12px' }} />
                <Line yAxisId="left" type="monotone" dataKey="time" stroke="#8B3A1F" strokeWidth={2} dot={{ fill: '#8B3A1F', r: 4 }} name="학습시간(h)" />
                <Line yAxisId="right" type="monotone" dataKey="accuracy" stroke="#4A5D3A" strokeWidth={2} dot={{ fill: '#4A5D3A', r: 4 }} name="정답률(%)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={{ backgroundColor: '#FAF6EB', border: '1px solid #1F1A1415', borderRadius: '4px', padding: '32px' }}>
          <div style={{ marginBottom: '24px' }}>
            <div style={sectionLabelStyle}>No 02 — Unit Mastery</div>
            <h2 className="serif" style={{ fontSize: '28px', fontWeight: 500, letterSpacing: '-0.02em', margin: 0 }}>단원별 진척도</h2>
          </div>
          {masteryData.map((u, i) => (
            <div key={i} style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '13px' }}>
                <span style={{ color: '#1F1A14', fontWeight: 500 }}>{u.subject}</span>
                <span className="mono" style={{ color: '#6B6354' }}>{u.value}%</span>
              </div>
              <div style={{ height: '6px', backgroundColor: '#1F1A1410', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{
                  height: '100%', width: `${u.value}%`,
                  backgroundColor: u.value >= 80 ? '#4A5D3A' : u.value >= 60 ? '#B45309' : '#8B3A1F',
                  borderRadius: '3px',
                }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* IMPROVEMENT AREAS + ACHIEVEMENTS */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
        <div style={{ backgroundColor: '#FAF6EB', border: '1px solid #1F1A1415', borderRadius: '4px', padding: '32px' }}>
          <div style={{ marginBottom: '24px' }}>
            <div style={sectionLabelStyle}>No 03 — Next Focus</div>
            <h2 className="serif" style={{ fontSize: '24px', fontWeight: 500, letterSpacing: '-0.02em', margin: 0 }}>다음 주 집중할 영역</h2>
          </div>
          {[
            { unit: '미적분 II', area: '회전체의 부피', priority: '최우선', color: '#8B3A1F', impact: '+8점 예상' },
            { unit: '확률·통계', area: '정규분포 표준화', priority: '높음', color: '#B45309', impact: '+5점 예상' },
            { unit: '기하·벡터', area: '공간좌표 시각화', priority: '중간', color: '#A16207', impact: '+3점 예상' },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', padding: '16px 0', borderBottom: i < 2 ? '1px solid #1F1A1415' : 'none' }}>
              <div className="serif mono" style={{ fontSize: '24px', color: item.color, fontWeight: 500, letterSpacing: '-0.02em' }}>0{i+1}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '11px', color: '#8B7E6A', marginBottom: '4px' }}>{item.unit}</div>
                <div className="serif" style={{ fontSize: '17px', fontWeight: 500, marginBottom: '6px', letterSpacing: '-0.01em' }}>{item.area}</div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <span style={{ fontSize: '10px', padding: '2px 8px', backgroundColor: item.color + '15', color: item.color, borderRadius: '2px', fontWeight: 600 }}>{item.priority}</span>
                  <span style={{ fontSize: '10px', padding: '2px 8px', backgroundColor: '#4A5D3A15', color: '#4A5D3A', borderRadius: '2px', fontWeight: 600 }}>{item.impact}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ backgroundColor: '#FAF6EB', border: '1px solid #1F1A1415', borderRadius: '4px', padding: '32px' }}>
          <div style={{ marginBottom: '24px' }}>
            <div style={sectionLabelStyle}>No 04 — Achievements</div>
            <h2 className="serif" style={{ fontSize: '24px', fontWeight: 500, letterSpacing: '-0.02em', margin: 0 }}>이번 주 성취</h2>
          </div>
          {[
            { icon: Flame, title: '23일 연속 학습 달성', sub: '개인 최고 기록 갱신', color: '#B45309' },
            { icon: TrendingUp, title: '정답률 70% 돌파', sub: '6주 만의 첫 70%대 진입', color: '#4A5D3A' },
            { icon: Target, title: '미적분 I 마스터 완료', sub: '단원 숙련도 91% 달성', color: '#1F1A14' },
            { icon: CheckCircle2, title: '오답 재도전 25문제', sub: '재출제 정답률 82%', color: '#4A5D3A' },
          ].map((a, i) => {
            const Icon = a.icon;
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 0', borderBottom: i < 3 ? '1px solid #1F1A1415' : 'none' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '4px', backgroundColor: a.color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={18} color={a.color} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '2px' }}>{a.title}</div>
                  <div style={{ fontSize: '11px', color: '#6B6354' }}>{a.sub}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ marginTop: '48px', paddingTop: '32px', borderTop: '1px solid #1F1A1415', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '11px', color: '#8B7E6A', letterSpacing: '0.05em' }}>Generated by AI Coach v2.4.1 · 2024년 11월 8일</div>
        <button style={{ padding: '10px 16px', backgroundColor: 'transparent', border: '1px solid #1F1A1430', borderRadius: '4px', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'inherit', color: '#1F1A14' }}>
          <FileText size={12} /> PDF로 내보내기
        </button>
      </div>
    </>
  );
}
