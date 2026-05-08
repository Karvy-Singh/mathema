import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

@Injectable()
export class CurriculumRepository {
  constructor(private readonly prisma: PrismaService) {}
  findUnitsWithSubUnits() {
    return this.prisma.unit.findMany({ orderBy: { order: 'asc' }, include: { subUnits: true } });
  }
}
