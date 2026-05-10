import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Clock, ArrowLeft, ArrowRight, CheckCircle2, X, Send, Home } from 'lucide-react';
import { toast } from './Toast';
import * as M from '../lib/mutations';
import ConfidenceSlider from './ConfidenceSlider';
import { useT } from '../lib/i18n';

type Props = {
  exam: M.ExamPackage;
  onClose: (result: { id: string; score: number; grade: number; percentile: number; durationMin: number } | null) => void;
};

/**
 * 모의고사 응시 화면 — 전체화면 오버레이.
 *
 * 흐름: 문제 1번부터 N번까지 순서대로 풀이 → 마지막 문제에서 「제출」.
 * 타이머: totalMinutes 카운트다운 (만료 시 자동 제출).
 * 답안 표기: 객관식 1~5 또는 주관식 텍스트 입력.
 * 진척률: 답안 입력된 문제 비율.
 *
 * 답안은 클라이언트가 모아두었다가 한 번에 백엔드로 제출.
 * 백엔드: 각 답안을 Attempt로 저장 → mastery·activity 자동 갱신 → 점수 채점.
 */
export default function ExamTakingScreen({ exam, onClose }: Props) {
  const qc = useQueryClient();
  const { t } = useT();
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [confidences, setConfidences] = useState<Record<string, number>>({});
  // 객관식 모드: 문제별 stepIndex → choiceId
  const [choiceIds, setChoiceIds] = useState<Record<string, Record<number, string>>>({});
  const [seconds, setSeconds] = useState(0);
  const startedAt = useRef<number>(Date.now());
  const perStartedAt = useRef<Record<string, number>>({}); // 문제별 시작시각 (durationSec 추적)
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [confirmExit, setConfirmExit] = useState(false);

  const totalSec = exam.totalMinutes * 60;
  const remaining = Math.max(0, totalSec - seconds);
  const mm = String(Math.floor(remaining / 60)).padStart(2, '0');
  const ss = String(remaining % 60).padStart(2, '0');

  const current = exam.problems[idx];
  const progress = useMemo(() => {
    const filled = exam.problems.filter((p) => {
      if (p.steps && p.steps.length > 0) {
        const cs = choiceIds[p.id] ?? {};
        return p.steps.every((s) => cs[s.stepIndex]);
      }
      return (answers[p.id] ?? '').trim() !== '';
    }).length;
    return { filled, total: exam.problems.length };
  }, [answers, choiceIds, exam.problems]);

  // 타이머
  useEffect(() => {
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  // 문제별 시작 시각 기록
  useEffect(() => {
    if (current && !perStartedAt.current[current.id]) {
      perStartedAt.current[current.id] = Date.now();
    }
  }, [current]);

  const submittedRef = useRef(false);
  // 시간 만료 자동 제출 — submittedRef 로 멱등 보장 (에러 시에도 재시도 안 함)
  useEffect(() => {
    if (remaining === 0 && exam.resultId && !submittedRef.current) {
      submittedRef.current = true;
      toast(t('exam.timer.expired'), 'info');
      submitMut.mutate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining]);

  const setAnswer = (problemId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [problemId]: value }));
  };

  const submitMut = useMutation({
    mutationFn: () => {
      const payload = exam.problems.map((p) => {
        const start = perStartedAt.current[p.id] ?? startedAt.current;
        const dur = Math.max(1, Math.round((Date.now() - start) / 1000));
        // 객관식 모드: choiceIds 배열 (stepIndex 1, 2, 3 순)
        const cs = choiceIds[p.id];
        const hasChoices = p.steps && p.steps.length > 0 && cs;
        if (hasChoices) {
          const ordered = p.steps!.sort((a, b) => a.stepIndex - b.stepIndex)
            .map((s) => cs[s.stepIndex]).filter(Boolean);
          return {
            problemId: p.id, answer: '', durationSec: dur,
            confidence: confidences[p.id],
            choiceIds: ordered,
          };
        }
        return {
          problemId: p.id, answer: answers[p.id] ?? '', durationSec: dur,
          confidence: confidences[p.id],
        };
      });
      return M.submitExamResult(exam.resultId!, { answers: payload });
    },
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

  // 응시 가능한 문제가 없는 경우
  if (!exam.resultId || exam.problems.length === 0) {
    return (
      <Overlay>
        <div style={card}>
          <div style={{ textAlign: 'center' }}>
            <h2 className="serif" style={{ fontSize: 24, fontWeight: 500, margin: 0, marginBottom: 12 }}>
              {exam.name}
            </h2>
            <p style={{ fontSize: 13, color: '#5C6B85', lineHeight: 1.65, marginBottom: 24 }}>
              <strong>{t('exam.empty.title')}</strong><br />
              {t('exam.empty.desc')}
            </p>
            <button onClick={() => onClose(null)} style={btnPrimary}>{t('common.close')}</button>
          </div>
        </div>
      </Overlay>
    );
  }

  return (
    <Overlay>
      {/* 헤더 */}
      <div style={{
        backgroundColor: '#142850', color: '#EFEBDF',
        padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: '1px solid #EFEBDF18',
      }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: '0.2em', color: '#AAB4C5', textTransform: 'uppercase' }}>
            {t('exam.label.takingNumOf', { filled: progress.filled, total: progress.total })}
          </div>
          <h1 className="serif" style={{ fontSize: 22, fontWeight: 500, margin: 0, marginTop: 2, letterSpacing: '-0.02em' }}>
            {exam.name}
          </h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 14px', backgroundColor: remaining < 60 ? '#C25E2E' : '#EFEBDF18',
            borderRadius: 4, fontFamily: 'JetBrains Mono, monospace',
            transition: 'background-color 0.3s',
          }}>
            <Clock size={14} />
            <span style={{ fontSize: 16, fontWeight: 600 }}>{mm}:{ss}</span>
          </div>
          <button
            onClick={() => setConfirmExit(true)}
            title={t('exam.exit.btn')}
            style={{ background: 'transparent', border: '1px solid #EFEBDF50', color: '#EFEBDF', padding: '8px 14px', borderRadius: 4, cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Home size={14} /> {t('exam.exit.home')}
          </button>
        </div>
      </div>

      {/* 진척률 바 */}
      <div style={{ height: 4, backgroundColor: '#EFEBDF20' }}>
        <div style={{
          height: '100%',
          width: `${(progress.filled / progress.total) * 100}%`,
          backgroundColor: '#D9A055', transition: 'width 0.3s',
        }} />
      </div>

      {/* 본문 */}
      <div style={{
        flex: 1, overflow: 'auto', padding: '40px',
        display: 'flex', justifyContent: 'center',
      }}>
        <div style={{ width: '100%', maxWidth: 720 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 }}>
            <div>
              <div style={{ fontSize: 11, letterSpacing: '0.18em', color: '#8B95AB', textTransform: 'uppercase' }}>
                {t('exam.problem.label', { n: String(idx + 1).padStart(2, '0'), total: exam.problems.length })}
              </div>
              <div className="serif" style={{ fontSize: 17, color: '#142850', fontStyle: 'italic', marginTop: 4 }}>
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
            }}>
              {current.difficulty}
            </span>
          </div>

          <div className="serif" style={{
            fontSize: 18, lineHeight: 1.75, color: '#142850', marginBottom: 24,
            whiteSpace: 'pre-wrap',
            padding: 24, backgroundColor: '#F8F4E9', border: '1px solid #14285018', borderRadius: 4,
          }}>
            {current.body}
          </div>

          {current.formula && (
            <div style={{
              padding: 18, backgroundColor: '#14285008', borderRadius: 4,
              textAlign: 'center', marginBottom: 24,
            }}>
              <div className="serif mono" style={{ fontSize: 18, color: '#142850' }}>
                {current.formula}
              </div>
            </div>
          )}

          {/* 3단계 객관식 (CONCEPT → PROCESS → ANSWER) — 순차 공개:
              이전 단계 답을 선택하기 전까지 다음 단계 보기는 가려둔다 (전단계 답 유출 방지).
              한 번 선택한 단계는 잠긴 채 이후 단계가 열린다. */}
          {current.steps && current.steps.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18, marginBottom: 8 }}>
              {(() => {
                const sorted = [...current.steps].sort((a, b) => a.stepIndex - b.stepIndex);
                const selectedFor = (idx: number) => choiceIds[current.id]?.[idx];
                return sorted.map((s, i) => {
                  const stepLabel = s.stepType === 'CONCEPT' ? t('study.step.concept') : s.stepType === 'PROCESS' ? t('study.step.process') : t('study.step.answer');
                  const selected = selectedFor(s.stepIndex);
                  // 이전 모든 단계가 선택됐을 때만 잠금 해제
                  const prevAllAnswered = sorted.slice(0, i).every((p) => !!selectedFor(p.stepIndex));
                  const isLockedNext = !prevAllAnswered && !selected; // 아직 열리지 않은 후속 단계
                  return (
                    <div key={s.id} style={{
                      padding: 16, backgroundColor: '#F8F4E9',
                      border: '1px solid #14285018', borderRadius: 4,
                      opacity: isLockedNext ? 0.55 : 1,
                    }}>
                      <div style={{
                        display: 'inline-block', padding: '3px 10px', marginBottom: 10,
                        backgroundColor: selected ? '#5A8A45' : isLockedNext ? '#AAB4C5' : '#C7791F',
                        color: '#EFEBDF', borderRadius: 2, fontSize: 11, fontWeight: 600,
                      }}>
                        {`${s.stepIndex}/${sorted.length}`} · {stepLabel}{selected ? ' ✓' : isLockedNext ? ' · ' + t('exam.step.locked') : ''}
                      </div>
                      <div style={{ fontSize: 14, color: '#142850', fontWeight: 600, marginBottom: 12, lineHeight: 1.5 }}>
                        {isLockedNext ? t('exam.step.lockedHint') : s.prompt}
                      </div>
                      {!isLockedNext && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {s.choices.map((c, ci) => {
                            const isSelected = selected === c.id;
                            return (
                              <button
                                key={c.id}
                                onClick={() => setChoiceIds((prev) => ({
                                  ...prev,
                                  [current.id]: { ...(prev[current.id] ?? {}), [s.stepIndex]: c.id },
                                }))}
                                style={{
                                  padding: '8px 12px', textAlign: 'left',
                                  border: '1px solid ' + (isSelected ? '#142850' : '#14285030'),
                                  backgroundColor: isSelected ? '#14285008' : '#EFEBDF',
                                  color: '#142850',
                                  borderRadius: 3, fontSize: 13, fontFamily: 'inherit',
                                  cursor: 'pointer',
                                  display: 'flex', alignItems: 'flex-start', gap: 8,
                                  transition: 'all 0.15s',
                                }}
                              >
                                <span style={{
                                  flexShrink: 0, width: 20, height: 20, borderRadius: '50%',
                                  backgroundColor: isSelected ? '#142850' : '#14285010',
                                  color: isSelected ? '#EFEBDF' : '#5C6B85',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  fontSize: 10, fontWeight: 600,
                                }}>{ci + 1}</span>
                                <span style={{ flex: 1, fontFamily: 'JetBrains Mono, monospace', fontSize: 12, lineHeight: 1.5 }}>{c.text}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                });
              })()}
              <ConfidenceSlider
                value={confidences[current.id] ?? 50}
                onChange={(v) => setConfidences((prev) => ({ ...prev, [current.id]: v }))}
              />
            </div>
          ) : (
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 11, letterSpacing: '0.15em', color: '#8B95AB', textTransform: 'uppercase', marginBottom: 8 }}>
                {t('exam.answer.label')}
              </div>
              <input
                type="text"
                value={answers[current.id] ?? ''}
                onChange={(e) => setAnswer(current.id, e.target.value)}
                placeholder={t('exam.answer.placeholder')}
                style={{
                  width: '100%', padding: '14px 16px', fontSize: 16,
                  border: '1px solid #14285030', borderRadius: 4,
                  backgroundColor: '#EFEBDF', fontFamily: 'JetBrains Mono, monospace',
                  outline: 'none', boxSizing: 'border-box',
                }}
              />
              <ConfidenceSlider
                value={confidences[current.id] ?? 50}
                onChange={(v) => setConfidences((prev) => ({ ...prev, [current.id]: v }))}
              />
            </div>
          )}

          {/* 문제 번호 그리드 (5×N 격자) */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: 4,
            marginTop: 32, paddingTop: 20, borderTop: '1px solid #14285018',
          }}>
            {exam.problems.map((p, i) => {
              const cs = choiceIds[p.id] ?? {};
              const allStepsAnswered = p.steps && p.steps.length > 0
                ? p.steps.every((s) => cs[s.stepIndex])
                : !!answers[p.id]?.trim();
              const filled = allStepsAnswered;
              const isCurrent = i === idx;
              return (
                <button
                  key={p.id}
                  onClick={() => setIdx(i)}
                  style={{
                    aspectRatio: '1', fontSize: 11, fontWeight: isCurrent ? 700 : 500,
                    backgroundColor: isCurrent ? '#142850' : filled ? '#5A8A4520' : '#F8F4E9',
                    color: isCurrent ? '#EFEBDF' : filled ? '#5A8A45' : '#5C6B85',
                    border: '1px solid ' + (isCurrent ? '#142850' : filled ? '#5A8A4540' : '#14285020'),
                    borderRadius: 2, cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 푸터 (이전/다음/제출) */}
      <div style={{
        backgroundColor: '#F8F4E9', borderTop: '1px solid #14285018',
        padding: '16px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <button
          onClick={() => setIdx((i) => Math.max(0, i - 1))}
          disabled={idx === 0}
          style={{
            ...btnGhost,
            opacity: idx === 0 ? 0.4 : 1,
          }}
        >
          <ArrowLeft size={14} /> {t('exam.prev.label')}
        </button>
        <div style={{ fontSize: 12, color: '#5C6B85' }}>
          {progress.filled === progress.total
            ? t('exam.progress.allDone')
            : t('exam.progress.remaining', { n: progress.total - progress.filled })}
        </div>
        {idx < exam.problems.length - 1 ? (
          <button
            onClick={() => setIdx((i) => Math.min(exam.problems.length - 1, i + 1))}
            style={btnPrimary}
          >
            {t('exam.next.label')} <ArrowRight size={14} />
          </button>
        ) : (
          <button
            onClick={() => setConfirmSubmit(true)}
            disabled={submitMut.isPending}
            style={{ ...btnPrimary, backgroundColor: '#D9A055', color: '#142850' }}
          >
            <Send size={14} /> {submitMut.isPending ? t('exam.submit.busy') : t('exam.submit.label')}
          </button>
        )}
      </div>

      {/* 제출 확인 모달 */}
      {confirmSubmit && (
        <ConfirmDialog
          title={t('exam.submit.title')}
          desc={t('exam.submit.desc', { filled: progress.filled, total: progress.total })}
          confirmLabel={submitMut.isPending ? t('exam.submit.busy') : t('exam.submit.confirm')}
          cancelLabel={t('common.cancel')}
          confirmDisabled={submitMut.isPending}
          onConfirm={() => { setConfirmSubmit(false); submitMut.mutate(); }}
          onCancel={() => setConfirmSubmit(false)}
        />
      )}
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
    </Overlay>
  );
}

function Overlay({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 90,
      backgroundColor: '#EFEBDF', color: '#142850',
      display: 'flex', flexDirection: 'column',
      fontFamily: '"Pretendard", sans-serif',
    }}>
      {children}
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
      backgroundColor: 'rgba(31,26,20,0.55)',
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

const card: React.CSSProperties = {
  margin: 'auto', width: 480, padding: 32, backgroundColor: '#F8F4E9',
  border: '1px solid #14285020', borderRadius: 6,
};
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
