import { Injectable } from '@nestjs/common';

/**
 * SM-2 (SuperMemo 2) 간격 반복 알고리즘.
 *
 * 입력:
 *   quality: 0~5 (사용자 자기평가)
 *     5: 완벽하게 기억
 *     4: 약간의 노력으로 정답
 *     3: 어렵지만 정답
 *     2: 힌트로 겨우 정답
 *     1: 답을 보고 떠올림
 *     0: 전혀 모름
 *   prev: { easinessFactor, repetitionCount, intervalDays }
 *
 * 출력:
 *   { easinessFactor, repetitionCount, intervalDays, nextReviewAt, lapsed }
 *
 * 핵심 규칙:
 *   - quality < 3 → 실패(lapse): repetitionCount=0, intervalDays=1, EF는 그대로 두되 살짝 페널티
 *   - quality ≥ 3 → 성공:
 *       rep 0회: interval = 1일
 *       rep 1회: interval = 6일
 *       rep ≥ 2회: interval = prevInterval × EF (반올림)
 *   - EF 갱신: EF + (0.1 - (5-q) × (0.08 + (5-q) × 0.02))
 *     EF는 1.3 미만이 되지 않도록 clamp.
 */

export type Quality = 0 | 1 | 2 | 3 | 4 | 5;

export interface Sm2State {
  easinessFactor: number;
  repetitionCount: number;
  intervalDays: number;
}

export interface Sm2Result extends Sm2State {
  nextReviewAt: Date;
  lapsed: boolean;
}

@Injectable()
export class SpacedRepetitionService {
  static readonly EF_MIN = 1.3;
  static readonly EF_DEFAULT = 2.5;

  /** SM-2 한 번의 복습을 반영한 다음 상태를 계산. 부수효과 없음 (순수 함수). */
  apply(prev: Sm2State, quality: Quality, now: Date = new Date()): Sm2Result {
    const q = Math.max(0, Math.min(5, quality)) as Quality;

    // EF 갱신 (성공/실패 모두 적용 — SM-2 표준)
    const efDelta = 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02);
    const ef = Math.max(SpacedRepetitionService.EF_MIN, prev.easinessFactor + efDelta);

    const lapsed = q < 3;
    let rep: number;
    let interval: number;

    if (lapsed) {
      // 실패 → 처음부터 다시
      rep = 0;
      interval = 1;
    } else if (prev.repetitionCount === 0) {
      rep = 1;
      interval = 1;
    } else if (prev.repetitionCount === 1) {
      rep = 2;
      interval = 6;
    } else {
      rep = prev.repetitionCount + 1;
      // prevInterval × EF — prevInterval 0이면 6일로 보정 (마이그레이션된 기존 데이터 보호)
      const base = prev.intervalDays > 0 ? prev.intervalDays : 6;
      interval = Math.max(1, Math.round(base * ef));
    }

    const next = new Date(now);
    next.setDate(next.getDate() + interval);
    next.setHours(0, 0, 0, 0);

    return {
      easinessFactor: Math.round(ef * 1000) / 1000,
      repetitionCount: rep,
      intervalDays: interval,
      nextReviewAt: next,
      lapsed,
    };
  }

  /** 사람 친화적 quality → 숫자 매핑 (UI 4단계 버튼용) */
  static parseQuality(label: string): Quality {
    switch (label) {
      case 'AGAIN': return 1;   // 어려움 (다시)
      case 'HARD': return 3;    // 보통 (힘들었음)
      case 'GOOD': return 4;    // 쉬움
      case 'EASY': return 5;    // 완벽
      default: return 3;
    }
  }
}
