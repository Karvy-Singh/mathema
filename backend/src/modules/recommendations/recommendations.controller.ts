import { Controller, Get, UseGuards } from '@nestjs/common';
import { RecommendationsService } from './recommendations.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('recommendations')
export class RecommendationsController {
  constructor(private readonly service: RecommendationsService) {}

  // 대시보드 "오늘의 맞춤 학습" 카드 3개
  @Get('today')
  today(@CurrentUser('id') userId: string) {
    return this.service.today(userId);
  }
}
