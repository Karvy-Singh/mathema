import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Sparkles, CheckCircle2, RotateCcw, Clock } from 'lucide-react';
import Modal from './Modal';
import { toast } from './Toast';
import { fetchWrongNote, fetchProblemHint } from '../lib/queries';
import { updateWrongNoteStatus, reviewWrongNote, ReviewQuality } from '../lib/mutations';

type Props = {
  noteId: string | null;
  onClose: () => void;
};

// SM-2 4단계 quality. label, color, 예상 다음 간격(라벨용 — 정확한 값은 EF에 따라 다름)
const QUALITY_BUTTONS: Array<{ key: ReviewQuality; label: string; sub: string; color: string }> = [
  { key: 'AGAIN', label: '다시',   sub: '내일',     color: '#8B3A1F' },
  { key: 'HARD',  label: '어려움', sub: '~1d',     color: '#B45309' },
  { key: 'GOOD',  label: '보통',   sub: '~6d',     color: '#1F1A14' },
  { key: 'EASY',  label: '완벽',   sub: '~6d×EF',  color: '#4A5D3A' },
];

export default function WrongNoteDetailModal({ noteId, onClose }: Props) {
  const qc = useQueryClient();
  const open = !!noteId;

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
      toast('영구 마스터 처리되었어요', 'success');
      invalidate();
    },
    onError: () => toast('마스터 처리 실패', 'error'),
  });

  const reviewMut = useMutation({
    mutationFn: (q: ReviewQuality) => reviewWrongNote(noteId!, q),
    onSuccess: (r) => {
      const next = r.nextReviewAt
        ? `${Math.max(1, Math.ceil((new Date(r.nextReviewAt).getTime() - Date.now()) / 86400000))}일 후`
        : '—';
      if (r.autoMastered) {
        toast('연속 완벽 3회 — 자동 마스터되었어요', 'success');
      } else if (r.lapsed) {
        toast(`다시 학습이 필요해요. 다음 복습: ${next}`, 'info');
      } else {
        toast(`복습 완료 · 다음 복습: ${next}`, 'success');
      }
      invalidate();
    },
    onError: () => toast('복습 기록 실패', 'error'),
  });

  return (
    <Modal open={open} onClose={onClose} subtitle="AI 맞춤 해설" title={detail.data?.problem ?? '오답 분석'} width={720}>
      {detail.isLoading && <div style={{ color: '#6B6354', fontSize: 13 }}>불러오는 중…</div>}
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
                힌트
              </div>
              <div style={{ padding: 12, backgroundColor: '#FAF6EB', border: '1px solid #1F1A1418', borderRadius: 4, fontSize: 13, lineHeight: 1.65 }}>
                {hint.data.hint}
              </div>
            </div>
          )}

          {detail.data.similar && detail.data.similar.length > 0 && (
            <div>
              <div style={{ fontSize: 11, letterSpacing: '0.15em', color: '#8B7E6A', textTransform: 'uppercase', marginBottom: 10 }}>
                유사 문제 {detail.data.similar.length}개
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
                  복습 평가 (SM-2)
                </div>
                <div style={{ marginLeft: 'auto', fontSize: 11, color: '#6B6354', display: 'flex', gap: 10 }}>
                  <span><Clock size={10} style={{ verticalAlign: -1, marginRight: 4 }}/>{detail.data.dueIn ?? '미복습'}</span>
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
                ※ 다시: 1일 뒤 재복습 · 어려움/보통: 짧은 간격 · 완벽: EF 배수로 늘어남. 연속 완벽 3회 이상 + 30일 이상 도달 시 자동 마스터.
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
                <CheckCircle2 size={12} /> {masterMut.isPending ? '처리 중…' : '영구 마스터로 즉시 처리'}
              </button>
            ) : (
              <span style={{ fontSize: 12, color: '#4A5D3A', display: 'flex', alignItems: 'center', gap: 6 }}>
                <CheckCircle2 size={14} /> 마스터 완료
              </span>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}
