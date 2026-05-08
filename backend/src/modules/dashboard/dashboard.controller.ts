import { Controller, Get, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly service: DashboardService) {}

  // 대시보드 헤더 4 stat 통합:
  //  오늘 학습 / 연속 학습 / 주간 정답률 / 예상 등급
  @Get('summary')
  summary(@CurrentUser('id') userId: string) {
    return this.service.summary(userId);
  }
}
