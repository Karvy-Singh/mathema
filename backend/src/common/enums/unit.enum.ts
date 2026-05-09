/**
 * 단원 마스터 데이터 (한국 중·고등 수학 교과 과정 기준).
 *
 * 학년별로 학습 가능한 단원을 GRADE_TO_UNITS 에 매핑.
 * 단원당 SUB_UNIT_MAP 으로 세부 영역.
 *
 * 시드의 진실 원천 — Unit 테이블 row 와 동기화.
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

export const GRADE_LABEL_KO: Record<GradeLevel, string> = {
  G_MIDDLE_1: '중1',
  G_MIDDLE_2: '중2',
  G_MIDDLE_3: '중3',
  G_HIGH_1: '고1',
  G_HIGH_2: '고2',
  G_HIGH_3: '고3',
};

export const GRADE_LABEL_EN: Record<GradeLevel, string> = {
  G_MIDDLE_1: 'Middle 1',
  G_MIDDLE_2: 'Middle 2',
  G_MIDDLE_3: 'Middle 3',
  G_HIGH_1: 'High 1',
  G_HIGH_2: 'High 2',
  G_HIGH_3: 'High 3',
};

/** 학년별 학습 단원 (좁은 범위만 — 빠른 데모를 위함) */
export const GRADE_TO_UNITS: Record<GradeLevel, string[]> = {
  G_MIDDLE_1: ['정수와 유리수', '문자와 식', '일차방정식', '좌표평면과 그래프'],
  G_MIDDLE_2: ['유리수와 순환소수', '식의 계산', '일차부등식', '일차함수'],
  G_MIDDLE_3: ['제곱근과 실수', '인수분해', '이차방정식', '이차함수'],
  G_HIGH_1: ['다항식', '방정식과 부등식', '도형의 방정식', '함수와 그래프'],
  G_HIGH_2: ['지수와 로그', '삼각함수', '수열', '함수의 극한'],
  G_HIGH_3: ['미적분 I', '미적분 II', '확률·통계', '기하·벡터'],
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

export const SUB_UNIT_MAP: Record<string, string[]> = {
  // 중1
  '정수와 유리수': ['정수의 사칙연산', '유리수와 절댓값', '소수와 분수의 변환'],
  '문자와 식': ['문자식 표현', '동류항 정리', '식의 값 계산'],
  '일차방정식': ['일차방정식 풀이', '비례식과 활용', '일차방정식의 활용'],
  '좌표평면과 그래프': ['순서쌍과 좌표', '정비례·반비례', '그래프 해석'],

  // 중2
  '유리수와 순환소수': ['순환소수와 분수', '유한·무한소수'],
  '식의 계산': ['지수법칙', '다항식의 곱셈', '곱셈공식'],
  '일차부등식': ['일차부등식 풀이', '연립일차부등식'],
  '일차함수': ['일차함수의 그래프', '기울기와 절편', '연립방정식과 그래프'],

  // 중3
  '제곱근과 실수': ['제곱근의 계산', '무리수와 실수', '근호의 사칙연산'],
  '인수분해': ['공통인수', '완전제곱식', '인수분해 공식'],
  '이차방정식': ['인수분해로 풀이', '근의 공식', '판별식', '근과 계수의 관계'],
  '이차함수': ['이차함수의 그래프', '꼭짓점·축', '최댓값·최솟값'],

  // 고1
  '다항식': ['다항식의 사칙연산', '나머지정리', '인수정리'],
  '방정식과 부등식': ['이차방정식의 활용', '연립이차방정식', '이차부등식', '절댓값 부등식'],
  '도형의 방정식': ['직선의 방정식', '원의 방정식', '도형의 이동'],
  '함수와 그래프': ['함수의 정의', '합성함수', '역함수', '유리·무리함수'],

  // 고2
  '지수와 로그': ['지수의 확장', '로그의 정의', '지수·로그함수의 그래프'],
  '삼각함수': ['일반각과 호도법', '삼각함수의 정의', '삼각함수의 그래프', '삼각함수의 활용'],
  '수열': ['등차수열', '등비수열', '수열의 합 (Σ)', '수학적 귀납법'],
  '함수의 극한': ['함수의 극한', '함수의 연속', '미분계수의 정의'],

  // 고3
  '미적분 I': ['도함수', '미분의 활용', '적분의 기초'],
  '미적분 II': ['치환적분', '부분적분', '정적분', '정적분의 활용'],
  '확률·통계': ['경우의 수', '조건부확률', '정규분포', '통계적 추정'],
  '기하·벡터': ['공간도형', '공간좌표', '공간벡터'],
};
