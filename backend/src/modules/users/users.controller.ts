import { Body, Controller, Delete, Get, Header, Patch, Post, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateTargetDto } from './dto/update-target.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly service: UsersService) {}

  // TopNav 의 아바타 이름·D-day 계산용
  @Get('me')
  me(@CurrentUser('id') id: string) { return this.service.findOne(id); }

  @Patch('me')
  updateProfile(@CurrentUser('id') id: string, @Body() dto: UpdateProfileDto) {
    return this.service.updateProfile(id, dto);
  }

  @Patch('me/target')
  updateTarget(@CurrentUser('id') id: string, @Body() dto: UpdateTargetDto) {
    return this.service.updateTarget(id, dto);
  }

  @Post('me/password')
  changePassword(@CurrentUser('id') id: string, @Body() dto: ChangePasswordDto) {
    return this.service.changePassword(id, dto.current, dto.next);
  }

  /**
   * 자기계정 삭제 — Play Console 2024 정책 필수.
   * Soft delete: deletedAt 마킹, JWT 차단 처리됨 (JwtStrategy.validate).
   */
  @Delete('me')
  async deleteAccount(@CurrentUser('id') id: string) {
    return this.service.deleteSelf(id);
  }

  /**
   * 자기데이터 다운로드 — GDPR Art. 20.
   * JSON 파일로 직접 다운로드 트리거 (브라우저 Save As).
   */
  @Get('me/export')
  @Header('Content-Type', 'application/json')
  @Header('Content-Disposition', 'attachment; filename="matheo-data-export.json"')
  async exportData(@CurrentUser('id') id: string, @Res() res: Response) {
    const data = await this.service.exportSelf(id);
    res.json(data);
  }
}
