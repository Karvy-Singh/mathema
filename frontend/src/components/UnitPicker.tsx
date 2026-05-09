import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchUnitsForUser } from '../lib/queries';
import { useT } from '../lib/i18n';

/**
 * 학년별 단원 선택 드롭다운 — 가입 학년 기반으로 단원 후보를 필터링.
 * "전체 학년" 토글로 모든 단원 노출 가능.
 */
export function UnitPicker({ onPick, disabled }: { onPick: (unitId: string) => void; disabled?: boolean }) {
  const { t } = useT();
  const [allGrades, setAllGrades] = useState(false);
  const [selected, setSelected] = useState<string>('');

  const units = useQuery({
    queryKey: ['units-picker', allGrades],
    // grade=__all__ → 백엔드는 무시하므로 모든 단원 반환
    queryFn: () => fetchUnitsForUser(allGrades ? '__all__' : undefined),
  });

  const list = units.data ?? [];

  return (
    <div style={{ marginTop: 16, padding: 16, backgroundColor: '#FAF6EB', border: '1px solid #1F1A1415', borderRadius: 4 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ fontSize: 11, letterSpacing: '0.18em', color: '#8B7E6A', textTransform: 'uppercase' }}>
          {t('unitPicker.label')}
        </span>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#6B6354', cursor: 'pointer' }}>
          <input type="checkbox" checked={allGrades} onChange={(e) => setAllGrades(e.target.checked)} />
          {t('unitPicker.allGrades')}
        </label>
      </div>

      {list.length === 0 && !units.isLoading ? (
        <div style={{ fontSize: 12, color: '#8B7E6A' }}>{t('unitPicker.empty')}</div>
      ) : (
        <div style={{ display: 'flex', gap: 8 }}>
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            disabled={disabled || units.isLoading}
            style={{
              flex: 1, padding: '10px 12px', fontSize: 13,
              border: '1px solid #1F1A1430', borderRadius: 4,
              backgroundColor: '#F2EDE2', outline: 'none', fontFamily: 'inherit',
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
              backgroundColor: selected ? '#1F1A14' : '#1F1A1430',
              color: '#F2EDE2', border: 'none', borderRadius: 4,
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
