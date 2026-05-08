import { Injectable } from '@nestjs/common';
import { ProblemsRepository } from './problems.repository';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { recommendedDifficulties } from '../../common/utils/difficulty-matcher.util';

@Injectable()
export class ProblemsService {
  constructor(
    private readonly repo: ProblemsRepository,
    private readonly prisma: PrismaService,
  ) {}
  list(q: any) { return this.repo.list(q); }
  one(id: string) { return this.repo.findById(id); }
  hint(id: string) { return this.repo.findHint(id); }

  /**
   * 사용자의 단원 숙련도에 맞는 권장 난이도 문제 목록.
   * mastery 미존재 시 score=50 기본값 (UPPER_MIDDLE 우선).
   * 모든 문제는 steps + choices 포함 (정답·오답메타는 제거된 상태로).
   */
  async recommendedFor(userId: string, unitId: string) {
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
    return fallback.map((p: any) => sanitize(p));
  }
}

// 클라이언트 노출 시 정답/오답메타 제거 (problems.repository 와 동일 정책)
function sanitize(p: any): any {
  if (!p) return p;
  const { answer, ...rest } = p;
  if (Array.isArray(rest.steps)) {
    rest.steps = rest.steps.map((s: any) => ({
      id: s.id, stepIndex: s.stepIndex, stepType: s.stepType, prompt: s.prompt,
      choices: (s.choices ?? []).map((c: any) => ({
        id: c.id, choiceIndex: c.choiceIndex, text: c.text,
      })),
    }));
  }
  return rest;
}
