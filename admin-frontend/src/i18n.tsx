import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export type Lang = 'ko' | 'en';
const STORAGE_KEY = 'matheo.admin.lang';

const ko = {
  // sidebar
  'nav.overview': '개요',
  'nav.content':  '콘텐츠',
  'nav.insights': '인사이트',
  'nav.users':    '사용자',
  'nav.push':     '푸시',
  'nav.events':   '이벤트',
  'nav.audit':    '감사 로그',
  'nav.logout':   '로그아웃',
  'nav.adminBadge': '관리자',
  'common.loading': '불러오는 중…',
  'common.failed':  '불러오기 실패',
  'common.empty':   '데이터 없음',
  // login
  'auth.signIn':    '로그인',
  'auth.email':     '이메일',
  'auth.password':  '비밀번호',
  'auth.signing':   '진행 중…',
  'auth.signFailed': '로그인 실패',
  'auth.allowlist': '관리자 이메일은 ADMIN_EMAILS 환경변수로 설정. 기본값은 시드 계정 1개.',
  // overview
  'ov.title':       '시스템 개요',
  'ov.subtitle':    '모든 사용자/시도/콘텐츠/이벤트 read-only 스냅샷.',
  'ov.kpi.users':   '전체 사용자',
  'ov.kpi.users.sub': '{n} 명 7일 활성',
  'ov.kpi.accuracy': '정답률',
  'ov.kpi.accuracy.sub': '시도 {n}건',
  'ov.kpi.attempts': '시도 · 7일 / 30일',
  'ov.kpi.attempts.sub': '최근 활동 볼륨',
  'ov.kpi.problems': '문제',
  'ov.kpi.problems.sub': '{n} 단원',
  'ov.kpi.wrong':    '오답노트',
  'ov.kpi.wrong.sub': '{n}건 마스터',
  'ov.kpi.tokens':   '푸시 토큰',
  'ov.kpi.tokens.sub': '{n}개 비활성',
  'ov.country':      '국가별 사용자 (Phase 1 = 인도)',
  'ov.country.note': '확장: Phase 2 → KR · Phase 3+ → US/UK/AU/SG. COUNTRY_ROADMAP.md 참고.',
  'ov.coverage':     '콘텐츠 커버리지 (목표 단원당 20문제)',
  'ov.coverage.full': '전체 커버리지 매트릭스 보기 →',
  'ov.dau':          '일별 활성 사용자 (최근 30일)',
  'ov.dau.empty':    '아직 활동 기록이 없습니다.',
  'ov.signups':      '최근 가입자',
  // content
  'content.title':   '콘텐츠 커버리지',
  'content.subtitle': '학년별 문제 재고 · 목표 = 단원수 × 20문제',
  'content.col.grade': '학년',
  'content.col.unit':  '단원',
  'content.col.problems': '문제',
  'content.col.stepped': '3단계',
  'content.col.concept': '개념',
  'content.col.formula': '공식',
  'content.col.diff':    '난이도 분포',
  'content.col.gap':     '목표까지',
  'content.units':       '{n} 단원',
  'content.stepped':     '{n}개 3단계',
  'content.coveragePct': '{p}% 커버리지',
  // insights
  'insights.title':    'Distractor 인사이트',
  'insights.subtitle': '학습자가 어떤 오답을 고르는지 — 콘텐츠 품질 + 오개념 시그널. 윈도우: 최근 {d}일 · 오답 {n}건.',
  'insights.empty':    '윈도우 내 오답이 없습니다. 학습자가 사용하면서 distractor 패턴이 여기에 표시됩니다.',
  'insights.byType':   'distractor 유형별',
  'insights.byUnit':   '단원별',
  'insights.top':      '가장 많이 선택된 오답 (콘텐츠 검수)',
  'insights.col.source': '출처',
  'insights.col.step':   '단계',
  'insights.col.type':   '유형',
  'insights.col.text':   '오답 보기',
  'insights.col.rationale': 'Rationale',
  'insights.col.picks':  '선택수',
  // users
  'users.title':     '사용자',
  'users.subtitle':  '{n}명 · 행 클릭 시 상세 보기',
  'users.col.name':  '이름',
  'users.col.email': '이메일',
  'users.col.grade': '학년',
  'users.col.attempts': '시도',
  'users.col.accuracy': '정답률',
  'users.col.mastery':  'mastery 평균',
  'users.col.wrong':    '오답노트',
  'users.col.mock':     '모의고사',
  'users.col.last':     '마지막 활동',
  // user detail
  'ud.back':       '사용자 목록',
  'ud.target':     '목표',
  'ud.exam':       '시험일',
  'ud.joined':     '가입일',
  'ud.tab.mastery': 'Mastery',
  'ud.tab.attempts': '시도',
  'ud.tab.wrong':   '오답노트',
  'ud.tab.mock':    '모의고사',
  'ud.tab.activity': '활동',
  'ud.tab.events':  '이벤트',
  // push
  'push.title':    '푸시 알림',
  'push.subtitle': 'FCM 디바이스 토큰 — 등록 헬스 + 최근 송신. FIREBASE_* env 설정 시 실제 송신.',
  'push.kpi.total':    '전체 토큰',
  'push.kpi.active':   '활성',
  'push.kpi.active.sub': '{p}% healthy',
  'push.kpi.disabled': '비활성',
  'push.kpi.disabled.sub': '영구 실패',
  'push.kpi.platforms': '플랫폼',
  'push.recent': '최근 활성 토큰 (10개)',
  'push.empty':  '아직 등록된 토큰이 없습니다.',
  // audit
  'audit.title':    '어드민 감사 로그',
  'audit.subtitle': '/admin/* 호출 자동 기록 — 누가 언제 어떤 데이터에 접근했는지 추적.',
  'audit.filter.email': '관리자 이메일',
  'audit.filter.path':  '경로',
  'audit.byEmail':  '관리자별 호출 수',
  'audit.col.time': '시각',
  'audit.col.email': '관리자',
  'audit.col.method': '메서드',
  'audit.col.path': '경로',
  'audit.col.status': '상태',
  'audit.col.ip': 'IP',
  'audit.col.duration': 'ms',
  'audit.empty':    '아직 감사 로그가 없습니다.',
  // events
  'events.title':    '분석 이벤트',
  'events.subtitle': 'AnalyticsEvent 테이블 raw 스트림 — 페이지뷰·CTA클릭·perspective 전환·API call.',
  'events.filter':   '유형 필터',
  'events.placeholder': '(전체)',
  'events.col.time': '시각',
  'events.col.user': '사용자',
  'events.col.type': '유형',
  'events.col.payload': '페이로드',
  'events.col.source':  '출처',
};

