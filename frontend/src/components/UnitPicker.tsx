import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchUnitsForUser, GradeLevel } from '../lib/queries';
import { useT } from '../lib/i18n';

/**
 * 학년 + 단원 선택 — 가입 학년이 기본값이며, 선행학습용으로 다른 학년을 선택해 단원 후보를 바꿀 수 있음.
 */

type GradeOption = '__mine__' | '__all__' | GradeLevel;
const GRADE_OPTIONS: GradeOption[] = ['__mine__', 'G_MIDDLE_1', 'G_MIDDLE_2', 'G_MIDDLE_3', 'G_HIGH_1', 'G_HIGH_2', 'G_HIGH_3', '__all__'];

export function UnitPicker({ onPick, disabled }: { onPick: (unitId: string) => void; disabled?: boolean }) {
  const { t } = useT();
  const [grade, setGrade] = useState<GradeOption>('__mine__');
  const [selected, setSelected] = useState<string>('');

  const units = useQuery({
    queryKey: ['units-picker', grade],
    // '__mine__' 은 빈 값으로 보내 백엔드가 사용자 gradeLevel 로 폴백.
    queryFn: () => fetchUnitsForUser(grade === '__mine__' ? undefined : grade),
  });

  const list = units.data ?? [];
  const gradeLabel = (g: GradeOption): string => {
    if (g === '__mine__') return t('unitPicker.gradeMine');
    if (g === '__all__') return t('unitPicker.allGrades');
    return t(`grade.${g}`);
  };

  return (
    <div style={{ marginTop: 16, padding: 16, backgroundColor: '#F8F4E9', border: '1px solid #14285015', borderRadius: 4 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, gap: 12 }}>
        <span style={{ fontSize: 11, letterSpacing: '0.18em', color: '#8B95AB', textTransform: 'uppercase' }}>
          {t('unitPicker.label')}
        </span>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#5C6B85' }}>
          <span style={{ letterSpacing: '0.1em', textTransform: 'uppercase' }}>{t('unitPicker.gradeFilter')}</span>
          <select
            value={grade}
            onChange={(e) => { setGrade(e.target.value as GradeOption); setSelected(''); }}
            style={{
              padding: '6px 10px', fontSize: 12,
              border: '1px solid #14285030', borderRadius: 4,
              backgroundColor: '#EFEBDF', outline: 'none', fontFamily: 'inherit',
            }}
          >
            {GRADE_OPTIONS.map((g) => (
              <option key={g} value={g}>{gradeLabel(g)}</option>
            ))}
          </select>
        </label>
      </div>

      {list.length === 0 && !units.isLoading ? (
        <div style={{ fontSize: 12, color: '#8B95AB' }}>{t('unitPicker.empty')}</div>
      ) : (
        <div style={{ display: 'flex', gap: 8 }}>
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            disabled={disabled || units.isLoading}
            style={{
              flex: 1, padding: '10px 12px', fontSize: 13,
              border: '1px solid #14285030', borderRadius: 4,
              backgroundColor: '#EFEBDF', outline: 'none', fontFamily: 'inherit',
            }}
          >
            <option value="">{t('unitPicker.placeholder')}</option>
            {list.map((u) => (
              <option key={u.id} value={u.id}>{u.displayName ?? u.name}</option>
            ))}
          </select>
          <button
            disabled={!selected || disabled}
            onClick={() => onPick(selected)}
            style={{
              padding: '10px 16px', fontSize: 13, fontWeight: 600,
              backgroundColor: selected ? '#142850' : '#14285030',
              color: '#EFEBDF', border: 'none', borderRadius: 4,
              cursor: selected ? 'pointer' : 'not-allowed', fontFamily: 'inherit',
            }}
          >
            {t('unitPicker.start')}
          </button>
        </div>
      )}
    </div>
  );
}
