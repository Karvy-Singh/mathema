/**
 * ConceptHubPage — NCERT 7~12 학년별 사전 개념학습 허브.
 *
 * URL: /learn
 *
 * 학년 탭 → 챕터 그리드. 각 카드는 lesson 진입 / mastered 여부 / cognitive load 표시.
 */

import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, CheckCircle2, Clock, Lock, Sparkles } from 'lucide-react';
import { toast } from '../components/Toast';
import {
  fetchConceptLessons,
  ConceptLessonSummary,
  NcertClass,
} from '../lib/queries';
import { useAuth } from '../context/AuthContext';
import { useT } from '../lib/i18n';

// 한국 학년 enum ↔ NCERT 학년 매핑 — ConceptLesson 트리는 NCERT 학년 1차 기준이므로
// 사용자의 한국 gradeLevel 을 그에 대응하는 NCERT class 로 변환해 디폴트 탭으로 사용.
const KO_GRADE_TO_NCERT: Record<string, NcertClass> = {
  G_MIDDLE_1: 'CLASS_7',
  G_MIDDLE_2: 'CLASS_8',
  G_MIDDLE_3: 'CLASS_9',
  G_HIGH_1: 'CLASS_10',
  G_HIGH_2: 'CLASS_11',
  G_HIGH_3: 'CLASS_12',
};

const CLASSES: { key: NcertClass; label: string }[] = [
  { key: 'CLASS_7', label: 'Class 7' },
  { key: 'CLASS_8', label: 'Class 8' },
  { key: 'CLASS_9', label: 'Class 9' },
  { key: 'CLASS_10', label: 'Class 10' },
  { key: 'CLASS_11', label: 'Class 11' },
  { key: 'CLASS_12', label: 'Class 12' },
];

const LOAD_LABEL_KO = ['가벼움', '보통', '집중', '심화'] as const;
const LOAD_LABEL_EN = ['Light', 'Standard', 'Focused', 'Challenging'] as const;
const LOAD_COLOR = ['#22c55e', '#3b82f6', '#f59e0b', '#dc2626'];

/**
 * @param embedded — true 이면 MathLearningApp 의 한 탭으로 임베드 (외곽 padding/배경/Back 버튼 제거).
 *                   false (기본) 이면 /learn URL 로 직접 진입한 별도 페이지.
 */
