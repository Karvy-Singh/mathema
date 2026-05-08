import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateTargetDto } from './dto/update-target.dto';

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
}
