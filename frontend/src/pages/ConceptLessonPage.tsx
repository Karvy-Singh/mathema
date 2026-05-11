/**
 * ConceptLessonPage — 단원 진입 전 사전 개념학습 화면.
 *
 * URL: /learn/:code (chapterCode, 예: C7-CH04-SIMPLE-EQUATIONS)
 *
 * 단계 순서 (서버 시퀀스 그대로 따름):
 *   HOOK → CONCRETE → PICTORIAL → ABSTRACT → WORKED_EXAMPLE → MISCONCEPTION → RETRIEVAL (→ REFLECT)
 *
 * RETRIEVAL 통과 시 ConceptProgress.masteredAt 이 세팅되고, 사용자는 문제풀이로 진입 가능.
 */

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, CheckCircle2, ChevronRight, Sparkles } from 'lucide-react';
import MathText from '../components/MathText';
import { toast } from '../components/Toast';
import { useT } from '../lib/i18n';
import {
  fetchConceptLesson,
  ConceptLessonDetail,
  ConceptStep,
  ConceptStepKind,
} from '../lib/queries';
import {
  startConceptLesson,
  completeConceptStep,
  checkConceptRetrieval,
} from '../lib/mutations';

const STEP_COLORS: Record<ConceptStepKind, string> = {
  HOOK: '#7c3aed',
  CONCRETE: '#0ea5e9',
  PICTORIAL: '#0891b2',
  ABSTRACT: '#4f46e5',
  WORKED_EXAMPLE: '#059669',
  GUIDED_PRACTICE: '#16a34a',
  MISCONCEPTION: '#dc2626',
  RETRIEVAL: '#ea580c',
  REFLECT: '#a16207',
};

const STEP_LABELS: Record<'ko' | 'en', Record<ConceptStepKind, string>> = {
  ko: {
    HOOK: '왜 배우는가',
    CONCRETE: '구체 예시',
    PICTORIAL: '그림·도식',
    ABSTRACT: '기호와 정의',
    WORKED_EXAMPLE: '풀이 시연',
    GUIDED_PRACTICE: '함께 풀어보기',
    MISCONCEPTION: '흔한 함정',
    RETRIEVAL: '자가 점검',
    REFLECT: '내 말로 정리',
  },
  en: {
    HOOK: 'Why this matters',
    CONCRETE: 'Concrete example',
    PICTORIAL: 'Picture & diagram',
    ABSTRACT: 'Symbols & definition',
    WORKED_EXAMPLE: 'Worked example',
    GUIDED_PRACTICE: 'Guided practice',
    MISCONCEPTION: 'Common pitfalls',
    RETRIEVAL: 'Recall check',
    REFLECT: 'My own summary',
  },
};

// UI 마이크로카피
const UI_LABEL = {
  ko: {
    backTo: '대시보드로',
    chapter: 'Chapter',
    mastered: '완료',
    loading: '불러오는 중…',
    loadFailed: '학습을 불러오지 못했어요.',
    prev: '이전',
    nextStep: '다음',
    finish: '완료',
    completed: '완료',
    answerPh: '답을 입력하세요',
    confirm: '확인',
    passed: '✅ 정확합니다.',
    failed: '❌ 다시 한 번 생각해보세요.',
    hintLabel: '힌트',
    finishMust: '마지막 단계 (자가 점검) 을 통과해야 완료됩니다.',
    finishPassed: '통과 🎉 — 이제 문제풀이로 진입할 수 있어요.',
  },
  en: {
    backTo: 'Back to dashboard',
    chapter: 'Chapter',
    mastered: 'Mastered',
    loading: 'Loading…',
    loadFailed: 'Could not load this lesson.',
    prev: 'Prev',
    nextStep: 'Next',
    finish: 'Finish',
    completed: 'completed',
    answerPh: 'Type your answer',
    confirm: 'Check',
    passed: '✅ Correct.',
    failed: '❌ Think again.',
    hintLabel: 'Hint',
    finishMust: 'Pass the final recall check to complete this lesson.',
    finishPassed: 'Passed 🎉 — problem practice unlocked.',
  },
} as const;

