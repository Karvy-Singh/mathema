/**
 * 문제 난이도 — UI 라벨과 1:1 매핑.
 * MathLearningApp.jsx 의 diff 필드("중", "중상", "준킬러", "킬러") 와 정확히 대응.
 */
export enum Difficulty {
  MIDDLE = 'MIDDLE',                // 중
  UPPER_MIDDLE = 'UPPER_MIDDLE',    // 중상
  SEMI_KILLER = 'SEMI_KILLER',      // 준킬러
  KILLER = 'KILLER',                // 킬러
}

export const DIFFICULTY_LABEL_KO: Record<Difficulty, string> = {
  [Difficulty.MIDDLE]: '중',
  [Difficulty.UPPER_MIDDLE]: '중상',
  [Difficulty.SEMI_KILLER]: '준킬러',
  [Difficulty.KILLER]: '킬러',
};
