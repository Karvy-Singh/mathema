/**
 * 점수 → 등급/백분위.
 * 실제 운영 시 시험별 등급컷 lookup 테이블을 외부화한다.
 * 여기서는 일반적인 근사치만 제공.
 */
const CUTS: Array<{ grade: number; min: number }> = [
  { grade: 1, min: 92 },
  { grade: 2, min: 84 },
  { grade: 3, min: 76 },
  { grade: 4, min: 68 },
  { grade: 5, min: 60 },
  { grade: 6, min: 50 },
  { grade: 7, min: 40 },
  { grade: 8, min: 30 },
  { grade: 9, min: 0 },
];

export function calcGrade(score: number): number {
  return CUTS.find((c) => score >= c.min)?.grade ?? 9;
}

export function calcPercentile(score: number): number {
  // 매우 단순한 근사 — 실제는 응시자 분포 기반
  return Math.min(99, Math.max(1, Math.round(score)));
}

/**
 * 다음 등급(상위)에 도달하기 위해 필요한 점수.
 * 이미 1등급이면 0점 반환.
 */
export function pointsToNextGrade(score: number): number {
  const cur = calcGrade(score);
  if (cur <= 1) return 0;
  const targetCut = CUTS.find((c) => c.grade === cur - 1);
  if (!targetCut) return 0;
  return Math.max(0, targetCut.min - score);
}
