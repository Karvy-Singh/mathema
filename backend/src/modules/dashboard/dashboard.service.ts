import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { ActivityService } from '../activity/activity.service';

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activity: ActivityService,
  ) {}

  async summary(userId: string) {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const todayAct = await this.prisma.dailyActivity.findUnique({
      where: { userId_date: { userId, date: today } },
    });

    const streak = await this.activity.streak(userId);

    // 이번 주 (D-7 ~ now) vs 지난 주 (D-14 ~ D-7) 정답률 비교
    const now = new Date();
    const w1Start = new Date(now); w1Start.setDate(w1Start.getDate() - 7);
    const w2Start = new Date(now); w2Start.setDate(w2Start.getDate() - 14);

    const [thisWeek, lastWeek] = await Promise.all([
      this.prisma.attempt.findMany({ where: { userId, createdAt: { gte: w1Start } } }),
      this.prisma.attempt.findMany({ where: { userId, createdAt: { gte: w2Start, lt: w1Start } } }),
    ]);
    const accuracy = (xs: { isCorrect: boolean }[]) =>
      xs.length === 0 ? 0 : Math.round((xs.filter((a) => a.isCorrect).length / xs.length) * 100);
    const weeklyAccuracy = accuracy(thisWeek);
    const lastWeeklyAccuracy = accuracy(lastWeek);
    const weeklyAccuracyDelta = lastWeek.length === 0 ? 0 : weeklyAccuracy - lastWeeklyAccuracy;

    // 예상 등급 (최근 2개 모의고사 비교)
    const recentResults = await this.prisma.mockExamResult.findMany({
      where: { userId }, orderBy: { takenAt: 'desc' }, take: 2,
    });
    const expectedGrade = recentResults[0]?.grade ?? 3;
    const expectedGradeFrom = recentResults[1]?.grade ?? expectedGrade;

    return {
      todayMinutes: todayAct?.durationMin ?? 0,
      todayGoalMinutes: 180,
      streakDays: streak.days,
      weeklyAccuracy,
      weeklyAccuracyDelta,
      expectedGrade,
      expectedGradeFrom,
    };
  }
}
