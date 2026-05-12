import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ReportsService } from './reports.service';
import { WeeklyReportService } from './weekly-report.service';

/**
 * 명세서 §5 path 정합 — `/weekly-reports/...` (기존 `/reports/weekly/...` 별칭).
 *   - GET  /api/weekly-reports/:reportId
 *   - POST /api/weekly-reports/generate
 *   - GET  /api/weekly-reports                 (본인 목록 — 명세서 §5 §6)
 */
@UseGuards(JwtAuthGuard)
@Controller('weekly-reports')
export class WeeklyReportsAliasController {
  constructor(
    private readonly reports: ReportsService,
    private readonly weekly: WeeklyReportService,
  ) {}

  @Get()
  list(@CurrentUser('id') userId: string) {
    return this.reports.listWeekly(userId);
  }

  @Post('generate')
  generate(@CurrentUser('id') userId: string, @Body() _body: unknown) {
    return this.weekly.generate(userId);
  }

  @Get(':reportId')
  byId(@CurrentUser('id') userId: string, @Param('reportId') id: string) {
    return this.reports.weeklyById(userId, id);
  }
}
