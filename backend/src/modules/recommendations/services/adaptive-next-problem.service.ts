import { Injectable, Logger } from '@nestjs/common';
import { ErrorPatternStatus, RecommendationType } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';

/**
 * AdaptiveNextProblemService — 명세서 §4 Flow 7 (다음 문제 1개 추천).
 *
 *   선택 기준 (우선순위 순):
 *     1) masteryScore 가 낮은 concept 우선
 *     2) ACTIVE error pattern 이 있는 concept 우선
 *     3) prerequisite concept 가 약하면 하위 개념 문제 우선
 *     4) 너무 쉬운 / 너무 어려운 문제 제외
 *     5) 최근에 추천했지만 풀지 않은 문제 제외 (24h)
 *     6) 같은 문제 반복 추천 금지 (최근 48h)
 *     7) 예상 성공률 60~80% 구간 (flow state) — difficultyLevel vs masteryScore
 *
 *   결과는 RecommendationLog 1 row 로 저장 (recommendationType=ADAPTIVE_NEXT).
 *   학생이 그 문제를 풀면 attempts 흐름에서 result 가 회수된다.
 *
 *   호출처: GET /students/:id/next-problem, study-sessions/start (Phase 후속).
 */

interface PickResult {
  problemId: string;
  reason: string;
  targetConceptId: string;
  targetErrorCode: string | null;
  expectedDifficulty: number;
}

