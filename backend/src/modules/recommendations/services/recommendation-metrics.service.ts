import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';

/**
 * RecommendationMetricsService — 추천 품질 KPI.
 *
 *   1000명 PoC 에서 추천 엔진이 실제로 의미 있는지 확인하기 위한 지표:
 *     - acceptRate         : 추천 후 풀이 진입율 (accepted/total)
 *     - solveRate          : 추천 풀이 완료율 (solved/accepted)
 *     - correctRate        : 추천 후 정답률 (CORRECT / (CORRECT+INCORRECT))
 *     - duplicateRate      : 같은 문제 중복 추천율
 *     - sameConceptStreak  : 같은 concept 연속 추천 평균 길이
 *     - postRecAcc         : 추천 후 다음 3 attempts 평균 정답률
 *     - skipRate           : SKIPPED 비율
 *     - dropoffRate        : accepted=false / 추천 후 24h 내 활동 없음 비율
 *
 *   /api/v1/recommendations/metrics?days=7
 *     - 본인 데이터 / TEACHER 면 같은 tenant 합산 (Phase 후속).
 */
@Injectable()
export class RecommendationMetricsService {
  constructor(private readonly prisma: PrismaService) {}

  async forUser(userId: string, days = 7) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const logs = await this.prisma.recommendationLog.findMany({
      where: { userId, createdAt: { gte: since } },
      orderBy: { createdAt: 'asc' },
    });

    const total = logs.length;
    if (total === 0) {
      return {
        total: 0, days,
        acceptRate: null, solveRate: null, correctRate: null,
        duplicateRate: null, sameConceptStreak: null,
        postRecAcc: null, skipRate: null, dropoffRate: null,
      };
    }

    const accepted = logs.filter((r) => r.accepted).length;
    const solved   = logs.filter((r) => r.solved).length;
    const correct  = logs.filter((r) => r.result === 'CORRECT').length;
    const incorrect= logs.filter((r) => r.result === 'INCORRECT').length;
    const skipped  = logs.filter((r) => r.result === 'SKIPPED').length;

    // duplicateRate — 같은 problemId 가 두 번 이상 추천된 비율.
    const byProblem = new Map<string, number>();
    for (const r of logs) byProblem.set(r.recommendedProblemId, (byProblem.get(r.recommendedProblemId) ?? 0) + 1);
    const duplicatePicks = [...byProblem.values()].reduce((s, n) => s + (n - 1), 0);
    const duplicateRate = duplicatePicks / total;

    // sameConceptStreak — 시간순으로 정렬한 logs 에서 연속된 같은 targetConceptId 묶음 평균.
    let streaks: number[] = [];
    let cur = 1;
    for (let i = 1; i < logs.length; i++) {
      if (logs[i].targetConceptId && logs[i].targetConceptId === logs[i - 1].targetConceptId) {
        cur++;
      } else {
        streaks.push(cur);
        cur = 1;
      }
    }
    streaks.push(cur);
    const sameConceptStreak = streaks.reduce((s, n) => s + n, 0) / streaks.length;

    // dropoffRate — accepted=false 비율. (24h 활동 추적은 attempt 조회 별도)
    const dropoff = logs.filter((r) => !r.accepted).length;

    // postRecAcc — 추천이 accepted 된 시점 이후 다음 3 attempts 의 정답률.
    let postRecCorrect = 0;
    let postRecTotal = 0;
    for (const r of logs.filter((l) => l.accepted)) {
      const next3 = await this.prisma.attempt.findMany({
        where: { userId, createdAt: { gt: r.createdAt } },
        orderBy: { createdAt: 'asc' },
        take: 3,
        select: { isCorrect: true },
      });
      postRecTotal += next3.length;
      postRecCorrect += next3.filter((a) => a.isCorrect).length;
    }

    const round = (n: number) => Math.round(n * 1000) / 1000;
    return {
      total, days,
      acceptRate:   round(accepted / total),
      solveRate:    accepted > 0 ? round(solved / accepted) : null,
      correctRate:  (correct + incorrect) > 0 ? round(correct / (correct + incorrect)) : null,
      duplicateRate: round(duplicateRate),
      sameConceptStreak: round(sameConceptStreak),
      postRecAcc:   postRecTotal > 0 ? round(postRecCorrect / postRecTotal) : null,
      skipRate:     round(skipped / total),
      dropoffRate:  round(dropoff / total),
    };
  }
}
