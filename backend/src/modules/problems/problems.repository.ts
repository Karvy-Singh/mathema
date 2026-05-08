import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

/**
 * 학습/응시 시 클라이언트로 전달할 때는 isCorrect/distractorType/rationale은 숨겨야 함.
 * Problem 객체에는 정답 답안 문자열도 포함되므로 fetch 시점에 sanitize.
 *
 * sanitize 규칙:
 *   - choices.isCorrect, distractorType, rationale 삭제
 *   - problem.answer 삭제 (정답 노출 방지)
 */
const sanitizeForClient = (p: any) => {
  if (!p) return p;
  const { answer, ...rest } = p;
  if (Array.isArray(rest.steps)) {
    rest.steps = rest.steps.map((s: any) => ({
      ...s,
      choices: (s.choices ?? []).map((c: any) => ({
        id: c.id, choiceIndex: c.choiceIndex, text: c.text,
        // isCorrect, distractorType, rationale 제외
      })),
    }));
  }
  return rest;
};

@Injectable()
export class ProblemsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async list(q: any) {
    const rows = await this.prisma.problem.findMany({
      where: this.buildWhere(q),
      include: { steps: { orderBy: { stepIndex: 'asc' }, include: { choices: { orderBy: { choiceIndex: 'asc' } } } } },
      orderBy: { createdAt: 'asc' },
    });
    return rows.map(sanitizeForClient);
  }

  async findById(id: string) {
    const row = await this.prisma.problem.findUnique({
      where: { id },
      include: { steps: { orderBy: { stepIndex: 'asc' }, include: { choices: { orderBy: { choiceIndex: 'asc' } } } } },
    });
    return sanitizeForClient(row);
  }

  async findHint(id: string) {
    const p = await this.prisma.problem.findUnique({ where: { id }, select: { hint: true } });
    return { hint: p?.hint };
  }

  private buildWhere(q: any) {
    const w: any = {};
    if (q?.unitId) w.unitId = q.unitId;
    if (q?.difficulty) w.difficulty = q.difficulty;
    if (q?.source) w.source = { contains: q.source, mode: 'insensitive' };
    return w;
  }
}

export const _sanitizeForClient = sanitizeForClient;
