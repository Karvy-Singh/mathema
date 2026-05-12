import { Body, Controller, Get, Param, Post, UseGuards, ForbiddenException, NotFoundException } from '@nestjs/common';
import { AttemptsService } from './attempts.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { SimilarProblemService } from '../recommendations/services/similar-problem.service';

@UseGuards(JwtAuthGuard)
@Controller('attempts')
export class AttemptsController {
  constructor(
    private readonly service: AttemptsService,
    private readonly prisma: PrismaService,
    private readonly similar: SimilarProblemService,
  ) {}

  @Post()
  create(@CurrentUser('id') userId: string, @Body() body: any) {
    return this.service.create(userId, body);
  }

  /** 명세서 §5 — GET /api/attempts/:attemptId. 본인 것만 반환. */
  @Get(':attemptId')
  async getById(@CurrentUser('id') userId: string, @Param('attemptId') id: string) {
    const a = await this.prisma.attempt.findUnique({
      where: { id },
      include: { problem: { select: { id: true, source: true, difficultyLevel: true } } },
    });
    if (!a) throw new NotFoundException('Attempt not found');
    if (a.userId !== userId) throw new ForbiddenException('Cannot access other user attempt');
    return a;
  }

  /** 명세서 §5 — GET /api/attempts/:attemptId/similar-problems. /recommendations/similar/:id 의 명세서 path 별칭. */
  @Get(':attemptId/similar-problems')
  similarProblems(@CurrentUser('id') userId: string, @Param('attemptId') id: string) {
    return this.similar.getSimilar(userId, id);
  }
}
