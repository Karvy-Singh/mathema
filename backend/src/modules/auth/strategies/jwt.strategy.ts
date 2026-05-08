import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(config: ConfigService, private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.get<string>('jwt.accessSecret')!,
    });
  }

  /**
   * 토큰 유효성 + 소프트 삭제 체크.
   * deletedAt이 null이 아닌 사용자는 인증 차단 — 분석 자산은 보존, 접근만 봉쇄.
   */
  async validate(payload: { sub: string }) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, deletedAt: true },
    });
    if (!user) throw new UnauthorizedException('User not found');
    if (user.deletedAt) throw new UnauthorizedException('Account deactivated');
    return { id: user.id };
  }
}
