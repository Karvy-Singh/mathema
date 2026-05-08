import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Camera, FileText, Image as ImageIcon, Upload } from 'lucide-react';
import Modal from './Modal';
import { toast } from './Toast';
import { get } from '../lib/api';
import type { Problem } from '../lib/queries';
import { createWrongNote, uploadWrongNotePhoto, uploadWrongNotePdf } from '../lib/mutations';

type Mode = 'text' | 'photo' | 'pdf';
type Props = {
  open: boolean;
  initialMode?: Mode;
  onClose: () => void;
};

const ERROR_TYPES = [
  { key: 'CONCEPT_MISUNDERSTANDING', label: '개념 오해' },
  { key: 'CALCULATION_MISTAKE', label: '계산 실수' },
  { key: 'TIME_SHORTAGE', label: '시간 부족' },
  { key: 'OTHER', label: '기타' },
];

export default function RegisterWrongNoteModal({ open, initialMode = 'text', onClose }: Props) {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [problemId, setProblemId] = useState('');
  const [errorType, setErrorType] = useState(ERROR_TYPES[0].key);
  const [insight, setInsight] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const qc = useQueryClient();

  const problemsQ = useQuery({
    queryKey: ['problems-pick'],
    queryFn: () => get<Problem[]>('/problems'),
    enabled: open && mode === 'text',
  });

  const reset = () => { setProblemId(''); setErrorType(ERROR_TYPES[0].key); setInsight(''); setFile(null); };
  const close = () => { reset(); onClose(); };

  const createMut = useMutation({
    mutationFn: () => createWrongNote({ problemId, errorType, insight: insight || undefined }),
    onSuccess: () => {
      toast('오답이 등록됐어요', 'success');
      qc.invalidateQueries({ queryKey: ['wn-list'] });
      qc.invalidateQueries({ queryKey: ['wn-stats'] });
      qc.invalidateQueries({ queryKey: ['wn-recent'] });
      close();
    },
    onError: (e: any) => toast(e?.response?.data?.error?.message ?? '등록 실패', 'error'),
  });

  const photoMut = useMutation({
    mutationFn: (f: File) => uploadWrongNotePhoto(f),
    onSuccess: (r) => {
      toast(r.message ?? '사진 업로드 완료', r.ok ? 'success' : 'info');
      close();
    },
    onError: () => toast('사진 업로드 실패', 'error'),
  });

  const pdfMut = useMutation({
    mutationFn: (f: File) => uploadWrongNotePdf(f),
    onSuccess: (r) => {
      toast(r.message ?? 'PDF 업로드 완료', r.ok ? 'success' : 'info');
      close();
    },
    onError: () => toast('PDF 업로드 실패', 'error'),
  });

  return (
    <Modal open={open} onClose={close} subtitle="Wrong Note · Add" title="오답 등록" width={620}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 24 }}>
        {([
          { key: 'photo', label: '사진으로 등록', sub: 'AI 자동 인식', Icon: Camera, color: '#8B3A1F' },
          { key: 'text', label: '직접 입력', sub: '문제 선택 + 메모', Icon: FileText, color: '#B45309' },
          { key: 'pdf', label: 'PDF 업로드', sub: '문제집 일괄', Icon: ImageIcon, color: '#4A5D3A' },
        ] as Array<{ key: Mode; label: string; sub: string; Icon: any; color: string }>).map((opt) => {
          const I = opt.Icon;
          const active = mode === opt.key;
          return (
            <button key={opt.key} onClick={() => setMode(opt.key)} style={{
              padding: 14, backgroundColor: active ? '#1F1A14' : '#F2EDE2',
              color: active ? '#F2EDE2' : '#1F1A14',
              border: '1px solid ' + (active ? '#1F1A14' : '#1F1A1430'),
              borderRadius: 4, cursor: 'pointer', fontFamily: 'inherit',
              display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 8, textAlign: 'left',
            }}>
              <I size={18} color={active ? '#D97706' : opt.color} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{opt.label}</div>
                <div style={{ fontSize: 11, color: active ? '#A89684' : '#6B6354', marginTop: 2 }}>{opt.sub}</div>
              </div>
            </button>
          );
        })}
      </div>

      {mode === 'text' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label="문제 선택">
            <select
              value={problemId}
              onChange={(e) => setProblemId(e.target.value)}
              style={inputStyle}
            >
              <option value="">— 문제를 선택하세요 —</option>
              {(problemsQ.data ?? []).map((p) => (
                <option key={p.id} value={p.id}>{p.source} ({p.difficulty})</option>
              ))}
            </select>
          </Field>
          <Field label="오류 유형">
            <select value={errorType} onChange={(e) => setErrorType(e.target.value)} style={inputStyle}>
              {ERROR_TYPES.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
            </select>
          </Field>
          <Field label="메모 (선택)">
            <textarea
              value={insight}
              onChange={(e) => setInsight(e.target.value)}
              placeholder="치환적분에서 dx 처리를 누락했음 …"
              rows={4}
              style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
            />
          </Field>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button onClick={close} style={btnGhost}>취소</button>
            <button
              disabled={!problemId || createMut.isPending}
              onClick={() => createMut.mutate()}
              style={btnPrimary}
            >
              {createMut.isPending ? '등록 중…' : '등록'}
            </button>
          </div>
        </div>
      )}

      {(mode === 'photo' || mode === 'pdf') && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{
            border: '1px dashed #1F1A1430', borderRadius: 4, padding: 24,
            backgroundColor: '#F2EDE2', textAlign: 'center',
          }}>
            <Upload size={20} color="#6B6354" />
            <div style={{ fontSize: 13, color: '#6B6354', margin: '10px 0 14px' }}>
              {mode === 'photo' ? '문제 사진을 업로드하세요 (JPG, PNG)' : '문제집 PDF를 업로드하세요'}
            </div>
            <input
              type="file"
              accept={mode === 'photo' ? 'image/*' : 'application/pdf'}
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              style={{ fontFamily: 'inherit', fontSize: 12 }}
            />
            {file && (
              <div style={{ fontSize: 11, color: '#1F1A14', marginTop: 10, fontFamily: 'JetBrains Mono, monospace' }}>
                {file.name} · {(file.size / 1024).toFixed(1)}KB
              </div>
            )}
          </div>
          <div style={{ fontSize: 11, color: '#8B7E6A', lineHeight: 1.6 }}>
            ※ AI Vision/LLM 키가 설정되지 않은 상태에서는 업로드 후 안내 메시지만 표시됩니다.
            실제 자동 인식은 <code>backend/.env</code> 의 AI 키 설정 시 활성화됩니다.
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button onClick={close} style={btnGhost}>취소</button>
            <button
              disabled={!file || (mode === 'photo' ? photoMut.isPending : pdfMut.isPending)}
              onClick={() => file && (mode === 'photo' ? photoMut.mutate(file) : pdfMut.mutate(file))}
              style={btnPrimary}
            >
              {(mode === 'photo' ? photoMut.isPending : pdfMut.isPending) ? '업로드 중…' : '업로드'}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={{ fontSize: 11, color: '#8B7E6A', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{label}</span>
      {children}
    </label>
  );
}

const inputStyle: React.CSSProperties = {
  padding: '10px 12px', fontSize: 13, border: '1px solid #1F1A1430',
  borderRadius: 4, backgroundColor: '#F2EDE2', outline: 'none', fontFamily: 'inherit',
};
const btnPrimary: React.CSSProperties = {
  padding: '10px 18px', backgroundColor: '#1F1A14', color: '#F2EDE2',
  border: 'none', borderRadius: 4, fontSize: 13, fontWeight: 600,
  cursor: 'pointer', fontFamily: 'inherit',
};
const btnGhost: React.CSSProperties = {
  padding: '10px 18px', backgroundColor: 'transparent', color: '#1F1A14',
  border: '1px solid #1F1A1430', borderRadius: 4, fontSize: 13,
  cursor: 'pointer', fontFamily: 'inherit',
};
