import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: any) { return this.prisma.user.create({ data }); }
  findById(id: string) { return this.prisma.user.findUnique({ where: { id } }); }
  findByEmail(email: string) { return this.prisma.user.findUnique({ where: { email } }); }
  update(id: string, data: any) { return this.prisma.user.update({ where: { id }, data }); }

  /**
   * Soft delete — deletedAt 표시. 분석 데이터(attempts, events) 보존.
   * 이메일은 충돌 회피를 위해 deleted-{uuid}-{원본} 형태로 변경.
   */
  async softDelete(id: string) {
    const u = await this.prisma.user.findUnique({ where: { id }, select: { email: true } });
    if (!u) return null;
    const shadowed = `deleted-${id}-${u.email}`.slice(0, 320);
    return this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date(), email: shadowed },
    });
  }

  /**
   * 사용자의 모든 데이터 export — GDPR Art. 20 / Play Data Safety 자기데이터 다운로드.
   * Prisma include 사용 — 추가 모델 생기면 여기 한곳에서 확장.
   */
  async exportAll(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        attempts: { take: 10000, orderBy: { createdAt: 'desc' } },
        wrongNotes: { take: 10000, orderBy: { createdAt: 'desc' } },
        studySessions: { take: 5000, orderBy: { startedAt: 'desc' } },
        mockExamResults: { take: 1000, orderBy: { takenAt: 'desc' } },
        activities: { take: 5000, orderBy: { date: 'desc' } },
        masteries: true,
        weeklyReports: { take: 200, orderBy: { generatedAt: 'desc' } },
        analyticsEvents: { take: 5000, orderBy: { createdAt: 'desc' } },
        deviceTokens: true,
      },
    });
  }
}
