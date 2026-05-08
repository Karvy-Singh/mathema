import { Injectable } from '@nestjs/common';
import { AiService } from '../../../infrastructure/ai/ai.service';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';

/**
 * 유사 문제 검색 — 오답노트 카드 하단 "유사 문제 N개 제안됨" 의 근간.
 * 1) Problem 에 미리 임베딩이 있으면 코사인 유사도로 검색
 * 2) 없으면 단원·단위·난이도·errorType 매칭으로 fallback
 */
@Injectable()
export class SimilarFinderService {
  constructor(
    private readonly ai: AiService,
    private readonly prisma: PrismaService,
  ) {}

  async findSimilar(problemId: string, limit = 5) {
    // TODO: pgvector 도입 후 임베딩 기반 검색으로 교체
    return this.prisma.problem.findMany({ where: { NOT: { id: problemId } }, take: limit });
  }
}
