import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const exists = await this.users.findByEmail(dto.email);
    if (exists) throw new UnauthorizedException('email already used');
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.users.create({
      email: dto.email,
      passwordHash,
      name: dto.name,
      examDate: new Date(dto.examDate),
      targetGrade: dto.targetGrade,
    });
    return this.issueTokens(user.id);
  }

  async login(dto: LoginDto) {
    const user = await this.users.findByEmail(dto.email);
    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('invalid credentials');
    }
    return this.issueTokens(user.id);
  }

  async refresh(token: string) {
    try {
      const payload = await this.jwt.verifyAsync(token, {
        secret: this.config.get<string>('jwt.refreshSecret'),
      });
      return this.issueTokens(payload.sub);
    } catch {
      throw new UnauthorizedException('invalid refresh token');
    }
  }

  async logout(_token: string) {
    // 화이트리스트 사용 시 Redis 에서 제거. 현재는 상태비저장.
    return { ok: true };
  }

  private issueTokens(userId: string) {
    const accessToken = this.jwt.sign(
      { sub: userId },
      {
        secret: this.config.get<string>('jwt.accessSecret'),
        expiresIn: this.config.get<string>('jwt.accessTtl'),
      },
    );
    const refreshToken = this.jwt.sign(
      { sub: userId, type: 'refresh' },
      {
        secret: this.config.get<string>('jwt.refreshSecret'),
        expiresIn: this.config.get<string>('jwt.refreshTtl'),
      },
    );
    return { accessToken, refreshToken };
  }
}
