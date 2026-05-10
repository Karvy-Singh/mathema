import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { NoteStatus } from '../../common/enums/note-status.enum';
import { ERROR_TYPE_LABEL_KO } from '../../common/enums/error-type.enum';
import { DIFFICULTY_LABEL_KO } from '../../common/enums/difficulty.enum';
import { Lang } from '../../common/i18n/current-lang.decorator';
import { UNIT_NAME_EN, SUB_UNIT_NAME_EN, DIFFICULTY_EN, ERROR_TYPE_EN, SOURCE_EN, INSIGHT_EN, PROBLEM_EN, CONCEPT_EN, FORMULA_EN } from '../../common/i18n/content-en';

const formatDate = (d: Date, lang: Lang) => {
  const days = Math.floor((Date.now() - d.getTime()) / 86400000);
  if (lang === 'en') {
    if (days <= 1) return 'today';
    if (days < 7) return `${days}d ago`;
    if (days < 30) return `${Math.floor(days / 7)}w ago`;
    return `${Math.floor(days / 30)}mo ago`;
  }
  if (days <= 1) return '오늘';
  if (days < 7) return `${days}일 전`;
  if (days < 30) return `${Math.floor(days / 7)}주 전`;
  return `${Math.floor(days / 30)}개월 전`;
};

const formatDueIn = (next: Date | null, lang: Lang): string | null => {
  if (!next) return null;
  const ms = next.getTime() - Date.now();
  const days = Math.ceil(ms / 86400000);
  if (lang === 'en') {
    if (ms <= 0) return 'Review now';
    if (days <= 1) return 'Tomorrow';
    return `In ${days}d`;
  }
  if (ms <= 0) return '복습 필요';
  if (days <= 1) return '내일';
  return `${days}일 후`;
};

const toCardShape = (n: any, lang: Lang = 'ko') => {
  const unitKo = n.problem.unit.name;
  const subUnitKo = n.problem.subUnit?.name ?? '';
  const sourceKo = n.problem.source;
  const insightKo = n.insight;
  // 문제 본문 — EN 모드면 PROBLEM_EN 사전에서 영문 치환, 없으면 KO 본문 그대로.
  const bodyKo = n.problem.body as string;
  const answerKo = n.problem.answer as string;
  const conceptKo = (n.problem.concept ?? null) as string | null;
  const formulaKo = (n.problem.formula ?? null) as string | null;
  const en = PROBLEM_EN[sourceKo];
  const problemBody = lang === 'en' && en?.body ? en.body : bodyKo;
  const problemAnswer = lang === 'en' && en?.answer ? en.answer : answerKo;
  const problemConcept = lang === 'en' && CONCEPT_EN[sourceKo] ? CONCEPT_EN[sourceKo] : conceptKo;
  const problemFormula = lang === 'en' && FORMULA_EN[sourceKo] ? FORMULA_EN[sourceKo] : formulaKo;
  return {
    id: n.id,
    problemId: n.problemId,
    problem: lang === 'en' ? (SOURCE_EN[sourceKo] ?? sourceKo) : sourceKo,
    /** 실제 문제 본문 (오답노트에서 어떤 문제였는지 즉시 확인 가능) */
    problemBody,
    /** 정답 — 오답노트 상세에서 노출 */
    problemAnswer,
    /** 핵심 개념 — 학습 피드백 / 오답노트 상세에 노출 */
    problemConcept,
    /** 관련 공식 — 개념 패널 안의 공식 라인 */
    problemFormula,
    unit: lang === 'en' ? (UNIT_NAME_EN[unitKo] ?? unitKo) : unitKo,
    subUnit: lang === 'en' ? (SUB_UNIT_NAME_EN[subUnitKo] ?? subUnitKo) : subUnitKo,
    errorType: lang === 'en'
      ? ERROR_TYPE_EN[n.errorType as keyof typeof ERROR_TYPE_EN]
      : ERROR_TYPE_LABEL_KO[n.errorType as keyof typeof ERROR_TYPE_LABEL_KO],
    errorTypeRaw: n.errorType,
    insight: lang === 'en' ? (INSIGHT_EN[insightKo] ?? insightKo) : insightKo,
    diff: lang === 'en'
      ? DIFFICULTY_EN[n.problem.difficulty as keyof typeof DIFFICULTY_EN]
      : DIFFICULTY_LABEL_KO[n.problem.difficulty as keyof typeof DIFFICULTY_LABEL_KO],
    date: formatDate(n.createdAt, lang),
    similarCount: n.similarCount,
    status: n.status.toLowerCase(),
    easinessFactor: Math.round((n.easinessFactor ?? 2.5) * 100) / 100,
    repetitionCount: n.repetitionCount ?? 0,
    intervalDays: n.intervalDays ?? 0,
    nextReviewAt: n.nextReviewAt ? n.nextReviewAt.toISOString() : null,
    dueIn: formatDueIn(n.nextReviewAt, lang),
    isDue: n.nextReviewAt ? n.nextReviewAt.getTime() <= Date.now() : true,
    lapseCount: n.lapseCount ?? 0,
  };
};

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

  async findDue(userId: string, limit?: number, lang: Lang = 'ko') {
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
    return rows.map((r) => toCardShape(r, lang));
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

  async findRecent(userId: string, limit: number, lang: Lang = 'ko') {
    const rows = await this.prisma.wrongNote.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: { problem: { include: { unit: true, subUnit: true } } },
    });
    return rows.map((r) => toCardShape(r, lang));
  }

  async list(userId: string, query: any, lang: Lang = 'ko') {
    const rows = await this.prisma.wrongNote.findMany({
      where: { userId, ...this.buildWhere(query) },
      orderBy: this.buildOrderBy(query),
      include: { problem: { include: { unit: true, subUnit: true } } },
    });
    return rows.map((r) => toCardShape(r, lang));
  }

  async findOne(userId: string, id: string, lang: Lang = 'ko') {
    const n = await this.prisma.wrongNote.findFirstOrThrow({
      where: { id, userId },
      include: { problem: { include: { unit: true, subUnit: true } } },
    });
    return toCardShape(n, lang);
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
