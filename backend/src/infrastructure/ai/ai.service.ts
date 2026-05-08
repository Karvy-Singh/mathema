import { Injectable } from '@nestjs/common';
import { LlmProvider, LlmRequest, LlmResponse } from './providers/llm.provider';
import { VisionProvider, VisionParseResult } from './providers/vision.provider';
import { EmbeddingProvider } from './providers/embedding.provider';
import { RedisService } from '../redis/redis.service';
import { createHash } from 'crypto';

/**
 * 모든 도메인 모듈이 의존하는 단일 AI facade.
 * 캐싱·동시성·재시도 등 횡단 관심사를 여기서 처리한다.
 *
 * 도메인은 절대로 LlmProvider/VisionProvider/EmbeddingProvider 를 직접 주입하지 않는다.
 */
@Injectable()
export class AiService {
  private static readonly CACHE_TTL_SEC = 7 * 24 * 60 * 60; // 7d

  constructor(
    private readonly llm: LlmProvider,
    private readonly vision: VisionProvider,
    private readonly embedding: EmbeddingProvider,
    private readonly redis: RedisService,
  ) {}

  /** 텍스트 생성 (7일 캐시 — 동일 prompt 재호출 방지) */
  async generateText(req: LlmRequest): Promise<LlmResponse> {
    const cacheKey = this.cacheKey(req);
    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached) as LlmResponse;

    const result = await this.llm.generate(req);
    await this.redis.set(cacheKey, JSON.stringify(result), AiService.CACHE_TTL_SEC);
    return result;
  }

  async parseProblemImage(image: Buffer): Promise<VisionParseResult> {
    return this.vision.parseProblemImage(image);
  }

  async embed(text: string): Promise<number[]> {
    return this.embedding.embed(text);
  }

  private cacheKey(req: LlmRequest): string {
    const sig = createHash('sha256')
      .update(JSON.stringify(req))
      .digest('hex');
    return `ai:cache:${sig}`;
  }
}
