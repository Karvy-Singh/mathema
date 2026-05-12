import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { RefreshStrategy } from './strategies/refresh.strategy';
import { UsersModule } from '../users/users.module';
import { PrivacyModule } from '../privacy/privacy.module';

@Module({
  imports: [
    UsersModule,
    PrivacyModule,
    PassportModule,
    // /auth/* 엔드포인트 전용 throttler — 글로벌(120/min)보다 훨씬 빡빡하게.
    // login: 5/min/IP 로 brute-force 차단. (per-endpoint 데코레이터로 조정)
    ThrottlerModule.forRoot([
      { name: 'auth', ttl: 60_000, limit: 30 },
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (c: ConfigService) => ({
        secret: c.get<string>('jwt.accessSecret'),
        signOptions: { expiresIn: c.get<string>('jwt.accessTtl') },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, RefreshStrategy],
  exports: [AuthService],
})
export class AuthModule {}
