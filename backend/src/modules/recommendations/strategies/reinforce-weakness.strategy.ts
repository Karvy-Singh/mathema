import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { Lang } from '../../../common/i18n/current-lang.decorator';
import { UNIT_NAME_EN, RECOMMENDATION_EN } from '../../../common/i18n/content-en';
import { UNIT_NAME_HI, RECOMMENDATION_HI } from '../../../common/i18n/content-hi';

/**
 * "약점 보강" — MasterySnapshot 점수가 가장 낮은 단원을 추천.
 */
@Injectable()
export class ReinforceWeaknessStrategy {
  private static readonly PEER_AVG = 71;
  constructor(private readonly prisma: PrismaService) {}

  async recommend(userId: string, excludeUnitIds: string[] = [], lang: Lang = 'ko') {
    const masteries = await this.prisma.masterySnapshot.findMany({
      where: { userId, ...(excludeUnitIds.length ? { unitId: { notIn: excludeUnitIds } } : {}) },
      include: { unit: true },
      orderBy: { score: 'asc' },
    });

    if (masteries.length === 0) return null;

    const weakest = masteries[0];
    const score = Math.round(weakest.score);
    const gap = ReinforceWeaknessStrategy.PEER_AVG - score;

    if (lang !== 'ko') {
      const D = lang === 'hi' ? RECOMMENDATION_HI : RECOMMENDATION_EN;
      const unitLocal = lang === 'hi'
        ? (UNIT_NAME_HI[weakest.unit.name] ?? UNIT_NAME_EN[weakest.unit.name] ?? weakest.unit.name)
        : (UNIT_NAME_EN[weakest.unit.name] ?? weakest.unit.name);
      return {
        tag: D.tagWeak,
        tagColor: '#B45309',
        unitId: weakest.unitId,
        unit: D.weakUnit(unitLocal),
        title: D.weakTitle(unitLocal),
        reason: gap > 0 ? D.weakReasonGap(score, gap) : D.weakReasonStable(score),
        time: this.estimateTime(score, lang),
        type: lang === 'hi' ? 'दृश्यांकन' : 'Visualization',
        icon: 'Eye',
      };
    }
    return {
      tag: '약점 보강',
      tagColor: '#B45309',
      unitId: weakest.unitId,
      unit: `${weakest.unit.name} · 핵심 개념`,
      title: `${weakest.unit.name} 직관적 이해`,
      reason: gap > 0
        ? `숙련도 ${score}% — 또래 평균 대비 ${gap}%p 낮음`
        : `숙련도 ${score}% — 안정 단계로 끌어올리기`,
      time: this.estimateTime(score, lang),
      type: '시각화 영상',
      icon: 'Eye',
    };
  }

  private estimateTime(score: number, lang: Lang = 'ko'): string {
    if (lang === 'hi') {
      if (score < 40) return '30 मिनट';
      if (score < 60) return '20 मिनट';
      return '15 मिनट';
    }
    if (lang !== 'ko') {
      if (score < 40) return '30 min';
      if (score < 60) return '20 min';
      return '15 min';
    }
    if (score < 40) return '30분';
    if (score < 60) return '20분';
    return '15분';
  }
}
