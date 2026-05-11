import { Body, Controller, Delete, Param, Post, UseGuards } from '@nestjs/common';
import { IsIn, IsOptional, IsString, MinLength } from 'class-validator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

class RegisterDeviceDto {
  @IsString() @MinLength(20) token!: string;
  @IsIn(['android', 'ios', 'web']) platform!: 'android' | 'ios' | 'web';
  @IsOptional() @IsString() appVersion?: string;
}

@UseGuards(JwtAuthGuard)
@Controller('devices')
export class PushController {
  constructor(private readonly prisma: PrismaService) {}

  /** 모바일 앱 부팅 시 호출 — FCM 토큰 등록 (이미 있으면 갱신). */
  @Post('register')
  async register(@CurrentUser('id') userId: string, @Body() dto: RegisterDeviceDto) {
    return this.prisma.deviceToken.upsert({
      where: { token: dto.token },
      create: {
        userId, token: dto.token, platform: dto.platform, appVersion: dto.appVersion ?? null,
      },
      update: {
        userId, platform: dto.platform, appVersion: dto.appVersion ?? null,
        disabledAt: null,
      },
    });
  }

  /** 앱 로그아웃 / 언인스톨 시 호출. */
  @Delete(':token')
  async unregister(@CurrentUser('id') userId: string, @Param('token') token: string) {
    await this.prisma.deviceToken.deleteMany({ where: { userId, token } });
    return { ok: true };
  }
}
