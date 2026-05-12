import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { MasteryTrajectoryService } from '../mastery/mastery-trajectory.service';
import { ErrorPatternService } from '../mastery/error-pattern.service';

/**
 * StudentsService — 명세서 §5 `/students/:studentId/...` 패턴의 권한 분리.
 *
 *   접근 규칙:
 *     - 자기 자신 (requester.id == studentId)  → 항상 허용
 *     - TEACHER : 같은 tenantId 의 STUDENT 만   → 허용
 *     - PARENT  : childOfUserId == studentId    → 허용
 *     - ADMIN   : 모두 허용
 *     - 그 외   → ForbiddenException
 *
 *   teacher/parent 가 학생 데이터를 보려면 매번 권한 게이트를 거친다.
 */
@Injectable()
export class StudentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly trajectory: MasteryTrajectoryService,
    private readonly errorPattern: ErrorPatternService,
  ) {}

  /** Teacher 가 보는 담당 학생 리스트 (같은 tenantId 의 STUDENT). */
  async listStudentsForTeacher(teacherUserId: string) {
    const teacher = await this.prisma.user.findUnique({
      where: { id: teacherUserId },
      select: { role: true, tenantId: true },
    });
    if (!teacher || (teacher.role !== UserRole.TEACHER && teacher.role !== UserRole.ADMIN)) {
      throw new ForbiddenException('Teacher role required');
    }
    if (!teacher.tenantId && teacher.role !== UserRole.ADMIN) {
      // tenant 없는 teacher → 비어있음 (solo)
      return [];
    }
    return this.prisma.user.findMany({
      where: {
        role: UserRole.STUDENT,
        deletedAt: null,
        ...(teacher.tenantId ? { tenantId: teacher.tenantId } : {}),
      },
      select: {
        id: true, name: true, email: true, gradeLevel: true, schoolLevel: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * 학생 데이터 접근 게이트. 권한 없으면 throw.
   * @returns student User row (만일 통과).
   */
  async assertAccess(requesterId: string, targetStudentId: string) {
    if (requesterId === targetStudentId) {
      return this.prisma.user.findUniqueOrThrow({ where: { id: targetStudentId } });
    }
    const requester = await this.prisma.user.findUnique({
      where: { id: requesterId },
      select: { id: true, role: true, tenantId: true },
    });
    if (!requester) throw new ForbiddenException('Requester not found');

    if (requester.role === UserRole.ADMIN) {
      return this.prisma.user.findUniqueOrThrow({ where: { id: targetStudentId } });
    }
    const target = await this.prisma.user.findUnique({ where: { id: targetStudentId } });
    if (!target) throw new NotFoundException('Student not found');

    if (requester.role === UserRole.TEACHER) {
      if (requester.tenantId && requester.tenantId === target.tenantId) return target;
    }
    if (requester.role === UserRole.PARENT) {
      // PARENT 의 childOfUserId 가 target.id 이어야 함 — 즉 부모.childOfUserId = 자녀.id 매핑.
      const parent = await this.prisma.user.findUnique({
        where: { id: requesterId }, select: { childOfUserId: true },
      });
      if (parent?.childOfUserId === target.id) return target;
    }
    throw new ForbiddenException('Cannot access this student');
  }

  // ---- 학생별 자료 조회 (접근 검증 후) ----

  async getMastery(requesterId: string, studentId: string) {
    await this.assertAccess(requesterId, studentId);
    return this.trajectory.getAllForUser(studentId);
  }

  async getMasteryHistory(requesterId: string, studentId: string, conceptId: string, take = 30) {
    await this.assertAccess(requesterId, studentId);
    return this.trajectory.getHistory(studentId, conceptId, take);
  }

  async getErrorPatterns(requesterId: string, studentId: string) {
    await this.assertAccess(requesterId, studentId);
    return this.errorPattern.getActiveForUser(studentId);
  }

  async getSessions(requesterId: string, studentId: string, take = 30) {
    await this.assertAccess(requesterId, studentId);
    return this.prisma.studySession.findMany({
      where: { userId: studentId },
      orderBy: { startedAt: 'desc' },
      take,
    });
  }

  async getAttempts(requesterId: string, studentId: string, take = 50) {
    await this.assertAccess(requesterId, studentId);
    return this.prisma.attempt.findMany({
      where: { userId: studentId },
      orderBy: { createdAt: 'desc' },
      take,
      include: { problem: { select: { id: true, source: true, difficultyLevel: true } } },
    });
  }

  async getWeeklyReports(requesterId: string, studentId: string) {
    await this.assertAccess(requesterId, studentId);
    return this.prisma.weeklyReport.findMany({
      where: { userId: studentId },
      orderBy: { weekStart: 'desc' },
    });
  }

  async getTeacherOverrides(requesterId: string, studentId: string) {
    await this.assertAccess(requesterId, studentId);
    return this.prisma.teacherOverride.findMany({
      where: { userId: studentId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
