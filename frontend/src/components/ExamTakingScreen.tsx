import { useEffect, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Clock, ArrowRight, CheckCircle2, AlertCircle, Lightbulb, Home } from 'lucide-react';
import { toast } from './Toast';
import * as M from '../lib/mutations';
import ConfidenceSlider from './ConfidenceSlider';
import { useT } from '../lib/i18n';
import MathText from './MathText';

type Props = {
  exam: M.ExamPackage;
  onClose: (result: { id: string; score: number; grade: number; percentile: number; durationMin: number } | null) => void;
};

type Feedback = {
  isCorrect: boolean;
  choiceId: string;
  choiceText: string;
  distractorType?: string | null;
  rationale?: string | null;
};

/**
 * 모의고사 응시 화면 — 학습(StudySession) 과 동일한 per-step 흐름.
 * 1) 한 단계씩만 노출 (이전 단계는 잠긴 채 가려짐)
 * 2) choice 선택 → submit → backend 가 isCorrect/distractorType/rationale 반환 → 즉시 피드백
 * 3) 정답이면 다음 단계, 오답이면 그 보기 잠그고 재시도
 * 4) 한 문제의 3 단계 모두 정답 후 → 다음 문제 자동 진행
 * 5) 모든 문제 완료 → finalize 호출 → 결과 모달
 *
 * 오버레이 아니라 메인 레이아웃 안에 인라인 렌더되어 TopNav 가 그대로 노출됨.
 */
