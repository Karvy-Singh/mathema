import { Controller, Get, Param, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AdminGuard } from '../../common/guards/admin.guard';
import { AdminAuditInterceptor } from './admin-audit.interceptor';
import { CurrentLang, Lang } from '../../common/i18n/current-lang.decorator';

@UseGuards(JwtAuthGuard, AdminGuard)
@UseInterceptors(AdminAuditInterceptor)
@Controller('admin')
export class AdminController {
  constructor(private readonly service: AdminService) {}

  @Get('overview')        overview() { return this.service.overview(); }
  @Get('users')           users(@Query('limit') limit = 100) { return this.service.listUsers(+limit); }
  @Get('users/:id')       user(@CurrentLang() lang: Lang, @Param('id') id: string) {
    return this.service.userDetail(id, lang);
  }
  @Get('events')          events(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('type') type?: string,
    @Query('userId') userId?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.events({ from, to, type, userId, limit: limit ? +limit : undefined });
  }
  @Get('dau')             dau(@Query('days') days = 30) { return this.service.dailyActives(+days); }
  @Get('users-by-country') usersByCountry() { return this.service.usersByCountry(); }
  @Get('content/coverage') contentCoverage(@CurrentLang() lang: Lang) {
    return this.service.contentCoverage(lang);
  }
  @Get('insights/distractors') distractors(@CurrentLang() lang: Lang, @Query('days') days = 30) {
    return this.service.distractorInsights(+days, lang);
  }
  @Get('push/health')      pushHealth() { return this.service.pushHealth(); }

  /**
   * 어드민 감사 로그 — 누가 언제 어떤 데이터에 접근했는지.
   * 본인 호출도 기록되므로 무한히 증가하진 않게 자주 archive 권장 (추후 운영).
   */
  @Get('audit-logs')
  auditLogs(
    @Query('limit') limit?: string,
    @Query('email') email?: string,
    @Query('path') path?: string,
  ) {
    return this.service.auditLogs({ limit: limit ? +limit : 200, email, path });
  }
}
