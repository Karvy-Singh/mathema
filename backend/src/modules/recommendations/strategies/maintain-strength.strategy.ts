import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';

/**
 * "강점 유지" — MasterySnapshot 최상위 단원을 추천.
 * 80% 이상 단원이 있을 때만 의미 있음 (없으면 null).
 */
@Injectable()
export class MaintainStrengthStrategy {
  constructor(private readonly prisma: PrismaService) {}

  async recommend(userId: string, excludeUnitIds: string[] = []) {
    const masteries = await this.prisma.masterySnapshot.findMany({
      where: { userId, ...(excludeUnitIds.length ? { unitId: { notIn: excludeUnitIds } } : {}) },
      include: { unit: true },
      orderBy: { score: 'desc' },
    });

    if (masteries.length === 0) return null;
    const top = masteries[0];
    if (top.score < 70) return null; // 강점이라 부르기엔 부족

    const score = Math.round(top.score);

    return {
      tag: '강점 유지',
      tagColor: '#4A5D3A',
      unitId: top.unitId,
      unit: `${top.unit.name} · 실전 응용`,
      title: `${top.unit.name} 실전 모의고사 도전`,
      reason: `숙련도 ${score}% 유지·심화를 위해`,
      time: '45분',
      type: '실전 문제',
      icon: 'Zap',
    };
  }
}
