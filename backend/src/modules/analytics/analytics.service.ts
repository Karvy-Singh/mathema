import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

/**
 * 사용자 행동 이벤트 기록 — POC funnel/retention/engagement 분석용.
 *
 * 비-답안 행동 (페이지뷰·CTA클릭·perspective전환·모달오픈 등)을 캡처.
 * Attempt 모델은 학습 행동을, AnalyticsEvent는 그 외 모든 인터랙션을 담당.
 *
 * 기록 실패는 절대 사용자 흐름을 막지 않음 — try/catch + warn.
 */
@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);
  /** 너무 큰 payload는 잘라냄 (1KB 제한) */
  private static readonly MAX_PAYLOAD_BYTES = 1024;

  constructor(private readonly prisma: PrismaService) {}

  async record(input: {
    userId?: string | null;
    eventType: string;
    payload?: any;
    sessionId?: string | null;
    userAgent?: string | null;
    source?: 'frontend' | 'backend';
  }) {
    try {
      const safePayload = this.truncate(input.payload ?? {});
      await this.prisma.analyticsEvent.create({
        data: {
          userId: input.userId ?? null,
          eventType: String(input.eventType ?? 'unknown').slice(0, 64),
          payload: safePayload,
          sessionId: input.sessionId ?? null,
          userAgent: input.userAgent?.slice(0, 500) ?? null,
          source: input.source ?? 'frontend',
        },
      });
    } catch (e: any) {
      this.logger.warn(`analytics record failed: ${e?.message ?? e}`);
    }
  }

  private truncate(payload: any): any {
    try {
      const json = JSON.stringify(payload ?? {});
      if (json.length <= AnalyticsService.MAX_PAYLOAD_BYTES) return payload;
      return { _truncated: true, preview: json.slice(0, AnalyticsService.MAX_PAYLOAD_BYTES) };
    } catch {
      return { _unserializable: true };
    }
  }
}
