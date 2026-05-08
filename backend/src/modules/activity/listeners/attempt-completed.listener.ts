import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';

/**
 * attempt.completed → 오늘자 DailyActivity 자동 갱신.
 *
 * 갱신되는 필드:
 *  - durationMin: 누적 풀이시간 (durationSec/60 합)
 *  - problemsSolved: 누적 풀이 문제 수
 *  - accuracyPct: 누적 정답률
 *  - intensity: clip(round(durationMin/40 + problemsSolved/10), 0, 3)
 *      → heatmap 색상 단계. 약 120분 + 20문제면 만점(3).
 */
@Injectable()
export class ActivityAttemptListener {
  private readonly logger = new Logger(ActivityAttemptListener.name);
  constructor(private readonly prisma: PrismaService) {}

  @OnEvent('attempt.completed')
  async onAttemptCompleted(attempt: {
    userId: string; isCorrect: boolean; durationSec: number;
  }) {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const minutes = attempt.durationSec / 60;

    // upsert with arithmetic update
    const existing = await this.prisma.dailyActivity.findUnique({
      where: { userId_date: { userId: attempt.userId, date: today } },
    });

    const newDuration = (existing?.durationMin ?? 0) + minutes;
    const newSolved = (existing?.problemsSolved ?? 0) + 1;
    const prevCorrect = (existing?.accuracyPct ?? 0) * (existing?.problemsSolved ?? 0) / 100;
    const newCorrect = prevCorrect + (attempt.isCorrect ? 1 : 0);
    const newAccuracy = newSolved > 0 ? Math.round((newCorrect / newSolved) * 1000) / 10 : 0;
    const newIntensity = Math.max(0, Math.min(3, Math.round(newDuration / 40 + newSolved / 10)));

    await this.prisma.dailyActivity.upsert({
      where: { userId_date: { userId: attempt.userId, date: today } },
      update: {
        durationMin: Math.round(newDuration),
        problemsSolved: newSolved,
        accuracyPct: newAccuracy,
        intensity: newIntensity,
      },
      create: {
        userId: attempt.userId,
        date: today,
        durationMin: Math.round(newDuration),
        problemsSolved: newSolved,
        accuracyPct: newAccuracy,
        intensity: newIntensity,
      },
    });
  }
}