export default function ConceptHubPage({ embedded = false }: { embedded?: boolean } = {}) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { lang } = useT();
  // 사용자 학년 → NCERT class 디폴트 (없으면 Class 7).
  const defaultClass: NcertClass = useMemo(
    () => (user?.gradeLevel ? KO_GRADE_TO_NCERT[user.gradeLevel] ?? 'CLASS_7' : 'CLASS_7'),
    [user?.gradeLevel],
  );
  const [activeClass, setActiveClass] = useState<NcertClass>(defaultClass);
  const LOAD_LABEL = lang === 'en' ? LOAD_LABEL_EN : LOAD_LABEL_KO;

  const { data: lessons, isLoading, isError, error } = useQuery<ConceptLessonSummary[]>({
    queryKey: ['conceptLessons', activeClass],
    queryFn: () => fetchConceptLessons(activeClass),
    retry: 0,
  });

  // Prerequisite lock 평가용 — 모든 학년의 mastery 가 필요할 수 있으나, 1차로 화면에 보이는
  // 학년 + 이전 학년 한 단계까지 조회 (대부분 prerequisite 은 같은 학년 안에서 닫힘).
  const { data: prevLessons } = useQuery<ConceptLessonSummary[]>({
    queryKey: ['conceptLessons', 'prev-class', activeClass],
    queryFn: () => {
      const idx = CLASSES.findIndex((c) => c.key === activeClass);
      return idx > 0 ? fetchConceptLessons(CLASSES[idx - 1].key) : Promise.resolve([]);
    },
    enabled: activeClass !== 'CLASS_7',
  });

  /** chapterCode → mastered 매핑 (현재 + 이전 학년). */
  const masteryByCode = useMemo(() => {
    const map: Record<string, boolean> = {};
    [...(lessons ?? []), ...(prevLessons ?? [])].forEach((l) => {
      map[l.chapterCode] = l.mastered;
    });
    return map;
  }, [lessons, prevLessons]);

  // Prerequisite 잠금 완전 비활성 — 사용자가 모든 챕터를 자유롭게 탐색 가능.
  // (백엔드 startConceptLesson 의 BadRequestException 도 ConceptLessonPage 에서 fallthrough 처리됨)
  const isLocked = (_lesson: ConceptLessonSummary): { locked: boolean; missing: string[] } => {
    return { locked: false, missing: [] };
  };

  const handleOpen = (l: ConceptLessonSummary) => {
    navigate(`/learn/${l.chapterCode}`);
  };

  // embed 시에는 외곽 wrapper/padding 제거, MathLearningApp 의 main 영역 안에서 렌더링.
  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) =>
    embedded ? <>{children}</> : <div style={pageStyle}><div style={containerStyle}>{children}</div></div>;

  return (
    <Wrapper>
        {!embedded && (
          <button onClick={() => navigate('/')} style={backBtnStyle}>
            <ArrowLeft size={16} /> {lang === 'en' ? 'Back to dashboard' : '대시보드로'}
          </button>
        )}

        <div style={{ marginTop: embedded ? 0 : 12 }}>
          <div style={{ fontSize: 11, letterSpacing: '0.2em', color: '#8B95AB' }}>
            CONCEPT LEARNING · NCERT 7–12
          </div>
          <h1 style={titleStyle}>{lang === 'en' ? 'Concept Learning' : '개념학습'}</h1>
          <p style={subtitleStyle}>
            {lang === 'en'
              ? 'Build the big idea before solving problems. A short lesson grounded in six learning-science principles (CPA · CLT · Variation · Worked-Example · Retrieval · Misconception).'
              : '문제를 풀기 전에 단원의 빅 아이디어를 잡습니다. 인지심리학 6원칙 (CPA · CLT · Variation · Worked-Example · Retrieval · Misconception) 으로 구성된 짧은 차시.'}
          </p>
        </div>

        {/* CLASS TABS */}
        <div style={tabsStyle}>
          {CLASSES.map((c) => (
            <button
              key={c.key}
              onClick={() => setActiveClass(c.key)}
              style={{
                ...tabBtnStyle,
                background: activeClass === c.key ? '#2A3447' : '#fff',
                color: activeClass === c.key ? '#fff' : '#5C6B85',
              }}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* LESSON GRID */}
        {isLoading ? (
          <div style={{ textAlign: 'center', color: '#5C6B85', padding: 40 }}>
            {lang === 'en' ? 'Loading…' : '불러오는 중…'}
          </div>
        ) : isError ? (
          <div style={{
            margin: '24px 0', padding: 20, borderRadius: 8,
            background: '#FEF3C7', border: '1px solid #F59E0B40',
            color: '#92400E',
          }}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>
              {lang === 'en'
                ? 'ConceptLesson table not initialised yet.'
                : 'ConceptLesson 테이블이 아직 초기화되지 않았습니다.'}
            </div>
            <div style={{ fontSize: 13, lineHeight: 1.6, color: '#7C2D12', marginBottom: 10 }}>
              {lang === 'en'
                ? 'Run the DB bootstrap once (in backend/):'
                : '백엔드 디렉토리에서 다음 명령을 한 번 실행하세요:'}
            </div>
            <pre style={{
              background: '#1F2937', color: '#F9FAFB',
              padding: 12, borderRadius: 6, fontSize: 12,
              fontFamily: 'monospace', overflow: 'auto', margin: 0,
            }}>{`# stop the dev server first (Ctrl+C)
npx prisma generate
npx prisma migrate dev --name concept_lessons
npm run db:seed
npm run start:dev`}</pre>
            <div style={{ fontSize: 11, color: '#92400E', marginTop: 8, opacity: 0.7 }}>
              {String((error as any)?.message ?? error ?? '')}
            </div>
          </div>
        ) : !lessons || lessons.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#5C6B85', padding: 40 }}>
            {lang === 'en' ? 'No lessons in this class yet.' : '이 학년의 개념학습이 아직 없습니다.'}
          </div>
        ) : (
          <div style={gridStyle}>
            {lessons.map((l) => {
              const lockState = isLocked(l);
              return (
                <LessonCard
                  key={l.chapterCode}
                  lesson={l}
                  lang={lang}
                  loadLabel={LOAD_LABEL}
                  locked={lockState.locked}
                  onOpen={() => handleOpen(l)}
                />
              );
            })}
          </div>
        )}
    </Wrapper>
  );
}

