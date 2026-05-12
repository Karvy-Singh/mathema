import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LLMAnalysisService } from './llm-analysis.service';
import { LlmAnalysisListener } from './llm-analysis.listener';
import { LLMAnalysisQueueService } from './llm-analysis-queue.service';
import { LLMAnalysisProcessor } from './llm-analysis.processor';
import { LLMAnalysisAdminController } from './llm-analysis.controller';
import { MasteryModule } from '../mastery/mastery.module';
import { AiModule } from '../../infrastructure/ai/ai.module';
import { LLM_ANALYSIS_QUEUE } from './llm-analysis.queue';
import { AdminGuard } from '../../common/guards/admin.guard';

/**
 * BullMQ 기반 LLM 분석 파이프라인.
 *   - 큐 'llm-analysis' 등록
 *   - Worker concurrency 환경변수 LLM_QUEUE_CONCURRENCY (기본 2)
 *   - Redis 연결 정보는 ConfigService 의 redis.* 사용 (RedisModule 과 동일)
 */
@Module({
  imports: [
    MasteryModule,
    AiModule,
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get<string>('redis.host'),
          port: config.get<number>('redis.port'),
          password: config.get<string>('redis.password') || undefined,
        },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue({ name: LLM_ANALYSIS_QUEUE }),
  ],
  controllers: [LLMAnalysisAdminController],
  providers: [
    LLMAnalysisService,
    LLMAnalysisQueueService,
    LLMAnalysisProcessor,
    LlmAnalysisListener,
    AdminGuard,
  ],
  exports: [LLMAnalysisService, LLMAnalysisQueueService],
})
export class LlmAnalysisModule {}
