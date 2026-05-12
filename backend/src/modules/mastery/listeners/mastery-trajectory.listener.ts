import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ErrorCode, MasteryUpdateSource } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { MasteryTrajectoryService } from '../mastery-trajectory.service';
import { ErrorPatternService } from '../error-pattern.service';

/**
 * attempt.completed 이벤트 → MasteryTrajectory + ErrorPatternProfile 갱신.
 *
 *   기존 MasteryAttemptListener (unit 단위 MasterySnapshot) 와 병행 동작.
 *   이건 concept 단위 — Phase 1.1 신규 모델 사용.
 *
 *   ErrorPatternService 의 status 가 Mastery delta 에 영향 → 호출 순서:
 *     1. 현 MasteryScore + hasActiveErrorPattern 조회
 *     2. MasteryTrajectory 갱신 (delta 계산)
 *     3. ErrorPatternProfile 갱신 (recentFrequency·status·severity)
 *
 *   AttemptCompletedEvent 페이로드 — attempts.repository 가 이미 발행.
 */

interface AttemptCompletedPayload {
  id: string;
  userId: string;
  problemId: string;
  isCorrect: boolean;
  durationSec: number;
  hintUsed?: boolean;
  confidence?: number | null;
  /** rule-based 1차 추정 errorCodes (GradingService). */
  errorCodes?: ErrorCode[];
  isRetry?: boolean;
  tenantId?: string | null;
}

@Injectable()
export class MasteryTrajectoryListener {
  private readonly logger = new Logger(MasteryTrajectoryListener.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly trajectory: MasteryTrajectoryService,
    private readonly errorPattern: ErrorPatternService,
  ) {}

  @OnEvent('attempt.completed')
  async onAttemptCompleted(payload: AttemptCompletedPayload): Promise<void> {
    if (payload.isRetry) return;

    // 이 문제가 측정하는 모든 Concept 조회 (ProblemConcept N:M).
    const problem = await this.prisma.problem.findUnique({
      where: { id: payload.problemId },
      select: {
        difficultyLevel: true,
        expectedTimeSec: true,
        concepts: { select: { conceptId: true, weight: true } },
      },
    });
    if (!problem || problem.concepts.length === 0) return;

    const conceptIds = problem.concepts.map((c) => c.conceptId);

    // 현 mastery 조회 (severity 계산용)
    const trajectories = await this.prisma.masteryTrajectory.findMany({
      where: { userId: payload.userId, conceptId: { in: conceptIds } },
      select: { conceptId: true, masteryScore: true },
    });
    const masteryByConcept = new Map(trajectories.map((t) => [t.conceptId, t.masteryScore]));

    // 1) MasteryTrajectory 갱신 — 각 concept 별.
    for (const cid of conceptIds) {
      const hasActive = await this.errorPattern.hasActiveForConcept(payload.userId, cid);
      try {
        await this.trajectory.updateAfterAttempt({
          userId: payload.userId,
          conceptId: cid,
          tenantId: payload.tenantId ?? null,
          attemptId: payload.id,
          isCorrect: payload.isCorrect,
          durationSec: payload.durationSec,
          expectedTimeSec: problem.expectedTimeSec ?? null,
          hintUsed: payload.hintUsed === true,
          difficultyLevel: problem.difficultyLevel,
          confidence: payload.confidence ?? null,
          hasActiveErrorPattern: hasActive,
          source: MasteryUpdateSource.RULE_BASED,
        });
      } catch (err) {
        this.logger.error(`Mastery update failed for concept ${cid}: ${(err as Error).message}`);
      }
    }

    // 2) ErrorPatternProfile 갱신 — errorCodes 가 있을 때만.
    if (payload.errorCodes && payload.errorCodes.length > 0) {
      try {
        await this.errorPattern.updateAfterAttempt({
          userId: payload.userId,
          tenantId: payload.tenantId ?? null,
          attemptId: payload.id,
          conceptIds,
          errorCodes: payload.errorCodes,
          isCorrect: payload.isCorrect,
          masteryScoreByConcept: masteryByConcept,
        });
      } catch (err) {
        this.logger.error(`ErrorPattern update failed: ${(err as Error).message}`);
      }
    } else if (payload.isCorrect) {
      // 정답이면 errorCodes 가 없어도 IMPROVING/RESOLVED 판정을 위해 refresh.
      try {
        await this.errorPattern.updateAfterAttempt({
          userId: payload.userId,
          tenantId: payload.tenantId ?? null,
          attemptId: payload.id,
          conceptIds,
          errorCodes: [],
          isCorrect: true,
          masteryScoreByConcept: masteryByConcept,
        });
      } catch (err) {
        this.logger.warn(`ErrorPattern refresh on correct failed: ${(err as Error).message}`);
      }
    }
  }
}
