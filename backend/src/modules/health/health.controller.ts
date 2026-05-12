import { Controller, Get } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { RedisService } from '../../infrastructure/redis/redis.service';

/**
 * 헬스 엔드포인트 — Azure Container Apps probe 와 1:1 매핑.
 *   /health            기본 호환 (이전 코드 호출용)
 *   /health/live       liveness — 프로세스가 살아있는지 (DB/Redis 미접속 시에도 200)
 *   /health/ready      readiness — DB·Redis 동작 확인 (의존성 끊기면 503)
 */
@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  @Public() @Get()
  ok() {
    return { status: 'ok', service: 'mathema-backend', time: new Date().toISOString() };
  }

  @Public() @Get('live')
  live() {
    return { status: 'ok', uptime: process.uptime() };
  }

  @Public() @Get('ready')
  async ready() {
    const checks: Record<string, 'ok' | string> = {};
    try { await this.prisma.$queryRaw`SELECT 1`; checks.db = 'ok'; }
    catch (e) { checks.db = (e as Error).message; }
    try { await this.redis.get('health:ping'); checks.redis = 'ok'; }
    catch (e) { checks.redis = (e as Error).message; }
    const ready = checks.db === 'ok' && checks.redis === 'ok';
    return { status: ready ? 'ready' : 'degraded', checks, time: new Date().toISOString() };
  }
}
