import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

@Injectable()
export class ActivityService {
  constructor(private readonly prisma: PrismaService) {}

  async heatmap(userId: string, weeks: number) {
    const days = weeks * 7;
    const rows = await this.prisma.dailyActivity.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      take: days,
    });
    // UI 는 오래된 → 오늘 순서로 그림
    return rows.reverse().map((r, i) => ({ day: i, intensity: r.intensity }));
  }

  async streak(userId: string) {
    const acts = await this.prisma.dailyActivity.findMany({
      where: { userId, intensity: { gt: 0 } },
      orderBy: { date: 'desc' },
      take: 365,
    });
    let streak = 0;
    let cursor = new Date(); cursor.setHours(0, 0, 0, 0);
    for (const a of acts) {
      const d = new Date(a.date); d.setHours(0, 0, 0, 0);
      if (d.getTime() === cursor.getTime()) {
        streak++;
        cursor.setDate(cursor.getDate() - 1);
      } else if (d.getTime() < cursor.getTime()) {
        break;
      }
    }
    return { days: streak };
  }

  async today(userId: string) {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const a = await this.prisma.dailyActivity.findUnique({
      where: { userId_date: { userId, date: today } },
    });
    return a ?? { durationMin: 0, problemsSolved: 0, accuracyPct: 0, intensity: 0 };
  }

  async aggregateStats(userId: string) {
    const all = await this.prisma.dailyActivity.findMany({ where: { userId } });
    const totalMin = all.reduce((s, x) => s + x.durationMin, 0);
    const days = all.filter((x) => x.intensity > 0).length || 1;
    const totalProblems = all.reduce((s, x) => s + x.problemsSolved, 0);
    const accs = all.filter((x) => x.problemsSolved > 0).map((x) => x.accuracyPct);
    const avgAcc = accs.length ? accs.reduce((s, x) => s + x, 0) / accs.length : 0;
    return {
      avgMinutesPerDay: Math.round(totalMin / days),
      totalProblems,
      avgAccuracy: Math.round(avgAcc * 10) / 10,
    };
  }
}
