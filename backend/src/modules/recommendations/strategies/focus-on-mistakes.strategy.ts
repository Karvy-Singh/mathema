import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { Lang } from '../../../common/i18n/current-lang.decorator';
import { UNIT_NAME_EN, SUB_UNIT_NAME_EN, RECOMMENDATION_EN } from '../../../common/i18n/content-en';

/**
 * "오답 집중" — 마스터되지 않은 오답이 가장 많이 누적된 단원을 추천.
 */
@Injectable()
export class FocusOnMistakesStrategy {
  constructor(private readonly prisma: PrismaService) {}

  async recommend(userId: string, lang: Lang = 'ko') {
    const notes = await this.prisma.wrongNote.findMany({
      where: { userId, status: { not: 'MASTERED' } },
      include: { problem: { include: { unit: true, subUnit: true } } },
      orderBy: { updatedAt: 'desc' },
    });

    if (notes.length === 0) {
      return null;
    }

    const buckets = new Map<string, { occurrences: number; latestAt: Date; unitName: string; subUnitName: string; unitId: string; lastInsight: string }>();
    for (const n of notes) {
      const key = n.problem.unitId + ':' + (n.problem.subUnitId ?? '');
      const cur = buckets.get(key);
      if (cur) {
        cur.occurrences += n.occurrences;
        if (n.updatedAt > cur.latestAt) cur.latestAt = n.updatedAt;
      } else {
        buckets.set(key, {
          occurrences: n.occurrences,
          latestAt: n.updatedAt,
          unitName: n.problem.unit.name,
          subUnitName: n.problem.subUnit?.name ?? '',
          unitId: n.problem.unitId,
          lastInsight: n.insight,
        });
      }
    }

    const top = [...buckets.values()].sort((a, b) => b.occurrences - a.occurrences)[0];
    const totalNotes = notes.filter((n) => n.problem.unitId === top.unitId).length;

    if (lang === 'en') {
      const unitEn = UNIT_NAME_EN[top.unitName] ?? top.unitName;
      const subEn = SUB_UNIT_NAME_EN[top.subUnitName] ?? top.subUnitName;
      return {
        tag: RECOMMENDATION_EN.tagFocus,
        tagColor: '#8B3A1F',
        unitId: top.unitId,
        unit: RECOMMENDATION_EN.focusUnit(unitEn, subEn),
        title: top.subUnitName ? RECOMMENDATION_EN.focusTitleSub(subEn) : RECOMMENDATION_EN.focusTitleUnit(unitEn),
        reason: RECOMMENDATION_EN.focusReason(top.occurrences, totalNotes),
        time: this.estimateTime(top.occurrences, lang),
        type: 'Interactive practice',
        icon: 'Layers',
      };
    }
    return {
      tag: '오답 집중',
      tagColor: '#8B3A1F',
      unitId: top.unitId,
      unit: `${top.unitName} · ${top.subUnitName || '핵심 영역'}`,
      title: top.subUnitName ? `${top.subUnitName} 한 번에 끝내기` : `${top.unitName} 약점 보강`,
      reason: `누적 오답 ${top.occurrences}회 (${totalNotes}문제) — 즉시 보강 필요`,
      time: this.estimateTime(top.occurrences, lang),
      type: '인터랙티브 학습',
      icon: 'Layers',
    };
  }

  private estimateTime(occurrences: number, lang: Lang = 'ko'): string {
    // 한 문제 마스터 ≈ 4분 + 누적당 +2분, 최대 45분
    const min = Math.min(45, 8 + occurrences * 2);
    return lang === 'en' ? `${min} min` : `${min}분`;
  }
}
