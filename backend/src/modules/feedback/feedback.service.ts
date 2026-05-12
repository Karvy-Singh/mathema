import { Injectable } from '@nestjs/common';
import { FeedbackRaterType, FeedbackTargetType } from '@prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

/**
 * FeedbackService — 명세서 §3 Feedback / §5 POST /feedback.
 *   학생 / 강사 / 학부모 / 관리자 4종 raterType. 같은 1~5점이라도 의미 다름.
 *   AI 산출물(insight / weeklyReport / next-problem / explanation) 에 대한 평가.
 */
@Injectable()
export class FeedbackService {
  constructor(private readonly prisma: PrismaService) {}

  create(input: {
    raterId: string;
    raterType: FeedbackRaterType;
    targetType: FeedbackTargetType;
    targetId: string;
    aiInsightRating: number;     // 1~5
    comment?: string;
  }) {
    return this.prisma.feedback.create({
      data: {
        raterId: input.raterId,
        raterType: input.raterType,
        targetType: input.targetType,
        targetId: input.targetId,
        aiInsightRating: Math.max(1, Math.min(5, Math.round(input.aiInsightRating))),
        comment: input.comment ?? null,
      },
    });
  }

  /** 특정 AI 산출물에 대한 모든 피드백 (관리자/품질 분석용). */
  listForTarget(targetType: FeedbackTargetType, targetId: string) {
    return this.prisma.feedback.findMany({
      where: { targetType, targetId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** raterType 별 평균 점수 (대시보드 카드용). */
  async averageByRater(targetType: FeedbackTargetType, targetId: string) {
    const rows = await this.prisma.feedback.findMany({
      where: { targetType, targetId },
      select: { raterType: true, aiInsightRating: true },
    });
    const buckets = new Map<FeedbackRaterType, number[]>();
    for (const r of rows) {
      const arr = buckets.get(r.raterType) ?? [];
      arr.push(r.aiInsightRating);
      buckets.set(r.raterType, arr);
    }
    const result: Record<string, { avg: number; count: number }> = {};
    for (const [k, vs] of buckets.entries()) {
      result[k] = { avg: Math.round((vs.reduce((s, x) => s + x, 0) / vs.length) * 10) / 10, count: vs.length };
    }
    return result;
  }
}
