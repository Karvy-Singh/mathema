import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { RecommendationsService } from './recommendations.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CurrentLang, Lang } from '../../common/i18n/current-lang.decorator';
import { AdaptiveNextProblemService } from './services/adaptive-next-problem.service';
import { SimilarProblemService } from './services/similar-problem.service';
import { ReviewScheduleService } from './services/review-schedule.service';
import { RecommendationMetricsService } from './services/recommendation-metrics.service';

@UseGuards(JwtAuthGuard)
@Controller('recommendations')
export class RecommendationsController {
  constructor(
    private readonly service: RecommendationsService,
    private readonly nextProblem: AdaptiveNextProblemService,
    private readonly similar: SimilarProblemService,
    private readonly review: ReviewScheduleService,
    private readonly metrics: RecommendationMetricsService,
  ) {}

  /** 추천 품질 KPI — 1000명 PoC 모니터링용 (acceptRate / solveRate / correctRate / 등). */
  @Get('metrics')
  metricsForMe(@CurrentUser('id') userId: string, @Query('days') days?: string) {
    const d = days ? Math.max(1, Math.min(90, parseInt(days, 10))) : 7;
    return this.metrics.forUser(userId, d);
  }

  /** 명세서 §4 Flow 6 — SM-2 forgettingRisk 기반 복습 후보. */
  @Get('review-schedule')
  reviewSchedule(@CurrentUser('id') userId: string) {
    return this.review.getForUser(userId);
  }

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

  /**
   * 명세서 §4 Flow 7 — 다음 문제 1개 추천. RecommendationLog 1 row 생성.
   * `?sessionId=...` 로 세션 추적 (선택).
   */
  @Get('next-problem')
  nextForMe(@CurrentUser('id') userId: string, @Query('sessionId') sessionId?: string) {
    return this.nextProblem.getNext(userId, { sessionId });
  }

  /** 명세서 §4 Flow 8 — 유사문제 5개. */
  @Get('similar/:attemptId')
  similarByAttempt(@CurrentUser('id') userId: string, @Param('attemptId') attemptId: string) {
    return this.similar.getSimilar(userId, attemptId);
  }

  /**
   * 명세서 §5 — POST /recommendations/:id/result.
   * 추천이 실제로 받아들여졌는지 / 풀었는지 / 결과를 기록 → 추천 효과 추적.
   */
  @Post(':id/result')
  recordResult(
    @CurrentUser('id') _userId: string,
    @Param('id') id: string,
    @Body() body: { accepted?: boolean; solved?: boolean; result?: 'CORRECT' | 'INCORRECT' | 'SKIPPED' },
  ) {
    return this.nextProblem.recordResult(id, body);
  }
}
