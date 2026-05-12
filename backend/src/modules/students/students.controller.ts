import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { StudentsService } from './students.service';

/**
 * 명세서 §5 — `/api/students/:studentId/...` path 표준.
 *
 *   권한: 자기 자신 / TEACHER (같은 tenant) / PARENT (childOfUserId) / ADMIN.
 *   StudentsService.assertAccess 가 모든 호출에서 검증.
 */
@UseGuards(JwtAuthGuard)
@Controller('students')
export class StudentsController {
  constructor(private readonly service: StudentsService) {}

  /** 명세서 §6 강사 UI — 담당 학생 리스트. */
  @Get('teacher/list')
  listForTeacher(@CurrentUser('id') userId: string) {
    return this.service.listStudentsForTeacher(userId);
  }

  // ---- 명세서 §5 — /api/students/:studentId/... ----

  /** GET /api/students/:studentId/mastery */
  @Get(':studentId/mastery')
  mastery(@CurrentUser('id') userId: string, @Param('studentId') sid: string) {
    return this.service.getMastery(userId, sid);
  }

  /** GET /api/students/:studentId/mastery/:conceptId/history */
  @Get(':studentId/mastery/:conceptId/history')
  masteryHistory(
    @CurrentUser('id') userId: string,
    @Param('studentId') sid: string,
    @Param('conceptId') cid: string,
    @Query('take') take?: string,
  ) {
    return this.service.getMasteryHistory(userId, sid, cid, take ? parseInt(take, 10) : 30);
  }

  /** GET /api/students/:studentId/error-patterns */
  @Get(':studentId/error-patterns')
  errorPatterns(@CurrentUser('id') userId: string, @Param('studentId') sid: string) {
    return this.service.getErrorPatterns(userId, sid);
  }

  /** GET /api/students/:studentId/error-patterns/active */
  @Get(':studentId/error-patterns/active')
  errorPatternsActive(@CurrentUser('id') userId: string, @Param('studentId') sid: string) {
    return this.service.getErrorPatterns(userId, sid);
  }

  /** GET /api/students/:studentId/sessions */
  @Get(':studentId/sessions')
  sessions(@CurrentUser('id') userId: string, @Param('studentId') sid: string, @Query('take') take?: string) {
    return this.service.getSessions(userId, sid, take ? parseInt(take, 10) : 30);
  }

  /** GET /api/students/:studentId/attempts */
  @Get(':studentId/attempts')
  attempts(@CurrentUser('id') userId: string, @Param('studentId') sid: string, @Query('take') take?: string) {
    return this.service.getAttempts(userId, sid, take ? parseInt(take, 10) : 50);
  }

  /** GET /api/students/:studentId/weekly-reports */
  @Get(':studentId/weekly-reports')
  weeklyReports(@CurrentUser('id') userId: string, @Param('studentId') sid: string) {
    return this.service.getWeeklyReports(userId, sid);
  }

  /** GET /api/students/:studentId/teacher-overrides */
  @Get(':studentId/teacher-overrides')
  teacherOverrides(@CurrentUser('id') userId: string, @Param('studentId') sid: string) {
    return this.service.getTeacherOverrides(userId, sid);
  }
}
