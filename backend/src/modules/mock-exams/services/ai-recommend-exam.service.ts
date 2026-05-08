import { Injectable } from '@nestjs/common';
import { AiService } from '../../../infrastructure/ai/ai.service';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { WrongNotesRepository } from '../../wrong-notes/wrong-notes.repository';
import { Difficulty } from '../../../common/enums/difficulty.enum';
import { examDifficultyDistribution } from '../../../common/utils/difficulty-matcher.util';

/**
 * AI 맞춤 진단 모의고사 — 약점 단원 위주 30문제 자동 구성.
 * (UI: "맞춤 진단 모의고사 / 30문제 / 60분 / 지금 시작하기")
 */
@Injectable()
export class AiRecommendExamService {
  constructor(
    private readonly ai: AiService,
    private readonly prisma: PrismaService,
    private readonly wrongNotesRepo: WrongNotesRepository,
  ) {}

  /**
   * 맞춤 진단: 약점 단원 역가중치 + ZPD 난이도 분포 기반 30문제 구성.
   *   1) 단원별 할당량 = (100 - mastery.score) 가중치로 30문제 분배
   *   2) 단원별 평균 mastery → 권장 난이도 분포 → 문제 추출
   */
  async compose(userId: string) {
    const masteries = await this.prisma.masterySnapshot.findMany({
      where: { userId }, include: { unit: true },
    });
    if (masteries.length === 0) return { problems: [] };

    const target = 30;
    const weights = masteries.map((m) => ({ unitId: m.unitId, score: m.score, w: Math.max(5, 100 - m.score) }));
    const totalW = weights.reduce((s, x) => s + x.w, 0);

    const problems: Array<{ id: string; source: string; difficulty: string }> = [];
    for (const m of weights) {
      const allocate = Math.max(1, Math.round((m.w / totalW) * target));
      const dist = examDifficultyDistribution(m.score);
      for (const [diff, ratio] of Object.entries(dist) as [Difficulty, number][]) {
        const n = Math.round(allocate * ratio);
        if (n <= 0) continue;
        const ps = await this.prisma.problem.findMany({
          where: { unitId: m.unitId, difficulty: diff as any },
          take: n,
          orderBy: { createdAt: 'desc' },
        });
        problems.push(...ps.map((p) => ({ id: p.id, source: p.source, difficulty: p.difficulty })));
      }
    }
    return { problems: problems.slice(0, target) };
  }

  /**
   * 유형별:
   *   mini       — 약점 1단원에서 10문제
   *   wrong-redo — SM-2 due 큐의 오답들 (최대 30개)
   *   real       — 6단원 균등 분포 30문제 (실전 시험 시뮬레이션)
   */
  async composeTyped(userId: string, kind: 'mini' | 'wrong-redo' | 'real') {
    if (kind === 'wrong-redo') {
      const due = await this.wrongNotesRepo.findDue(userId, 30);
      const problemIds = due.map((d: any) => d.problemId);
      if (problemIds.length === 0) return { kind, problems: [] };
      const ps = await this.prisma.problem.findMany({ where: { id: { in: problemIds } } });
      return {
        kind,
        problems: ps.map((p) => ({ id: p.id, source: p.source, difficulty: p.difficulty })),
      };
    }

    if (kind === 'mini') {
      // 약점 단원에서 ZPD 난이도 매칭으로 10문제
      const weakest = await this.prisma.masterySnapshot.findFirst({
        where: { userId }, orderBy: { score: 'asc' },
      });
      if (!weakest) return { kind, problems: [] };
      const dist = examDifficultyDistribution(weakest.score);
      const problems: Array<{ id: string; source: string; difficulty: string }> = [];
      for (const [diff, ratio] of Object.entries(dist) as [Difficulty, number][]) {
        const n = Math.round(10 * ratio);
        if (n <= 0) continue;
        const ps = await this.prisma.problem.findMany({
          where: { unitId: weakest.unitId, difficulty: diff as any }, take: n,
        });
        problems.push(...ps.map((p) => ({ id: p.id, source: p.source, difficulty: p.difficulty })));
      }
      // fallback: 권장 난이도에 문제가 없으면 단원 전체에서
      if (problems.length === 0) {
        const ps = await this.prisma.problem.findMany({ where: { unitId: weakest.unitId }, take: 10 });
        return { kind, problems: ps.map((p) => ({ id: p.id, source: p.source, difficulty: p.difficulty })) };
      }
      return { kind, problems };
    }

    // real — 단원별 균등 분포
    const units = await this.prisma.unit.findMany();
    const perUnit = Math.max(1, Math.floor(30 / Math.max(units.length, 1)));
    const all: Array<{ id: string; source: string; difficulty: string }> = [];
    for (const u of units) {
      const ps = await this.prisma.problem.findMany({ where: { unitId: u.id }, take: perUnit });
      all.push(...ps.map((p) => ({ id: p.id, source: p.source, difficulty: p.difficulty })));
    }
    return { kind, problems: all.slice(0, 30) };
  }
}
