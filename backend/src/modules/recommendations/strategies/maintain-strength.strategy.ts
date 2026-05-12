import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { Lang } from '../../../common/i18n/current-lang.decorator';
import { UNIT_NAME_EN, RECOMMENDATION_EN } from '../../../common/i18n/content-en';
import { UNIT_NAME_HI, RECOMMENDATION_HI } from '../../../common/i18n/content-hi';

/**
 * "강점 유지" — MasterySnapshot 최상위 단원을 추천.
 */
@Injectable()
export class MaintainStrengthStrategy {
  constructor(private readonly prisma: PrismaService) {}

  async recommend(userId: string, excludeUnitIds: string[] = [], lang: Lang = 'ko') {
    const masteries = await this.prisma.masterySnapshot.findMany({
      where: { userId, ...(excludeUnitIds.length ? { unitId: { notIn: excludeUnitIds } } : {}) },
      include: { unit: true },
      orderBy: { score: 'desc' },
    });

    if (masteries.length === 0) return null;
    const top = masteries[0];
    if (top.score < 70) return null; // 강점이라 부르기엔 부족

    const score = Math.round(top.score);

    if (lang !== 'ko') {
      const D = lang === 'hi' ? RECOMMENDATION_HI : RECOMMENDATION_EN;
      const unitLocal = lang === 'hi'
        ? (UNIT_NAME_HI[top.unit.name] ?? UNIT_NAME_EN[top.unit.name] ?? top.unit.name)
        : (UNIT_NAME_EN[top.unit.name] ?? top.unit.name);
      return {
        tag: D.tagStrong,
        tagColor: '#4A5D3A',
        unitId: top.unitId,
        unit: D.strongUnit(unitLocal),
        title: D.strongTitle(unitLocal),
        reason: D.strongReason(score),
        time: lang === 'hi' ? '45 मिनट' : '45 min',
        type: lang === 'hi' ? 'अभ्यास' : 'Practice',
        icon: 'Zap',
      };
    }
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