export default function ConceptLessonPage() {
  const { code = '' } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { lang } = useT();
  const L = UI_LABEL[lang];
  const stepLabels = STEP_LABELS[lang];

  const { data, isLoading, error } = useQuery<ConceptLessonDetail>({
    queryKey: ['conceptLesson', code],
    queryFn: () => fetchConceptLesson(code),
    enabled: !!code,
  });

  const [stepIdx, setStepIdx] = useState(0);
  const [retrievalAnswer, setRetrievalAnswer] = useState('');
  const [retrievalResult, setRetrievalResult] = useState<{
    passed: boolean;
    explain: { ko: string; en: string } | null;
    hint: { ko: string; en: string } | null;
  } | null>(null);

  const [started, setStarted] = useState(false);
  // ConceptLesson 시작 — 처음 데이터 로드 시 한 번만 호출 (idempotent on server).
  useEffect(() => {
    if (data && !started) {
      startConceptLesson(code).catch(() => undefined);
      setStarted(true);
    }
  }, [data, code, started]);

  // 답안을 수정하면 이전 채점 결과를 지운다 — 사용자가 같은 카드에 재도전 가능.
  const handleRetrievalAnswerChange = (v: string) => {
    setRetrievalAnswer(v);
    if (retrievalResult && !retrievalResult.passed) setRetrievalResult(null);
  };

  const completeMut = useMutation({
    mutationFn: (stepIndex: number) => completeConceptStep(code, stepIndex),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['conceptLesson', code] }),
  });

  const checkMut = useMutation({
    mutationFn: ({ stepIndex, answer }: { stepIndex: number; answer: string }) =>
      checkConceptRetrieval(code, stepIndex, answer),
    onSuccess: (res) => {
      setRetrievalResult({
        passed: res.passed,
        explain: res.explain,
        hint: res.hint,
      });
      if (res.passed) {
        toast(L.finishPassed, 'success');
        qc.invalidateQueries({ queryKey: ['conceptLesson', code] });
      }
    },
  });

  if (isLoading) {
    return <Center>{L.loading}</Center>;
  }
  if (error || !data) {
    return <Center>{L.loadFailed}</Center>;
  }

  const steps = data.steps;
  const current = steps[stepIdx];
  const isLast = stepIdx === steps.length - 1;
  const totalCount = steps.length;
  const completedCount = data.progress?.completedSteps?.length ?? 0;

  const goNext = async () => {
    try {
      await completeMut.mutateAsync(current.stepIndex);
    } catch { /* ignore — local progress works */ }
    setRetrievalAnswer('');
    setRetrievalResult(null);
    if (isLast) {
      if (data.progress?.masteredAt || retrievalResult?.passed) {
        navigate('/'); // 문제풀이로 복귀
      } else {
        toast(L.finishMust, 'error');
      }
    } else {
      setStepIdx((i) => i + 1);
    }
  };

  return (
    <div style={pageStyle}>
      <div style={containerStyle}>
        {/* HEADER */}
        <div style={headerStyle}>
          <button onClick={() => navigate('/')} style={backBtnStyle} aria-label="back">
            <ArrowLeft size={18} />
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, letterSpacing: '0.2em', color: '#8B95AB' }}>
              NCERT · {data.ncertClass.replace('CLASS_', 'Class ')} · {L.chapter} {data.chapterNumber}
            </div>
            <h1 style={titleStyle}>{data.title}</h1>
            <p style={bigIdeaStyle}>{data.bigIdea}</p>
          </div>
          {data.mastered && (
            <span style={masteredBadgeStyle}>
              <CheckCircle2 size={14} /> {L.mastered}
            </span>
          )}
        </div>

        {/* PROGRESS BAR */}
        <ProgressBar steps={steps} currentIdx={stepIdx} stepLabels={stepLabels} />

        {/* STEP BODY */}
        <StepCard
          step={current}
          stepLabels={stepLabels}
          L={L}
          retrievalAnswer={retrievalAnswer}
          onRetrievalAnswer={handleRetrievalAnswerChange}
          retrievalResult={retrievalResult}
          onSubmitRetrieval={() =>
            checkMut.mutate({ stepIndex: current.stepIndex, answer: retrievalAnswer })
          }
        />

        {/* NAV */}
        <div style={navRowStyle}>
          <button
            onClick={() => setStepIdx((i) => Math.max(0, i - 1))}
            disabled={stepIdx === 0}
            style={{
              ...secondaryBtnStyle,
              opacity: stepIdx === 0 ? 0.4 : 1,
              cursor: stepIdx === 0 ? 'not-allowed' : 'pointer',
            }}
          >
            {L.prev}
          </button>
          <div style={{ fontSize: 12, color: '#8B95AB' }}>
            {stepIdx + 1} / {totalCount} · {L.completed} {completedCount}
          </div>
          <button
            onClick={goNext}
            disabled={
              current.kind === 'RETRIEVAL' && !retrievalResult?.passed && !data.mastered
            }
            style={{
              ...primaryBtnStyle,
              opacity:
                current.kind === 'RETRIEVAL' && !retrievalResult?.passed && !data.mastered
                  ? 0.5
                  : 1,
            }}
          >
            {isLast ? L.finish : L.nextStep}
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

