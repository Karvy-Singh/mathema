import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { LLMAnalysisService } from './llm-analysis.service';

/**
 * attempt.completed → LLM 분석을 비동기 트리거.
 *
 *   학생 응답 흐름을 차단하지 않기 위해 setImmediate 으로 떼어낸다.
 *   PoC 단계 — production 에서는 BullMQ 로 전환 (현재 구현은 process 재시작 시 분석 손실 가능).
 *
 *   retry 인 attempt 는 분석 skip (학생 부담 학습 흐름 보호).
 *   정답인 attempt 도 분석 수행 — recommendedAction 이 다음 학습 행동에 유용.
 */
@Injectable()
export class LlmAnalysisListener {
  private readonly logger = new Logger(LlmAnalysisListener.name);

  constructor(private readonly llm: LLMAnalysisService) {}

  @OnEvent('attempt.completed')
  onAttemptCompleted(payload: { id: string; isRetry?: boolean }): void {
    if (payload.isRetry) return;
    setImmediate(() => {
      this.llm.analyzeAttempt(payload.id).catch((err) => {
        this.logger.error(`LLM analyze failed for attempt ${payload.id}: ${(err as Error).message}`);
      });
    });
  }
}
