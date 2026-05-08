import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

@Injectable()
export class ReportsRepository {
  constructor(private readonly prisma: PrismaService) {}

  currentWeek(userId: string) { return this.prisma.weeklyReport.findFirst({ where: { userId }, orderBy: { weekStart: 'desc' } }); }
  recentWeeks(userId: string, take: number) { return this.prisma.weeklyReport.findMany({ where: { userId }, orderBy: { weekStart: 'desc' }, take }); }
  byWeek(userId: string, isoWeek: string) { return this.prisma.weeklyReport.findUnique({ where: { userId_isoWeek: { userId, isoWeek } } }); }
  timeVsAccuracy(userId: string, weeks: number) {
    return this.prisma.weeklyReport.findMany({ where: { userId }, orderBy: { weekStart: 'desc' }, take: weeks });
  }
  // TODO: nextFocus / achievements 는 Mastery + WrongNote + DailyActivity 를 종합
  nextFocus(_userId: string) { return []; }
  achievements(_userId: string) { return []; }
}