const en: typeof ko = {
  'nav.overview': 'Overview',
  'nav.content':  'Content',
  'nav.insights': 'Insights',
  'nav.users':    'Users',
  'nav.push':     'Push',
  'nav.events':   'Events',
  'nav.audit':    'Audit log',
  'nav.logout':   'Logout',
  'nav.adminBadge': 'admin',
  'common.loading': 'Loading…',
  'common.failed':  'Failed to load',
  'common.empty':   'No data',
  'auth.signIn':    'Sign in',
  'auth.email':     'Email',
  'auth.password':  'Password',
  'auth.signing':   'Signing in…',
  'auth.signFailed': 'Sign-in failed',
  'auth.allowlist': 'Admin emails are configured via ADMIN_EMAILS env. Default: seed account only.',
  'ov.title':       'System Overview',
  'ov.subtitle':    'Read-only snapshot of all users, attempts, content, and event volume.',
  'ov.kpi.users':   'Total users',
  'ov.kpi.users.sub': '{n} active 7d',
  'ov.kpi.accuracy': 'Accuracy',
  'ov.kpi.accuracy.sub': 'across {n} attempts',
  'ov.kpi.attempts': 'Attempts · 7d / 30d',
  'ov.kpi.attempts.sub': 'recent activity volume',
  'ov.kpi.problems': 'Problems',
  'ov.kpi.problems.sub': '{n} units',
  'ov.kpi.wrong':    'Wrong notes',
  'ov.kpi.wrong.sub': '{n} mastered',
  'ov.kpi.tokens':   'Push tokens',
  'ov.kpi.tokens.sub': '{n} disabled',
  'ov.country':      'Users by country (Phase 1 = India)',
  'ov.country.note': 'Expand: Phase 2 → KR · Phase 3+ → US/UK/AU/SG. See COUNTRY_ROADMAP.md.',
  'ov.coverage':     'Content coverage (target 20/unit)',
  'ov.coverage.full': 'View full coverage matrix →',
  'ov.dau':          'Daily active users (last 30 days)',
  'ov.dau.empty':    'No activity recorded yet.',
  'ov.signups':      'Recent signups',
  'content.title':   'Content coverage',
  'content.subtitle': 'Curriculum problem stock per grade · target = 20 × unit count',
  'content.col.grade': 'Grade',
  'content.col.unit':  'Unit',
  'content.col.problems': 'Problems',
  'content.col.stepped': 'Stepped',
  'content.col.concept': 'Concept',
  'content.col.formula': 'Formula',
  'content.col.diff':    'Difficulty mix',
  'content.col.gap':     'Gap to target',
  'content.units':       '{n} units',
  'content.stepped':     '{n} stepped',
  'content.coveragePct': '{p}% coverage',
  'insights.title':    'Distractor insights',
  'insights.subtitle': 'What learners pick wrong — content quality + misconception signal. Window: last {d} days · {n} wrong attempts.',
  'insights.empty':    'No wrong attempts in this window. As learners use the app, distractor patterns will appear here.',
  'insights.byType':   'By distractor type',
  'insights.byUnit':   'By unit',
  'insights.top':      'Top distractors picked (content review)',
  'insights.col.source': 'Source',
  'insights.col.step':   'Step',
  'insights.col.type':   'Type',
  'insights.col.text':   'Wrong choice',
  'insights.col.rationale': 'Rationale',
  'insights.col.picks':  'Picks',
  'users.title':     'Users',
  'users.subtitle':  '{n} users · click a row for full detail',
  'users.col.name':  'Name',
  'users.col.email': 'Email',
  'users.col.grade': 'Grade',
  'users.col.attempts': 'Attempts',
  'users.col.accuracy': 'Accuracy',
  'users.col.mastery':  'Mastery avg',
  'users.col.wrong':    'Wrong notes',
  'users.col.mock':     'Mock exams',
  'users.col.last':     'Last active',
  'ud.back':       'Back to users',
  'ud.target':     'Target',
  'ud.exam':       'Exam',
  'ud.joined':     'Joined',
  'ud.tab.mastery': 'Mastery',
  'ud.tab.attempts': 'Attempts',
  'ud.tab.wrong':   'Wrong notes',
  'ud.tab.mock':    'Mock results',
  'ud.tab.activity': 'Activity',
  'ud.tab.events':  'Events',
  'push.title':    'Push notifications',
  'push.subtitle': 'FCM device tokens — registration health and recent delivery. Set FIREBASE_* env to enable real sends.',
  'push.kpi.total':    'Total tokens',
  'push.kpi.active':   'Active',
  'push.kpi.active.sub': '{p}% healthy',
  'push.kpi.disabled': 'Disabled',
  'push.kpi.disabled.sub': 'permanent failures',
  'push.kpi.platforms': 'Platforms',
  'push.recent': 'Recent active tokens (last 10)',
  'push.empty':  'No tokens registered yet.',
  // audit
  'audit.title':    'Admin audit log',
  'audit.subtitle': 'Every /admin/* call is recorded — who accessed what, and when.',
  'audit.filter.email': 'Admin email',
  'audit.filter.path':  'Path',
  'audit.byEmail':  'Calls by admin',
  'audit.col.time': 'Time',
  'audit.col.email': 'Admin',
  'audit.col.method': 'Method',
  'audit.col.path': 'Path',
  'audit.col.status': 'Status',
  'audit.col.ip': 'IP',
  'audit.col.duration': 'ms',
  'audit.empty':    'No audit log entries yet.',
  'events.title':    'Analytics events',
  'events.subtitle': 'Raw stream from AnalyticsEvent table — page views, CTA clicks, perspective switches, API calls.',
  'events.filter':   'Filter type',
  'events.placeholder': '(all)',
  'events.col.time': 'Time',
  'events.col.user': 'User',
  'events.col.type': 'Type',
  'events.col.payload': 'Payload',
  'events.col.source':  'Source',
};

