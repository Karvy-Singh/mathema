import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Sentry from '@sentry/node';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

// Sentry 초기화 — DSN 미설정이면 SDK 가 no-op 모드로 동작 (안전).
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV ?? 'development',
    tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? 0.1),
  });
}

// production 빌드에서 JWT 시크릿 placeholder/약한값 사용 금지 — 가드.
function validateProductionSecrets(logger: Logger) {
  if (process.env.NODE_ENV !== 'production') {
    if (!process.env.JWT_ACCESS_SECRET || !process.env.JWT_REFRESH_SECRET) {
      logger.warn('JWT secrets missing in env — falling back to dev defaults.');
    }
    return;
  }
  const weak = (s?: string) =>
    !s || s.length < 32 ||
    /^(changeme|secret|default|placeholder|password|api입력|todo|jwt[-_]secret)$/i.test(s);

  const issues: string[] = [];
  if (weak(process.env.JWT_ACCESS_SECRET)) issues.push('JWT_ACCESS_SECRET');
  if (weak(process.env.JWT_REFRESH_SECRET)) issues.push('JWT_REFRESH_SECRET');
  if (process.env.JWT_ACCESS_SECRET && process.env.JWT_ACCESS_SECRET === process.env.JWT_REFRESH_SECRET) {
    issues.push('JWT_ACCESS_SECRET === JWT_REFRESH_SECRET (must differ)');
  }
  if (issues.length > 0) {
    logger.error('FATAL: insecure JWT configuration in production:');
    issues.forEach((i) => logger.error(`  - ${i}`));
    logger.error('Generate with: node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'base64\'))"');
    process.exit(1);
  }
}

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  validateProductionSecrets(logger);

  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const config = app.get(ConfigService);

  app.use(helmet());
  // CORS: 메인 앱(5173) + 관리자 앱(5174) 둘 다 허용
  const webOrigin = config.get<string>('app.webOrigin') ?? 'http://localhost:5173';
  const adminOrigin = config.get<string>('app.adminOrigin') ?? 'http://localhost:5174';
  app.enableCors({
    origin: [webOrigin, adminOrigin],
    credentials: true,
  });
  // X-Forwarded-For 신뢰 — throttler 가 진짜 client IP 로 카운트하도록.
  app.getHttpAdapter().getInstance().set('trust proxy', 1);
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new TransformInterceptor());

  const port = config.get<number>('app.port') ?? 4000;
  await app.listen(port);
  logger.log(`Mathēma backend listening on :${port}`);
}

bootstrap();
