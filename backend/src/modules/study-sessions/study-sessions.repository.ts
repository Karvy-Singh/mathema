import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { StartSessionDto } from './dto/start-session.dto';

@Injectable()
export class StudySessionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(userId: string, dto: StartSessionDto) {
    return this.prisma.studySession.create({
      data: {
        userId,
        unitId: dto.unitId,
        sessionNumber: dto.sessionNumber ?? 1,
        totalSessions: dto.totalSessions ?? 5,
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

  endSession(userId: string, id: string) {
    return this.prisma.studySession.update({
      where: { id },
      data: { endedAt: new Date() },
    });
  }
}
