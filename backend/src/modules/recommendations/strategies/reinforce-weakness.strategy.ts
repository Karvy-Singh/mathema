import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';

/**
 * "약점 보강" — MasterySnapshot 점수가 가장 낮은 단원을 추천.
 * 같은 백분위 학생의 평균 숙련도(상수 71%)와 비교해 격차 표시.
 */
@Injectable()
export class ReinforceWeaknessStrategy {
  private static readonly PEER_AVG = 71;
  constructor(private readonly prisma: PrismaService) {}

  async recommend(userId: string, excludeUnitIds: string[] = []) {
    const masteries = await this.prisma.masterySnapshot.findMany({
      where: { userId, ...(excludeUnitIds.length ? { unitId: { notIn: excludeUnitIds } } : {}) },
      include: { unit: true },
      orderBy: { score: 'asc' },
    });

    if (masteries.length === 0) return null;

    const weakest = masteries[0];
    const score = Math.round(weakest.score);
    const gap = ReinforceWeaknessStrategy.PEER_AVG - score;

    return {
      tag: '약점 보강',
      tagColor: '#B45309',
      unitId: weakest.unitId,
      unit: `${weakest.unit.name} · 핵심 개념`,
      title: `${weakest.unit.name} 직관적 이해`,
      reason: gap > 0
        ? `숙련도 ${score}% — 또래 평균 대비 ${gap}%p 낮음`
        : `숙련도 ${score}% — 안정 단계로 끌어올리기`,
      time: this.estimateTime(score),
      type: '시각화 영상',
      icon: 'Eye',
    };
  }

  private estimateTime(score: number): string {
    // 점수 낮을수록 더 긴 학습 권장
    if (score < 40) return '30분';
    if (score < 60) return '20분';
    return '15분';
  }
}
