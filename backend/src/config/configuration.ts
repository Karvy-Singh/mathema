import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  env: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.PORT ?? '4000', 10),
  url: process.env.APP_URL ?? 'http://localhost:4000',
  webOrigin: process.env.WEB_ORIGIN ?? 'http://localhost:5173',
  adminOrigin: process.env.ADMIN_ORIGIN ?? 'http://localhost:5174',
}));
