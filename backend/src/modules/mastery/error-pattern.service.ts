import { Injectable, Logger } from '@nestjs/common';
import { ErrorCode, ErrorPatternStatus } from '@prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

/**
 * ErrorPatternService — 반복 실수 패턴의 누적 + 상태 관리.
 *
 *   요구사항 명세서 Flow 5:
 *     동일 (conceptId, errorCode) 의 attempt 가
 *       - 최근 3회 이상 발생  → status=ACTIVE
 *       - 최근 5회 중 빈도 감소 → status=IMPROVING
 *       - 최근 5회 이상 미발생 → status=RESOLVED
 *     severity 는 recentFrequency 와 masteryScore 를 함께 반영.
 *
 *   호출처:
 *     - AttemptCompletedListener — attempt.completed 이벤트로 trigger.
 *     - LLMAnalysisService — LLM 분석 결과로 errorCodes 가 갱신되면 재계산.
 *
 *   evidenceAttemptIds 는 최대 20개로 cap.
 */

const RECENT_WINDOW = 5;             // 최근 5회 attempt window
const ACTIVE_THRESHOLD = 3;          // 최근 5회 안에서 3회 이상 발생 → ACTIVE
const IMPROVING_HALF = 2;            // 직전 3회 ≥ X, 직후 2회 < X → IMPROVING
const EVIDENCE_CAP = 20;

@Injectable()
export class ErrorPatternService {
  private readonly logger = new Logger(ErrorPatternService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * 한 attempt 의 errorCodes 를 받아 모든 (concept, code) 패턴에 반영.
   */
  async updateAfterAttempt(input: {
    userId: string;
    tenantId?: string | null;
    attemptId: string;
    conceptIds: string[];               // 이 문제가 측정하는 모든 Concept
    errorCodes: ErrorCode[];            // 발생한 오답 코드 (rule-based 또는 LLM 검증된 것)
    isCorrect: boolean;
    masteryScoreByConcept: Map<string, number>;  // 현재 mastery (severity 계산용)
  }): Promise<void> {
    // 1) 정답이면 — 해당 concept 의 모든 ACTIVE 패턴의 recentFrequency 갱신만 (감소 방향).
    if (input.isCorrect) {
      for (const cid of input.conceptIds) {
        await this.refreshAllStatusesForConcept(input.userId, cid, input.masteryScoreByConcept.get(cid) ?? 50);
      }
      return;
    }

    // 2) 오답 — 각 concept × errorCode 조합 upsert.
    for (const cid of input.conceptIds) {
      for (const code of input.errorCodes) {
        const key = { userId: input.userId, conceptId: cid, errorCode: code };
        const existing = await this.prisma.errorPatternProfile.findUnique({
          where: { userId_conceptId_errorCode: key },
        });

        const now = new Date();
        const newEvidence = [...(existing?.evidenceAttemptIds ?? []), input.attemptId].slice(-EVIDENCE_CAP);

        await this.prisma.errorPatternProfile.upsert({
          where: { userId_conceptId_errorCode: key },
          update: {
            frequency: { increment: 1 },
            lastDetectedAt: now,
            evidenceAttemptIds: newEvidence,
            // recentFrequency / status / severity 는 아래 refresh 에서 일괄 재계산.
          },
          create: {
            ...key,
            tenantId: input.tenantId ?? null,
            frequency: 1,
            recentFrequency: 1,
            severity: 'low',
            firstDetectedAt: now,
            lastDetectedAt: now,
            evidenceAttemptIds: [input.attemptId],
            status: ErrorPatternStatus.ACTIVE,
          },
        });
      }
      await this.refreshAllStatusesForConcept(input.userId, cid, input.masteryScoreByConcept.get(cid) ?? 50);
    }
  }

  /**
   * 특정 concept 의 모든 패턴 status 재계산 — 최근 5회 attempt window 기준.
   */
  private async refreshAllStatusesForConcept(userId: string, conceptId: string, masteryScore: number): Promise<void> {
    const recentAttempts = await this.prisma.attempt.findMany({
      where: {
        userId,
        problem: { concepts: { some: { conceptId } } },
      },
      orderBy: { createdAt: 'desc' },
      take: RECENT_WINDOW,
      select: { errorCodes: true },
    });

    const patterns = await this.prisma.errorPatternProfile.findMany({
      where: { userId, conceptId },
    });

    for (const p of patterns) {
      // 최근 5 attempt 중 이 errorCode 가 몇 번 나왔는지.
      const recentCount = recentAttempts.filter((a) => a.errorCodes.includes(p.errorCode)).length;

      // 가장 오래된 절반 vs 가장 최근 절반의 빈도 비교 — IMPROVING 판정.
      const olderHalf = recentAttempts.slice(Math.ceil(RECENT_WINDOW / 2));
      const newerHalf = recentAttempts.slice(0, Math.ceil(RECENT_WINDOW / 2));
      const olderCount = olderHalf.filter((a) => a.errorCodes.includes(p.errorCode)).length;
      const newerCount = newerHalf.filter((a) => a.errorCodes.includes(p.errorCode)).length;

      let nextStatus: ErrorPatternStatus;
      if (recentCount === 0 && recentAttempts.length >= RECENT_WINDOW) {
        nextStatus = ErrorPatternStatus.RESOLVED;
      } else if (recentCount >= ACTIVE_THRESHOLD) {
        nextStatus = ErrorPatternStatus.ACTIVE;
      } else if (olderCount >= IMPROVING_HALF && newerCount < olderCount) {
        nextStatus = ErrorPatternStatus.IMPROVING;
      } else if (recentCount > 0) {
        nextStatus = ErrorPatternStatus.ACTIVE;
      } else {
        // 최근 5회 미만에서 발생 없음 — 기존 상태 유지 (관측 부족).
        nextStatus = p.status;
      }

      // severity — recentFrequency × (1 - mastery/100).
      // 최근 빈도 높고 mastery 낮으면 high. 빈도 낮거나 mastery 높으면 low.
      const sevScore = recentCount * (1 - masteryScore / 100);
      let severity: 'low' | 'medium' | 'high' = 'low';
      if (sevScore >= 2) severity = 'high';
      else if (sevScore >= 1) severity = 'medium';

      await this.prisma.errorPatternProfile.update({
        where: { id: p.id },
        data: { recentFrequency: recentCount, status: nextStatus, severity },
      });
    }
  }

  /** 학생의 ACTIVE 패턴 목록 (UI/추천 엔진 입력용). */
  async getActiveForUser(userId: string) {
    return this.prisma.errorPatternProfile.findMany({
      where: { userId, status: ErrorPatternStatus.ACTIVE },
      include: { concept: { select: { id: true, code: true, name: true } } },
      orderBy: [{ severity: 'desc' }, { recentFrequency: 'desc' }],
    });
  }

  /** 특정 concept 에 ACTIVE 패턴이 있는지 (MasteryService 의 delta 계산용). */
  async hasActiveForConcept(userId: string, conceptId: string): Promise<boolean> {
    const n = await this.prisma.errorPatternProfile.count({
      where: { userId, conceptId, status: ErrorPatternStatus.ACTIVE },
    });
    return n > 0;
  }
}
