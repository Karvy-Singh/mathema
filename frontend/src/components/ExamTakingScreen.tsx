import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Clock, ArrowLeft, ArrowRight, CheckCircle2, X, Send } from 'lucide-react';
import { toast } from './Toast';
import * as M from '../lib/mutations';
import ConfidenceSlider from './ConfidenceSlider';

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

  // 시간 만료 자동 제출
  useEffect(() => {
    if (remaining === 0 && exam.resultId && !submitMut.isPending && !submitMut.isSuccess) {
      toast('시간이 만료되어 자동 제출됩니다', 'info');
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
      toast(`제출 완료 · ${r.score}점 · ${r.grade}등급`, 'success');
      qc.invalidateQueries({ queryKey: ['mock-summary'] });
      qc.invalidateQueries({ queryKey: ['mock-trajectory'] });
      qc.invalidateQueries({ queryKey: ['mock-results'] });
      qc.invalidateQueries({ queryKey: ['mastery'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      qc.invalidateQueries({ queryKey: ['act-stats'] });
      qc.invalidateQueries({ queryKey: ['heatmap'] });
      onClose(r);
    },
    onError: () => toast('제출 실패', 'error'),
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
            <p style={{ fontSize: 13, color: '#6B6354', lineHeight: 1.65, marginBottom: 24 }}>
              현재 응시 가능한 문제가 없어요.<br />
              학습 데이터가 누적되거나 AI 키 설정 후 자동 구성됩니다.
            </p>
            <button onClick={() => onClose(null)} style={btnPrimary}>닫기</button>
          </div>
        </div>
      </Overlay>
    );
  }

  return (
    <Overlay>
      {/* 헤더 */}
      <div style={{
        backgroundColor: '#1F1A14', color: '#F2EDE2',
        padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: '1px solid #F2EDE218',
      }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: '0.2em', color: '#A89684', textTransform: 'uppercase' }}>
            응시 중 · {progress.filled}/{progress.total} 답안 입력
          </div>
          <h1 className="serif" style={{ fontSize: 22, fontWeight: 500, margin: 0, marginTop: 2, letterSpacing: '-0.02em' }}>
            {exam.name}
          </h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 14px', backgroundColor: remaining < 60 ? '#8B3A1F' : '#F2EDE218',
            borderRadius: 4, fontFamily: 'JetBrains Mono, monospace',
            transition: 'background-color 0.3s',
          }}>
            <Clock size={14} />
            <span style={{ fontSize: 16, fontWeight: 600 }}>{mm}:{ss}</span>
          </div>
          <button
            onClick={() => setConfirmExit(true)}
            style={{ background: 'none', border: '1px solid #F2EDE230', color: '#F2EDE2', padding: '6px 12px', borderRadius: 4, cursor: 'pointer', fontSize: 12, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 4 }}
          >
            <X size={12} /> 나가기
          </button>
        </div>
      </div>

      {/* 진척률 바 */}
      <div style={{ height: 4, backgroundColor: '#F2EDE220' }}>
        <div style={{
          height: '100%',
          width: `${(progress.filled / progress.total) * 100}%`,
          backgroundColor: '#D97706', transition: 'width 0.3s',
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
              <div style={{ fontSize: 11, letterSpacing: '0.18em', color: '#8B7E6A', textTransform: 'uppercase' }}>
                Problem {String(idx + 1).padStart(2, '0')} / {exam.problems.length}
              </div>
              <div className="serif" style={{ fontSize: 17, color: '#1F1A14', fontStyle: 'italic', marginTop: 4 }}>
                {current.source}
              </div>
            </div>
            <span style={{
              fontSize: 11, padding: '4px 10px',
              backgroundColor:
                current.difficulty === 'KILLER' ? '#1F1A14' :
                current.difficulty === 'SEMI_KILLER' ? '#8B3A1F' :
                current.difficulty === 'UPPER_MIDDLE' ? '#B45309' : '#A89684',
              color: '#F2EDE2', borderRadius: 2,
            }}>
              {current.difficulty === 'KILLER' ? '킬러' :
               current.difficulty === 'SEMI_KILLER' ? '준킬러' :
               current.difficulty === 'UPPER_MIDDLE' ? '중상' : '중'}
            </span>
          </div>

          <div className="serif" style={{
            fontSize: 18, lineHeight: 1.75, color: '#1F1A14', marginBottom: 24,
            whiteSpace: 'pre-wrap',
            padding: 24, backgroundColor: '#FAF6EB', border: '1px solid #1F1A1418', borderRadius: 4,
          }}>
            {current.body}
          </div>

          {current.formula && (
            <div style={{
              padding: 18, backgroundColor: '#1F1A1408', borderRadius: 4,
              textAlign: 'center', marginBottom: 24,
            }}>
              <div className="serif mono" style={{ fontSize: 18, color: '#1F1A14' }}>
                {current.formula}
              </div>
            </div>
          )}

          {/* 3단계 객관식 (CONCEPT → PROCESS → ANSWER) */}
          {current.steps && current.steps.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18, marginBottom: 8 }}>
              {current.steps.sort((a, b) => a.stepIndex - b.stepIndex).map((s) => {
                const stepLabel = s.stepType === 'CONCEPT' ? '개념' : s.stepType === 'PROCESS' ? '풀이 과정' : '정답';
                const selected = choiceIds[current.id]?.[s.stepIndex];
                return (
                  <div key={s.id} style={{
                    padding: 16, backgroundColor: '#FAF6EB',
                    border: '1px solid #1F1A1418', borderRadius: 4,
                  }}>
                    <div style={{
                      display: 'inline-block', padding: '3px 10px', marginBottom: 10,
                      backgroundColor: selected ? '#4A5D3A' : '#B45309',
                      color: '#F2EDE2', borderRadius: 2, fontSize: 11, fontWeight: 600,
                    }}>
                      {s.stepIndex}단계 · {stepLabel}{selected ? ' ✓' : ''}
                    </div>
                    <div style={{ fontSize: 14, color: '#1F1A14', fontWeight: 600, marginBottom: 12, lineHeight: 1.5 }}>
                      {s.prompt}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {s.choices.map((c) => {
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
                              border: '1px solid ' + (isSelected ? '#1F1A14' : '#1F1A1430'),
                              backgroundColor: isSelected ? '#1F1A1408' : '#F2EDE2',
                              color: '#1F1A14',
                              borderRadius: 3, fontSize: 13, fontFamily: 'inherit',
                              cursor: 'pointer',
                              display: 'flex', alignItems: 'flex-start', gap: 8,
                              transition: 'all 0.15s',
                            }}
                          >
                            <span style={{
                              flexShrink: 0, width: 20, height: 20, borderRadius: '50%',
                              backgroundColor: isSelected ? '#1F1A14' : '#1F1A1410',
                              color: isSelected ? '#F2EDE2' : '#6B6354',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: 10, fontWeight: 600,
                            }}>{c.choiceIndex}</span>
                            <span style={{ flex: 1, fontFamily: 'JetBrains Mono, monospace', fontSize: 12, lineHeight: 1.5 }}>{c.text}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
              <ConfidenceSlider
                value={confidences[current.id] ?? 50}
                onChange={(v) => setConfidences((prev) => ({ ...prev, [current.id]: v }))}
              />
            </div>
          ) : (
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 11, letterSpacing: '0.15em', color: '#8B7E6A', textTransform: 'uppercase', marginBottom: 8 }}>
                답안 (단일 입력)
              </div>
              <input
                type="text"
                value={answers[current.id] ?? ''}
                onChange={(e) => setAnswer(current.id, e.target.value)}
                placeholder="답을 입력하세요"
                style={{
                  width: '100%', padding: '14px 16px', fontSize: 16,
                  border: '1px solid #1F1A1430', borderRadius: 4,
                  backgroundColor: '#F2EDE2', fontFamily: 'JetBrains Mono, monospace',
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
            marginTop: 32, paddingTop: 20, borderTop: '1px solid #1F1A1418',
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
                    backgroundColor: isCurrent ? '#1F1A14' : filled ? '#4A5D3A20' : '#FAF6EB',
                    color: isCurrent ? '#F2EDE2' : filled ? '#4A5D3A' : '#6B6354',
                    border: '1px solid ' + (isCurrent ? '#1F1A14' : filled ? '#4A5D3A40' : '#1F1A1420'),
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
        backgroundColor: '#FAF6EB', borderTop: '1px solid #1F1A1418',
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
          <ArrowLeft size={14} /> 이전
        </button>
        <div style={{ fontSize: 12, color: '#6B6354' }}>
          {progress.filled === progress.total
            ? '모든 문제 답안 작성됨'
            : `미작성 ${progress.total - progress.filled}문제`}
        </div>
        {idx < exam.problems.length - 1 ? (
          <button
            onClick={() => setIdx((i) => Math.min(exam.problems.length - 1, i + 1))}
            style={btnPrimary}
          >
            다음 <ArrowRight size={14} />
          </button>
        ) : (
          <button
            onClick={() => setConfirmSubmit(true)}
            disabled={submitMut.isPending}
            style={{ ...btnPrimary, backgroundColor: '#D97706', color: '#1F1A14' }}
          >
            <Send size={14} /> {submitMut.isPending ? '제출 중…' : '제출하기'}
          </button>
        )}
      </div>

      {/* 제출 확인 모달 */}
      {confirmSubmit && (
        <ConfirmDialog
          title="모의고사를 제출할까요?"
          desc={`${progress.filled}/${progress.total}개 답안 작성됨. 제출 후에는 수정할 수 없어요.`}
          confirmLabel={submitMut.isPending ? '제출 중…' : '제출'}
          confirmDisabled={submitMut.isPending}
          onConfirm={() => { setConfirmSubmit(false); submitMut.mutate(); }}
          onCancel={() => setConfirmSubmit(false)}
        />
      )}
      {confirmExit && (
        <ConfirmDialog
          title="응시를 중단할까요?"
          desc="작성한 답안은 저장되지 않습니다."
          confirmLabel="나가기"
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
      backgroundColor: '#F2EDE2', color: '#1F1A14',
      display: 'flex', flexDirection: 'column',
      fontFamily: '"Pretendard", sans-serif',
    }}>
      {children}
    </div>
  );
}

function ConfirmDialog({ title, desc, confirmLabel, confirmDisabled, onConfirm, onCancel, danger }: {
  title: string; desc: string; confirmLabel: string; confirmDisabled: boolean;
  onConfirm: () => void; onCancel: () => void; danger?: boolean;
}) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 95,
      backgroundColor: 'rgba(31,26,20,0.55)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        width: 420, padding: 28, backgroundColor: '#FAF6EB', borderRadius: 6,
        border: '1px solid #1F1A1420',
      }}>
        <h3 className="serif" style={{ fontSize: 20, fontWeight: 500, margin: 0, marginBottom: 8 }}>{title}</h3>
        <p style={{ fontSize: 13, color: '#6B6354', lineHeight: 1.65, margin: 0, marginBottom: 20 }}>{desc}</p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onCancel} style={btnGhost}>취소</button>
          <button
            onClick={onConfirm}
            disabled={confirmDisabled}
            style={danger ? { ...btnPrimary, backgroundColor: '#8B3A1F' } : btnPrimary}
          >
            {danger && <CheckCircle2 size={14} />} {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

const card: React.CSSProperties = {
  margin: 'auto', width: 480, padding: 32, backgroundColor: '#FAF6EB',
  border: '1px solid #1F1A1420', borderRadius: 6,
};
const btnPrimary: React.CSSProperties = {
  padding: '10px 18px', backgroundColor: '#1F1A14', color: '#F2EDE2',
  border: 'none', borderRadius: 4, fontSize: 13, fontWeight: 600,
  cursor: 'pointer', fontFamily: 'inherit',
  display: 'flex', alignItems: 'center', gap: 6,
};
const btnGhost: React.CSSProperties = {
  padding: '10px 18px', backgroundColor: 'transparent', color: '#1F1A14',
  border: '1px solid #1F1A1430', borderRadius: 4, fontSize: 13,
  cursor: 'pointer', fontFamily: 'inherit',
  display: 'flex', alignItems: 'center', gap: 6,
};
