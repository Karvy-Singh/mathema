import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

/**
 * 어드민 액션 감사 로그 — /admin/* 호출 자동 기록.
 * 누가 언제 어떤 자원에 접근했는지 추적. 분쟁/규제 대응 용도.
 * 본문 일부 민감 필드는 redact.
 */
@Injectable()
export class AdminAuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AdminAuditInterceptor.name);

  constructor(private readonly prisma: PrismaService) {}

  intercept(ctx: ExecutionContext, next: CallHandler): Observable<any> {
    const req = ctx.switchToHttp().getRequest();
    const res = ctx.switchToHttp().getResponse();
    const started = Date.now();

    const write = async (statusCode: number) => {
      try {
        await (this.prisma as any).adminAccessLog.create({
          data: {
            adminEmail: req.user?.email ?? 'unknown',
            method: req.method,
            path: req.originalUrl ?? req.url,
            query: safeStringify(req.query),
            body: redactBody(req.body),
            statusCode,
            ip: req.ip ?? req.headers['x-forwarded-for'] ?? null,
            userAgent: (req.headers['user-agent'] as string) ?? null,
            durationMs: Date.now() - started,
          },
        });
      } catch (e: any) {
        this.logger.error(`audit log write failed: ${e?.message}`);
      }
    };

    return next.handle().pipe(
      tap(() => { write(res.statusCode ?? 200); }),
      catchError((err) => { write(err?.status ?? 500); return throwError(() => err); }),
    );
  }
}

function safeStringify(v: any): string | null {
  if (!v || (typeof v === 'object' && Object.keys(v).length === 0)) return null;
  try { return JSON.stringify(v).slice(0, 2000); } catch { return null; }
}

function redactBody(body: any): string | null {
  if (!body || typeof body !== 'object') return null;
  const SENSITIVE = ['password', 'token', 'idToken', 'refreshToken', 'accessToken', 'passwordHash', 'secret'];
  const clone: any = {};
  for (const k of Object.keys(body)) {
    clone[k] = SENSITIVE.some((s) => k.toLowerCase().includes(s.toLowerCase())) ? '[REDACTED]' : body[k];
  }
  return safeStringify(clone);
}
