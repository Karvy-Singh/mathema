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

  /**
   * 약점 단원 Top 3 — mastery 낮은 순. impact 는 실 mastery gap 기반.
   * priority 는 단순히 순위 라벨; impact 는 객관적인 '점수 여력' (100-score).
   */
  async nextFocus(userId: string, lang: Lang = 'ko') {
    const masteries = await this.prisma.masterySnapshot.findMany({
      where: { userId, samples: { gte: 3 } },     // 표본 부족한 단원은 제외 — 실제 약점 식별 신뢰도 확보
      include: { unit: true },
      orderBy: { score: 'asc' },
      take: 3,
    });
    if (masteries.length === 0) return [];

    const palette = ['#8B3A1F', '#B45309', '#A16207'];
    const isEn = lang !== 'ko';
    const priorities = isEn ? ['Top', 'High', 'Mid'] : ['최우선', '높음', '중간'];

    return masteries.map((m, i) => {
      const gap = Math.max(0, Math.round(100 - m.score));
      return {
        unit: isEn ? (UNIT_NAME_EN[m.unit.name] ?? m.unit.name) : m.unit.name,
        // area: 단원명 그대로 (가짜 sub-단원명 매핑 제거 — 실 SubUnit 로 추후 확장)
        area: isEn ? (UNIT_NAME_EN[m.unit.name] ?? m.unit.name) : m.unit.name,
        priority: priorities[i] ?? (isEn ? 'Mid' : '중간'),
        color: palette[i] ?? '#A16207',
        impact: isEn ? `${gap} pts to mastery` : `숙련도 ${gap}점 여력`,
      };
    });
  }

  /**
   * 실 데이터 기반 성취 카드 — 조건 미충족 단원은 카드 생략.
   *   1) 학습 streak (연속 일수, ≥ 3)
   *   2) 최근 7일 정답률 ≥ 70 (표본 10 이상)
   *   3) 단원 마스터 (mastery ≥ 90)
   *   4) 오답노트 정복 (status=MASTERED count ≥ 5)
   */
  async achievements(userId: string, lang: Lang = 'ko') {
    const isEn = lang !== 'ko';
    const cards: Array<{ icon: string; title: string; sub: string; color: string }> = [];

    // 1) Streak — 연속 학습 일수
    const streak = await this.computeStreak(userId);
    if (streak >= 3) {
      cards.push({
        icon: 'Flame',
        title: isEn ? `${streak}-day learning streak` : `${streak}일 연속 학습`,
        sub: isEn ? 'Keep it going' : '꾸준한 학습',
        color: '#B45309',
      });
    }

    // 2) 최근 7일 정답률
    const since = new Date(Date.now() - 7 * 86_400_000);
    const recent = await this.prisma.attempt.findMany({
      where: { userId, createdAt: { gte: since } },
      select: { isCorrect: true },
    });
    if (recent.length >= 10) {
      const acc = recent.filter((a) => a.isCorrect).length / recent.length;
      if (acc >= 0.7) {
        cards.push({
          icon: 'TrendingUp',
          title: isEn ? `Accuracy ${Math.round(acc * 100)}% (last 7d)` : `정답률 ${Math.round(acc * 100)}% (최근 7일)`,
          sub: isEn ? `${recent.length} problems` : `${recent.length}문제`,
          color: '#4A5D3A',
        });
      }
    }

    // 3) 단원 마스터 — score ≥ 90 인 첫 단원
    const mastered = await this.prisma.masterySnapshot.findFirst({
      where: { userId, score: { gte: 90 } },
      include: { unit: true },
      orderBy: { score: 'desc' },
    });
    if (mastered) {
      const unitName = isEn ? (UNIT_NAME_EN[mastered.unit.name] ?? mastered.unit.name) : mastered.unit.name;
      cards.push({
        icon: 'Target',
        title: isEn ? `${unitName} mastered` : `${unitName} 마스터`,
        sub: isEn ? `${Math.round(mastered.score)}% mastery` : `숙련도 ${Math.round(mastered.score)}%`,
        color: '#1F1A14',
      });
    }

    // 4) 오답 정복 — MASTERED count
    const masteredNotes = await this.prisma.wrongNote.count({
      where: { userId, status: 'MASTERED' },
    });
    if (masteredNotes >= 5) {
      cards.push({
        icon: 'CheckCircle2',
        title: isEn ? `${masteredNotes} wrong notes mastered` : `오답 ${masteredNotes}건 정복`,
        sub: isEn ? 'Spaced repetition' : '간격 반복 학습',
        color: '#4A5D3A',
      });
    }

    return cards;
  }

  /** 연속 학습 일수 — DailyActivity 의 날짜 인접성 기반. */
  private async computeStreak(userId: string): Promise<number> {
    const rows = await this.prisma.dailyActivity.findMany({
      where: { userId, intensity: { gt: 0 } },
      orderBy: { date: 'desc' },
      select: { date: true },
      take: 60,
    });
    if (rows.length === 0) return 0;
    let streak = 1;
    for (let i = 1; i < rows.length; i++) {
      const diff = Math.round((rows[i - 1].date.getTime() - rows[i].date.getTime()) / 86_400_000);
      if (diff === 1) streak++;
      else break;
    }
    return streak;
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
