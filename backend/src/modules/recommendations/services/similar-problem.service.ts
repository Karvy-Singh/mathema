import { Injectable, Logger } from '@nestjs/common';
import { RecommendationType } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';

/**
 * SimilarProblemService — 명세서 §4 Flow 8 (유사문제 5개).
 *
 *   목적:
 *     - 방금 틀린 문제와 같은 개념
 *     - 비슷한 난이도 (±1)
 *     - 같은 오답 원인을 교정 (commonErrorCodes 가 attempt.errorCodes 와 겹침)
 *     - 추가 연습용 (이미 푼 문제 제외)
 *
 *   현재 구현:
 *     - ProblemConcept N:M 기반 동일 concept 매칭 (Phase 1)
 *     - 난이도 ±1 우선, ±2 fallback
 *     - commonErrorCodes 교집합이 큰 problem 우선
 *     - 5개 미만이면 있는 만큼만 반환
 *     - 각 추천은 RecommendationLog 1 row (recommendationType=SIMILAR_PROBLEM)
 *
 *   Phase 2 후속:
 *     - Embedding 코사인 유사도 (pgvector 도입 후)
 *     - LLM 기반 의미 유사도
 */

const TARGET_COUNT = 5;

@Injectable()
export class SimilarProblemService {
  private readonly logger = new Logger(SimilarProblemService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getSimilar(userId: string, attemptId: string): Promise<{
    items: Array<{ problemId: string; reason: string; recommendationLogId: string }>;
    requested: number;
    returned: number;
    /** 5개 미만일 때 부족 사유 — 명세서 §7. */
    shortfallReason?: string;
  }> {
    const attempt = await this.prisma.attempt.findUnique({
      where: { id: attemptId },
      include: {
        problem: {
          include: { concepts: { select: { conceptId: true, weight: true } } },
        },
      },
    });
    if (!attempt) {
      return { items: [], requested: TARGET_COUNT, returned: 0, shortfallReason: 'Attempt not found.' };
    }

    const conceptIds = attempt.problem.concepts.map((c) => c.conceptId);
    if (conceptIds.length === 0) {
      return { items: [], requested: TARGET_COUNT, returned: 0, shortfallReason: 'This problem is not linked to any concept.' };
    }

    const targetDiff = attempt.problem.difficultyLevel;
    const errorCodes = attempt.errorCodes;

    // 이미 푼 problem 제외.
    const solvedProblemIds = (await this.prisma.attempt.findMany({
      where: { userId, problemId: { not: attempt.problemId } },
      select: { problemId: true },
      distinct: ['problemId'],
    })).map((a) => a.problemId);

    const excludeIds = new Set<string>([attempt.problemId, ...solvedProblemIds]);

    // 후보 검색 — 같은 concept + 난이도 ±2 + 이미 푼 problem 제외.
    const candidates = await this.prisma.problem.findMany({
      where: {
        id: { notIn: Array.from(excludeIds) },
        difficultyLevel: { gte: Math.max(1, targetDiff - 2), lte: Math.min(5, targetDiff + 2) },
        concepts: { some: { conceptId: { in: conceptIds } } },
      },
      include: {
        concepts: { select: { conceptId: true, weight: true } },
      },
      take: 50,
    });

    // 점수 계산: 같은 conceptId 가중 + commonErrorCodes 교집합 + 난이도 일치도.
    const scored = candidates.map((p) => {
      const sameConcept = p.concepts.some((c) => conceptIds.includes(c.conceptId)) ? 1 : 0;
      const errorOverlap = errorCodes.filter((ec) => p.commonErrorCodes.includes(ec)).length;
      const diffPenalty = Math.abs(p.difficultyLevel - targetDiff);
      const score = sameConcept * 10 + errorOverlap * 5 - diffPenalty * 2;
      return { problem: p, score };
    });
    scored.sort((a, b) => b.score - a.score);

    const picked = scored.slice(0, TARGET_COUNT);
    if (picked.length === 0) {
      return {
        items: [], requested: TARGET_COUNT, returned: 0,
        shortfallReason: '같은 개념의 다른 문제를 데이터베이스에서 찾지 못했습니다.',
      };
    }

    const tenantId = attempt.tenantId;
    const sessionId = attempt.studySessionId;
    const targetConceptId = conceptIds[0];

    const logs = await Promise.all(picked.map((p) =>
      this.prisma.recommendationLog.create({
        data: {
          userId, sessionId, tenantId,
          recommendedProblemId: p.problem.id,
          recommendationType: RecommendationType.SIMILAR_PROBLEM,
          reason: this.buildReason(p.problem, errorCodes),
          targetConceptId,
          targetErrorCode: (errorCodes[0] as any) ?? null,
          expectedDifficulty: p.problem.difficultyLevel,
        },
      })
    ));

    const items = picked.map((p, i) => ({
      problemId: p.problem.id,
      reason: logs[i].reason,
      recommendationLogId: logs[i].id,
    }));

    return {
      items,
      requested: TARGET_COUNT,
      returned: items.length,
      ...(items.length < TARGET_COUNT && {
        shortfallReason: `해당 개념(${conceptIds.length}개)의 적정 난이도 후보가 ${candidates.length}개 — 5개를 모두 채우지 못했습니다.`,
      }),
    };
  }

  private buildReason(problem: { commonErrorCodes: string[] }, errorCodes: string[]): string {
    const shared = errorCodes.filter((ec) => problem.commonErrorCodes.includes(ec));
    if (shared.length > 0) {
      return `같은 개념이고 ${shared.join(', ')} 오류를 교정하기 위한 문제입니다.`;
    }
    return '같은 개념을 다른 표현으로 다시 풀어보는 문제입니다.';
  }
}
