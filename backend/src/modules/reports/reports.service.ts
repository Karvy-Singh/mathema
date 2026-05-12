import { Injectable } from '@nestjs/common';
import { ReportsRepository } from './reports.repository';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { Lang } from '../../common/i18n/current-lang.decorator';
import { UNIT_NAME_EN } from '../../common/i18n/content-en';

@Injectable()
export class ReportsService {
  constructor(
    private readonly repo: ReportsRepository,
    private readonly prisma: PrismaService,
  ) {}

  async current(userId: string) {
    const recent = await this.repo.recentWeeks(userId, 2);
    const r = recent[0];
    const prev = recent[1];
    if (!r) return {
      totalHours: 0, hoursDelta: 0, problemsSolved: 0, problemsPerDay: 0,
      accuracyPct: 0, accuracyDelta: 0, aiScore: 0, topPercentile: 50,
    };

    // hours/accuracy delta — 지난주가 없으면 0
    const hoursDelta = prev?.totalHours
      ? Math.round(((r.totalHours - prev.totalHours) / prev.totalHours) * 100)
      : 0;
    const accuracyDelta = prev ? Math.round(r.accuracyPct - prev.accuracyPct) : 0;

    // topPercentile — 가장 최근 모의고사 백분위 기반 (상위 %)
    const lastMock = await this.prisma.mockExamResult.findFirst({
      where: { userId }, orderBy: { takenAt: 'desc' },
    });
    const topPercentile = lastMock ? Math.max(1, 100 - lastMock.percentile) : 50;

    return {
      totalHours: r.totalHours,
      hoursDelta,
      problemsSolved: r.problemsSolved,
      problemsPerDay: Math.round(r.problemsSolved / 7),
      accuracyPct: Math.round(r.accuracyPct),
      accuracyDelta,
      aiScore: Math.round(r.aiScore * 10) / 10,
      topPercentile,
    };
  }

  async timeVsAccuracy(userId: string, weeks: number) {
    const rows = await this.repo.timeVsAccuracy(userId, weeks);
    return rows
      .sort((a: any, b: any) => +a.weekStart - +b.weekStart)
      .map((r: any, i: number) => ({
        week: `W${i + 1}`,
        time: Math.round(r.totalHours),
        accuracy: Math.round(r.accuracyPct),
      }));
  }

  async nextFocus(userId: string, lang: Lang = 'ko') {
    const masteries = await this.prisma.masterySnapshot.findMany({
      where: { userId }, include: { unit: true }, orderBy: { score: 'asc' }, take: 3,
    });
    const palette = ['#8B3A1F', '#B45309', '#A16207'];
    const isEn = lang !== 'ko';
    const priorities = isEn ? ['Top', 'High', 'Mid'] : ['최우선', '높음', '중간'];
    const impacts = isEn ? ['+8 pts est.', '+5 pts est.', '+3 pts est.'] : ['+8점 예상', '+5점 예상', '+3점 예상'];
    const fallbackPriority = isEn ? 'Mid' : '중간';
    const fallbackImpact = isEn ? '+1 pt est.' : '+1점 예상';
    const fallbackArea = isEn ? 'Weak-area review' : '약점 보강';
    const areaKo: Record<string, string> = {
      '미적분 II': '회전체의 부피', '확률·통계': '정규분포 표준화', '기하·벡터': '공간좌표 시각화',
    };
    const areaEn: Record<string, string> = {
      '미적분 II': 'Volumes of revolution',
      '확률·통계': 'Normal-distribution z-scores',
      '기하·벡터': 'Spatial coordinates',
      '미적분 I':  'Limits & derivatives',
      '함수':      'Function transformations',
    };
    return masteries.map((m, i) => ({
      unit: isEn ? (UNIT_NAME_EN[m.unit.name] ?? m.unit.name) : m.unit.name,
      area: (isEn ? areaEn[m.unit.name] : areaKo[m.unit.name]) ?? fallbackArea,
      priority: priorities[i] ?? fallbackPriority,
      color: palette[i] ?? '#A16207',
      impact: impacts[i] ?? fallbackImpact,
    }));
  }

  async achievements(userId: string, lang: Lang = 'ko') {
    const streak = await this.prisma.dailyActivity.count({
      where: { userId, intensity: { gt: 0 } },
    });
    if (lang !== 'ko') {
      return [
        { icon: 'Flame', title: `${streak}-day learning streak`, sub: 'New personal record', color: '#B45309' },
        { icon: 'TrendingUp', title: 'Accuracy passed 70%', sub: 'First 70%+ in 6 weeks', color: '#4A5D3A' },
        { icon: 'Target', title: 'Calculus I mastered', sub: 'Unit mastery reached 91%', color: '#1F1A14' },
        { icon: 'CheckCircle2', title: '25 wrong-note retries', sub: '82% correct on re-attempts', color: '#4A5D3A' },
      ];
    }
    return [
      { icon: 'Flame', title: `${streak}일 연속 학습 달성`, sub: '개인 최고 기록 갱신', color: '#B45309' },
      { icon: 'TrendingUp', title: '정답률 70% 돌파', sub: '6주 만의 첫 70%대 진입', color: '#4A5D3A' },
      { icon: 'Target', title: '미적분 I 마스터 완료', sub: '단원 숙련도 91% 달성', color: '#1F1A14' },
      { icon: 'CheckCircle2', title: '오답 재도전 25문제', sub: '재출제 정답률 82%', color: '#4A5D3A' },
    ];
  }

