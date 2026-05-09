import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { GradeLevel } from '../../common/enums/unit.enum';

@Injectable()
export class CurriculumRepository {
  constructor(private readonly prisma: PrismaService) {}

  findUnitsWithSubUnits(grade?: GradeLevel | null) {
    return this.prisma.unit.findMany({
      where: grade ? ({ gradeLevels: { has: grade } } as any) : undefined,
      orderBy: { order: 'asc' },
      include: { subUnits: { orderBy: { order: 'asc' } } },
    });
  }

  findUserGrade(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: { gradeLevel: true } as any,
    }) as Promise<{ gradeLevel: GradeLevel | null } | null>;
  }
}
