import { Global, Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { LlmProvider } from './providers/llm.provider';
import { VisionProvider } from './providers/vision.provider';
import { EmbeddingProvider } from './providers/embedding.provider';
import { RedisModule } from '../redis/redis.module';

/**
 * 모든 도메인 모듈에서 import 없이 사용할 수 있도록 전역(@Global) 선언.
 * AiService 만 외부로 export — 공급자(provider)는 노출하지 않는다.
 */
@Global()
@Module({
  imports: [RedisModule],
  providers: [AiService, LlmProvider, VisionProvider, EmbeddingProvider],
  exports: [AiService],
})
export class AiModule {}
