import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Sparkles, CheckCircle2, RotateCcw, Clock } from 'lucide-react';
import Modal from './Modal';
import { toast } from './Toast';
import { fetchWrongNote, fetchProblemHint } from '../lib/queries';
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
    { key: 'AGAIN', label: t('wn.detail.review.again'), sub: '~1d', color: '#8B3A1F' },
    { key: 'HARD',  label: t('wn.detail.review.hard'),  sub: '~1d',    color: '#B45309' },
    { key: 'GOOD',  label: t('wn.detail.review.good'),  sub: '~6d',    color: '#1F1A14' },
    { key: 'EASY',  label: t('wn.detail.review.easy'),  sub: '~6d×EF', color: '#4A5D3A' },
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
      {detail.isLoading && <div style={{ color: '#6B6354', fontSize: 13 }}>{t('common.loading')}</div>}
      {detail.data && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', gap: 8, fontSize: 12, color: '#6B6354', flexWrap: 'wrap' }}>
            <span style={{ padding: '3px 10px', backgroundColor: detail.data.diff === '준킬러' ? '#8B3A1F' : '#B45309', color: '#F2EDE2', borderRadius: 2 }}>
              {detail.data.diff}
            </span>
            <span style={{ padding: '3px 10px', backgroundColor: '#8B3A1F15', color: '#8B3A1F', borderRadius: 2, fontWeight: 600 }}>
              {detail.data.errorType}
            </span>
            <span>{detail.data.unit} · {detail.data.subUnit}</span>
            <span style={{ marginLeft: 'auto' }}>{detail.data.date}</span>
          </div>

          <div style={{ padding: 16, backgroundColor: '#1F1A1408', borderLeft: '2px solid #8B3A1F', borderRadius: '0 4px 4px 0' }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <Sparkles size={14} color="#8B3A1F" style={{ marginTop: 3, flexShrink: 0 }} />
              <div style={{ fontSize: 13, lineHeight: 1.65 }}>{detail.data.insight}</div>
            </div>
          </div>

          {hint.data?.hint && (
            <div>
              <div style={{ fontSize: 11, letterSpacing: '0.15em', color: '#8B7E6A', textTransform: 'uppercase', marginBottom: 10 }}>
                {t('wn.detail.hint')}
              </div>
              <div style={{ padding: 12, backgroundColor: '#FAF6EB', border: '1px solid #1F1A1418', borderRadius: 4, fontSize: 13, lineHeight: 1.65 }}>
                {hint.data.hint}
              </div>
            </div>
          )}

          {detail.data.similar && detail.data.similar.length > 0 && (
            <div>
              <div style={{ fontSize: 11, letterSpacing: '0.15em', color: '#8B7E6A', textTransform: 'uppercase', marginBottom: 10 }}>
                {t('wn.detail.similar', { n: detail.data.similar.length })}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {detail.data.similar.map((s) => (
                  <div key={s.id} style={{ padding: '10px 12px', backgroundColor: '#FAF6EB', border: '1px solid #1F1A1418', borderRadius: 4, fontSize: 12, color: '#1F1A14', display: 'flex', justifyContent: 'space-between' }}>
                    <span>{s.source}</span>
                    <span style={{ color: '#6B6354' }}>{s.difficulty}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SM-2 복습 패널 */}
          {detail.data.status !== 'mastered' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <RotateCcw size={12} color="#8B7E6A" />
                <div style={{ fontSize: 11, letterSpacing: '0.15em', color: '#8B7E6A', textTransform: 'uppercase' }}>
                  {t('wn.detail.review.label')}
                </div>
                <div style={{ marginLeft: 'auto', fontSize: 11, color: '#6B6354', display: 'flex', gap: 10 }}>
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
                      padding: '12px 8px', backgroundColor: '#FAF6EB',
                      border: `1px solid ${b.color}40`, borderRadius: 4,
                      cursor: 'pointer', fontFamily: 'inherit',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                      transition: 'all 0.15s',
                      opacity: reviewMut.isPending ? 0.5 : 1,
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = b.color + '12'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#FAF6EB'; }}
                  >
                    <span style={{ fontSize: 14, fontWeight: 600, color: b.color }}>{b.label}</span>
                    <span style={{ fontSize: 10, color: '#8B7E6A', fontFamily: 'JetBrains Mono, monospace' }}>{b.sub}</span>
                  </button>
                ))}
              </div>
              <div style={{ marginTop: 8, fontSize: 11, color: '#A89684', lineHeight: 1.5 }}>
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
                  padding: '8px 14px', backgroundColor: 'transparent', color: '#6B6354',
                  border: '1px solid #1F1A1430', borderRadius: 4, fontSize: 12,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'inherit',
                }}
              >
                <CheckCircle2 size={12} /> {masterMut.isPending ? t('common.loading') : t('wn.detail.permanentMaster')}
              </button>
            ) : (
              <span style={{ fontSize: 12, color: '#4A5D3A', display: 'flex', alignItems: 'center', gap: 6 }}>
                <CheckCircle2 size={14} /> {t('wn.master.completed')}
              </span>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}
