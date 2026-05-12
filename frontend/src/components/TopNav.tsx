import { LogOut, Settings as SettingsIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useT } from '../lib/i18n';
import { trackUi } from '../lib/analytics';

/**
 * 상단 네비게이션 — 6 탭 + 언어 토글 + D-day + 프로필 + 로그아웃.
 *
 * 두 가지 사용 패턴:
 *   1. MathLearningApp 내부 — activeNav state 와 setActiveNav 콜백 제공.
 *      탭 클릭 시 같은 페이지 안에서 view 전환 (history push 포함).
 *   2. ConceptLessonPage 같은 외부 라우트 — activeNav 는 '개념학습' 고정,
 *      setActiveNav 는 `/#/<hash>` 로 navigate 하여 메인 앱으로 복귀.
 */
export type NavKey = '대시보드' | '오답노트' | '학습' | '개념학습' | '모의고사' | '리포트';

export const NAV_TO_HASH: Record<NavKey, string> = {
  '대시보드': 'dashboard',
  '오답노트': 'wrong-notes',
  '학습': 'study',
  '개념학습': 'concept',
  '모의고사': 'mock-exam',
  '리포트': 'report',
};

export function TopNav({
  activeNav,
  setActiveNav,
}: {
  activeNav: NavKey;
  setActiveNav: (v: NavKey) => void;
}) {
  const { user, logout } = useAuth();
  const { t, lang, setLang } = useT();
  const navigate = useNavigate();
  const goSettings = () => { navigate('/settings'); };
  const items: NavKey[] = ['대시보드', '오답노트', '개념학습', '학습', '모의고사', '리포트'];
  const navLabel = (k: NavKey): string => ({
    '대시보드': t('nav.dashboard'),
    '오답노트': t('nav.wrongNotes'),
    '학습': t('nav.study'),
    '개념학습': t('nav.concept'),
    '모의고사': t('nav.mockExam'),
    '리포트': t('nav.report'),
  } as const)[k];

  return (
    <nav style={{
      borderBottom: '1px solid #14285020', backgroundColor: '#EFEBDF',
      position: 'sticky', top: 0, zIndex: 50, backdropFilter: 'blur(8px)',
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '20px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '48px' }}>
          <button
            onClick={() => { trackUi('nav.change', { to: '대시보드', via: 'brand' }); setActiveNav('대시보드'); }}
            title={t('app.brand')}
            aria-label={t('app.brand')}
            style={{
              display: 'flex', alignItems: 'center',
              background: 'none', border: 'none', padding: 0, cursor: 'pointer',
              color: 'inherit', fontFamily: 'inherit',
            }}
          >
            <img
              src="/matheo-logo.png"
              alt={t('app.brand')}
              style={{
                height: 56, width: 'auto', objectFit: 'contain',
                mixBlendMode: 'multiply',
              }}
            />
          </button>
          <div style={{ display: 'flex', gap: '4px' }}>
            {items.map(item => (
              <button key={item} onClick={() => { trackUi('nav.change', { to: item }); setActiveNav(item); }} style={{
                padding: '8px 16px', fontSize: '14px',
                fontWeight: activeNav === item ? 600 : 400,
                color: activeNav === item ? '#142850' : '#5C6B85',
                backgroundColor: activeNav === item ? '#14285010' : 'transparent',
                border: 'none', borderRadius: '4px', cursor: 'pointer',
                transition: 'all 0.2s', fontFamily: 'inherit',
              }}>{navLabel(item)}</button>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{
            display: 'flex', gap: 0, padding: 2,
            backgroundColor: '#14285008', borderRadius: 4, border: '1px solid #14285018',
          }}>
            {(['hi', 'en', 'ko'] as const).map((l) => (
              <button
                key={l}
                onClick={() => { trackUi('lang.toggle', { to: l }); setLang(l); }}
                title={t('common.lang.toggle')}
                style={{
                  padding: '4px 10px', fontSize: 11, fontWeight: 600,
                  letterSpacing: '0.1em', textTransform: 'uppercase',
                  backgroundColor: lang === l ? '#142850' : 'transparent',
                  color: lang === l ? '#EFEBDF' : '#5C6B85',
                  border: 'none', borderRadius: 3, cursor: 'pointer',
                  fontFamily: 'JetBrains Mono, monospace',
                  transition: 'all 0.15s',
                }}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '10px', letterSpacing: '0.2em', color: '#8B95AB', textTransform: 'uppercase', marginBottom: '2px' }}>{t('nav.dDayPrefix')}</div>
            <div className="serif mono" style={{ fontSize: '20px', fontWeight: 600, letterSpacing: '-0.02em' }}>{t('nav.dDay', { days: user?.dDay ?? '–' })}</div>
          </div>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#142850', color: '#EFEBDF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 600 }}>
            {user?.name?.[0] ?? '?'}
          </div>
          <button onClick={goSettings} title={t('settings.title')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#5C6B85' }}>
            <SettingsIcon size={16} />
          </button>
          <button onClick={logout} title={t('nav.logout')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#5C6B85' }}>
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </nav>
  );
}
