import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Camera, FileText, Image as ImageIcon, Upload } from 'lucide-react';
import Modal from './Modal';
import { toast } from './Toast';
import { get } from '../lib/api';
import type { Problem } from '../lib/queries';
import { createWrongNote, uploadWrongNotePhoto, uploadWrongNotePdf } from '../lib/mutations';
import { useT } from '../lib/i18n';

type Mode = 'text' | 'photo' | 'pdf';
type Props = {
  open: boolean;
  initialMode?: Mode;
  onClose: () => void;
};

export default function RegisterWrongNoteModal({ open, initialMode = 'text', onClose }: Props) {
  const { t } = useT();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [problemId, setProblemId] = useState('');
  const [insight, setInsight] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const qc = useQueryClient();

  const ERROR_TYPES = [
    { key: 'CONCEPT_MISUNDERSTANDING', label: t('wn.regModal.errorType.concept') },
    { key: 'CALCULATION_MISTAKE',      label: t('wn.regModal.errorType.calc') },
    { key: 'TIME_SHORTAGE',            label: t('wn.regModal.errorType.time') },
    { key: 'OTHER',                    label: t('wn.regModal.errorType.other') },
  ];
  const [errorType, setErrorType] = useState(ERROR_TYPES[0].key);

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
      toast(t('toast.wn.added'), 'success');
      qc.invalidateQueries({ queryKey: ['wn-list'] });
      qc.invalidateQueries({ queryKey: ['wn-stats'] });
      qc.invalidateQueries({ queryKey: ['wn-recent'] });
      close();
    },
    onError: (e: any) => toast(e?.response?.data?.error?.message ?? t('toast.wn.addFailed'), 'error'),
  });

  const photoMut = useMutation({
    mutationFn: (f: File) => uploadWrongNotePhoto(f),
    onSuccess: (r) => {
      toast(r.message ?? t('toast.wn.uploadDone'), r.ok ? 'success' : 'info');
      close();
    },
    onError: () => toast(t('toast.wn.uploadFailed'), 'error'),
  });

  const pdfMut = useMutation({
    mutationFn: (f: File) => uploadWrongNotePdf(f),
    onSuccess: (r) => {
      toast(r.message ?? t('toast.wn.pdfDone'), r.ok ? 'success' : 'info');
      close();
    },
    onError: () => toast(t('toast.wn.pdfFailed'), 'error'),
  });

  const MODES: Array<{ key: Mode; label: string; sub: string; Icon: any; color: string }> = [
    { key: 'photo', label: t('wn.register.photo'), sub: t('wn.register.photoSub'), Icon: Camera, color: '#8B3A1F' },
    { key: 'text',  label: t('wn.register.text'),  sub: t('wn.register.textSub'),  Icon: FileText, color: '#B45309' },
    { key: 'pdf',   label: t('wn.register.pdf'),   sub: t('wn.register.pdfSub'),   Icon: ImageIcon, color: '#4A5D3A' },
  ];

  return (
    <Modal open={open} onClose={close} subtitle={t('wn.regModal.label')} title={t('wn.regModal.title')} width={620}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 24 }}>
        {MODES.map((opt) => {
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
          <Field label={t('wn.regModal.field.problem')}>
            <select
              value={problemId}
              onChange={(e) => setProblemId(e.target.value)}
              style={inputStyle}
            >
              <option value="">{t('wn.regModal.field.problem.placeholder')}</option>
              {(problemsQ.data ?? []).map((p) => (
                <option key={p.id} value={p.id}>{p.source} ({p.difficulty})</option>
              ))}
            </select>
          </Field>
          <Field label={t('wn.regModal.field.errorType')}>
            <select value={errorType} onChange={(e) => setErrorType(e.target.value)} style={inputStyle}>
              {ERROR_TYPES.map((et) => <option key={et.key} value={et.key}>{et.label}</option>)}
            </select>
          </Field>
          <Field label={t('wn.regModal.field.note')}>
            <textarea
              value={insight}
              onChange={(e) => setInsight(e.target.value)}
              rows={4}
              style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
            />
          </Field>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button onClick={close} style={btnGhost}>{t('common.cancel')}</button>
            <button
              disabled={!problemId || createMut.isPending}
              onClick={() => createMut.mutate()}
              style={btnPrimary}
            >
              {createMut.isPending ? t('wn.regModal.submit.busy') : t('wn.regModal.submit.label')}
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
              {mode === 'photo' ? t('wn.regModal.upload.imgHint') : t('wn.regModal.upload.pdfHint')}
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
            {t('wn.regModal.upload.aiNote')}
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button onClick={close} style={btnGhost}>{t('common.cancel')}</button>
            <button
              disabled={!file || (mode === 'photo' ? photoMut.isPending : pdfMut.isPending)}
              onClick={() => file && (mode === 'photo' ? photoMut.mutate(file) : pdfMut.mutate(file))}
              style={btnPrimary}
            >
              {(mode === 'photo' ? photoMut.isPending : pdfMut.isPending) ? t('wn.regModal.upload.busy') : t('wn.regModal.upload.submit')}
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