// =========================================================
// SUB COMPONENTS
// =========================================================

function ProgressBar({
  steps,
  currentIdx,
  stepLabels,
}: {
  steps: ConceptStep[];
  currentIdx: number;
  stepLabels: Record<ConceptStepKind, string>;
}) {
  return (
    <div style={{ display: 'flex', gap: 6, marginBottom: 24 }}>
      {steps.map((s, i) => (
        <div
          key={s.id}
          title={stepLabels[s.kind]}
          style={{
            flex: 1,
            height: 6,
            borderRadius: 3,
            background:
              i < currentIdx
                ? STEP_COLORS[s.kind]
                : i === currentIdx
                ? STEP_COLORS[s.kind]
                : '#DDD7C5',
            opacity: i <= currentIdx ? 1 : 0.5,
            transition: 'opacity .2s',
          }}
        />
      ))}
    </div>
  );
}

function StepCard({
  step,
  stepLabels,
  L,
  retrievalAnswer,
  onRetrievalAnswer,
  retrievalResult,
  onSubmitRetrieval,
}: {
  step: ConceptStep;
  stepLabels: Record<ConceptStepKind, string>;
  L: typeof UI_LABEL['ko'] | typeof UI_LABEL['en'];
  retrievalAnswer: string;
  onRetrievalAnswer: (v: string) => void;
  retrievalResult: {
    passed: boolean;
    explain: { ko: string; en: string } | null;
    hint: { ko: string; en: string } | null;
  } | null;
  onSubmitRetrieval: () => void;
}) {
  const { lang } = useT();
  const color = STEP_COLORS[step.kind];
  const explainText = retrievalResult?.explain
    ? lang === 'en' ? retrievalResult.explain.en : retrievalResult.explain.ko
    : null;
  const hintText = retrievalResult?.hint
    ? lang === 'en' ? retrievalResult.hint.en : retrievalResult.hint.ko
    : null;

  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <span style={{ ...stepChipStyle, background: color }}>
          <Sparkles size={12} /> {stepLabels[step.kind]}
        </span>
        <h2 style={stepTitleStyle}>{step.title}</h2>
      </div>

      <div style={bodyTextStyle}>
        <MathText text={step.body} />
      </div>

      {/* WORKED_EXAMPLE 풀이 단계 */}
      {step.kind === 'WORKED_EXAMPLE' && step.workedSteps && (
        <ol style={{ marginTop: 16, paddingLeft: 20, lineHeight: 1.8 }}>
          {step.workedSteps.map((w, i) => (
            <li key={i} style={{ marginBottom: 8 }}>
              <div style={{ fontFamily: 'KaTeX, monospace', fontWeight: 500 }}>
                <MathText text={w.math} />
              </div>
              <div style={{ fontSize: 13, color: '#5C6B85' }}>
                {lang === 'en' ? w.narrationEn : w.narrationKo}
              </div>
            </li>
          ))}
        </ol>
      )}

      {/* RETRIEVAL — 입력 + 채점 */}
      {step.kind === 'RETRIEVAL' && step.retrievalCheck && (
        <div style={{ marginTop: 16 }}>
          <input
            type="text"
            value={retrievalAnswer}
            onChange={(e) => onRetrievalAnswer(e.target.value)}
            placeholder={L.answerPh}
            style={inputStyle}
            disabled={retrievalResult?.passed}
          />
          <button
            onClick={onSubmitRetrieval}
            disabled={!retrievalAnswer.trim() || retrievalResult?.passed}
            style={{ ...primaryBtnStyle, marginTop: 12, opacity: retrievalAnswer.trim() ? 1 : 0.5 }}
          >
            {L.confirm}
          </button>
          {retrievalResult && (
            <div
              style={{
                marginTop: 12,
                padding: 12,
                borderRadius: 8,
                background: retrievalResult.passed ? '#DCFCE7' : '#FEE2E2',
                color: retrievalResult.passed ? '#166534' : '#991B1B',
                fontSize: 14,
              }}
            >
              {retrievalResult.passed ? L.passed : L.failed}
              {explainText && (
                <div style={{ marginTop: 6, color: '#5C6B85', fontSize: 13 }}>
                  💡 {explainText}
                </div>
              )}
              {hintText && !retrievalResult.passed && (
                <div style={{ marginTop: 6, color: '#7C2D12', fontSize: 13 }}>
                  {L.hintLabel}: {hintText}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* MISCONCEPTION block — body 가 이미 ❌/💡/✅ 포함이므로 body 표시로 충분 */}
    </div>
  );
}

function Center({ children }: { children: React.ReactNode }) {
  return (
    <div style={pageStyle}>
      <div style={{ ...cardStyle, textAlign: 'center', color: '#5C6B85' }}>{children}</div>
    </div>
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
const containerStyle: React.CSSProperties = {
  maxWidth: 720,
  margin: '0 auto',
};
const headerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: 12,
  marginBottom: 20,
};
const backBtnStyle: React.CSSProperties = {
  background: '#fff',
  border: '1px solid #DDD7C5',
  width: 36,
  height: 36,
  borderRadius: 18,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  flexShrink: 0,
};
const titleStyle: React.CSSProperties = {
  margin: '4px 0 6px',
  color: '#2A3447',
  fontSize: 22,
  fontWeight: 700,
};
const bigIdeaStyle: React.CSSProperties = {
  margin: 0,
  color: '#5C6B85',
  fontSize: 14,
  lineHeight: 1.6,
};
const masteredBadgeStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  padding: '4px 10px',
  borderRadius: 12,
  background: '#DCFCE7',
  color: '#166534',
  fontSize: 12,
  fontWeight: 600,
  flexShrink: 0,
};
const cardStyle: React.CSSProperties = {
  background: '#fff',
  borderRadius: 12,
  padding: 24,
  border: '1px solid #DDD7C5',
  boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
};
const stepChipStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  padding: '3px 8px',
  borderRadius: 10,
  color: '#fff',
  fontSize: 11,
  fontWeight: 600,
};
const stepTitleStyle: React.CSSProperties = {
  margin: 0,
  color: '#2A3447',
  fontSize: 16,
  fontWeight: 600,
};
const bodyTextStyle: React.CSSProperties = {
  color: '#2A3447',
  fontSize: 15,
  lineHeight: 1.75,
  whiteSpace: 'pre-line',
};
const navRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginTop: 24,
};
const primaryBtnStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '10px 18px',
  borderRadius: 8,
  background: '#2A3447',
  color: '#fff',
  border: 'none',
  cursor: 'pointer',
  fontSize: 14,
  fontWeight: 600,
};
const secondaryBtnStyle: React.CSSProperties = {
  padding: '10px 18px',
  borderRadius: 8,
  background: '#fff',
  color: '#5C6B85',
  border: '1px solid #DDD7C5',
  fontSize: 14,
  fontWeight: 500,
};
const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 14px',
  fontSize: 15,
  borderRadius: 8,
  border: '1px solid #DDD7C5',
  background: '#FAF8F1',
  color: '#2A3447',
  outline: 'none',
};
