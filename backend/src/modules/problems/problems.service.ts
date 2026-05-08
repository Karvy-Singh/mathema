import { Injectable } from '@nestjs/common';
import { ProblemsRepository, sanitizeForClient } from './problems.repository';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { recommendedDifficulties } from '../../common/utils/difficulty-matcher.util';
import { Lang } from '../../common/i18n/current-lang.decorator';

@Injectable()
export class ProblemsService {
  constructor(
    private readonly repo: ProblemsRepository,
    private readonly prisma: PrismaService,
  ) {}
  list(q: any, lang: Lang = 'ko') { return this.repo.list(q, lang); }
  one(id: string, lang: Lang = 'ko') { return this.repo.findById(id, lang); }
  hint(id: string) { return this.repo.findHint(id); }

  async recommendedFor(userId: string, unitId: string, lang: Lang = 'ko') {
    const mastery = await this.prisma.masterySnapshot.findUnique({
      where: { userId_unitId: { userId, unitId } },
    });
    const score = mastery?.score ?? 50;
    const difficulties = recommendedDifficulties(score);
    const include = {
      steps: { orderBy: { stepIndex: 'asc' as const }, include: { choices: { orderBy: { choiceIndex: 'asc' as const } } } },
    };
    const problems = await this.prisma.problem.findMany({
      where: { unitId, difficulty: { in: difficulties as any } },
      include, orderBy: { createdAt: 'asc' },
    });
    const fallback = problems.length === 0
      ? await this.prisma.problem.findMany({ where: { unitId }, include, orderBy: { createdAt: 'asc' } })
      : problems;
    return fallback.map((p: any) => sanitizeForClient(p, lang));
  }
}
