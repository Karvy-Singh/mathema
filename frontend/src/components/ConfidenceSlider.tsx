import { useT } from '../lib/i18n';

type Props = {
  value: number;
  onChange: (v: number) => void;
  label?: string;
};

/**
 * 메타인지 자기평가 슬라이더 — 답 제출 직전 확신도 표시.
 *
 * 색상: 0~33% 빨강 / 34~66% 주황 / 67~100% 녹색
 * 5% 단위 스냅. 키보드(←/→), 드래그, 클릭 모두 지원.
 *
 * 캘리브레이션 분석에 사용 — Brier score 와 confidence-accuracy 산점도.
 */
export default function ConfidenceSlider({ value, onChange, label }: Props) {
  const { t } = useT();
  const color = value < 34 ? '#C25E2E' : value < 67 ? '#C7791F' : '#5A8A45';
  const labelText = value < 34 ? t('study.confidence.low') : value < 67 ? t('study.confidence.medium') : t('study.confidence.high');
  const displayLabel = label ?? t('study.confidence.label');

  return (
    <div style={{ marginTop: 12, marginBottom: 12 }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        fontSize: 11, color: '#5C6B85', marginBottom: 6,
        letterSpacing: '0.1em', textTransform: 'uppercase',
      }}>
        <span>{displayLabel}</span>
        <span style={{
          color, fontWeight: 600,
          fontFamily: 'JetBrains Mono, monospace',
          textTransform: 'none', letterSpacing: 0,
        }}>
          {value}% · {labelText}
        </span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        step={5}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{
          width: '100%', accentColor: color, cursor: 'pointer',
        }}
      />
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        fontSize: 10, color: '#AAB4C5', marginTop: 4,
        fontFamily: 'JetBrains Mono, monospace',
      }}>
        <span>0</span><span>25</span><span>50</span><span>75</span><span>100</span>
      </div>
    </div>
  );
}
