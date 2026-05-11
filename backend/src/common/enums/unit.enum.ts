/**
 * 단원 마스터 데이터 — NCERT Mathematics Class 7~12 챕터를 1차 기준으로 통일.
 *
 * 1차 출시 시장은 인도(영어). 한국어 단원명은 NCERT 챕터의 번역본이며 개발자 보조용.
 * 즉 영어 UI 가 출시 표준, 한국어는 개발/디버그용 1:1 미러.
 *
 *   단원명(KO) = ncert-chapters.ts 의 titleKo
 *   단원명(EN) = ncert-chapters.ts 의 titleEn (i18n/content-en.ts 매핑)
 *
 * 시드의 진실 원천 — Unit 테이블 row 와 동기화.
 * 한국 학년 enum 은 NCERT Class 7~12 와 1:1 (G_MIDDLE_1 = Class 7, …).
 */

export const GRADE_LEVELS = [
  'G_MIDDLE_1',
  'G_MIDDLE_2',
  'G_MIDDLE_3',
  'G_HIGH_1',
  'G_HIGH_2',
  'G_HIGH_3',
] as const;
export type GradeLevel = (typeof GRADE_LEVELS)[number];

/** 개발자 보조용 한국어 학년 라벨 (실제 UI 는 EN 디폴트) */
export const GRADE_LABEL_KO: Record<GradeLevel, string> = {
  G_MIDDLE_1: '중1 / Class 7',
  G_MIDDLE_2: '중2 / Class 8',
  G_MIDDLE_3: '중3 / Class 9',
  G_HIGH_1: '고1 / Class 10',
  G_HIGH_2: '고2 / Class 11',
  G_HIGH_3: '고3 / Class 12',
};

/** 출시 표준 — NCERT Class 표기 */
export const GRADE_LABEL_EN: Record<GradeLevel, string> = {
  G_MIDDLE_1: 'Class 7',
  G_MIDDLE_2: 'Class 8',
  G_MIDDLE_3: 'Class 9',
  G_HIGH_1: 'Class 10',
  G_HIGH_2: 'Class 11',
  G_HIGH_3: 'Class 12',
};

/**
 * NCERT 7~12 챕터 한국어명을 학년별 단원으로 매핑.
 * 이 리스트의 모든 단원명은 ncert-chapters.ts 의 titleKo 와 정확히 일치해야 한다.
 *
 * 총 79 챕터 (Class 7: 13, 8: 13, 9: 12, 10: 14, 11: 14, 12: 13)
 */
export const GRADE_TO_UNITS: Record<GradeLevel, string[]> = {
  G_MIDDLE_1: [
    '정수', '분수와 소수', '자료의 정리', '간단한 방정식', '직선과 각',
    '삼각형의 성질', '비교하기 (비·백분율)', '유리수', '둘레와 넓이',
    '대수식', '지수와 거듭제곱', '대칭', '입체도형의 시각화',
  ],
  G_MIDDLE_2: [
    '유리수의 성질', '일변수 일차방정식', '사각형의 이해', '자료의 정리 II',
    '제곱과 제곱근', '세제곱과 세제곱근', '비교하기 II (이자·할인)',
    '대수식과 항등식', '도형의 양 (둘레·넓이·부피)', '지수의 확장',
    '정비례·반비례', '인수분해 (입문)', '그래프 입문',
  ],
  G_MIDDLE_3: [
    '수의 체계 (실수)', '다항식', '좌표기하 입문', '두 변수 일차방정식',
    '유클리드 기하의 공준', '직선과 각 II', '삼각형 (합동)', '사각형 (성질·증명)',
    '원', '헤론의 공식', '겉넓이와 부피', '통계 입문',
  ],
  G_HIGH_1: [
    '실수 II (산술의 기본정리)', '다항식 II (영점·계수 관계)',
    '두 변수 일차연립방정식', '이차방정식', '등차수열 (A.P.)',
    '삼각형의 닮음', '좌표기하 II (분점·넓이)', '삼각비 입문',
    '삼각비의 활용', '원 II (접선)', '원과 관련된 넓이',
    '겉넓이·부피 (합성도형)', '통계 II (평균·중앙값·최빈값)', '확률 입문',
  ],
  G_HIGH_2: [
    '집합', '관계와 함수', '삼각함수 (일반각)', '복소수와 이차방정식',
    '일차부등식', '순열과 조합', '이항정리', '수열과 급수',
    '직선의 방정식', '원뿔곡선', '공간기하 입문', '극한과 미분 입문',
    '통계 III (분산·표준편차)', '확률 II (사건의 대수)',
  ],
  G_HIGH_3: [
    '관계와 함수 II', '역삼각함수', '행렬', '행렬식',
    '연속과 미분가능성', '미분의 활용', '적분', '적분의 활용',
    '미분방정식', '벡터대수', '공간기하 II', '선형계획법',
    '확률 III (조건부·베이즈)',
  ],
};

/** 모든 단원 (중복 제거, 순서 유지) — 시드용 */
export const UNIT_NAMES = Array.from(
  new Set(Object.values(GRADE_TO_UNITS).flat()),
) as readonly string[];

export type UnitName = (typeof UNIT_NAMES)[number];

/** 학년별 단원 → 학년 역매핑 */
export const UNIT_TO_GRADES: Record<string, GradeLevel[]> = (() => {
  const map: Record<string, GradeLevel[]> = {};
  for (const g of GRADE_LEVELS) {
    for (const u of GRADE_TO_UNITS[g]) {
      if (!map[u]) map[u] = [];
      map[u].push(g);
    }
  }
  return map;
})();

/**
 * SubUnit 매핑 — 1차 출시 단계에서는 단원 = NCERT 챕터 (1:1) 라
 * 세부 sub-section 매핑은 비워둔다.
 * 향후 챕터별 sub-section (예: Class 7 Integers · 1.1 Closure / 1.2 …) 을
 * 채울 때 키를 단원명과 동일하게 추가하면 자동으로 시드된다.
 */
export const SUB_UNIT_MAP: Record<string, string[]> = {
  // 비워둠 — 추후 챕터 내부 절(section) 단위로 확장.
};
