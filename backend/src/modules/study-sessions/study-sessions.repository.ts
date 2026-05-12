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
   * 세션 종료 — durationSec 확정 + MasterySnapshot.studyTimeMin 누적.
   * 단원별 공부 시간 균형 분석의 데이터 원천.
   */
  async endSession(userId: string, id: string) {
    const s = await this.findOne(userId, id);
    const endedAt = new Date();
    const durationSec = s.endedAt
      ? s.durationSec  // 멱등: 이미 종료된 세션은 그대로
      : Math.max(0, Math.floor((endedAt.getTime() - s.startedAt.getTime()) / 1000));

    const studyMinDelta = s.endedAt ? 0 : Math.floor(durationSec / 60);

    // 트랜잭션: 세션 종료 + 마스터리 시간 누적을 원자적으로
    return this.prisma.$transaction(async (tx) => {
      const session = await tx.studySession.update({
        where: { id },
        data: { endedAt, durationSec },
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
