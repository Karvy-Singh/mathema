import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

/**
 * Admin allowlist guard.
 * JwtAuthGuard 가 먼저 통과해 req.user 가 채워진 상태에서 동작.
 * .env 의 ADMIN_EMAILS (콤마 구분) 또는 기본 시드 계정만 허용.
 */
@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly config: ConfigService, private readonly prisma: PrismaService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest();
    const userId = req.user?.id;
    if (!userId) throw new ForbiddenException('admin: not authenticated');

    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
    if (!user) throw new ForbiddenException('admin: user not found');

    const raw = this.config.get<string>('ADMIN_EMAILS') ?? 'polopot123@gmail.com';
    const allow = new Set(raw.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean));
    if (!allow.has(user.email.toLowerCase())) {
      throw new ForbiddenException(`admin: ${user.email} not in allowlist`);
    }
    // 감사 로그 인터셉터가 사용할 수 있도록 req.user 에 이메일 부착.
    req.user.email = user.email;
    return true;
  }
}
