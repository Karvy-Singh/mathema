import { Injectable, Logger } from '@nestjs/common';
import { ErrorPatternStatus, MasteryTrend } from '@prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

/**
 * WeeklyReportService — 명세서 §4 Flow 9.
 *
 *   매주 자동 생성. 입력:
 *     - 해당 주 Session / Attempt
 *     - MasteryTrajectory 변화 (MasteryEvent 시계열)
 *     - ErrorPatternProfile 변화
 *     - RecommendationLog 결과
 *     - Feedback (선택)
 *
 *   출력 3종:
 *     - studentSummary  : 긍정적 코칭, 잘한 점 + 다음 목표 1개
 *     - parentSummary   : 학습량 + 집중 시간 + 다음 주 관리 포인트
 *     - teacherSummary  : 진단 + 추천 보충 문제 + 개입 포인트 + 신뢰도
 *
 *   PoC 단계: 룰 기반 텍스트 생성 (LLM 미사용, 빠르고 결정론적).
 *   Phase 후속: LLM 으로 narrative tone 강화.
 *
 *   호출처: cron / 수동 API (POST /weekly-reports/generate).
 */

@Injectable()
export class WeeklyReportService {
  private readonly logger = new Logger(WeeklyReportService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * 한 사용자의 한 주 리포트 upsert (멱등). week='2026-W19' 형식.
   * 명시되지 않으면 이번 주 (월요일 시작).
   */
  async generate(userId: string, opts: { weekStart?: Date } = {}) {
    const { weekStart, weekEnd, isoWeek } = this.weekRange(opts.weekStart);

    const [user, attempts, sessions, mastery, errorPatterns, recommendations] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: userId }, select: { tenantId: true } }),
      this.prisma.attempt.findMany({
        where: { userId, createdAt: { gte: weekStart, lt: weekEnd } },
        include: { problem: { select: { difficultyLevel: true, source: true } } },
      }),
      this.prisma.studySession.findMany({
        where: { userId, startedAt: { gte: weekStart, lt: weekEnd } },
      }),
      this.prisma.masteryTrajectory.findMany({
        where: { userId },
        include: { concept: { select: { id: true, name: true, code: true } } },
      }),
      this.prisma.errorPatternProfile.findMany({
        where: { userId, updatedAt: { gte: weekStart, lt: weekEnd } },
        include: { concept: { select: { id: true, name: true } } },
        orderBy: { recentFrequency: 'desc' },
      }),
      this.prisma.recommendationLog.findMany({
        where: { userId, createdAt: { gte: weekStart, lt: weekEnd } },
      }),
    ]);

    if (!user) throw new Error(`user not found: ${userId}`);

    // 통계 집계
    const totalAttempts = attempts.length;
    const correctCount = attempts.filter((a) => a.isCorrect).length;
    const averageAccuracyPct = totalAttempts === 0 ? 0 : Math.round((correctCount / totalAttempts) * 100);
    const totalDurationSec = sessions.reduce((s, x) => s + (x.durationSec ?? 0), 0);
    const averageStudyDurationSec = sessions.length === 0 ? 0 : Math.round(totalDurationSec / sessions.length);
    const totalHours = Math.round((totalDurationSec / 3600) * 10) / 10;
    const problemsPerDay = Math.round(totalAttempts / 7);

    // 개선된 / 약한 concept
    const topImprovedConcepts: string[] = mastery
      .filter((m) => m.trend === MasteryTrend.UP)
      .sort((a, b) => b.masteryScore - a.masteryScore)
      .slice(0, 3)
      .map((m) => m.conceptId);
    const weakConcepts: string[] = mastery
      .filter((m) => m.masteryScore < 60 && m.evidenceCount >= 3)
      .sort((a, b) => a.masteryScore - b.masteryScore)
      .slice(0, 3)
      .map((m) => m.conceptId);
    const repeatedErrorPatterns: string[] = errorPatterns
      .filter((e) => e.status === ErrorPatternStatus.ACTIVE)
      .slice(0, 5)
      .map((e) => e.id);

    // 추천 효과
    const accepted = recommendations.filter((r) => r.accepted).length;
    const solved = recommendations.filter((r) => r.solved).length;
    const recommendationAcceptRate = recommendations.length === 0 ? 0 : Math.round((accepted / recommendations.length) * 100);

    // 다음 주 목표 — 가장 약한 1~3 concept + ACTIVE error pattern 1개.
    const recommendedNextGoals = this.buildNextGoals(mastery, errorPatterns);

    // 3종 summary (룰 기반)
    const conceptNameMap = new Map(mastery.map((m) => [m.conceptId, m.concept.name]));
    const studentSummary = this.buildStudentSummary({
      totalAttempts, averageAccuracyPct,
      improvedNames: topImprovedConcepts.map((id) => conceptNameMap.get(id) ?? ''),
      weakNames: weakConcepts.map((id) => conceptNameMap.get(id) ?? ''),
      nextGoal: recommendedNextGoals[0] ?? null,
    });
    const parentSummary = this.buildParentSummary({
      totalSessions: sessions.length, averageStudyDurationSec,
      totalAttempts, averageAccuracyPct,
      weakNames: weakConcepts.map((id) => conceptNameMap.get(id) ?? ''),
      repeatedPatternCount: repeatedErrorPatterns.length,
    });
    const teacherSummary = this.buildTeacherSummary({
      totalAttempts, averageAccuracyPct,
      weakConcepts: weakConcepts.map((id) => ({ id, name: conceptNameMap.get(id) ?? '' })),
      activeErrorPatterns: errorPatterns
        .filter((e) => e.status === ErrorPatternStatus.ACTIVE)
        .map((e) => ({ errorCode: e.errorCode, conceptName: e.concept.name, severity: e.severity })),
      recommendations: { total: recommendations.length, accepted, solved, acceptRate: recommendationAcceptRate },
    });

    return this.prisma.weeklyReport.upsert({
      where: { userId_isoWeek: { userId, isoWeek } },
      update: {
        weekEnd,
        totalHours, problemsSolved: totalAttempts,
        accuracyPct: averageAccuracyPct,
        aiScore: this.computeAiScore({ totalAttempts, averageAccuracyPct, sessions: sessions.length }),
        mentorMessage: studentSummary,
        studentSummary, parentSummary, teacherSummary,
        topImprovedConcepts, weakConcepts, repeatedErrorPatterns,
        totalSessions: sessions.length, totalAttempts,
        averageStudyDurationSec, recommendedNextGoals,
        generatedAt: new Date(),
        tenantId: user.tenantId,
      },
      create: {
        userId, tenantId: user.tenantId,
        isoWeek, weekStart, weekEnd,
        totalHours, problemsSolved: totalAttempts,
        accuracyPct: averageAccuracyPct,
        aiScore: this.computeAiScore({ totalAttempts, averageAccuracyPct, sessions: sessions.length }),
        mentorMessage: studentSummary,
        studentSummary, parentSummary, teacherSummary,
        topImprovedConcepts, weakConcepts, repeatedErrorPatterns,
        totalSessions: sessions.length, totalAttempts,
        averageStudyDurationSec, recommendedNextGoals,
      },
    });
  }

  /** ISO week 'YYYY-Www'. weekStart = 가장 가까운 직전 월요일 00:00. */
  private weekRange(opt?: Date): { weekStart: Date; weekEnd: Date; isoWeek: string } {
    const d = opt ? new Date(opt) : new Date();
    const day = (d.getDay() + 6) % 7;       // Mon=0 ... Sun=6
    const weekStart = new Date(d);
    weekStart.setHours(0, 0, 0, 0);
    weekStart.setDate(weekStart.getDate() - day);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);
    // ISO week number — Thursday rule.
    const tmp = new Date(weekStart);
    tmp.setDate(tmp.getDate() + 3);
    const year = tmp.getFullYear();
    const firstThu = new Date(year, 0, 4);
    firstThu.setDate(4 - ((firstThu.getDay() + 6) % 7));
    const week = 1 + Math.round((tmp.getTime() - firstThu.getTime()) / (7 * 24 * 60 * 60 * 1000));
    return { weekStart, weekEnd, isoWeek: `${year}-W${String(week).padStart(2, '0')}` };
  }

  private computeAiScore(s: { totalAttempts: number; averageAccuracyPct: number; sessions: number }): number {
    if (s.totalAttempts === 0) return 0;
    const baseAccuracy = s.averageAccuracyPct / 10;          // 0~10
    const volumeBonus = Math.min(2, s.totalAttempts / 30);    // 30+ 문제 = +2
    const consistencyBonus = Math.min(1, s.sessions / 5);     // 5+ 세션 = +1
    return Math.round((baseAccuracy + volumeBonus + consistencyBonus) * 10) / 10;
  }

  private buildNextGoals(
    mastery: Array<{ conceptId: string; masteryScore: number; concept: { name: string }; evidenceCount: number }>,
    patterns: Array<{ status: ErrorPatternStatus; concept: { name: string }; errorCode: string }>,
  ): string[] {
    const goals: string[] = [];
    const weakest = mastery.filter((m) => m.evidenceCount >= 3).sort((a, b) => a.masteryScore - b.masteryScore)[0];
    if (weakest) {
      goals.push(`${weakest.concept.name} 숙련도 ${Math.round(weakest.masteryScore)}% → 다음 주 +10% 목표`);
    }
    const activePattern = patterns.find((p) => p.status === ErrorPatternStatus.ACTIVE);
    if (activePattern) {
      goals.push(`${activePattern.concept.name} 의 ${activePattern.errorCode} 오류 줄이기 (단계별 풀이 입력 습관)`);
    }
    return goals.slice(0, 3);
  }

  private buildStudentSummary(s: {
    totalAttempts: number; averageAccuracyPct: number;
    improvedNames: string[]; weakNames: string[]; nextGoal: string | null;
  }): string {
    if (s.totalAttempts === 0) {
      return '이번 주 학습 데이터가 없네요. 한 문제부터 시작해 봅시다.';
    }
    const parts: string[] = [];
    parts.push(`이번 주 ${s.totalAttempts}문제 풀이, 정답률 ${s.averageAccuracyPct}%.`);
    if (s.improvedNames.length > 0) {
      parts.push(`${s.improvedNames[0]} 가 눈에 띄게 안정됐어요.`);
    }
    if (s.nextGoal) {
      parts.push(`다음 목표: ${s.nextGoal}`);
    } else if (s.weakNames.length > 0) {
      parts.push(`다음 주는 ${s.weakNames[0]} 에 시간을 좀 더 써볼게요.`);
    }
    return parts.join(' ');
  }

  private buildParentSummary(s: {
    totalSessions: number; averageStudyDurationSec: number;
    totalAttempts: number; averageAccuracyPct: number;
    weakNames: string[]; repeatedPatternCount: number;
  }): string {
    const minPerSession = Math.round(s.averageStudyDurationSec / 60);
    const parts: string[] = [
      `이번 주 학습 횟수 ${s.totalSessions}회, 평균 ${minPerSession}분/회.`,
      `푼 문제 ${s.totalAttempts}개, 정답률 ${s.averageAccuracyPct}%.`,
    ];
    if (s.weakNames.length > 0) parts.push(`주요 취약 단원: ${s.weakNames.join(', ')}.`);
    if (s.repeatedPatternCount > 0) parts.push(`반복 실수 패턴 ${s.repeatedPatternCount}건이 active 상태입니다.`);
    return parts.join(' ');
  }

  private buildTeacherSummary(s: {
    totalAttempts: number; averageAccuracyPct: number;
    weakConcepts: Array<{ id: string; name: string }>;
    activeErrorPatterns: Array<{ errorCode: string; conceptName: string; severity: string }>;
    recommendations: { total: number; accepted: number; solved: number; acceptRate: number };
  }): string {
    const parts: string[] = [
      `학생 주간 정답률 ${s.averageAccuracyPct}% (${s.totalAttempts}문제).`,
    ];
    if (s.weakConcepts.length > 0) {
      parts.push(`취약 단원: ${s.weakConcepts.map((c) => c.name).join(', ')}.`);
    }
    if (s.activeErrorPatterns.length > 0) {
      const top = s.activeErrorPatterns[0];
      parts.push(`주요 오답 원인: ${top.conceptName} 의 ${top.errorCode} (${top.severity}).`);
    }
    parts.push(`AI 추천 ${s.recommendations.total}건 — 수락 ${s.recommendations.acceptRate}%, 해결 ${s.recommendations.solved}건.`);
    parts.push(`Teacher Override 필요 여부는 ErrorPattern severity / 추천 수락률 결합 후 판단을 권장합니다.`);
    return parts.join(' ');
  }
}
