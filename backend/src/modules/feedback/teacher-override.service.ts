import { Injectable } from '@nestjs/common';
import { MasteryUpdateSource, TeacherOverrideTargetType } from '@prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

/**
 * TeacherOverrideService — 명세서 §3 TeacherOverride / §10 "강사용 수정 기능 없이 AI 판단만 절대화 X".
 *
 *   강사가 AI 판단(MasteryTrajectory / ErrorPatternProfile / RecommendationLog)을
 *   덮어쓸 수 있다. 변경 전/후 값을 모두 저장 (감사 추적).
 *
 *   예시 시나리오:
 *     - MASTERY      : "이 학생은 mastery 50% 가 아니라 70% 다" (수업 관찰)
 *     - ERROR_PATTERN: "이 학생은 개념 부족이 아니라 부호 실수가 반복되는 상태"
 *     - RECOMMENDATION: "이 추천 대신 다른 문제를 풀게 한다"
 */
@Injectable()
export class TeacherOverrideService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 강사 권한 검증은 controller 의 guard 에서 수행. 여기는 비즈니스 로직만.
   */
  async apply(input: {
    teacherId: string;
    studentUserId: string;
    targetType: TeacherOverrideTargetType;
    targetId: string;
    afterValue: Record<string, unknown>;
    reason: string;
  }) {
    // 1) 현재 값 조회 (beforeValue)
    const before = await this.fetchTarget(input.targetType, input.targetId);
    if (!before) throw new Error(`Target not found: ${input.targetType}:${input.targetId}`);

    // 2) 대상 row 갱신 (각 모델에 맞게)
    await this.applyToTarget(input.targetType, input.targetId, input.afterValue);

    // 3) 감사 기록.
    const tenantId =
      (before as any).tenantId ??
      (await this.prisma.user.findUnique({
        where: { id: input.studentUserId }, select: { tenantId: true },
      }))?.tenantId ?? null;

    return this.prisma.teacherOverride.create({
      data: {
        teacherId: input.teacherId,
        userId: input.studentUserId,
        tenantId,
        targetType: input.targetType,
        targetId: input.targetId,
        beforeValue: before as any,
        afterValue: input.afterValue as any,
        reason: input.reason,
      },
    });
  }

  listForStudent(studentUserId: string) {
    return this.prisma.teacherOverride.findMany({
      where: { userId: studentUserId },
      orderBy: { createdAt: 'desc' },
    });
  }

  private fetchTarget(type: TeacherOverrideTargetType, id: string) {
    if (type === 'MASTERY')        return this.prisma.masteryTrajectory.findUnique({ where: { id } });
    if (type === 'ERROR_PATTERN')  return this.prisma.errorPatternProfile.findUnique({ where: { id } });
    if (type === 'RECOMMENDATION') return this.prisma.recommendationLog.findUnique({ where: { id } });
    return null;
  }

  private async applyToTarget(type: TeacherOverrideTargetType, id: string, after: Record<string, unknown>) {
    if (type === 'MASTERY') {
      const data: any = { updatedBy: MasteryUpdateSource.TEACHER_OVERRIDE };
      if (typeof after.masteryScore === 'number') data.masteryScore = after.masteryScore;
      if (after.trend) data.trend = after.trend;
      return this.prisma.masteryTrajectory.update({ where: { id }, data });
    }
    if (type === 'ERROR_PATTERN') {
      const data: any = {};
      if (after.status) data.status = after.status;
      if (after.severity) data.severity = after.severity;
      if (after.llmSummary) data.llmSummary = after.llmSummary;
      return this.prisma.errorPatternProfile.update({ where: { id }, data });
    }
    if (type === 'RECOMMENDATION') {
      const data: any = {};
      if (after.reason) data.reason = after.reason;
      if (typeof after.expectedDifficulty === 'number') data.expectedDifficulty = after.expectedDifficulty;
      return this.prisma.recommendationLog.update({ where: { id }, data });
    }
    throw new Error(`Unknown targetType: ${type}`);
  }
}
