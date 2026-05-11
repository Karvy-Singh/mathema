import { Difficulty } from '../enums/difficulty.enum';

/**
 * Vygotsky ZPD (근접발달영역) 적용:
 *   학습 효율은 정답 확률 70-85% 근처에서 최대.
 *   너무 쉬우면 지루(boredom), 너무 어려우면 좌절(anxiety).
 *
 * mastery score → 권장 난이도 셋:
 *   < 40   : MIDDLE                        (개념 정착 단계)
 *   < 65   : MIDDLE, UPPER_MIDDLE          (응용력 형성)
 *   < 85   : UPPER_MIDDLE, SEMI_KILLER     (실전 진입)
 *   ≥ 85   : SEMI_KILLER, KILLER           (변별력 훈련)
 */
export function recommendedDifficulties(score: number): Difficulty[] {
  if (score < 40) return [Difficulty.MIDDLE];
  if (score < 65) return [Difficulty.MIDDLE, Difficulty.UPPER_MIDDLE];
  if (score < 85) return [Difficulty.UPPER_MIDDLE, Difficulty.SEMI_KILLER];
  return [Difficulty.SEMI_KILLER, Difficulty.KILLER];
}

/**
 * 모의고사 30문제 난이도 분포 비율 (CBSE Pre-Board / JEE Mock 실전 분포 근사):
 *   중 50% / 중상 30% / 준킬러 13% / 킬러 7%
 *   약점 단원에서는 중·중상 비율을 더 높여 구성한다.
 */
export function examDifficultyDistribution(score: number): Record<Difficulty, number> {
  if (score < 40) {
    return { MIDDLE: 0.7, UPPER_MIDDLE: 0.25, SEMI_KILLER: 0.05, KILLER: 0 } as any;
  }
  if (score < 65) {
    return { MIDDLE: 0.55, UPPER_MIDDLE: 0.3, SEMI_KILLER: 0.1, KILLER: 0.05 } as any;
  }
  if (score < 85) {
    return { MIDDLE: 0.4, UPPER_MIDDLE: 0.35, SEMI_KILLER: 0.18, KILLER: 0.07 } as any;
  }
  return { MIDDLE: 0.3, UPPER_MIDDLE: 0.3, SEMI_KILLER: 0.25, KILLER: 0.15 } as any;
}
