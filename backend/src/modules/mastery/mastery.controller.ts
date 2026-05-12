import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { MasteryService } from './mastery.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CurrentLang, Lang } from '../../common/i18n/current-lang.decorator';
import { MasteryTrajectoryService } from './mastery-trajectory.service';
import { ErrorPatternService } from './error-pattern.service';

@UseGuards(JwtAuthGuard)
@Controller('mastery')
export class MasteryController {
  constructor(
    private readonly service: MasteryService,
    private readonly trajectory: MasteryTrajectoryService,
    private readonly errorPattern: ErrorPatternService,
  ) {}

  // ---- 기존 (Unit 단위, 호환 유지) ----
  @Get()
  all(@CurrentUser('id') userId: string, @CurrentLang() lang: Lang) {
    return this.service.all(userId, lang);
  }

  @Get('unit/:unitId')
  byUnit(@CurrentUser('id') userId: string, @Param('unitId') unitId: string) {
    return this.service.byUnit(userId, unitId);
  }

  // ---- 신규: 명세서 §5 — concept 단위 ----

  /** 명세서 §5 — GET /api/students/:studentId/mastery (concept 단위). */
  @Get('trajectory')
  conceptTrajectory(@CurrentUser('id') userId: string) {
    return this.trajectory.getAllForUser(userId);
  }

  /** 명세서 §5 — GET /api/students/:studentId/mastery/:conceptId/history. */
  @Get('trajectory/:conceptId/history')
  conceptHistory(
    @CurrentUser('id') userId: string,
    @Param('conceptId') conceptId: string,
    @Query('take') take?: string,
  ) {
    return this.trajectory.getHistory(userId, conceptId, take ? parseInt(take, 10) : 30);
  }

  /** 명세서 §5 — GET /api/students/:studentId/error-patterns. */
  @Get('error-patterns')
  errorPatterns(@CurrentUser('id') userId: string) {
    return this.errorPattern.getActiveForUser(userId);
  }

  /** 명세서 §5 — GET /api/students/:studentId/error-patterns/active. */
  @Get('error-patterns/active')
  activeErrorPatterns(@CurrentUser('id') userId: string) {
    return this.errorPattern.getActiveForUser(userId);
  }
}
