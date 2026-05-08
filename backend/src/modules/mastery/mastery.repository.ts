import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

@Injectable()
export class MasteryRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll(userId: string) {
    return this.prisma.masterySnapshot.findMany({
      where: { userId }, include: { unit: true },
    });
  }

  findByUnit(userId: string, unitId: string) {
    return this.prisma.masterySnapshot.findUnique({
      where: { userId_unitId: { userId, unitId } },
      include: { unit: true },
    });
  }
}
