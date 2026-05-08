import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { NoteStatus } from '../../common/enums/note-status.enum';
import { ERROR_TYPE_LABEL_KO } from '../../common/enums/error-type.enum';
import { DIFFICULTY_LABEL_KO } from '../../common/enums/difficulty.enum';

const formatDate = (d: Date) => {
  const days = Math.floor((Date.now() - d.getTime()) / 86400000);
  if (days <= 1) return '오늘';
  if (days < 7) return `${days}일 전`;
  if (days < 30) return `${Math.floor(days / 7)}주 전`;
  return `${Math.floor(days / 30)}개월 전`;
};

const formatDueIn = (next: Date | null): string | null => {
  if (!next) return null;
  const ms = next.getTime() - Date.now();
  const days = Math.ceil(ms / 86400000);
  if (ms <= 0) return '복습 필요';
  if (days <= 1) return '내일';
  return `${days}일 후`;
};

const toCardShape = (n: any) => ({
  id: n.id,
  problemId: n.problemId,
  problem: n.problem.source,
  unit: n.problem.unit.name,
  subUnit: n.problem.subUnit?.name ?? '',
  errorType: ERROR_TYPE_LABEL_KO[n.errorType as keyof typeof ERROR_TYPE_LABEL_KO],
  errorTypeRaw: n.errorType,
  insight: n.insight,
  diff: DIFFICULTY_LABEL_KO[n.problem.difficulty as keyof typeof DIFFICULTY_LABEL_KO],
  date: formatDate(n.createdAt),
  similarCount: n.similarCount,
  status: n.status.toLowerCase(),
  // SM-2 노출 필드
  easinessFactor: Math.round((n.easinessFactor ?? 2.5) * 100) / 100,
  repetitionCount: n.repetitionCount ?? 0,
  intervalDays: n.intervalDays ?? 0,
  nextReviewAt: n.nextReviewAt ? n.nextReviewAt.toISOString() : null,
  dueIn: formatDueIn(n.nextReviewAt),
  isDue: n.nextReviewAt ? n.nextReviewAt.getTime() <= Date.now() : true, // 미복습 = 즉시 due
  lapseCount: n.lapseCount ?? 0,
});

@Injectable()
export class WrongNotesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async aggregateStats(userId: string) {
    const all = await this.prisma.wrongNote.findMany({ where: { userId } });
    const total = all.length;
    const analyzed = all.filter((n) => n.status !== 'PENDING').length;
    const mastered = all.filter((n) => n.status === 'MASTERED').length;

    // 재출제 정답률: 오답으로 등록된 problem의 isCorrect 비율 (creation 이후 attempts)
    let retryAccuracy = 0;
    if (all.length > 0) {
      const problemIds = all.map((n) => n.problemId);
      const retries = await this.prisma.attempt.findMany({
        where: { userId, problemId: { in: problemIds } },
        orderBy: { createdAt: 'asc' },
      });
      // 각 문제의 첫 attempt 이후의 attempts만 (= 재시도)
      const firstByProblem = new Map<string, Date>();
      for (const a of retries) {
        if (!firstByProblem.has(a.problemId)) firstByProblem.set(a.problemId, a.createdAt);
      }
      const onlyRetries = retries.filter((a) => {
        const first = firstByProblem.get(a.problemId)!;
        return a.createdAt.getTime() > first.getTime();
      });
      const correctCount = onlyRetries.filter((a) => a.isCorrect).length;
      retryAccuracy = onlyRetries.length > 0
        ? Math.round((correctCount / onlyRetries.length) * 100)
        : 0;
    }

    return {
      total,
      analyzed,
      mastered,
      masteredPct: total ? Math.round((mastered / total) * 100) : 0,
      retryAccuracy,
    };
  }

  async findDue(userId: string, limit?: number) {
    const now = new Date();
    const rows = await this.prisma.wrongNote.findMany({
      where: {
        userId,
        status: { not: 'MASTERED' },
        OR: [
          { nextReviewAt: null },                // 미복습
          { nextReviewAt: { lte: now } },         // 만기
        ],
      },
      orderBy: [
        { nextReviewAt: { sort: 'asc', nulls: 'first' } },
        { occurrences: 'desc' },
      ],
      ...(limit ? { take: limit } : {}),
      include: { problem: { include: { unit: true, subUnit: true } } },
    });
    return rows.map(toCardShape);
  }

  async applyReview(userId: string, id: string, sm2: { easinessFactor: number; repetitionCount: number; intervalDays: number; nextReviewAt: Date; lapsed: boolean }) {
    return this.prisma.wrongNote.update({
      where: { id },
      data: {
        easinessFactor: sm2.easinessFactor,
        repetitionCount: sm2.repetitionCount,
        intervalDays: sm2.intervalDays,
        nextReviewAt: sm2.nextReviewAt,
        lastReviewedAt: new Date(),
        ...(sm2.lapsed ? { lapseCount: { increment: 1 }, status: 'ANALYZING' as const } : { status: 'ANALYZING' as const }),
      },
    });
  }

  async findRecent(userId: string, limit: number) {
    const rows = await this.prisma.wrongNote.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: { problem: { include: { unit: true, subUnit: true } } },
    });
    return rows.map(toCardShape);
  }

  async list(userId: string, query: any) {
    const rows = await this.prisma.wrongNote.findMany({
      where: { userId, ...this.buildWhere(query) },
      orderBy: this.buildOrderBy(query),
      include: { problem: { include: { unit: true, subUnit: true } } },
    });
    return rows.map(toCardShape);
  }

  async findOne(userId: string, id: string) {
    const n = await this.prisma.wrongNote.findFirstOrThrow({
      where: { id, userId },
      include: { problem: { include: { unit: true, subUnit: true } } },
    });
    return toCardShape(n);
  }

  create(userId: string, dto: any) {
    return this.prisma.wrongNote.create({ data: { userId, ...dto } });
  }

  updateStatus(userId: string, id: string, status: NoteStatus) {
    return this.prisma.wrongNote.update({
      where: { id },
      data: { status, masteredAt: status === NoteStatus.MASTERED ? new Date() : null },
    });
  }

  private buildWhere(q: any) {
    const where: any = {};
    if (q?.unitName && q.unitName !== '전체') where.problem = { unit: { name: q.unitName } };
    if (q?.errorType) where.errorType = q.errorType;
    if (q?.status) where.status = q.status;
    return where;
  }

  private buildOrderBy(q: any) {
    return q?.sort === 'oldest' ? { createdAt: 'asc' as const } : { createdAt: 'desc' as const };
  }
}
