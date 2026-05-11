import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import * as Sentry from '@sentry/node';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse();
    const req = ctx.getRequest();

    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const body = exception instanceof HttpException ? exception.getResponse() : { message: 'Internal error' };

    this.logger.error(`${req.method} ${req.url} → ${status}`, exception as any);
    // 5xx 만 Sentry 로 — 4xx 는 클라이언트 잘못이므로 스팸 방지
    if (status >= 500 && process.env.SENTRY_DSN) {
      Sentry.withScope((scope) => {
        scope.setExtra('path', req.url);
        scope.setExtra('method', req.method);
        scope.setUser({ id: req.user?.id ?? 'anonymous' });
        Sentry.captureException(exception);
      });
    }
    res.status(status).json({ error: body, path: req.url, timestamp: new Date().toISOString() });
  }
}