function LessonCard({
  lesson,
  lang,
  loadLabel,
  locked,
  onOpen,
}: {
  lesson: ConceptLessonSummary;
  lang: 'ko' | 'en' | 'hi';
  loadLabel: readonly string[];
  locked: boolean;
  onOpen: () => void;
}) {
  const load = Math.min(3, Math.max(0, lesson.cognitiveLoad ?? 1));
  return (
    <button
      onClick={onOpen}
      style={{
        ...cardStyle,
        opacity: locked ? 0.55 : 1,
        background: locked ? '#F7F4EA' : '#fff',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <span style={chapterNumStyle}>Ch. {lesson.chapterNumber}</span>
        {lesson.mastered && (
          <span style={masteredBadge}>
            <CheckCircle2 size={12} /> {lang === 'en' ? 'Mastered' : '완료'}
          </span>
        )}
        {!lesson.mastered && locked && (
          <span style={lockedBadge}>
            <Lock size={12} /> {lang === 'en' ? 'Locked' : '잠김'}
          </span>
        )}
      </div>
      <h3 style={cardTitleStyle}>{lesson.title}</h3>
      <p style={cardIdeaStyle}>{lesson.bigIdea}</p>
      <div style={cardFooterStyle}>
        <span style={{ ...metaItemStyle, color: '#5C6B85' }}>
          <Clock size={12} /> {lesson.estimatedMin}{lang === 'en' ? ' min' : '분'}
        </span>
        <span style={{ ...metaItemStyle, color: LOAD_COLOR[load] }}>
          <Sparkles size={12} /> {loadLabel[load]}
        </span>
        {lesson.unit && (
          <span style={{ ...metaItemStyle, color: '#0e7490' }}>· {lesson.unit.name}</span>
        )}
      </div>
    </button>
  );
}

// =========================================================
// STYLES
// =========================================================
const pageStyle: React.CSSProperties = {
  minHeight: '100vh',
  background: '#EFEBDF',
  padding: '24px 16px',
  fontFamily: '"Pretendard", -apple-system, sans-serif',
};
const containerStyle: React.CSSProperties = { maxWidth: 1080, margin: '0 auto' };
const backBtnStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '6px 12px',
  background: '#fff',
  border: '1px solid #DDD7C5',
  borderRadius: 16,
  cursor: 'pointer',
  fontSize: 13,
  color: '#5C6B85',
};
const titleStyle: React.CSSProperties = {
  margin: '4px 0',
  color: '#2A3447',
  fontSize: 26,
  fontWeight: 700,
};
const subtitleStyle: React.CSSProperties = {
  marginTop: 6,
  color: '#5C6B85',
  fontSize: 14,
  lineHeight: 1.6,
  maxWidth: 640,
};
const tabsStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 8,
  margin: '24px 0',
};
const tabBtnStyle: React.CSSProperties = {
  padding: '8px 16px',
  borderRadius: 18,
  border: '1px solid #DDD7C5',
  fontWeight: 600,
  fontSize: 13,
  cursor: 'pointer',
  transition: 'all .15s',
};
const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
  gap: 14,
};
const cardStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: 16,
  borderRadius: 12,
  background: '#fff',
  border: '1px solid #DDD7C5',
  cursor: 'pointer',
  boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  transition: 'transform .15s, box-shadow .15s',
};
const chapterNumStyle: React.CSSProperties = {
  fontSize: 11,
  letterSpacing: '0.15em',
  color: '#8B95AB',
  fontWeight: 600,
};
const masteredBadge: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 3,
  padding: '2px 8px',
  borderRadius: 10,
  background: '#DCFCE7',
  color: '#166534',
  fontSize: 11,
  fontWeight: 600,
};
const lockedBadge: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 3,
  padding: '2px 8px',
  borderRadius: 10,
  background: '#FEF3C7',
  color: '#92400E',
  fontSize: 11,
  fontWeight: 600,
};
const cardTitleStyle: React.CSSProperties = {
  margin: 0,
  color: '#2A3447',
  fontSize: 16,
  fontWeight: 700,
};
const cardIdeaStyle: React.CSSProperties = {
  margin: 0,
  color: '#5C6B85',
  fontSize: 13,
  lineHeight: 1.55,
  display: '-webkit-box',
  WebkitLineClamp: 3,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
};
const cardFooterStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  flexWrap: 'wrap',
  marginTop: 'auto',
  paddingTop: 6,
  borderTop: '1px solid #F0EAD8',
  fontSize: 12,
};
const metaItemStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
};
