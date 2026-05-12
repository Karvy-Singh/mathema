import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

/**
 * 캐시·세션·스트릭·AI 응답 캐시·동시성 락을 위한 단일 ioredis 클라이언트.
 * 키 네임스페이스 규칙은 README §5 참고.
 */
@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private readonly client: Redis;

  constructor(config: ConfigService) {
    this.client = new Redis({
      host: config.get<string>('redis.host'),
      port: config.get<number>('redis.port'),
      password: config.get<string>('redis.password') || undefined,
      lazyConnect: false,
    });
    this.client.on('connect', () => this.logger.log('Redis connected'));
    this.client.on('error', (e) => this.logger.error(e));
  }

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async set(key: string, value: string, ttlSec?: number): Promise<void> {
    if (ttlSec) await this.client.set(key, value, 'EX', ttlSec);
    else await this.client.set(key, value);
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  async incr(key: string): Promise<number> {
    return this.client.incr(key);
  }

  async expire(key: string, ttlSec: number): Promise<void> {
    await this.client.expire(key, ttlSec);
  }

  /** 첫 호출 시 TTL 부여 + 카운트 증가. rate-limit 의 표준 패턴. */
  async incrWithTtl(key: string, ttlSec: number): Promise<number> {
    const count = await this.client.incr(key);
    if (count === 1) await this.client.expire(key, ttlSec);
    return count;
  }

  async exists(key: string): Promise<boolean> {
    return (await this.client.exists(key)) === 1;
  }

  async setNx(key: string, value: string, ttlSec: number): Promise<boolean> {
    const r = await this.client.set(key, value, 'EX', ttlSec, 'NX');
    return r === 'OK';
  }

  async withLock<T>(key: string, ttlSec: number, fn: () => Promise<T>): Promise<T> {
    const ok = await this.client.set(`lock:${key}`, '1', 'EX', ttlSec, 'NX');
    if (!ok) throw new Error(`Lock busy: ${key}`);
    try {
      return await fn();
    } finally {
      await this.client.del(`lock:${key}`);
    }
  }

  async onModuleDestroy() {
    await this.client.quit();
  }
}
