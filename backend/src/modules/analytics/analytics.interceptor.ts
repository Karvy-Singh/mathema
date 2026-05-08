import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { AnalyticsService } from './analytics.service';

/**
 * 인증된 모든 API 호출을 자동으로 AnalyticsEvent로 기록.
 *
 * 기록 내용: { method, path, statusCode, durationMs }
 * 제외 path:
 *   - /analytics/events  (자기 자신 — 무한 루프 방지)
 *   - /health            (모니터링 노이즈)
 *
 * fire-and-forget — 분석 기록 실패가 사용자 응답을 막지 않음.
 */
@Injectable()
export class AnalyticsInterceptor implements NestInterceptor {
  private static readonly SKIP_PATHS = ['/analytics/events', '/health', '/api/v1/analytics/events', '/api/v1/health'];

  constructor(private readonly analytics: AnalyticsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const http = context.switchToHttp();
    const req = http.getRequest();
    const res = http.getResponse();
    const start = Date.now();
    const path: string = req.originalUrl?.split('?')[0] ?? req.url ?? '';
    const method: string = req.method;
    const skip = AnalyticsInterceptor.SKIP_PATHS.some((p) => path.startsWith(p));

    return next.handle().pipe(
      tap({
        next: () => !skip && this.log(req, res, path, method, start, true),
        error: () => !skip && this.log(req, res, path, method, start, false),
      }),
    );
  }

  private log(req: any, res: any, path: string, method: string, start: number, ok: boolean) {
    const userId = req?.user?.id ?? null;
    if (!userId) return; // 비인증 호출은 기록 X (랜딩 페이지뷰는 frontend가 직접 보냄)
    void this.analytics.record({
      userId,
      eventType: 'api.call',
      payload: {
        method, path,
        statusCode: ok ? res.statusCode : (res.statusCode || 500),
        durationMs: Date.now() - start,
      },
      sessionId: req.headers['x-session-id'] ?? null,
      userAgent: req.headers['user-agent'] ?? null,
      source: 'backend',
    });
  }
}
