import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Sparkles, CheckCircle2, RotateCcw, Clock, Lightbulb, ChevronDown, ChevronUp } from 'lucide-react';
import Modal from './Modal';
import { toast } from './Toast';
import { fetchWrongNote, fetchProblemHint, fetchProblem } from '../lib/queries';
import { updateWrongNoteStatus, reviewWrongNote, ReviewQuality } from '../lib/mutations';
import { useT } from '../lib/i18n';

type Props = {
  noteId: string | null;
  onClose: () => void;
};

export default function WrongNoteDetailModal({ noteId, onClose }: Props) {
  const qc = useQueryClient();
  const { t } = useT();
  const open = !!noteId;
  // SM-2 4단계 quality
  const QUALITY_BUTTONS: Array<{ key: ReviewQuality; label: string; sub: string; color: string }> = [
    { key: 'AGAIN', label: t('wn.detail.review.again'), sub: '~1d', color: '#C25E2E' },
    { key: 'HARD',  label: t('wn.detail.review.hard'),  sub: '~1d',    color: '#C7791F' },
    { key: 'GOOD',  label: t('wn.detail.review.good'),  sub: '~6d',    color: '#142850' },
    { key: 'EASY',  label: t('wn.detail.review.easy'),  sub: '~6d×EF', color: '#5A8A45' },
  ];

  const detail = useQuery({
    queryKey: ['wn-detail', noteId],
    queryFn: () => fetchWrongNote(noteId!),
    enabled: open,
  });

  const hint = useQuery({
    queryKey: ['hint', detail.data?.problemId],
    queryFn: () => fetchProblemHint(detail.data!.problemId),
    enabled: !!detail.data?.problemId,
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['wn-list'] });
    qc.invalidateQueries({ queryKey: ['wn-stats'] });
    qc.invalidateQueries({ queryKey: ['wn-recent'] });
    qc.invalidateQueries({ queryKey: ['wn-due'] });
    qc.invalidateQueries({ queryKey: ['wn-detail', noteId] });
  };

  const masterMut = useMutation({
    mutationFn: (id: string) => updateWrongNoteStatus(id, 'MASTERED'),
    onSuccess: () => {
      toast(t('toast.master.permanent'), 'success');
      invalidate();
    },
    onError: () => toast(t('toast.master.failed'), 'error'),
  });

  const reviewMut = useMutation({
    mutationFn: (q: ReviewQuality) => reviewWrongNote(noteId!, q),
    onSuccess: (r) => {
      const days = r.nextReviewAt
        ? Math.max(1, Math.ceil((new Date(r.nextReviewAt).getTime() - Date.now()) / 86400000))
        : 0;
      const next = days > 0 ? t('wn.due.inDays', { days }) : '—';
      if (r.autoMastered) {
        toast(t('toast.review.autoMastered'), 'success');
      } else if (r.lapsed) {
        toast(t('toast.review.tryAgain', { date: next }), 'info');
      } else {
        toast(t('toast.review.done', { date: next }), 'success');
      }
      invalidate();
    },
    onError: () => toast(t('toast.review.failed'), 'error'),
  });

  return (
    <Modal open={open} onClose={onClose} subtitle={t('wn.detail.label')} title={detail.data?.problem ?? t('wn.detail.fallbackTitle')} width={720}>
      {detail.isLoading && <div style={{ color: '#5C6B85', fontSize: 13 }}>{t('common.loading')}</div>}
      {detail.data && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', gap: 8, fontSize: 12, color: '#5C6B85', flexWrap: 'wrap' }}>
            <span style={{ padding: '3px 10px', backgroundColor: detail.data.diff === '준킬러' ? '#C25E2E' : '#C7791F', color: '#EFEBDF', borderRadius: 2 }}>
              {detail.data.diff}
            </span>
            <span style={{ padding: '3px 10px', backgroundColor: '#C25E2E15', color: '#C25E2E', borderRadius: 2, fontWeight: 600 }}>
              {detail.data.errorType}
            </span>
            <span>{detail.data.unit} · {detail.data.subUnit}</span>
            <span style={{ marginLeft: 'auto' }}>{detail.data.date}</span>
          </div>

          {/* 문제 본문 — 어떤 문제였는지 즉시 확인 */}
          {detail.data.problemBody && (
            <div>
              <div style={{ fontSize: 11, letterSpacing: '0.15em', color: '#8B95AB', textTransform: 'uppercase', marginBottom: 8 }}>
                {t('wn.detail.problemBody')}
              </div>
              <div className="serif" style={{
                padding: 16, backgroundColor: '#F8F4E9', border: '1px solid #14285018',
                borderRadius: 4, fontSize: 15, lineHeight: 1.7, color: '#142850',
                whiteSpace: 'pre-wrap',
              }}>{detail.data.problemBody}</div>
              {detail.data.problemAnswer && (
                <div style={{ marginTop: 8, padding: '10px 14px', backgroundColor: '#5A8A4512', border: '1px solid #5A8A4540', borderRadius: 4, fontSize: 13, color: '#142850' }}>
                  <span style={{ fontWeight: 600, color: '#5A8A45', marginRight: 6 }}>{t('wn.detail.answer')}</span>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>{detail.data.problemAnswer}</span>
                </div>
              )}
            </div>
          )}

          {/* 핵심 개념 + 공식 — 정답과 AI 분석 사이에 위치 */}
          {detail.data.problemConcept && (
            <div>
              <div style={{ fontSize: 11, letterSpacing: '0.15em', color: '#C25E2E', textTransform: 'uppercase', marginBottom: 8, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Lightbulb size={13} /> {t('wn.detail.concept')}
              </div>
              <div style={{
                padding: 14, backgroundColor: '#F8F4E9',
                border: '1px solid #14285020', borderLeft: '3px solid #C25E2E',
                borderRadius: '0 4px 4px 0',
                fontSize: 13, lineHeight: 1.7, color: '#142850', whiteSpace: 'pre-wrap',
              }}>
                <div>{detail.data.problemConcept}</div>
                {detail.data.problemFormula && (
                  <div style={{
                    marginTop: 10, padding: '10px 12px',
                    backgroundColor: '#EFEBDF', border: '1px solid #14285020', borderRadius: 4,
                  }}>
                    <div style={{ fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#1FB8C4', fontWeight: 700, marginBottom: 4 }}>
                      {t('wn.detail.formula')}
                    </div>
                    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, color: '#142850' }}>
                      {detail.data.problemFormula}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div style={{ padding: 16, backgroundColor: '#14285008', borderLeft: '2px solid #C25E2E', borderRadius: '0 4px 4px 0' }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <Sparkles size={14} color="#C25E2E" style={{ marginTop: 3, flexShrink: 0 }} />
              <div style={{ fontSize: 13, lineHeight: 1.65 }}>{detail.data.insight}</div>
            </div>
          </div>

          {hint.data?.hint && (
            <div>
              <div style={{ fontSize: 11, letterSpacing: '0.15em', color: '#8B95AB', textTransform: 'uppercase', marginBottom: 10 }}>
                {t('wn.detail.hint')}
              </div>
              <div style={{ padding: 12, backgroundColor: '#F8F4E9', border: '1px solid #14285018', borderRadius: 4, fontSize: 13, lineHeight: 1.65 }}>
                {hint.data.hint}
              </div>
            </div>
          )}

          {detail.data.similar && detail.data.similar.length > 0 && (
            <div>
              <div style={{ fontSize: 11, letterSpacing: '0.15em', color: '#8B95AB', textTransform: 'uppercase', marginBottom: 10 }}>
                {t('wn.detail.similar', { n: detail.data.similar.length })}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {detail.data.similar.map((s) => (
                  <SimilarProblemRow key={s.id} id={s.id} source={s.source} difficulty={s.difficulty} />
                ))}
              </div>
            </div>
          )}

          {/* SM-2 복습 패널 */}
          {detail.data.status !== 'mastered' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <RotateCcw size={12} color="#8B95AB" />
                <div style={{ fontSize: 11, letterSpacing: '0.15em', color: '#8B95AB', textTransform: 'uppercase' }}>
                  {t('wn.detail.review.label')}
                </div>
                <div style={{ marginLeft: 'auto', fontSize: 11, color: '#5C6B85', display: 'flex', gap: 10 }}>
                  <span><Clock size={10} style={{ verticalAlign: -1, marginRight: 4 }}/>{detail.data.dueIn ?? t('wn.detail.review.unreviewed')}</span>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>rep {detail.data.repetitionCount} · EF {detail.data.easinessFactor}</span>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                {QUALITY_BUTTONS.map((b) => (
                  <button
                    key={b.key}
                    disabled={reviewMut.isPending}
                    onClick={() => reviewMut.mutate(b.key)}
                    style={{
                      padding: '12px 8px', backgroundColor: '#F8F4E9',
                      border: `1px solid ${b.color}40`, borderRadius: 4,
                      cursor: 'pointer', fontFamily: 'inherit',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                      transition: 'all 0.15s',
                      opacity: reviewMut.isPending ? 0.5 : 1,
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = b.color + '12'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#F8F4E9'; }}
                  >
                    <span style={{ fontSize: 14, fontWeight: 600, color: b.color }}>{b.label}</span>
                    <span style={{ fontSize: 10, color: '#8B95AB', fontFamily: 'JetBrains Mono, monospace' }}>{b.sub}</span>
                  </button>
                ))}
              </div>
              <div style={{ marginTop: 8, fontSize: 11, color: '#AAB4C5', lineHeight: 1.5 }}>
                {t('wn.detail.review.note')}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 8 }}>
            {detail.data.status !== 'mastered' ? (
              <button
                disabled={masterMut.isPending}
                onClick={() => masterMut.mutate(detail.data!.id)}
                style={{
                  padding: '8px 14px', backgroundColor: 'transparent', color: '#5C6B85',
                  border: '1px solid #14285030', borderRadius: 4, fontSize: 12,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'inherit',
                }}
              >
                <CheckCircle2 size={12} /> {masterMut.isPending ? t('common.loading') : t('wn.detail.permanentMaster')}
              </button>
            ) : (
              <span style={{ fontSize: 12, color: '#5A8A45', display: 'flex', alignItems: 'center', gap: 6 }}>
                <CheckCircle2 size={14} /> {t('wn.master.completed')}
              </span>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}

/**
 * 유사문제 한 줄 — 클릭하면 그 문제의 본문/개념/공식/정답을 인라인으로 펼쳐 보여준다.
 * 별도 모달을 쌓지 않고 같은 모달 안에서 read-only 미리보기.
 */
function SimilarProblemRow({ id, source, difficulty }: { id: string; source: string; difficulty: string }) {
  const { t } = useT();
  const [open, setOpen] = useState(false);
  const problem = useQuery({
    queryKey: ['problem-preview', id],
    queryFn: () => fetchProblem(id),
    enabled: open,
  });
  return (
    <div style={{ border: '1px solid #14285018', borderRadius: 4, backgroundColor: '#F8F4E9' }}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        style={{
          width: '100%', padding: '10px 12px', background: 'transparent', border: 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          fontFamily: 'inherit', fontSize: 12, color: '#142850', cursor: 'pointer',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {open ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          <span>{source}</span>
        </span>
        <span style={{ color: '#5C6B85' }}>{difficulty}</span>
      </button>
      {open && (
        <div style={{ padding: '0 12px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {problem.isLoading && <div style={{ fontSize: 12, color: '#5C6B85' }}>{t('common.loading')}</div>}
          {problem.data && (
            <>
              <div className="serif" style={{
                padding: '10px 12px', backgroundColor: '#EFEBDF',
                border: '1px solid #14285018', borderRadius: 4,
                fontSize: 14, lineHeight: 1.65, color: '#142850', whiteSpace: 'pre-wrap',
              }}>
                {problem.data.body}
              </div>
              {(problem.data as any).concept && (
                <div style={{
                  padding: 10, backgroundColor: '#14285008',
                  border: '1px solid #14285020', borderLeft: '3px solid #C25E2E',
                  borderRadius: '0 4px 4px 0', fontSize: 12, lineHeight: 1.6, color: '#142850',
                }}>
                  <div style={{ fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#C25E2E', fontWeight: 700, marginBottom: 4 }}>
                    {t('wn.detail.concept')}
                  </div>
                  {(problem.data as any).concept}
                  {problem.data.formula && (
                    <div style={{
                      marginTop: 8, padding: '8px 10px',
                      backgroundColor: '#F8F4E9', border: '1px solid #14285020', borderRadius: 4,
                      fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: '#142850',
                    }}>{problem.data.formula}</div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
