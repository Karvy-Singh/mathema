import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { RecommendationsService } from './recommendations.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CurrentLang, Lang } from '../../common/i18n/current-lang.decorator';

@UseGuards(JwtAuthGuard)
@Controller('recommendations')
export class RecommendationsController {
  constructor(private readonly service: RecommendationsService) {}

  @Get('today')
  today(@CurrentUser('id') userId: string, @CurrentLang() lang: Lang) {
    return this.service.today(userId, lang);
  }

  /** 단원별 공부 시간 균형 분석 — Weakness Dashboard 의 데이터 원천. */
  @Get('balance')
  balance(@CurrentUser('id') userId: string, @CurrentLang() lang: Lang) {
    return this.service.balanceAnalysis(userId, lang);
  }

  /**
   * LangChain adaptive plan — weakness + 시간 균형 동시 고려.
   * `?minutes=60` 으로 가용 학습 시간 지정 (기본 45). LLM 호출이므로 latency 2~5s.
   */
  @Get('adaptive')
  adaptive(
    @CurrentUser('id') userId: string,
    @CurrentLang() lang: Lang,
    @Query('minutes') minutes?: string,
  ) {
    const m = minutes ? Math.max(15, Math.min(120, parseInt(minutes, 10))) : 45;
    return this.service.adaptivePlan(userId, lang, m);
  }
}
