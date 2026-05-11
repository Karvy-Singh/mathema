import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { Lang } from '../../common/i18n/current-lang.decorator';
import { UNIT_NAME_EN } from '../../common/i18n/content-en';

const localizeUnit = (name: string | undefined | null, lang: Lang) =>
  lang === 'en' ? (name && UNIT_NAME_EN[name]) || name || '—' : name || '—';

/**
 * 관리자 데이터 — 전체 사용자/시스템 통계 + 개별 사용자 상세.
 * 모든 메서드는 read-only.
 */
@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  // ===== 시스템 전체 개요 =====
  async overview() {
    const now = new Date();
    const day7 = new Date(now); day7.setDate(day7.getDate() - 7);
    const day30 = new Date(now); day30.setDate(day30.getDate() - 30);

    const [
      totalUsers, activeUsers7d, totalAttempts, attemptsLast7d, attemptsLast30d,
      totalProblems, totalUnits, totalWrongNotes, masteredWrongNotes,
      totalMockResults, totalAnalyticsEvents,
    ] = await Promise.all([
      this.prisma.user.count({ where: { deletedAt: null } }),
      this.prisma.user.count({
        where: { deletedAt: null, attempts: { some: { createdAt: { gte: day7 } } } },
      }),
      this.prisma.attempt.count(),
      this.prisma.attempt.count({ where: { createdAt: { gte: day7 } } }),
      this.prisma.attempt.count({ where: { createdAt: { gte: day30 } } }),
      this.prisma.problem.count(),
      this.prisma.unit.count(),
      this.prisma.wrongNote.count(),
      this.prisma.wrongNote.count({ where: { status: 'MASTERED' } }),
      this.prisma.mockExamResult.count(),
      this.prisma.analyticsEvent.count(),
    ]);

    const recentSignups = await this.prisma.user.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, email: true, name: true, gradeLevel: true, createdAt: true } as any,
    });

    const accuracyAgg = await this.prisma.attempt.groupBy({
      by: ['isCorrect'], _count: true,
    });
    const correct = accuracyAgg.find((x) => x.isCorrect)?._count ?? 0;
    const wrong = accuracyAgg.find((x) => !x.isCorrect)?._count ?? 0;
    const overallAccuracy = correct + wrong > 0 ? Math.round((correct / (correct + wrong)) * 100) : 0;

    return {
      totalUsers, activeUsers7d, overallAccuracy,
      totalAttempts, attemptsLast7d, attemptsLast30d,
      totalProblems, totalUnits, totalWrongNotes, masteredWrongNotes,
      totalMockResults, totalAnalyticsEvents,
      recentSignups,
    };
  }

  // ===== 사용자 목록 + 핵심 지표 =====
  async listUsers(limit = 100) {
    const users = await this.prisma.user.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' }, take: limit,
      select: {
        id: true, email: true, name: true,
        examDate: true, targetGrade: true,
        createdAt: true, updatedAt: true,
        gradeLevel: true,
      } as any,
    });
    if (users.length === 0) return [];

    const ids: string[] = users.map((u: any) => u.id);
    const [attempts, masteries, wrongNotes, mockResults, lastAttempts] = await Promise.all([
      this.prisma.attempt.groupBy({ by: ['userId', 'isCorrect'], where: { userId: { in: ids } }, _count: true }),
      this.prisma.masterySnapshot.groupBy({ by: ['userId'], where: { userId: { in: ids } }, _avg: { score: true }, _count: true }),
      this.prisma.wrongNote.groupBy({ by: ['userId', 'status'], where: { userId: { in: ids } }, _count: true }),
      this.prisma.mockExamResult.groupBy({ by: ['userId'], where: { userId: { in: ids } }, _count: true, _avg: { score: true } }),
      this.prisma.attempt.findMany({
        where: { userId: { in: ids } },
        orderBy: { createdAt: 'desc' }, distinct: ['userId'],
        select: { userId: true, createdAt: true },
      }),
    ]);

    const byUser = new Map<string, any>();
    (users as any[]).forEach((u) => byUser.set(u.id, {
      ...u, attemptsTotal: 0, attemptsCorrect: 0, accuracy: 0,
      masteryAvg: null as number | null, masteryCount: 0,
      wrongNotesTotal: 0, wrongNotesMastered: 0,
      mockExamCount: 0, mockExamAvgScore: null as number | null,
      lastActivityAt: null as Date | null,
    }));
    for (const a of attempts) {
      const r = byUser.get(a.userId); if (!r) continue;
      r.attemptsTotal += a._count;
      if (a.isCorrect) r.attemptsCorrect += a._count;
    }
    for (const r of byUser.values()) {
      r.accuracy = r.attemptsTotal > 0 ? Math.round((r.attemptsCorrect / r.attemptsTotal) * 100) : 0;
    }
    for (const m of masteries) {
      const r = byUser.get(m.userId); if (!r) continue;
      r.masteryAvg = m._avg.score != null ? Math.round(m._avg.score) : null;
      r.masteryCount = m._count;
    }
    for (const w of wrongNotes) {
      const r = byUser.get(w.userId); if (!r) continue;
      r.wrongNotesTotal += w._count;
      if (w.status === 'MASTERED') r.wrongNotesMastered += w._count;
    }
    for (const m of mockResults) {
      const r = byUser.get(m.userId); if (!r) continue;
      r.mockExamCount = m._count;
      r.mockExamAvgScore = m._avg.score != null ? Math.round(m._avg.score) : null;
    }
    for (const a of lastAttempts) {
      const r = byUser.get(a.userId); if (!r) continue;
      r.lastActivityAt = a.createdAt;
    }
    return Array.from(byUser.values());
  }

  // ===== 사용자 상세 =====
  async userDetail(userId: string, lang: Lang = 'ko') {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, email: true, name: true, examDate: true, targetGrade: true,
        gradeLevel: true, createdAt: true, updatedAt: true, deletedAt: true,
      } as any,
    });
    if (!user) throw new NotFoundException('user not found');

    const [mastery, recentAttempts, wrongNotes, mockResults, dailyActivity, weeklyReports, recentEvents] = await Promise.all([
      this.prisma.masterySnapshot.findMany({
        where: { userId }, include: { unit: true }, orderBy: { score: 'asc' },
      }),
      this.prisma.attempt.findMany({
        where: { userId }, orderBy: { createdAt: 'desc' }, take: 50,
        include: {
          problem: { select: { source: true, difficulty: true, unit: { select: { name: true } } } },
          choice: { select: { choiceIndex: true, isCorrect: true, distractorType: true } },
        },
      }),
      this.prisma.wrongNote.findMany({
        where: { userId }, orderBy: { createdAt: 'desc' },
        include: { problem: { select: { source: true, body: true, unit: { select: { name: true } }, subUnit: { select: { name: true } } } } },
      }),
      this.prisma.mockExamResult.findMany({
        where: { userId }, orderBy: { takenAt: 'desc' }, include: { mockExam: true },
      }),
      this.prisma.dailyActivity.findMany({
        where: { userId }, orderBy: { date: 'desc' }, take: 90,
      }),
      this.prisma.weeklyReport.findMany({
        where: { userId }, orderBy: { weekStart: 'desc' }, take: 12,
      }),
      this.prisma.analyticsEvent.findMany({
        where: { userId }, orderBy: { createdAt: 'desc' }, take: 100,
      }),
    ]);

    // 단원명 lang 적용 — mastery / attempts / wrongNotes 모두
    const masteryL = mastery.map((m: any) => ({ ...m, unit: { ...m.unit, name: localizeUnit(m.unit?.name, lang) } }));
    const attemptsL = recentAttempts.map((a: any) => ({
      ...a,
      problem: { ...a.problem, unit: a.problem.unit ? { ...a.problem.unit, name: localizeUnit(a.problem.unit.name, lang) } : null },
    }));
    const wrongL = wrongNotes.map((w: any) => ({
      ...w,
      problem: {
        ...w.problem,
        unit: w.problem.unit ? { ...w.problem.unit, name: localizeUnit(w.problem.unit.name, lang) } : null,
      },
    }));
    return { user, mastery: masteryL, recentAttempts: attemptsL, wrongNotes: wrongL, mockResults, dailyActivity, weeklyReports, recentEvents };
  }

  // ===== Analytics 이벤트 (모든 사용자) =====
  async events(params: { from?: string; to?: string; type?: string; userId?: string; limit?: number }) {
    const where: any = {};
    if (params.userId) where.userId = params.userId;
    if (params.type) where.eventType = params.type;
    if (params.from || params.to) {
      where.createdAt = {};
      if (params.from) where.createdAt.gte = new Date(params.from);
      if (params.to) where.createdAt.lte = new Date(params.to);
    }
    const limit = Math.min(500, Math.max(10, params.limit ?? 100));
    const [items, byType] = await Promise.all([
      this.prisma.analyticsEvent.findMany({
        where, orderBy: { createdAt: 'desc' }, take: limit,
        include: { user: { select: { email: true, name: true } } },
      }),
      this.prisma.analyticsEvent.groupBy({
        by: ['eventType'], where, _count: true,
      } as any),
    ]);
    return { items, byType };
  }

  // ===== 국가별 사용자 분포 — Phase 2/3 확장 모니터링 =====
  async usersByCountry() {
    const rows = await this.prisma.user.groupBy({
      by: ['country'] as any, where: { deletedAt: null }, _count: true,
    } as any);
    return (rows as any[]).sort((a, b) => b._count - a._count);
  }

  // ===== 콘텐츠 커버리지 — Class × Unit × (problems / stepped / with concept / with formula) =====
  async contentCoverage(lang: Lang = 'ko') {
    const units = await this.prisma.unit.findMany({
      orderBy: { order: 'asc' },
      include: { problems: { include: { _count: { select: { steps: true } } } } },
    });

    const result = units.map((u: any) => {
      const total = u.problems.length;
      const stepped = u.problems.filter((p: any) => p._count.steps >= 3).length;
      const withConcept = u.problems.filter((p: any) => !!p.concept).length;
      const withFormula = u.problems.filter((p: any) => !!p.formula).length;
      const byDifficulty: Record<string, number> = {};
      for (const p of u.problems) byDifficulty[p.difficulty] = (byDifficulty[p.difficulty] ?? 0) + 1;
      return {
        unitId: u.id,
        unitName: localizeUnit(u.name, lang),
        gradeLevels: u.gradeLevels ?? [],
        order: u.order,
        problems: total,
        stepped,
        withConcept,
        withFormula,
        byDifficulty,
        gapToTarget: Math.max(0, 20 - total),
      };
    });

    // 학년별 요약
    const grades = ['G_MIDDLE_1', 'G_MIDDLE_2', 'G_MIDDLE_3', 'G_HIGH_1', 'G_HIGH_2', 'G_HIGH_3'];
    const summary = grades.map((g) => {
      const inGrade = result.filter((u) => (u.gradeLevels as string[]).includes(g));
      const total = inGrade.reduce((s, u) => s + u.problems, 0);
      const stepped = inGrade.reduce((s, u) => s + u.stepped, 0);
      const target = inGrade.length * 20;
      return {
        grade: g, units: inGrade.length, problems: total, stepped, target,
        coverage: target > 0 ? Math.round((total / target) * 100) : 0,
      };
    });

    return { units: result, summary };
  }

  // ===== Distractor 선택 분포 — 콘텐츠 품질 + 학습자 misconception 시그널 =====
  async distractorInsights(days = 30, lang: Lang = 'ko') {
    const since = new Date(); since.setDate(since.getDate() - days);
    const wrongAttempts = await this.prisma.attempt.findMany({
      where: { isCorrect: false, choiceId: { not: null }, createdAt: { gte: since } },
      include: {
        choice: { select: { distractorType: true, rationale: true, step: { select: { stepType: true } } } },
        problem: { select: { source: true, unit: { select: { name: true } } } },
      },
    });

    const totalWrong = wrongAttempts.length;
    const byType: Record<string, number> = {};
    const byStepType: Record<string, number> = {};
    const byUnit: Record<string, { unit: string; total: number; byType: Record<string, number> }> = {};

    for (const a of wrongAttempts) {
      const dt = a.choice?.distractorType ?? 'UNCLASSIFIED';
      const st = a.choice?.step?.stepType ?? 'UNKNOWN';
      const unitName = localizeUnit(a.problem.unit?.name, lang);
      byType[dt] = (byType[dt] ?? 0) + 1;
      byStepType[`${st}/${dt}`] = (byStepType[`${st}/${dt}`] ?? 0) + 1;
      const u = byUnit[unitName] ?? (byUnit[unitName] = { unit: unitName, total: 0, byType: {} });
      u.total += 1;
      u.byType[dt] = (u.byType[dt] ?? 0) + 1;
    }

    // 가장 많이 선택된 distractor (rationale 샘플 포함) — 콘텐츠 검수용
    const choiceCounts = new Map<string, number>();
    for (const a of wrongAttempts) {
      if (!a.choiceId) continue;
      choiceCounts.set(a.choiceId, (choiceCounts.get(a.choiceId) ?? 0) + 1);
    }
    const topIds = [...choiceCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([id]) => id);
    const topChoices = topIds.length === 0 ? [] : await this.prisma.problemChoice.findMany({
      where: { id: { in: topIds } },
      select: {
        id: true, text: true, distractorType: true, rationale: true,
        step: { select: { stepType: true, problem: { select: { source: true, unit: { select: { name: true } } } } } },
      },
    });
    const topDistractors = topChoices
      .map((c: any) => ({
        choiceId: c.id,
        text: c.text,
        distractorType: c.distractorType,
        rationale: c.rationale,
        unit: localizeUnit(c.step?.problem?.unit?.name, lang),
        source: c.step?.problem?.source ?? '—',
        stepType: c.step?.stepType ?? '—',
        count: choiceCounts.get(c.id) ?? 0,
      }))
      .sort((a, b) => b.count - a.count);

    return {
      windowDays: days,
      totalWrong,
      byType: Object.entries(byType).sort((a, b) => b[1] - a[1]).map(([k, v]) => ({ key: k, count: v, share: totalWrong ? Math.round((v / totalWrong) * 100) : 0 })),
      byStepType: Object.entries(byStepType).sort((a, b) => b[1] - a[1]).map(([k, v]) => ({ key: k, count: v })),
      byUnit: Object.values(byUnit).sort((a, b) => b.total - a.total),
      topDistractors,
    };
  }

  // ===== 푸시 헬스 — DeviceToken 활성 / 비활성 / 플랫폼별 =====
  async pushHealth() {
    const [total, active, disabled, byPlatform, recentSent] = await Promise.all([
      this.prisma.deviceToken.count(),
      this.prisma.deviceToken.count({ where: { disabledAt: null } }),
      this.prisma.deviceToken.count({ where: { disabledAt: { not: null } } }),
      this.prisma.deviceToken.groupBy({
        by: ['platform'], _count: true,
      } as any),
      this.prisma.deviceToken.findMany({
        where: { disabledAt: null }, orderBy: { lastSentAt: 'desc' }, take: 10,
        include: { user: { select: { email: true, name: true } } },
      }),
    ]);
    return { total, active, disabled, byPlatform, recentSent };
  }

  // ===== 어드민 감사 로그 =====
  async auditLogs(params: { limit?: number; email?: string; path?: string }) {
    const where: any = {};
    if (params.email) where.adminEmail = params.email;
    if (params.path) where.path = { contains: params.path };
    const limit = Math.min(1000, Math.max(10, params.limit ?? 200));
    const items = await (this.prisma as any).adminAccessLog.findMany({
      where, orderBy: { createdAt: 'desc' }, take: limit,
    });
    const byEmail = await (this.prisma as any).adminAccessLog.groupBy({
      by: ['adminEmail'], _count: true,
    });
    return { items, byEmail };
  }

  // ===== 일별 활성 사용자 (최근 N일) =====
  async dailyActives(days = 30) {
    const since = new Date(); since.setDate(since.getDate() - days);
    const acts = await this.prisma.dailyActivity.findMany({
      where: { date: { gte: since }, intensity: { gt: 0 } },
      select: { userId: true, date: true },
    });
    const map = new Map<string, Set<string>>();
    for (const a of acts) {
      const key = a.date.toISOString().slice(0, 10);
      if (!map.has(key)) map.set(key, new Set());
      map.get(key)!.add(a.userId);
    }
    return Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, set]) => ({ date, dau: set.size }));
  }
}
