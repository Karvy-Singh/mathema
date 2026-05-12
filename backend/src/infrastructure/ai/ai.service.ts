import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { LlmProvider, LlmRequest, LlmResponse } from './providers/llm.provider';
import { VisionProvider, VisionParseResult } from './providers/vision.provider';
import { EmbeddingProvider } from './providers/embedding.provider';
import { RedisService } from '../redis/redis.service';
import { createHash } from 'crypto';

/**
 * 모든 도메인 모듈이 의존하는 단일 AI facade.
 * 캐싱·재시도·rate-limit·stale fallback 등 횡단 관심사를 여기서 처리.
 *
 * Phase 4 강화:
 *   1) Fresh cache (7d)
 *   2) Retry with exponential backoff for transient errors
 *   3) Stale cache (30d) — primary cache 만료 후에도 LLM 장애 시 fallback
 *   4) Per-user rate limit (Redis 카운터)
 *   5) Circuit breaker — 5분간 연속 실패율 50% 초과 시 호출 중단
 */
@Injectable()
export class AiService {
  private static readonly FRESH_TTL_SEC = 7 * 24 * 60 * 60;   // 7d
  private static readonly STALE_TTL_SEC = 30 * 24 * 60 * 60;  // 30d
  private static readonly MAX_ATTEMPTS = 3;
  private static readonly RATE_LIMIT_PER_MIN = 30;
  private static readonly CB_WINDOW_SEC = 300;                // 5분 window
  private static readonly CB_FAILURE_RATIO = 0.5;             // 실패율 50% 초과 시 차단
  private static readonly CB_MIN_SAMPLES = 5;                 // 5회 미만이면 평가 X

  private readonly logger = new Logger(AiService.name);

  constructor(
    private readonly llm: LlmProvider,
    private readonly vision: VisionProvider,
    private readonly embedding: EmbeddingProvider,
    private readonly redis: RedisService,
  ) {}

  /**
   * 텍스트 생성 + 신뢰성 계층.
   * @param req prompt + system + 옵션
   * @param ctx 호출 컨텍스트 — userId 로 rate limit, allowStale 로 stale fallback 허용
   */
  async generateText(
    req: LlmRequest,
    ctx: { userId?: string | null; allowStale?: boolean } = {},
  ): Promise<LlmResponse & { stale?: boolean }> {
    // 1. Rate limit (userId 있을 때만 — 익명 호출은 controller 단의 global throttler 가 처리)
    if (ctx.userId) await this.assertRateLimit(ctx.userId);

    const freshKey = this.cacheKey('fresh', req);
    const staleKey = this.cacheKey('stale', req);

    // 2. Fresh cache hit
    const fresh = await this.redis.get(freshKey);
    if (fresh) return JSON.parse(fresh) as LlmResponse;

    // 3. Circuit breaker — 차단 중이면 stale fallback 시도
    if (await this.isCircuitOpen()) {
      const stale = await this.redis.get(staleKey);
      if (stale && ctx.allowStale !== false) {
        this.logger.warn('Circuit open — returning stale cache');
        return { ...(JSON.parse(stale) as LlmResponse), stale: true };
      }
      throw new HttpException('AI service temporarily unavailable', HttpStatus.SERVICE_UNAVAILABLE);
    }

    // 4. Retry loop
    try {
      const result = await this.callWithRetry(req);
      await this.redis.set(freshKey, JSON.stringify(result), AiService.FRESH_TTL_SEC);
      await this.redis.set(staleKey, JSON.stringify(result), AiService.STALE_TTL_SEC);
      await this.recordOutcome(true);
      return result;
    } catch (err) {
      await this.recordOutcome(false);
      this.logger.warn(`LLM call failed: ${(err as Error).message}`);

      // 5. Stale fallback
      const stale = await this.redis.get(staleKey);
      if (stale && ctx.allowStale !== false) {
        this.logger.log('Returning stale cache after failure');
        return { ...(JSON.parse(stale) as LlmResponse), stale: true };
      }
      throw err;
    }
  }

  async parseProblemImage(image: Buffer): Promise<VisionParseResult> {
    return this.vision.parseProblemImage(image);
  }

  async embed(text: string): Promise<number[]> {
    return this.embedding.embed(text);
  }

  // ---------- 내부 헬퍼 ----------

  private async callWithRetry(req: LlmRequest): Promise<LlmResponse> {
    let lastErr: unknown;
    for (let attempt = 1; attempt <= AiService.MAX_ATTEMPTS; attempt++) {
      try {
        return await this.llm.generate(req);
      } catch (err) {
        lastErr = err;
        if (!this.isRetriable(err) || attempt === AiService.MAX_ATTEMPTS) throw err;
        const delayMs = Math.min(2 ** attempt * 500 + Math.random() * 200, 8000);
        this.logger.debug(`LLM retry ${attempt}/${AiService.MAX_ATTEMPTS} in ${Math.round(delayMs)}ms`);
        await new Promise((r) => setTimeout(r, delayMs));
      }
    }
    throw lastErr ?? new Error('LLM retry exhausted');
  }

  /** 재시도해도 무의미한 오류(인증·구문 등)는 즉시 throw. 429/5xx/네트워크는 재시도. */
  private isRetriable(err: any): boolean {
    const status = err?.status ?? err?.statusCode ?? err?.response?.status;
    if (status === 429) return true;
    if (typeof status === 'number' && status >= 500 && status < 600) return true;
    const code = err?.code;
    if (['ETIMEDOUT', 'ECONNRESET', 'ENOTFOUND', 'EAI_AGAIN', 'ECONNREFUSED'].includes(code)) return true;
    return false;
  }

  private async assertRateLimit(userId: string): Promise<void> {
    const bucket = Math.floor(Date.now() / 60_000);
    const key = `ai:rate:${userId}:${bucket}`;
    const count = await this.redis.incrWithTtl(key, 90);
    if (count > AiService.RATE_LIMIT_PER_MIN) {
      throw new HttpException(
        `AI rate limit: ${AiService.RATE_LIMIT_PER_MIN} calls/min exceeded`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  private cacheKey(ns: 'fresh' | 'stale', req: LlmRequest): string {
    const sig = createHash('sha256').update(JSON.stringify(req)).digest('hex');
    return `ai:cache:${ns}:${sig}`;
  }

  // ---- Circuit breaker ----

  private cbBucket(): string {
    const win = Math.floor(Date.now() / (AiService.CB_WINDOW_SEC * 1000));
    return `ai:cb:${win}`;
  }

  private async recordOutcome(success: boolean): Promise<void> {
    const key = this.cbBucket();
    const field = success ? 'ok' : 'fail';
    // 별도 키로 카운트 — incrWithTtl 활용
    await this.redis.incrWithTtl(`${key}:${field}`, AiService.CB_WINDOW_SEC + 30);
  }

  private async isCircuitOpen(): Promise<boolean> {
    const key = this.cbBucket();
    const [okStr, failStr] = await Promise.all([
      this.redis.get(`${key}:ok`),
      this.redis.get(`${key}:fail`),
    ]);
    const ok = parseInt(okStr ?? '0', 10);
    const fail = parseInt(failStr ?? '0', 10);
    const total = ok + fail;
    if (total < AiService.CB_MIN_SAMPLES) return false;
    return fail / total > AiService.CB_FAILURE_RATIO;
  }
}
