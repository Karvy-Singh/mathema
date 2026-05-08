import { Global, Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { AnalyticsInterceptor } from './analytics.interceptor';

/**
 * Analytics 모듈은 글로벌 — 모든 모듈이 AnalyticsService 주입 가능.
 * APP_INTERCEPTOR로 등록되어 모든 API 호출이 자동 로깅됨.
 */
@Global()
@Module({
  controllers: [AnalyticsController],
  providers: [
    AnalyticsService,
    { provide: APP_INTERCEPTOR, useClass: AnalyticsInterceptor },
  ],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