@Injectable()
export class AdaptiveNextProblemService {
  private readonly logger = new Logger(AdaptiveNextProblemService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * 다음 문제 1개 추천 + RecommendationLog 저장.
   * 데이터 부족 (mastery 0건 등) 이면 null.
   */
  async getNext(userId: string, opts: { sessionId?: string } = {}): Promise<{
    problemId: string;
    reason: string;
    targetConceptId: string;
    targetErrorCode: string | null;
    expectedDifficulty: number;
    recommendationLogId: string;
  } | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId }, select: { tenantId: true, gradeLevel: true },
    });
    if (!user) return null;

    // 1) 약한 concept 후보 — mastery 낮은 순. 표본 부족(<3) 도 우선순위 낮음.
    const trajectories = await this.prisma.masteryTrajectory.findMany({
      where: { userId },
      orderBy: [{ masteryScore: 'asc' }, { evidenceCount: 'desc' }],
      take: 10,
    });

    // mastery 0건이면 학년 기준 첫 Concept 의 첫 문제 추천 (cold start).
    if (trajectories.length === 0) {
      return this.coldStart(userId, user.gradeLevel ?? null, user.tenantId, opts.sessionId);
    }

    // 2) ACTIVE error pattern 이 있는 concept 우선.
    const activePatterns = await this.prisma.errorPatternProfile.findMany({
      where: { userId, status: ErrorPatternStatus.ACTIVE },
      orderBy: [{ severity: 'desc' }, { recentFrequency: 'desc' }],
      take: 5,
    });
    const activeConceptIds = new Set(activePatterns.map((p) => p.conceptId));

    // 3) prerequisite 약점 확인 — 약한 concept 의 prerequisite 가 더 약하면 그쪽 우선.
    // 명시적으로 userId 전달 (사용자 격리 — cross-user 누출 방지).
    const candidateConcepts = await this.expandWithPrerequisites(userId, trajectories);

    // 4~7) 각 candidate concept 에 대해 적절한 Problem 찾기.
    for (const cand of candidateConcepts) {
      const pick = await this.pickProblemForConcept(userId, cand.conceptId, cand.masteryScore);
      if (!pick) continue;

      // ACTIVE error pattern 의 targetErrorCode 선택 (있으면).
      const pattern = activePatterns.find((p) => p.conceptId === cand.conceptId);
      const targetErrorCode = pattern?.errorCode ?? null;

      const reason = this.buildReason(cand, pattern, pick.difficultyLevel);

      // RecommendationLog 저장.
      const log = await this.prisma.recommendationLog.create({
        data: {
          userId,
          sessionId: opts.sessionId ?? null,
          tenantId: user.tenantId,
          recommendedProblemId: pick.problemId,
          recommendationType: RecommendationType.ADAPTIVE_NEXT,
          reason,
          targetConceptId: cand.conceptId,
          targetErrorCode: (targetErrorCode as any) ?? null,
          expectedDifficulty: pick.difficultyLevel,
        },
      });

      return {
        problemId: pick.problemId,
        reason,
        targetConceptId: cand.conceptId,
        targetErrorCode,
        expectedDifficulty: pick.difficultyLevel,
        recommendationLogId: log.id,
      };
    }

    this.logger.warn(`getNext: no suitable problem for userId=${userId}`);
    return null;
  }

  /**
   * cold start — mastery 데이터 0건 사용자.
   * 학년 기준 첫 Concept 의 가장 쉬운 문제.
   */
  private async coldStart(userId: string, gradeLevel: string | null, tenantId: string | null, sessionId?: string) {
    const concept = await this.prisma.concept.findFirst({
      where: gradeLevel ? { gradeLevel: gradeLevel as any } : {},
      orderBy: { code: 'asc' },
    });
    if (!concept) return null;

    const problem = await this.prisma.problem.findFirst({
      where: { concepts: { some: { conceptId: concept.id } } },
      orderBy: { difficultyLevel: 'asc' },
    });
    if (!problem) return null;

    const log = await this.prisma.recommendationLog.create({
      data: {
        userId, sessionId: sessionId ?? null, tenantId,
        recommendedProblemId: problem.id,
        recommendationType: RecommendationType.ADAPTIVE_NEXT,
        reason: `학습 데이터를 모으는 중이에요. ${concept.name} 의 가장 기본 문제로 시작합니다.`,
        targetConceptId: concept.id,
        expectedDifficulty: problem.difficultyLevel,
      },
    });

    return {
      problemId: problem.id,
      reason: log.reason,
      targetConceptId: concept.id,
      targetErrorCode: null,
      expectedDifficulty: problem.difficultyLevel,
      recommendationLogId: log.id,
    };
  }

  /**
   * 약한 concept 의 prerequisite 가 더 약하면 그것을 우선 후보로.
   *
   * 사용자 격리 — userId 를 명시적 파라미터로 받아 prerequisite mastery 조회 시
   * where 절에 항상 동일 userId 를 강제. cross-user mastery 누출 방지.
   */
  private async expandWithPrerequisites(
    userId: string,
    trajectories: Array<{ conceptId: string; masteryScore: number; evidenceCount: number }>,
  ): Promise<Array<{ conceptId: string; masteryScore: number; reason: 'weak' | 'prerequisite' }>> {
    if (!userId) throw new Error('expandWithPrerequisites: userId is required');
    const result: Array<{ conceptId: string; masteryScore: number; reason: 'weak' | 'prerequisite' }> = [];
    for (const t of trajectories) {
      const concept = await this.prisma.concept.findUnique({
        where: { id: t.conceptId },
        select: { prerequisiteConceptIds: true },
      });
      if (!concept) continue;

      // prerequisite 의 mastery 가 더 낮으면 그쪽 우선. userId 필터 고정.
      if (concept.prerequisiteConceptIds.length > 0) {
        const preTrajectories = await this.prisma.masteryTrajectory.findMany({
          where: { userId, conceptId: { in: concept.prerequisiteConceptIds } },
        });
        for (const pre of preTrajectories) {
          if (pre.masteryScore < t.masteryScore - 10) {
            // 적어도 10점 차이로 더 약하면 prerequisite 진입.
            result.push({ conceptId: pre.conceptId, masteryScore: pre.masteryScore, reason: 'prerequisite' });
          }
        }
      }
      result.push({ conceptId: t.conceptId, masteryScore: t.masteryScore, reason: 'weak' });
    }
    // 중복 제거 + mastery 낮은 순.
    const seen = new Set<string>();
    return result.filter((c) => {
      if (seen.has(c.conceptId)) return false;
      seen.add(c.conceptId);
      return true;
    }).sort((a, b) => a.masteryScore - b.masteryScore);
  }

  /**
   * 한 concept 안에서 적합한 Problem 1개.
   *   - 최근 48h 내 같은 problem 추천 X
   *   - 최근 24h 내 추천했지만 안 푼 problem X
   *   - flow state: difficultyLevel ≈ masteryScore/20+1 (60~80% 성공률 구간)
   */
  private async pickProblemForConcept(userId: string, conceptId: string, masteryScore: number): Promise<{
    problemId: string;
    difficultyLevel: number;
  } | null> {
    // 목표 난이도 = mastery 0→1, 20→2, 40→3, 60→4, 80→5. clamp 1~5.
    const target = Math.max(1, Math.min(5, Math.round(masteryScore / 20) + 1));

    // 최근 추천했지만 안 푼 problem id 들 (24h).
    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentUnsolved = await this.prisma.recommendationLog.findMany({
      where: { userId, accepted: false, createdAt: { gte: since24h } },
      select: { recommendedProblemId: true },
    });

    // 최근 추천 problem (48h, accepted 무관 — 반복 추천 금지).
    const since48h = new Date(Date.now() - 48 * 60 * 60 * 1000);
    const recentRecommended = await this.prisma.recommendationLog.findMany({
      where: { userId, createdAt: { gte: since48h } },
      select: { recommendedProblemId: true },
    });

    const excludeIds = new Set([
      ...recentUnsolved.map((r) => r.recommendedProblemId),
      ...recentRecommended.map((r) => r.recommendedProblemId),
    ]);

    // target 난이도 ±1 우선, 없으면 ±2.
    for (const drift of [0, 1, -1, 2, -2]) {
      const level = Math.max(1, Math.min(5, target + drift));
      const problem = await this.prisma.problem.findFirst({
        where: {
          difficultyLevel: level,
          concepts: { some: { conceptId } },
          id: { notIn: Array.from(excludeIds) },
        },
        orderBy: { updatedAt: 'desc' },
      });
      if (problem) return { problemId: problem.id, difficultyLevel: problem.difficultyLevel };
    }
    return null;
  }

  /**
   * 명세서 §6-2 합격 예시 — 구체 수치 포함:
   *   "최근 5회 중 SIGN 오류가 3회 발생했고, 현재 masteryScore가 62점이므로 중간 난이도(3) 문제를 추천합니다."
   */
  private buildReason(
    cand: { conceptId: string; masteryScore: number; reason: 'weak' | 'prerequisite' },
    pattern: { errorCode: string; recentFrequency: number; frequency: number } | undefined,
    difficulty: number,
  ): string {
    const score = Math.round(cand.masteryScore);
    if (cand.reason === 'prerequisite') {
      return `이 단원의 선수 개념이 ${score}% 로 약해, 난이도 ${difficulty}/5 문제로 먼저 다집니다.`;
    }
    if (pattern) {
      return `최근 5회 중 ${pattern.errorCode} 오류가 ${pattern.recentFrequency}회 발생했고, ` +
        `현재 masteryScore가 ${score}점이므로 난이도 ${difficulty}/5 문제를 추천합니다.`;
    }
    return `이 개념의 masteryScore가 ${score}점 — 난이도 ${difficulty}/5 문제로 보강합니다.`;
  }

  /** 추천 결과 회수 — POST /recommendations/:id/result. */
  async recordResult(recommendationLogId: string, payload: {
    accepted?: boolean;
    solved?: boolean;
    result?: 'CORRECT' | 'INCORRECT' | 'SKIPPED';
  }) {
    return this.prisma.recommendationLog.update({
      where: { id: recommendationLogId },
      data: {
        accepted: payload.accepted ?? undefined,
        solved: payload.solved ?? undefined,
        result: (payload.result as any) ?? undefined,
      },
    });
  }
}
