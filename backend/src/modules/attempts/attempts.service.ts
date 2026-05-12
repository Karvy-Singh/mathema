import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ErrorCode } from '@prisma/client';
import { AttemptsRepository } from './attempts.repository';

/**
 * 명세서 §4 Flow 2 — POST /attempts 응답:
 *   { attemptId, isCorrect, basicFeedback, nextAction }
 *
 *   basicFeedback / nextAction 은 rule-based errorCodes 로 즉시 생성.
 *   LLM 분석 결과는 비동기로 reasoningSummary 가 채워짐 (Attempt detail 에서 노출).
 */
@Injectable()
export class AttemptsService {
  constructor(
    private readonly repo: AttemptsRepository,
    private readonly events: EventEmitter2,
  ) {}

  async create(userId: string, dto: any) {
    const attempt = await this.repo.create(userId, dto);
    this.events.emit('attempt.completed', attempt);

    // 명세서 §4 Flow 2 반환 스키마 + raw row 함께 제공 (호환).
    return {
      ...attempt,
      attemptId: attempt.id,
      basicFeedback: this.buildBasicFeedback(attempt),
      nextAction:    this.buildNextAction(attempt),
    };
  }

  private buildBasicFeedback(a: { isCorrect: boolean; errorCodes: ErrorCode[]; hintUsed: boolean; durationSec: number }): string {
    if (a.isCorrect) {
      if (a.hintUsed) return '정답입니다. 다음엔 힌트 없이 한 번 더 시도해볼게요.';
      return '정답입니다.';
    }
    if (a.errorCodes.includes(ErrorCode.SIGN))    return '풀이 과정에서 부호 처리 실수가 의심돼요.';
    if (a.errorCodes.includes(ErrorCode.CALC))    return '단계별 계산 실수가 의심돼요.';
    if (a.errorCodes.includes(ErrorCode.CON))     return '개념 적용 단계에서 막힘이 있어 보여요.';
    if (a.errorCodes.includes(ErrorCode.FORMULA)) return '공식 선택/적용을 다시 살펴볼게요.';
    if (a.errorCodes.includes(ErrorCode.LOGIC))   return '풀이 흐름에서 단계 누락이 있어 보여요.';
    if (a.errorCodes.includes(ErrorCode.GRAPH))   return '그래프 해석 부분을 다시 살펴볼게요.';
    if (a.errorCodes.includes(ErrorCode.UNIT))    return '단위 변환 부분을 다시 살펴볼게요.';
    if (a.errorCodes.includes(ErrorCode.ALG))     return '대수 변형 과정을 다시 살펴볼게요.';
    if (a.durationSec > 240) return '시간이 충분치 않았어요. 다음엔 풀이 순서를 정리하며 풀어볼게요.';
    return '함께 다시 풀어볼게요.';
  }

  private buildNextAction(a: { isCorrect: boolean; errorCodes: ErrorCode[] }): string {
    if (a.isCorrect) return '같은 개념의 한 단계 어려운 문제를 추천할게요.';
    if (a.errorCodes.length === 0) return '비슷한 난이도의 다른 표현 문제를 추천할게요.';
    return '풀이 단계를 하나씩 확인하는 같은 개념 문제를 추천할게요.';
  }
}
