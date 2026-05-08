import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AiCoachService } from './ai-coach.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

/**
 * UI ↔ 라우트:
 *  - 대시보드 상단 진단 메시지            → GET /diagnosis
 *  - 대시보드 Error DNA 카드 (4유형 비율)  → GET /error-dna
 *  - 오답노트 페이지 3가지 패턴            → GET /patterns
 *  - 리포트 페이지 AI Mentor Message       → GET /mentor-message
 */
@UseGuards(JwtAuthGuard)
@Controller('ai-coach')
export class AiCoachController {
  constructor(private readonly service: AiCoachService) {}

  @Get('diagnosis')
  diagnosis(@CurrentUser('id') userId: string) {
    return this.service.diagnosis(userId);
  }

  @Get('error-dna')
  errorDna(@CurrentUser('id') userId: string) {
    return this.service.errorDna(userId);
  }

  @Get('patterns')
  patterns(@CurrentUser('id') userId: string) {
    return this.service.patterns(userId);
  }

  @Get('mentor-message')
  mentorMessage(@CurrentUser('id') userId: string, @Query('week') week = 'current') {
    return this.service.mentorMessage(userId, week);
  }
}
