/**
 * 단원 마스터 데이터 (수능 수학 기준).
 * 실제 운영 시 Unit 테이블의 row 와 동기화되며, seed 의 진실 원천이다.
 * MathLearningApp.jsx 의 masteryData 6개 축과 정확히 대응.
 */
export const UNIT_NAMES = [
  '수와 식',
  '함수',
  '미적분 I',
  '미적분 II',
  '확률·통계',
  '기하·벡터',
] as const;

export type UnitName = (typeof UNIT_NAMES)[number];

export const SUB_UNIT_MAP: Record<UnitName, string[]> = {
  '수와 식': ['실수와 식', '복소수', '다항식'],
  '함수': ['지수·로그함수', '삼각함수', '함수의 극한과 연속'],
  '미적분 I': ['도함수', '미분의 활용', '적분의 기초'],
  '미적분 II': ['치환적분', '부분적분', '정적분', '정적분의 활용'],
  '확률·통계': ['경우의 수', '조건부확률', '정규분포', '통계적 추정'],
  '기하·벡터': ['공간도형', '공간좌표', '공간벡터'],
};
