import { Injectable, Logger } from '@nestjs/common';
import { MasteryTrend, MasteryUpdateSource, Prisma } from '@prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

/**
 * MasteryTrajectoryService — 개념(Concept) 단위 숙련도 갱신.
 *
 *   요구사항 명세서 Flow 4 (Mastery 업데이트) 의 공식을 구현:
 *
 *     base = previousMasteryScore
 *     delta += isCorrect ? +5 : -6
 *     delta += hintUsed ? -2 : 0
 *     delta += responseTime > expected ? -1 : 0
 *     delta += (difficultyLevel >= 4 && isCorrect) ? +2 : 0
 *     delta += repeatedErrorPattern ACTIVE ? -2 : 0
 *     newMasteryScore = clamp(base + delta, 0, 100)
 *
 *   추가:
 *     - evidenceCount += 1
 *     - recentAccuracy: 최근 10 attempt 정답률 (windowed)
 *     - averageResponseTimeSec / hintUsageRate: 평균 갱신
 *     - confidenceGap: |confidence - isCorrect*100| (overconfidence 측정)
 *     - trend: 직전 5 MasteryEvent 의 delta 합산 부호로 결정
 *     - MasteryEvent 한 row 기록 (시계열)
 *
 *   호출처:
 *     - AttemptCompletedListener — attempt.completed 이벤트
 *     - LLMAnalysisService — LLM 검증 결과로 errorCodes 가 갱신되면 재계산
 *     - TeacherOverrideService — 강사 수정 시 updatedBy=TEACHER_OVERRIDE
 */

export interface MasteryUpdateInput {
  userId: string;
  conceptId: string;
  tenantId?: string | null;
  attemptId?: string | null;
  isCorrect: boolean;
  durationSec: number;
  expectedTimeSec?: number | null;
  hintUsed: boolean;
  difficultyLevel: number;            // 1~5
  confidence?: number | null;         // 0~100
  hasActiveErrorPattern: boolean;     // ErrorPatternProfile.status=ACTIVE 존재 여부
  source: MasteryUpdateSource;
}

@Injectable()
export class MasteryTrajectoryService {
  private readonly logger = new Logger(MasteryTrajectoryService.name);

  constructor(private readonly prisma: PrismaService) {}

  async updateAfterAttempt(input: MasteryUpdateInput): Promise<{ score: number; delta: number }> {
    const existing = await this.prisma.masteryTrajectory.findUnique({
      where: { userId_conceptId: { userId: input.userId, conceptId: input.conceptId } },
    });

    const prevScore = existing?.masteryScore ?? 50;       // 초기 사전확률 50 (Bayesian uninformative prior)
    let delta = 0;

    delta += input.isCorrect ? 5 : -6;
    if (input.hintUsed) delta -= 2;
    if (input.expectedTimeSec && input.durationSec > input.expectedTimeSec) delta -= 1;
    if (input.difficultyLevel >= 4 && input.isCorrect) delta += 2;
    if (input.hasActiveErrorPattern) delta -= 2;

    const nextScore = Math.max(0, Math.min(100, prevScore + delta));

    // recentAccuracy 갱신 — 최근 10 attempt window (대상 concept 의 attempt 만)
    // Phase 1 단순화: 새 정답률을 이동평균으로 부드럽게 — α=0.2.
    const prevAcc = existing?.recentAccuracy ?? 0.5;
    const recentAccuracy = prevAcc * 0.8 + (input.isCorrect ? 1 : 0) * 0.2;

    // averageResponseTimeSec — 단순 이동평균.
    const prevAvgT = existing?.averageResponseTimeSec ?? input.durationSec;
    const averageResponseTimeSec = Math.round(prevAvgT * 0.8 + input.durationSec * 0.2);

    // hintUsageRate.
    const prevHint = existing?.hintUsageRate ?? 0;
    const hintUsageRate = prevHint * 0.8 + (input.hintUsed ? 1 : 0) * 0.2;

    // confidenceGap — confidence(0~100) vs 실제 정답(0/100)의 |차이|.
    let confidenceGap = existing?.confidenceGap ?? 0;
    if (typeof input.confidence === 'number') {
      const truth = input.isCorrect ? 100 : 0;
      const gap = Math.abs(input.confidence - truth);
      confidenceGap = confidenceGap * 0.8 + gap * 0.2;
    }

    // trend — 직전 5 MasteryEvent 의 delta 합산 부호.
    const recentEvents = await this.prisma.masteryEvent.findMany({
      where: { userId: input.userId, conceptId: input.conceptId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { delta: true },
    });
    const sumDelta = recentEvents.reduce((s, e) => s + e.delta, 0) + delta;
    let trend: MasteryTrend = MasteryTrend.STABLE;
    if (sumDelta > 3) trend = MasteryTrend.UP;
    else if (sumDelta < -3) trend = MasteryTrend.DOWN;

    const evidenceCount = (existing?.evidenceCount ?? 0) + 1;

    await this.prisma.$transaction([
      // 1) MasteryTrajectory upsert.
      this.prisma.masteryTrajectory.upsert({
        where: { userId_conceptId: { userId: input.userId, conceptId: input.conceptId } },
        update: {
          masteryScore: nextScore,
          recentAccuracy,
          averageResponseTimeSec,
          hintUsageRate,
          confidenceGap,
          trend,
          evidenceCount,
          lastAttemptAt: new Date(),
          updatedBy: input.source,
        },
        create: {
          userId: input.userId,
          conceptId: input.conceptId,
          tenantId: input.tenantId ?? null,
          masteryScore: nextScore,
          recentAccuracy,
          averageResponseTimeSec,
          hintUsageRate,
          confidenceGap,
          trend,
          evidenceCount,
          lastAttemptAt: new Date(),
          updatedBy: input.source,
        },
      }),
      // 2) MasteryEvent 시계열 1 row.
      this.prisma.masteryEvent.create({
        data: {
          userId: input.userId,
          conceptId: input.conceptId,
          tenantId: input.tenantId ?? null,
          attemptId: input.attemptId ?? null,
          masteryScore: nextScore,
          delta,
          evidenceCount,
        },
      }),
    ]);

    return { score: nextScore, delta };
  }

  /** 학생의 모든 MasteryTrajectory 조회 (UI heatmap 용). */
  async getAllForUser(userId: string) {
    return this.prisma.masteryTrajectory.findMany({
      where: { userId },
      include: { concept: { select: { id: true, code: true, name: true, gradeLevel: true } } },
      orderBy: { masteryScore: 'asc' },
    });
  }

  /** 특정 concept 의 시계열 (그래프 용). */
  async getHistory(userId: string, conceptId: string, take = 30) {
    return this.prisma.masteryEvent.findMany({
      where: { userId, conceptId },
      orderBy: { createdAt: 'desc' },
      take,
    });
  }
}
