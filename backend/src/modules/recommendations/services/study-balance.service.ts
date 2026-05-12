import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { Lang } from '../../../common/i18n/current-lang.decorator';
import { UNIT_NAME_EN } from '../../../common/i18n/content-en';
import { UNIT_NAME_HI } from '../../../common/i18n/content-hi';

/**
 * 단원별 공부 시간 균형 분석 — Phase 2 핵심.
 *
 * 데이터 원천:
 *   - MasterySnapshot.studyTimeMin (StudySession.endSession 시 누적)
 *   - MasterySnapshot.score        (BKT 갱신)
 *   - MasterySnapshot.samples      (신뢰도 게이트)
 *
 * 출력:
 *   - 단원별 시간 분포 (heatmap/bar용)
 *   - 지니계수: 학습 시간 불평등도 (0=균형, 1=완전 편중)
 *   - 부족학습 단원: 시간↓ AND mastery↓
 *   - 저효율 단원:   시간↑ BUT mastery↓
 *   - 경고 메시지 (lang 별)
 */

export interface UnitBalance {
  unitId: string;
  unitName: string;
  order: number;
  score: number;          // 0~100
  studyTimeMin: number;
  samples: number;
  efficiency: number | null;  // score / studyTimeMin (시간당 숙련도 증가)
}

export interface StudyBalanceResult {
  gini: number;
  balanced: boolean;
  totalStudyMin: number;
  perUnit: UnitBalance[];
  underStudied: UnitBalance[];   // 더 학습 필요
  lowEfficiency: UnitBalance[];  // 학습법 변경 필요
  warnings: string[];
}

function localize(name: string, lang: Lang): string {
  if (lang === 'hi') return UNIT_NAME_HI[name] ?? UNIT_NAME_EN[name] ?? name;
  if (lang === 'en') return UNIT_NAME_EN[name] ?? name;
  return name;
}

/**
 * 지니계수 — 정렬된 시리즈에서 0~1 사이 불평등도.
 * 모든 값이 같으면 0. 한 단원에만 시간 몰리면 1에 가까움.
 */
function computeGini(values: number[]): number {
  if (values.length === 0) return 0;
  const sum = values.reduce((s, v) => s + v, 0);
  if (sum === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;
  let weighted = 0;
  for (let i = 0; i < n; i++) weighted += (i + 1) * sorted[i];
  return (2 * weighted) / (n * sum) - (n + 1) / n;
}

const WARN_KO = {
  imbalance: '학습 시간이 일부 단원에 편중되어 있어요',
  under: (n: number) => `충분히 학습되지 않은 단원이 ${n}개 있어요`,
  lowEff: (n: number) => `시간 대비 효율이 낮은 단원이 ${n}개 — 학습법 변경을 권합니다`,
};
const WARN_EN = {
  imbalance: 'Your study time is skewed toward a few units',
  under: (n: number) => `${n} unit(s) have not received enough practice`,
  lowEff: (n: number) => `${n} unit(s) show low efficiency — consider changing your approach`,
};
const WARN_HI = {
  imbalance: 'आपका अध्ययन समय कुछ ही अध्यायों में केंद्रित है',
  under: (n: number) => `${n} अध्याय में पर्याप्त अभ्यास नहीं हुआ है`,
  lowEff: (n: number) => `${n} अध्याय में समय की तुलना में दक्षता कम है — विधि बदलने पर विचार करें`,
};

@Injectable()
export class StudyBalanceService {
  constructor(private readonly prisma: PrismaService) {}

  async analyze(userId: string, lang: Lang = 'en'): Promise<StudyBalanceResult> {
    const snapshots = await this.prisma.masterySnapshot.findMany({
      where: { userId },
      include: { unit: { select: { name: true, order: true } } },
      orderBy: { unit: { order: 'asc' } },
    });

    const perUnit: UnitBalance[] = snapshots.map((s) => {
      const t = s.studyTimeMin;
      const efficiency = t > 0 ? Math.round((s.score / t) * 100) / 100 : null;
      return {
        unitId: s.unitId,
        unitName: localize(s.unit.name, lang),
        order: s.unit.order,
        score: Math.round(s.score),
        studyTimeMin: t,
        samples: s.samples,
        efficiency,
      };
    });

    const times = perUnit.map((u) => u.studyTimeMin);
    const totalStudyMin = times.reduce((s, t) => s + t, 0);
    const gini = computeGini(times);

    // 부족학습: 시간 30분 미만 AND mastery 60 미만 AND 표본 5 미만
    const underStudied = perUnit
      .filter((u) => u.studyTimeMin < 30 && u.score < 60 && u.samples < 5)
      .sort((a, b) => a.score - b.score)
      .slice(0, 5);

    // 저효율: 시간 90분 이상이지만 mastery 65 미만 (시간을 썼는데 안 늘었음)
    const lowEfficiency = perUnit
      .filter((u) => u.studyTimeMin >= 90 && u.score < 65)
      .sort((a, b) => (b.studyTimeMin - 2 * b.score) - (a.studyTimeMin - 2 * a.score))
      .slice(0, 3);

    const W = lang === 'ko' ? WARN_KO : lang === 'hi' ? WARN_HI : WARN_EN;
    const warnings: string[] = [];
    if (gini > 0.5) warnings.push(W.imbalance);
    if (underStudied.length >= 3) warnings.push(W.under(underStudied.length));
    if (lowEfficiency.length > 0) warnings.push(W.lowEff(lowEfficiency.length));

    return {
      gini: Math.round(gini * 1000) / 1000,
      balanced: gini < 0.4,
      totalStudyMin,
      perUnit,
      underStudied,
      lowEfficiency,
      warnings,
    };
  }
}
