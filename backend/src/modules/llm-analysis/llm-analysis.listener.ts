import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ErrorCode } from '@prisma/client';
import { LLMAnalysisService } from './llm-analysis.service';

/**
 * attempt.completed → LLM 분석을 비동기 트리거 (대상 제한).
 *
 *   학생 응답 흐름을 차단하지 않기 위해 setImmediate 으로 떼어낸다.
 *   ⚠️ PoC 단계 — production 1000+명 환경에서는 BullMQ Redis queue 로 전환 권장
 *      (현재는 process 재시작 시 진행 중 분석 손실 가능 / DLQ 없음 / retry 약함).
 *
 *   LLM 분석 대상 (1000명 PoC 비용·환각·큐 적체 회피):
 *     ✓ isRetry == false           — 재시도는 항상 skip
 *     그리고 아래 4 조건 중 1+ 충족:
 *       a) 오답
 *       b) stepByStepInput 이 있고 비어있지 않음
 *       c) rule-based errorCodes 가 비어있음 (휴리스틱 신뢰도 낮음)
 *       d) 정답이지만 stepByStepInput 이 있고 자기 자신감과 정답률 차이가 큼
 *          (overconfidence 진단 — confidence ≥ 70 인데 풀이 시간 짧음 = 추측 의심)
 *
 *   skip 케이스 (분석 비대상):
 *     - 정답 + 풀이 입력 없음     → 분석 가치 낮음 (단순 채점)
 *     - 정답 + 풀이 입력 있고 자신감 가까움 → 흐름 정상
 *     - 재시도 attempt              → 학생 학습 흐름 보호
 *
 *   향후 (BullMQ 도입 시):
 *     - LLMAnalysisJob 테이블 또는 queue job status
 *     - pending / processing / completed / failed / retrying / needs_review
 *     - retryCount + dead-letter queue
 *     - failed job 재처리 API
 */
@Injectable()
export class LlmAnalysisListener {
  private readonly logger = new Logger(LlmAnalysisListener.name);

  constructor(private readonly llm: LLMAnalysisService) {}

  @OnEvent('attempt.completed')
  onAttemptCompleted(payload: {
    id: string;
    isRetry?: boolean;
    isCorrect?: boolean;
    errorCodes?: ErrorCode[];
    stepByStepInput?: unknown;
    confidence?: number | null;
    durationSec?: number;
  }): void {
    if (payload.isRetry) return;

    if (!this.shouldAnalyze(payload)) {
      this.logger.debug(`LLM skip attempt=${payload.id} — analysis not warranted by gating rules`);
      return;
    }

    setImmediate(() => {
      this.llm.analyzeAttempt(payload.id).catch((err) => {
        this.logger.error(`LLM analyze failed for attempt ${payload.id}: ${(err as Error).message}`);
      });
    });
  }

  /**
   * 분석 가치 게이트 — 명세서 §3-1 "환각 방지" + 1000명 PoC 비용 관리.
   */
  private shouldAnalyze(payload: {
    isCorrect?: boolean;
    errorCodes?: ErrorCode[];
    stepByStepInput?: unknown;
    confidence?: number | null;
    durationSec?: number;
  }): boolean {
    // 정답 + 풀이 입력 없음 → 학습 신호 적음. skip.
    const hasSteps = Array.isArray(payload.stepByStepInput) && payload.stepByStepInput.length > 0;
    if (payload.isCorrect === true && !hasSteps) {
      // 단, 자신감 높은데 풀이 시간이 짧으면 (추측 의심) 분석.
      if (typeof payload.confidence === 'number' && payload.confidence >= 80
          && typeof payload.durationSec === 'number' && payload.durationSec < 30) {
        return true;
      }
      return false;
    }
    // 오답이면 무조건 분석.
    if (payload.isCorrect === false) return true;
    // rule-based errorCodes 가 비어있으면 (휴리스틱 신뢰도 낮음) 분석.
    if ((payload.errorCodes?.length ?? 0) === 0) return true;
    // stepByStepInput 있는 정답 attempt → 메타인지 검토 (recommendedAction 가치).
    return hasSteps;
  }
}