  byWeek(userId: string, week: string) { return this.repo.byWeek(userId, week); }

  /**
   * 메타인지 캘리브레이션 분석.
   *   - Brier score: 자신감(0~1) vs 실제 정답(0/1) 의 평균 제곱오차. 낮을수록 좋음.
   *   - 5단계 buckets: 자신감을 5개 구간으로 나눠 (mean conf, mean acc) 산점.
   *     완벽한 캘리브레이션은 y=x 대각선.
   *   - over/under-confidence 진단 + 권장 행동.
   */
  async calibration(userId: string, lang: Lang = 'ko') {
    const attempts = await this.prisma.attempt.findMany({
      where: { userId, confidence: { not: null } },
      select: { confidence: true, isCorrect: true, createdAt: true },
    });
    const isEn = lang !== 'ko';

    if (attempts.length === 0) {
      return {
        brier: null,
        attemptCount: 0,
        buckets: [],
        insight: isEn
          ? 'Confidence data needed. Use the confidence slider when submitting answers to enable calibration analysis.'
          : '자신감 입력이 필요합니다. 답 제출 시 슬라이더로 확신도를 표시하면 캘리브레이션이 분석돼요.',
      };
    }

    // Brier score
    const brier = attempts.reduce((s, a) => {
      const conf = (a.confidence ?? 0) / 100;
      const truth = a.isCorrect ? 1 : 0;
      return s + (conf - truth) ** 2;
    }, 0) / attempts.length;

    // 5-bucket binning (0-20 / 20-40 / 40-60 / 60-80 / 80-100)
    const ranges = [
      { label: '0–20%',   min: 0,  max: 20 },
      { label: '20–40%',  min: 20, max: 40 },
      { label: '40–60%',  min: 40, max: 60 },
      { label: '60–80%',  min: 60, max: 80 },
      { label: '80–100%', min: 80, max: 101 },
    ];
    const buckets = ranges.map((r) => {
      const xs = attempts.filter((a) => (a.confidence ?? 0) >= r.min && (a.confidence ?? 0) < r.max);
      if (xs.length === 0) {
        return { bucket: r.label, meanConfidence: null, meanAccuracy: null, count: 0 };
      }
      const meanConf = Math.round(xs.reduce((s, a) => s + (a.confidence ?? 0), 0) / xs.length);
      const meanAcc  = Math.round((xs.filter((a) => a.isCorrect).length / xs.length) * 100);
      return { bucket: r.label, meanConfidence: meanConf, meanAccuracy: meanAcc, count: xs.length };
    });

    // Over/under-confidence 진단 (활성 버킷만 평균)
    const active = buckets.filter((b) => b.count > 0);
    const avgGap = active.length > 0
      ? active.reduce((s, b) => s + ((b.meanConfidence ?? 0) - (b.meanAccuracy ?? 0)), 0) / active.length
      : 0;

    let insight: string;
    if (Math.abs(avgGap) < 5) {
      insight = isEn
        ? `Well calibrated (Brier ${brier.toFixed(3)}). Confidence and actual accuracy are closely aligned.`
        : `잘 보정되어 있어요 (Brier ${brier.toFixed(3)}). 자신감과 실제 정답률이 거의 일치합니다.`;
    } else if (avgGap > 0) {
      insight = isEn
        ? `Confidence runs ${Math.round(avgGap)}%p above actual accuracy (overconfidence). Add a verification step right after solving to close the gap.`
        : `자신감이 실제 정답률보다 평균 ${Math.round(avgGap)}%p 높아요 (overconfidence). 풀이 직후 검산 단계를 추가하면 정확도와 자신감의 격차가 줄어듭니다.`;
    } else {
      insight = isEn
        ? `Confidence runs ${Math.round(-avgGap)}%p below actual accuracy (underconfidence). Trust what you know — you can save real-test time.`
        : `자신감이 실제 정답률보다 평균 ${Math.round(-avgGap)}%p 낮아요 (underconfidence). 알고 있는 내용에 더 확신을 가져도 됩니다 — 실전에서 시간 낭비를 줄일 수 있어요.`;
    }

    return {
      brier: Math.round(brier * 10000) / 10000,
      attemptCount: attempts.length,
      buckets,
      insight,
      avgGap: Math.round(avgGap * 10) / 10,
    };
  }
}
