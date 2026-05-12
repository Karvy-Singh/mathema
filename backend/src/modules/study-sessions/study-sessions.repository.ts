import { Injectable } from '@nestjs/common';
import { SessionContext } from '@prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { StartSessionDto } from './dto/start-session.dto';

@Injectable()
export class StudySessionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(userId: string, dto: StartSessionDto) {
    const deviceType = dto.deviceType && ['android', 'ios', 'web'].includes(dto.deviceType)
      ? dto.deviceType : null;
    return this.prisma.studySession.create({
      data: {
        userId,
        unitId: dto.unitId,
        sessionNumber: dto.sessionNumber ?? 1,
        totalSessions: dto.totalSessions ?? 5,
        context: (dto.context as SessionContext) ?? SessionContext.STUDY,
        deviceType,
      },
    });
  }

  findOne(userId: string, id: string) {
    return this.prisma.studySession.findFirstOrThrow({ where: { id, userId } });
  }

  async advanceStep(userId: string, id: string) {
    const s = await this.findOne(userId, id);
    return this.prisma.studySession.update({
      where: { id },
      data: { currentStep: Math.min(5, s.currentStep + 1) },
    });
  }

  /**
   * 세션 종료 — durationSec 확정 + studyTimeMin 누적 + 명세서 §9 Phase 3:
   *   focusScore (0~100) 와 fatigueSignal ('low'|'medium'|'high') 자동 계산.
   *
   *   focusScore — 응답시간 안정성·정답률·힌트 사용률 종합:
   *     base = accuracy * 60 + (1 - hintRate) * 30 + responseStability * 10
   *   fatigueSignal — 세션 후반 응답시간 증가율 & 정답률 하락:
   *     attempt 6+ 면서 후반 절반 응답시간 평균 ≥ 전반 1.5× → 'high'
   *     1.2× 이상 → 'medium', 그 외 → 'low'
   */
  async endSession(userId: string, id: string) {
    const s = await this.findOne(userId, id);
    const endedAt = new Date();
    const durationSec = s.endedAt
      ? s.durationSec
      : Math.max(0, Math.floor((endedAt.getTime() - s.startedAt.getTime()) / 1000));
    const studyMinDelta = s.endedAt ? 0 : Math.floor(durationSec / 60);

    // 이 세션의 attempt 들을 시간순으로 가져와 focusScore / fatigueSignal 계산.
    const attempts = await this.prisma.attempt.findMany({
      where: { studySessionId: id },
      orderBy: { createdAt: 'asc' },
      select: { isCorrect: true, durationSec: true, hintUsed: true },
    });

    let focusScore: number | null = null;
    let fatigueSignal: string | null = null;
    let problemCount = attempts.length;
    let correctCount = attempts.filter((a) => a.isCorrect).length;
    let averageResponseTimeSec: number | null = null;

    if (attempts.length > 0) {
      averageResponseTimeSec = Math.round(
        attempts.reduce((sum, a) => sum + a.durationSec, 0) / attempts.length
      );
      const accuracy = correctCount / attempts.length;
      const hintRate = attempts.filter((a) => a.hintUsed).length / attempts.length;

      // 응답시간 안정성 — 표준편차 / 평균 (낮을수록 안정).
      const mean = averageResponseTimeSec;
      const variance = attempts.reduce((s, a) => s + (a.durationSec - mean) ** 2, 0) / attempts.length;
      const sigma = Math.sqrt(variance);
      const cv = mean > 0 ? sigma / mean : 1;             // coefficient of variation
      const responseStability = Math.max(0, Math.min(1, 1 - cv));

      focusScore = Math.round(accuracy * 60 + (1 - hintRate) * 30 + responseStability * 10);

      // fatigueSignal — 6 attempt 이상에서만 의미 있게.
      if (attempts.length >= 6) {
        const half = Math.floor(attempts.length / 2);
        const early = attempts.slice(0, half);
        const late  = attempts.slice(half);
        const earlyAvg = early.reduce((s, a) => s + a.durationSec, 0) / early.length;
        const lateAvg  = late.reduce((s, a) => s + a.durationSec, 0) / late.length;
        const ratio = earlyAvg > 0 ? lateAvg / earlyAvg : 1;
        fatigueSignal = ratio >= 1.5 ? 'high' : ratio >= 1.2 ? 'medium' : 'low';
      } else {
        fatigueSignal = 'low';
      }
    }

    return this.prisma.$transaction(async (tx) => {
      const session = await tx.studySession.update({
        where: { id },
        data: {
          endedAt, durationSec,
          problemCount, correctCount,
          averageResponseTimeSec,
          focusScore, fatigueSignal,
        },
      });
      if (studyMinDelta > 0) {
        await tx.masterySnapshot.upsert({
          where: { userId_unitId: { userId, unitId: s.unitId } },
          update: { studyTimeMin: { increment: studyMinDelta } },
          create: { userId, unitId: s.unitId, score: 0, studyTimeMin: studyMinDelta },
        });
      }
      return session;
    });
  }
}
