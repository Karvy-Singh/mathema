import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CurrentLang, Lang } from '../../common/i18n/current-lang.decorator';

@UseGuards(JwtAuthGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly service: ReportsService) {}

  // 헤더 4 stat: 주간 학습시간 / 푼 문제 / 정답률 / AI 종합 점수
  @Get('weekly/current')
  current(@CurrentUser('id') userId: string) { return this.service.current(userId); }

  @Get('weekly/time-vs-accuracy')
  timeVsAccuracy(@CurrentUser('id') userId: string, @Query('weeks') weeks = 8) {
    return this.service.timeVsAccuracy(userId, +weeks);
  }

  @Get('weekly/next-focus')
  nextFocus(@CurrentUser('id') userId: string, @CurrentLang() lang: Lang) {
    return this.service.nextFocus(userId, lang);
  }

  @Get('weekly/achievements')
  achievements(@CurrentUser('id') userId: string, @CurrentLang() lang: Lang) {
    return this.service.achievements(userId, lang);
  }

  // 메타인지 캘리브레이션 — confidence vs 실제 정답률
  @Get('calibration')
  calibration(@CurrentUser('id') userId: string, @CurrentLang() lang: Lang) {
    return this.service.calibration(userId, lang);
  }

  @Get('weekly/:isoWeek')
  byWeek(@CurrentUser('id') userId: string, @Param('isoWeek') week: string) {
    return this.service.byWeek(userId, week);
  }
}
