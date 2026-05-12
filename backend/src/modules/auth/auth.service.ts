import { Injectable, UnauthorizedException, BadRequestException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { randomBytes, createHash, randomUUID } from 'crypto';
import * as bcrypt from 'bcrypt';
import { OAuth2Client } from 'google-auth-library';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { RedisService } from '../../infrastructure/redis/redis.service';
import { MailService } from '../../infrastructure/mail/mail.service';
import { PrivacyService } from '../privacy/privacy.service';

const RESET_TOKEN_TTL_MIN = 30;
const VERIFY_TOKEN_TTL_HOURS = 24;
const REFRESH_REVOKE_NAMESPACE = 'jwt:refresh:revoked:';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  // 단일 OAuth2 클라이언트 — verifyIdToken 만 사용 (서명 검증 + audience 검증).
  private googleClient: OAuth2Client | null = null;

  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly mail: MailService,
    private readonly privacy: PrivacyService,
  ) {
    const cid = this.config.get<string>('GOOGLE_CLIENT_ID');
    if (cid && cid !== 'api입력칸') this.googleClient = new OAuth2Client(cid);
  }

  async register(dto: RegisterDto, ctx: { ip?: string; ua?: string } = {}) {
    const exists = await this.users.findByEmail(dto.email);
    if (exists) throw new UnauthorizedException('email already used');
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.users.create({
      email: dto.email,
      passwordHash,
      name: dto.name,
      examDate: new Date(dto.examDate),
      targetGrade: dto.targetGrade,
      ...(dto.gradeLevel ? { gradeLevel: dto.gradeLevel } : {}),
    });

    // DPDP/GDPR — 가입 시 필수 동의(DATA_PROCESSING) + 선택 동의(가입 폼에서 보낸 값)
    await this.privacy.grantInitial(user.id, {
      analytics:  dto.consentAnalytics  === true,
      marketing:  dto.consentMarketing  === true,
      aiTraining: dto.consentAiTraining === true,
      ipAddress: ctx.ip,
      userAgent: ctx.ua,
    });

    // 가입 직후 이메일 검증 토큰 발급 — 실패해도 가입은 진행 (fire-and-forget).
    this.issueVerificationToken(user.id, user.email).catch((e) =>
      this.logger.error(`verification token issue failed: ${e?.message}`),
    );
    return this.issueTokens(user.id);
  }

  async login(dto: LoginDto) {
    const user = await this.users.findByEmail(dto.email);
    if (!user || (user as any).deletedAt || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('invalid credentials');
    }
    return this.issueTokens(user.id);
  }

  async refresh(token: string) {
    let payload: any;
    try {
      payload = await this.jwt.verifyAsync(token, {
        secret: this.config.get<string>('jwt.refreshSecret'),
      });
    } catch {
      throw new UnauthorizedException('invalid refresh token');
    }
    if (payload?.type !== 'refresh' || !payload?.jti) {
      throw new UnauthorizedException('invalid refresh token');
    }
    // Redis blacklist 확인 — 폐기된 jti 이면 거부.
    if (await this.redis.exists(`${REFRESH_REVOKE_NAMESPACE}${payload.jti}`)) {
      throw new UnauthorizedException('refresh token revoked');
    }
    // Rotation: 사용한 refresh 는 즉시 blacklist (TTL은 원본 만료까지).
    const now = Math.floor(Date.now() / 1000);
    const remainSec = Math.max(60, (payload.exp ?? now) - now);
    await this.redis.set(`${REFRESH_REVOKE_NAMESPACE}${payload.jti}`, '1', remainSec);
    return this.issueTokens(payload.sub);
  }

  async logout(token: string) {
    if (!token) return { ok: true };
    try {
      const payload: any = this.jwt.decode(token);
      if (payload?.jti && payload?.exp) {
        const now = Math.floor(Date.now() / 1000);
        const ttl = Math.max(60, payload.exp - now);
        await this.redis.set(`${REFRESH_REVOKE_NAMESPACE}${payload.jti}`, '1', ttl);
      }
    } catch {
      // 잘못된 토큰이어도 로그아웃은 멱등 처리.
    }
    return { ok: true };
  }

  /**
   * Google ID Token 검증 후 user find-or-create.
   */
  async signInWithGoogle(idToken: string) {
    if (!this.googleClient) {
      throw new UnauthorizedException('Google sign-in not configured (GOOGLE_CLIENT_ID missing)');
    }
    let payload: any;
    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken,
        audience: this.config.get<string>('GOOGLE_CLIENT_ID')!,
      });
      payload = ticket.getPayload();
    } catch {
      throw new UnauthorizedException('invalid Google ID token');
    }
    if (!payload?.email || !payload.email_verified) {
      throw new UnauthorizedException('email not verified by Google');
    }

    const email = payload.email.toLowerCase();
    const name = payload.name ?? payload.given_name ?? email.split('@')[0];
    let user = await this.users.findByEmail(email);
    if (!user) {
      const placeholderExam = new Date();
      placeholderExam.setFullYear(placeholderExam.getFullYear() + 1);
      user = await this.users.create({
        email,
        passwordHash: await bcrypt.hash(`google:${payload.sub}:${Date.now()}`, 10),
        name,
        examDate: placeholderExam,
        targetGrade: 1,
        country: 'IN' as any,
        gradeLevel: 'G_HIGH_2' as any,
      });
    }
    return this.issueTokens(user.id);
  }

  // ---------- 비밀번호 재설정 ----------

  /**
   * forgot — email이 존재하든 안 하든 항상 같은 응답을 돌려서
   * 가입 여부 정보 누출(enumeration) 차단.
   */
  async forgotPassword(email: string, requestIp?: string) {
    const user = await this.users.findByEmail(email);
    if (user && !(user as any).deletedAt) {
      const raw = randomBytes(32).toString('hex');
      const tokenHash = createHash('sha256').update(raw).digest('hex');
      const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MIN * 60 * 1000);
      await (this.prisma as any).passwordResetToken.create({
        data: { userId: user.id, tokenHash, expiresAt, requestIp },
      });
      await this.mail.sendPasswordResetEmail(user.email, raw);
    }
    return { ok: true };
  }

  async resetPassword(rawToken: string, newPassword: string) {
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');
    const rec = await (this.prisma as any).passwordResetToken.findUnique({ where: { tokenHash } });
    if (!rec || rec.usedAt || rec.expiresAt < new Date()) {
      throw new BadRequestException('invalid or expired token');
    }
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: rec.userId }, data: { passwordHash } }),
      (this.prisma as any).passwordResetToken.update({
        where: { id: rec.id },
        data: { usedAt: new Date() },
      }),
    ]);
    return { ok: true };
  }

  // ---------- 이메일 검증 ----------

  private async issueVerificationToken(userId: string, email: string): Promise<void> {
    const raw = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(raw).digest('hex');
    const expiresAt = new Date(Date.now() + VERIFY_TOKEN_TTL_HOURS * 3600 * 1000);
    await (this.prisma as any).emailVerificationToken.create({
      data: { userId, email, tokenHash, expiresAt },
    });
    await this.mail.sendEmailVerification(email, raw);
  }

  async resendVerification(userId: string) {
    const u = await this.users.findOne(userId);
    if (!u) throw new UnauthorizedException('User not found');
    await this.issueVerificationToken(u.id, u.email);
    return { ok: true };
  }

  async verifyEmail(rawToken: string) {
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');
    const rec = await (this.prisma as any).emailVerificationToken.findUnique({ where: { tokenHash } });
    if (!rec || rec.usedAt || rec.expiresAt < new Date()) {
      throw new BadRequestException('invalid or expired token');
    }
    await (this.prisma as any).emailVerificationToken.update({
      where: { id: rec.id },
      data: { usedAt: new Date() },
    });
    // emailVerified 컬럼은 추후 추가 가능. 지금은 토큰만 소비 + 로그.
    this.logger.log(`Email verified: ${rec.email}`);
    return { ok: true, email: rec.email };
  }

  // ---------- 토큰 발급 ----------

  private issueTokens(userId: string) {
    const jti = randomUUID();
    const accessToken = this.jwt.sign(
      { sub: userId },
      {
        secret: this.config.get<string>('jwt.accessSecret'),
        expiresIn: this.config.get<string>('jwt.accessTtl'),
      },
    );
    const refreshToken = this.jwt.sign(
      { sub: userId, type: 'refresh', jti },
      {
        secret: this.config.get<string>('jwt.refreshSecret'),
        expiresIn: this.config.get<string>('jwt.refreshTtl'),
      },
    );
    return { accessToken, refreshToken };
  }
}
