import Modal from './Modal';
import type { ExamResult } from '../lib/queries';
import { useT } from '../lib/i18n';

type Props = {
  result: ExamResult | null;
  onClose: () => void;
};

export default function MockExamResultModal({ result, onClose }: Props) {
  const { t } = useT();
  return (
    <Modal open={!!result} onClose={onClose} subtitle={t('mock.detail.label')} title={result?.name ?? ''} width={560}>
      {result && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ fontSize: 12, color: '#5C6B85' }}>
            {t('mock.detail.duration', { date: result.date, time: result.time })}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {[
              { label: t('mock.list.col.score'), value: String(result.score), unit: t('common.score'), color: '#142850' },
              { label: t('mock.list.col.grade'), value: String(result.grade), unit: t('common.grade'), color: result.grade <= 2 ? '#5A8A45' : '#C7791F' },
              { label: t('mock.list.col.percentile'), value: String(result.percentile), unit: 'p', color: '#C25E2E' },
            ].map((s, i) => (
              <div key={i} style={{
                padding: 16, backgroundColor: '#EFEBDF',
                border: '1px solid #14285018', borderRadius: 4,
              }}>
                <div style={{ fontSize: 10, letterSpacing: '0.15em', color: '#8B95AB', textTransform: 'uppercase', marginBottom: 8 }}>
                  {s.label}
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                  <span style={{
                    fontSize: 32, fontWeight: 500, letterSpacing: '-0.04em',
                    fontFamily: 'JetBrains Mono, monospace', color: s.color,
                  }}>
                    {s.value}
                  </span>
                  <span style={{ fontSize: 12, color: '#5C6B85' }}>{s.unit}</span>
                </div>
              </div>
            ))}
          </div>

          <div style={{
            padding: 16, backgroundColor: '#14285008',
            borderLeft: '2px solid #C7791F', borderRadius: '0 4px 4px 0',
            fontSize: 13, lineHeight: 1.65, color: '#142850',
          }}>
            {t('mock.detail.percentileText', { top: Math.max(0, 100 - result.percentile) })}
            {result.grade <= 2 && ' ' + t('mock.detail.stable')}
            {result.grade > 2 && ' ' + t('mock.detail.improve')}
          </div>

          <div style={{ fontSize: 11, color: '#8B95AB' }}>
            {t('mock.detail.aiNote')}
          </div>
        </div>
      )}
    </Modal>
  );
}
