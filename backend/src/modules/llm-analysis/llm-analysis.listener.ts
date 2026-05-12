import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ErrorCode } from '@prisma/client';
import { LLMAnalysisQueueService } from './llm-analysis-queue.service';

/**
 * attempt.completed → BullMQ 큐 enqueue (대상 제한).
 *
 *   1000명 PoC 흐름:
 *     - process 재시작 시 진행 중 작업은 BullMQ 가 자동 회수.
 *     - 실패 시 exponential backoff retry (max 3) → 모두 실패하면 dead-letter.
 *     - DB LLMAnalysisJob row 로 상태 영구 기록.
 *
 *   LLM 분석 대상 (비용·환각·큐 적체 회피):
 *     ✓ isRetry == false           — 재시도는 항상 skip
 *     그리고 아래 조건 1+ 충족:
 *       a) 오답
 *       b) stepByStepInput 이 있고 비어있지 않음
 *       c) rule-based errorCodes 가 비어있음 (휴리스틱 신뢰도 낮음)
 *       d) 정답이지만 자신감 80+/풀이 30s 미만 — 추측 의심
 *
 *   skip 케이스:
 *     - 정답 + 풀이 입력 없음 + 자신감 낮음 → 분석 가치 낮음
 *     - 재시도 attempt → 학생 학습 흐름 보호
 */
@Injectable()
export class LlmAnalysisListener {
  private readonly logger = new Logger(LlmAnalysisListener.name);

  constructor(private readonly queue: LLMAnalysisQueueService) {}

  @OnEvent('attempt.completed')
  async onAttemptCompleted(payload: {
    id: string;
    userId: string;
    problemId: string;
    tenantId?: string | null;
    isRetry?: boolean;
    isCorrect?: boolean;
    errorCodes?: ErrorCode[];
    stepByStepInput?: unknown;
    confidence?: number | null;
    durationSec?: number;
  }): Promise<void> {
    if (payload.isRetry) return;

    if (!this.shouldAnalyze(payload)) {
      this.logger.debug(`LLM skip attempt=${payload.id} — analysis not warranted by gating rules`);
      return;
    }

    try {
      const res = await this.queue.enqueueAttemptAnalysis({
        attemptId: payload.id,
        userId: payload.userId,
        problemId: payload.problemId,
        tenantId: payload.tenantId ?? null,
      });
      this.logger.debug(`enqueue attempt=${payload.id} job=${res.bullJobId} reused=${res.reused}`);
    } catch (err) {
      this.logger.error(`Queue enqueue failed for attempt ${payload.id}: ${(err as Error).message}`);
    }
  }

  /** 분석 가치 게이트 — 명세서 §3-1 + 1000명 PoC 비용 관리. */
  private shouldAnalyze(payload: {
    isCorrect?: boolean;
    errorCodes?: ErrorCode[];
    stepByStepInput?: unknown;
    confidence?: number | null;
    durationSec?: number;
  }): boolean {
    const hasSteps = Array.isArray(payload.stepByStepInput) && payload.stepByStepInput.length > 0;
    if (payload.isCorrect === true && !hasSteps) {
      if (typeof payload.confidence === 'number' && payload.confidence >= 80
          && typeof payload.durationSec === 'number' && payload.durationSec < 30) {
        return true;
      }
      return false;
    }
    if (payload.isCorrect === false) return true;
    if ((payload.errorCodes?.length ?? 0) === 0) return true;
    return hasSteps;
  }
}
