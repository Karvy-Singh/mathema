import Modal from './Modal';
import type { ExamResult } from '../lib/queries';

type Props = {
  result: ExamResult | null;
  onClose: () => void;
};

export default function MockExamResultModal({ result, onClose }: Props) {
  return (
    <Modal open={!!result} onClose={onClose} subtitle="Mock Exam · Detail" title={result?.name ?? ''} width={560}>
      {result && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ fontSize: 12, color: '#6B6354' }}>
            {result.date} · 풀이시간 {result.time}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {[
              { label: '점수', value: String(result.score), unit: '점', color: '#1F1A14' },
              { label: '등급', value: String(result.grade), unit: '등급', color: result.grade <= 2 ? '#4A5D3A' : '#B45309' },
              { label: '백분위', value: String(result.percentile), unit: 'p', color: '#8B3A1F' },
            ].map((s, i) => (
              <div key={i} style={{
                padding: 16, backgroundColor: '#F2EDE2',
                border: '1px solid #1F1A1418', borderRadius: 4,
              }}>
                <div style={{ fontSize: 10, letterSpacing: '0.15em', color: '#8B7E6A', textTransform: 'uppercase', marginBottom: 8 }}>
                  {s.label}
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                  <span style={{
                    fontSize: 32, fontWeight: 500, letterSpacing: '-0.04em',
                    fontFamily: 'JetBrains Mono, monospace', color: s.color,
                  }}>
                    {s.value}
                  </span>
                  <span style={{ fontSize: 12, color: '#6B6354' }}>{s.unit}</span>
                </div>
              </div>
            ))}
          </div>

          <div style={{
            padding: 16, backgroundColor: '#1F1A1408',
            borderLeft: '2px solid #B45309', borderRadius: '0 4px 4px 0',
            fontSize: 13, lineHeight: 1.65, color: '#1F1A14',
          }}>
            상위 <strong>{Math.max(0, 100 - result.percentile)}%</strong> 영역에 위치해 있어요.
            {result.grade <= 2 && ' 안정적인 등급권을 유지하고 있습니다.'}
            {result.grade > 2 && ' 다음 등급 진입을 위한 약점 단원 보강이 필요합니다.'}
          </div>

          <div style={{ fontSize: 11, color: '#8B7E6A' }}>
            ※ 문항별 상세 분석은 AI 키 설정 후 활성화됩니다.
          </div>
        </div>
      )}
    </Modal>
  );
}