export default function ExamTakingScreen({ exam, onClose }: Props) {
  const qc = useQueryClient();
  const { t } = useT();

  // 문제 인덱스 / 단계 / 선택 / 결과
  const [idx, setIdx] = useState(0);
  const [problemStep, setProblemStep] = useState<1 | 2 | 3>(1);
  const [selectedChoiceId, setSelectedChoiceId] = useState<string | null>(null);
  // 문제별로 단계별 결과 저장: { [problemId]: { [stepIndex]: { correct, choiceId } } }
  const [results, setResults] = useState<Record<string, Record<number, { correct: boolean; choiceId: string }>>>({});
  const [wrongChoiceIds, setWrongChoiceIds] = useState<Set<string>>(new Set());
  const [lastFeedback, setLastFeedback] = useState<Feedback | null>(null);
  const [confidence, setConfidence] = useState(50);

  // 타이머
  const [seconds, setSeconds] = useState(0);
  const startedAt = useRef<number>(Date.now());
  const stepStartedAt = useRef<number>(Date.now());

  const [confirmExit, setConfirmExit] = useState(false);
  const [confirmFinalize, setConfirmFinalize] = useState(false);
  const finalizedRef = useRef(false);

  const totalSec = exam.totalMinutes * 60;
  const remaining = Math.max(0, totalSec - seconds);
  const mm = String(Math.floor(remaining / 60)).padStart(2, '0');
  const ss = String(remaining % 60).padStart(2, '0');

  const current = exam.problems[idx];
  const currentStep = current?.steps?.find((s) => s.stepIndex === problemStep);
  const totalSteps = current?.steps?.length ?? 3;
  const stepLocked = !!results[current?.id ?? '']?.[problemStep];

  // 문제 / 단계가 바뀌면 상태 리셋
  useEffect(() => {
    setSelectedChoiceId(null);
    setLastFeedback(null);
    setWrongChoiceIds(new Set());
    setConfidence(50);
    stepStartedAt.current = Date.now();
  }, [current?.id, problemStep]);

  // 타이머
  useEffect(() => {
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  // 시간 만료 자동 종료
  useEffect(() => {
    if (remaining === 0 && exam.resultId && !finalizedRef.current) {
      finalizedRef.current = true;
      toast(t('exam.timer.expired'), 'info');
      finalizeMut.mutate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining]);

  const submitStepMut = useMutation({
    mutationFn: (choiceId: string) => M.submitExamStepAnswer(exam.resultId!, {
      problemId: current.id,
      choiceId,
      stepIndex: problemStep,
      durationSec: Math.max(1, Math.round((Date.now() - stepStartedAt.current) / 1000)),
      confidence: wrongChoiceIds.size === 0 ? confidence : undefined,
    }),
    onSuccess: (res) => {
      const c = res.choice;
      if (!c) return;
      setLastFeedback({
        isCorrect: !!res.isCorrect,
        choiceId: c.id,
        choiceText: c.text,
        distractorType: c.distractorType,
        rationale: c.rationale,
      });
      if (res.isCorrect) {
        // 단계 잠금
        setResults((prev) => ({
          ...prev,
          [current.id]: { ...(prev[current.id] ?? {}), [problemStep]: { correct: true, choiceId: c.id } },
        }));
      } else {
        // 오답 → wrongChoiceIds 추가, selection 해제 (다른 보기로 재시도)
        setWrongChoiceIds((prev) => new Set(prev).add(c.id));
        setSelectedChoiceId(null);
      }
    },
    onError: () => toast(t('toast.exam.submitFailed'), 'error'),
  });

  const finalizeMut = useMutation({
    mutationFn: () => M.finalizeExam(exam.resultId!),
    onSuccess: (r) => {
      toast(t('toast.exam.submitDone', { score: r.score, grade: r.grade }), 'success');
      qc.invalidateQueries({ queryKey: ['mock-summary'] });
      qc.invalidateQueries({ queryKey: ['mock-trajectory'] });
      qc.invalidateQueries({ queryKey: ['mock-results'] });
      qc.invalidateQueries({ queryKey: ['mastery'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      qc.invalidateQueries({ queryKey: ['act-stats'] });
      qc.invalidateQueries({ queryKey: ['heatmap'] });
      onClose(r);
    },
    onError: () => toast(t('toast.exam.submitFailed'), 'error'),
  });

  const advanceAfterCorrect = () => {
    if (problemStep < totalSteps) {
      setProblemStep((problemStep + 1) as 1 | 2 | 3);
    } else if (idx < exam.problems.length - 1) {
      setIdx(idx + 1);
      setProblemStep(1);
    } else {
      // 마지막 문제의 마지막 단계 정답 → 종료 확인
      setConfirmFinalize(true);
    }
  };

  // 응시 가능한 문제가 없는 경우
  if (!exam.resultId || exam.problems.length === 0) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <h2 className="serif" style={{ fontSize: 22, fontWeight: 500, margin: 0, marginBottom: 12 }}>{exam.name}</h2>
        <p style={{ fontSize: 13, color: '#5C6B85', lineHeight: 1.65, marginBottom: 20 }}>
          <strong>{t('exam.empty.title')}</strong><br />
          {t('exam.empty.desc')}
        </p>
        <button onClick={() => onClose(null)} style={btnPrimary}>{t('common.close')}</button>
      </div>
    );
  }

  const progressDone = exam.problems.filter((p) => {
    const r = results[p.id];
    return r && Object.keys(r).length === (p.steps?.length ?? 0);
  }).length;
  const progressPct = Math.round((progressDone / exam.problems.length) * 100);

  return (
    <div style={{ maxWidth: 880, margin: '0 auto' }}>
      {/* Exam 서브바: 시험명 + 진행 + 타이머 + 종료. TopNav 는 부모에서 노출됨. */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
        marginBottom: 24, padding: '14px 18px',
        backgroundColor: '#142850', color: '#EFEBDF', borderRadius: 6,
      }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: '0.18em', color: '#AAB4C5', textTransform: 'uppercase' }}>
            {t('exam.problem.label', { n: String(idx + 1).padStart(2, '0'), total: exam.problems.length })} · {progressPct}%
          </div>
          <div className="serif" style={{ fontSize: 18, fontWeight: 500, marginTop: 2 }}>
            {exam.name}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '6px 12px', backgroundColor: remaining < 60 ? '#C25E2E' : '#EFEBDF18',
            borderRadius: 4, fontFamily: 'JetBrains Mono, monospace',
          }}>
            <Clock size={14} />
            <span style={{ fontSize: 15, fontWeight: 600 }}>{mm}:{ss}</span>
          </div>
          <button
            onClick={() => setConfirmExit(true)}
            title={t('exam.exit.btn')}
            style={{ background: 'transparent', border: '1px solid #EFEBDF50', color: '#EFEBDF', padding: '6px 12px', borderRadius: 4, cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Home size={13} /> {t('exam.exit.home')}
          </button>
        </div>
      </div>

      {/* 진척률 바 */}
      <div style={{ height: 4, backgroundColor: '#14285015', borderRadius: 2, marginBottom: 24, overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${progressPct}%`,
          backgroundColor: '#5A8A45', transition: 'width 0.3s',
        }} />
      </div>

      {/* 문제 메타 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: '0.18em', color: '#8B95AB', textTransform: 'uppercase' }}>
            {current.source}
          </div>
        </div>
        <span style={{
          fontSize: 11, padding: '4px 10px',
          backgroundColor:
            current.difficulty === 'KILLER' ? '#142850' :
            current.difficulty === 'SEMI_KILLER' ? '#C25E2E' :
            current.difficulty === 'UPPER_MIDDLE' ? '#C7791F' : '#AAB4C5',
          color: '#EFEBDF', borderRadius: 2,
        }}>{current.difficulty}</span>
      </div>

      {/* 본문 — KaTeX 로 $...$ / $$...$$ 수식 렌더링 */}
      <div className="serif" style={{
        fontSize: 18, lineHeight: 1.75, color: '#142850', marginBottom: 24,
        whiteSpace: 'pre-wrap',
        padding: 24, backgroundColor: '#F8F4E9', border: '1px solid #14285018', borderRadius: 4,
      }}>
        <MathText text={current.body} />
      </div>

      {/* 단계 표시 */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 8 }}>
          {[1, 2, 3].map((n) => {
            const r = results[current.id]?.[n];
            const isCurrent = n === problemStep;
            const bg = r?.correct ? '#5A8A45' : isCurrent ? '#C7791F' : '#14285018';
            const label = n === 1 ? t('study.step.concept') : n === 2 ? t('study.step.process') : t('study.step.answer');
            return (
              <div key={n} style={{
                flex: 1, padding: '6px 10px', backgroundColor: bg,
                color: r || isCurrent ? '#EFEBDF' : '#5C6B85',
                borderRadius: 4, fontSize: 11, fontWeight: 600, textAlign: 'center', letterSpacing: '0.05em',
              }}>
                {`${n}/3`} · {label} {r?.correct ? '✓' : ''}
              </div>
            );
          })}
        </div>
        {currentStep && (
          <div style={{ fontSize: 14, color: '#142850', fontWeight: 600, marginTop: 12, lineHeight: 1.5 }}>
            Q{problemStep}. {currentStep.prompt}
          </div>
        )}
      </div>

      {/* 5지선다 — 학습과 동일한 mastery learning */}
      {currentStep && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
          {currentStep.choices.map((c, ci) => {
            const isAlreadyWrong = wrongChoiceIds.has(c.id);
            const isCurrentSelection = !stepLocked && selectedChoiceId === c.id;
            const isFinalCorrect = stepLocked && results[current.id]?.[problemStep]?.choiceId === c.id;
            const disabled = stepLocked || isAlreadyWrong;

            let bgColor = '#F8F4E9';
            let borderColor = '#14285030';
            let icon: string | null = null;
            let textColor = '#142850';
            if (isFinalCorrect) { bgColor = '#5A8A4518'; borderColor = '#5A8A45'; icon = '✓'; }
            else if (isAlreadyWrong) { bgColor = '#C25E2E12'; borderColor = '#C25E2E'; icon = '✗'; textColor = '#8B95AB'; }
            else if (stepLocked) { bgColor = '#14285005'; borderColor = '#14285018'; textColor = '#AAB4C5'; }
            else if (isCurrentSelection) { bgColor = '#14285008'; borderColor = '#142850'; }

            return (
              <button
                key={c.id}
                onClick={() => !disabled && setSelectedChoiceId(c.id)}
                disabled={disabled}
                style={{
                  padding: '10px 14px', textAlign: 'left',
                  border: '1px solid ' + borderColor, backgroundColor: bgColor, color: textColor,
                  borderRadius: 4, fontSize: 14, fontFamily: 'inherit',
                  cursor: disabled ? 'default' : 'pointer',
                  display: 'flex', alignItems: 'flex-start', gap: 10, transition: 'all 0.15s',
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
                }}>{icon ?? (ci + 1)}</span>
                <span style={{ flex: 1, fontFamily: 'JetBrains Mono, monospace', fontSize: 13, lineHeight: 1.5 }}>{c.text}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* 즉시 피드백 — 정답이면 초록, 오답이면 distractor 설명 */}
      {lastFeedback && (
        <div style={{
          padding: 14,
          backgroundColor: lastFeedback.isCorrect ? '#5A8A4512' : '#C25E2E0E',
          border: `1px solid ${lastFeedback.isCorrect ? '#5A8A4540' : '#C25E2E40'}`,
          borderRadius: 4, marginBottom: 12, fontSize: 13, lineHeight: 1.65,
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
              <div style={{ fontSize: 12, color: '#5C6B85' }}>{t('study.feedback.wrong.tryAgain')}</div>
            </div>
          )}
        </div>
      )}

      {/* 핵심 개념 + 공식 — 한 번이라도 틀리거나 마지막 단계 정답 시 노출 */}
      {(current as any).concept && (lastFeedback || (results[current.id]?.[3]?.correct)) && (
        <div style={{
          padding: 14, marginBottom: 12,
          backgroundColor: '#14285008',
          border: '1px solid #14285020', borderLeft: '3px solid #C25E2E',
          borderRadius: '0 4px 4px 0',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#C25E2E', fontWeight: 600, marginBottom: 8 }}>
            <Lightbulb size={13} /> {t('study.concept.label')}
          </div>
          <div style={{ fontSize: 13, lineHeight: 1.7, color: '#142850', whiteSpace: 'pre-wrap' }}>
            {(current as any).concept}
          </div>
          {current.formula && (
            <div style={{
              marginTop: 10, padding: '10px 12px',
              backgroundColor: '#F8F4E9', border: '1px solid #14285020', borderRadius: 4,
            }}>
              <div style={{ fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#1FB8C4', fontWeight: 700, marginBottom: 4 }}>
                {t('study.formula.label')}
              </div>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, color: '#142850' }}>
                {current.formula}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 액션 영역 — 학습과 동일한 흐름 */}
      {!stepLocked ? (
        <>
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
          </div>
        </>
      ) : (
        <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
          <button
            onClick={advanceAfterCorrect}
            style={{
              flex: 1, padding: '14px',
              backgroundColor: '#5A8A45', color: '#EFEBDF', border: 'none',
              borderRadius: 4, fontSize: 14, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}
          >
            {problemStep < totalSteps ? t('study.next.step', { next: problemStep + 1, total: totalSteps }) :
             idx < exam.problems.length - 1 ? t('study.next.problem') : t('exam.finalize')}
            <ArrowRight size={14} />
          </button>
        </div>
      )}

      {/* 종료 확인 모달 */}
      {confirmExit && (
        <ConfirmDialog
          title={t('exam.exit.title')}
          desc={t('exam.exit.desc')}
          confirmLabel={t('exam.exit.confirm')}
          cancelLabel={t('common.cancel')}
          confirmDisabled={false}
          onConfirm={() => onClose(null)}
          onCancel={() => setConfirmExit(false)}
          danger
        />
      )}
      {confirmFinalize && (
        <ConfirmDialog
          title={t('exam.submit.title')}
          desc={t('exam.submit.desc', { filled: progressDone, total: exam.problems.length })}
          confirmLabel={finalizeMut.isPending ? t('exam.submit.busy') : t('exam.submit.confirm')}
          cancelLabel={t('common.cancel')}
          confirmDisabled={finalizeMut.isPending}
          onConfirm={() => { setConfirmFinalize(false); finalizeMut.mutate(); }}
          onCancel={() => setConfirmFinalize(false)}
        />
      )}
    </div>
  );
}

function ConfirmDialog({ title, desc, confirmLabel, cancelLabel, confirmDisabled, onConfirm, onCancel, danger }: {
  title: string; desc: string; confirmLabel: string; cancelLabel: string; confirmDisabled: boolean;
  onConfirm: () => void; onCancel: () => void; danger?: boolean;
}) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 95,
      backgroundColor: 'rgba(20,40,80,0.55)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        width: 420, padding: 28, backgroundColor: '#F8F4E9', borderRadius: 6,
        border: '1px solid #14285020',
      }}>
        <h3 className="serif" style={{ fontSize: 20, fontWeight: 500, margin: 0, marginBottom: 8 }}>{title}</h3>
        <p style={{ fontSize: 13, color: '#5C6B85', lineHeight: 1.65, margin: 0, marginBottom: 20 }}>{desc}</p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onCancel} style={btnGhost}>{cancelLabel}</button>
          <button
            onClick={onConfirm}
            disabled={confirmDisabled}
            style={danger ? { ...btnPrimary, backgroundColor: '#C25E2E' } : btnPrimary}
          >
            {danger && <CheckCircle2 size={14} />} {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

const btnPrimary: React.CSSProperties = {
  padding: '10px 18px', backgroundColor: '#142850', color: '#EFEBDF',
  border: 'none', borderRadius: 4, fontSize: 13, fontWeight: 600,
  cursor: 'pointer', fontFamily: 'inherit',
  display: 'flex', alignItems: 'center', gap: 6,
};
const btnGhost: React.CSSProperties = {
  padding: '10px 18px', backgroundColor: 'transparent', color: '#142850',
  border: '1px solid #14285030', borderRadius: 4, fontSize: 13,
  cursor: 'pointer', fontFamily: 'inherit',
  display: 'flex', alignItems: 'center', gap: 6,
};
