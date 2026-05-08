import { Difficulty } from '../enums/difficulty.enum';

/**
 * Bayesian Knowledge Tracing (BKT) — 표준 4-파라미터 모델 (Corbett & Anderson, 1995).
 *
 * 학생이 KC(Knowledge Component, 본 시스템에서는 단원)를 마스터했는지에 대한
 * 베이지안 사후확률 P(L_t)을 매 attempt마다 갱신.
 *
 * 4 파라미터:
 *   P(L0)  — 사전 마스터 확률 (학습 시작 전부터 알고 있을 확률)
 *   P(T)   — 시도당 학습 확률 (한 번 풀면서 마스터로 전이할 확률)
 *   P(S)   — slip: 마스터 상태에서 틀릴 확률
 *   P(G)   — guess: 미마스터 상태에서 우연히 맞힐 확률
 *
 * 갱신 절차 (관측 후):
 *   1) 관측 likelihood:
 *      P(correct) = P(L)·(1-S) + (1-P(L))·G
 *      P(wrong)   = P(L)·S     + (1-P(L))·(1-G)
 *   2) 베이지안 사후확률:
 *      correct →  P(L|correct) = P(L)·(1-S) / P(correct)
 *      wrong   →  P(L|wrong)   = P(L)·S     / P(wrong)
 *   3) 학습 전이:
 *      P(L_t+1) = P(L|obs) + (1 - P(L|obs))·T
 *
 * 난이도별 파라미터 차등:
 *   - 쉬운 문제 (MIDDLE): guess 확률↑, slip↓ → 정답이 마스터 신호로 약함
 *   - 어려운 문제 (KILLER): guess↓, slip↑ → 정답이 더 강한 신호, 오답은 덜한 신호
 */

export interface BktParams {
  pInit: number;
  pTransit: number;
  pSlip: number;
  pGuess: number;
}

/** 난이도별 BKT 파라미터 — IRT 영감 (난이도↑ → guess↓, slip↑) */
export const BKT_BY_DIFFICULTY: Record<Difficulty, BktParams> = {
  [Difficulty.MIDDLE]:       { pInit: 0.50, pTransit: 0.25, pSlip: 0.05, pGuess: 0.25 },
  [Difficulty.UPPER_MIDDLE]: { pInit: 0.40, pTransit: 0.18, pSlip: 0.08, pGuess: 0.18 },
  [Difficulty.SEMI_KILLER]:  { pInit: 0.30, pTransit: 0.12, pSlip: 0.12, pGuess: 0.10 },
  [Difficulty.KILLER]:       { pInit: 0.20, pTransit: 0.08, pSlip: 0.15, pGuess: 0.05 },
};

/**
 * P(L_t-1)에 한 번의 관측을 적용해 P(L_t)을 산출 (순수 함수).
 *
 * @param prev 0~1 범위의 이전 P(L). 처음이면 params.pInit 사용.
 * @param isCorrect 관측 결과
 * @param params 난이도별 파라미터
 * @returns 갱신된 P(L) (0~1)
 */
export function bktUpdate(prev: number, isCorrect: boolean, params: BktParams): number {
  const { pSlip: S, pGuess: G, pTransit: T } = params;
  const p = clamp01(prev);

  // 관측 likelihood
  const pObs = isCorrect
    ? p * (1 - S) + (1 - p) * G
    : p * S + (1 - p) * (1 - G);

  if (pObs <= 1e-9) return p; // numerical safeguard

  // 베이지안 사후
  const pPost = isCorrect
    ? (p * (1 - S)) / pObs
    : (p * S) / pObs;

  // 학습 전이
  const pNext = pPost + (1 - pPost) * T;

  return clamp01(pNext);
}

/** 시간 가중치 — 너무 빠르면 추측 가능성↑, 너무 느리면 마스터 신호↓ */
export function timeAdjustedParams(base: BktParams, durationSec: number): BktParams {
  if (durationSec < 30) {
    // 매우 빠름 → guess 확률 +0.1 (확신 못함)
    return { ...base, pGuess: Math.min(0.5, base.pGuess + 0.1) };
  }
  if (durationSec > 240) {
    // 매우 느림 → slip 확률 +0.05 (집중력 저하 가능)
    return { ...base, pSlip: Math.min(0.3, base.pSlip + 0.05) };
  }
  return base;
}

function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x));
}

/** 0~1 P(L) → 0~100 score 표현 */
export const probToScore = (p: number): number => Math.round(p * 100);

/** 0~100 score → 0~1 P(L) 표현 */
export const scoreToProb = (s: number): number => clamp01(s / 100);