const dict = { ko, en };
export type AdminTKey = keyof typeof ko;

type I18n = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (k: AdminTKey, params?: Record<string, string | number>) => string;
};

const Ctx = createContext<I18n | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'ko' || saved === 'en') return saved;
    return navigator.language?.startsWith('ko') ? 'ko' : 'en';
  });
  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem(STORAGE_KEY, l);
    document.documentElement.lang = l;
  };
  useEffect(() => { document.documentElement.lang = lang; }, [lang]);
  const t = (k: AdminTKey, params?: Record<string, string | number>) => {
    let s = (dict[lang] as Record<string, string>)[k] ?? (dict.ko as Record<string, string>)[k] ?? k;
    if (params) for (const [pk, pv] of Object.entries(params)) {
      s = s.replace(new RegExp(`\\{${pk}\\}`, 'g'), String(pv));
    }
    return s;
  };
  return <Ctx.Provider value={{ lang, setLang, t }}>{children}</Ctx.Provider>;
}

export function useT() {
  const v = useContext(Ctx);
  if (!v) throw new Error('I18nProvider not mounted');
  return v;
}

/** 학년 코드 → 라벨 (lang 자동 감지). UI에서 직접 호출. */
export function gradeLabel(g: string, lang: Lang): string {
  const num = ({
    G_MIDDLE_1: 7, G_MIDDLE_2: 8, G_MIDDLE_3: 9,
    G_HIGH_1: 10, G_HIGH_2: 11, G_HIGH_3: 12,
  } as Record<string, number>)[g];
  if (!num) return g;
  return lang === 'ko' ? `${num}학년` : `Grade ${num}`;
}
