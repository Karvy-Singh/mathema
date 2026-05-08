import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { StudySessionsService } from './study-sessions.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { StartSessionDto } from './dto/start-session.dto';
import { SubmitAnswerDto } from './dto/submit-answer.dto';

@UseGuards(JwtAuthGuard)
@Controller('study-sessions')
export class StudySessionsController {
  constructor(private readonly service: StudySessionsService) {}

  @Post('start')
  start(@CurrentUser('id') userId: string, @Body() dto: StartSessionDto) {
    return this.service.start(userId, dto);
  }

  @Get(':id')
  get(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.service.get(userId, id);
  }

  // 4가지 관점 변환: '공식 중심' | '단계별' | '시각화' | '실생활 예시'
  @Get(':id/guide')
  guide(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Query('perspective') perspective: string,
  ) {
    return this.service.getAiGuide(userId, id, perspective);
  }

  @Post(':id/answer')
  submit(@CurrentUser('id') userId: string, @Param('id') id: string, @Body() dto: SubmitAnswerDto) {
    return this.service.submitAnswer(userId, id, dto);
  }

  @Post(':id/next')
  next(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.service.next(userId, id);
  }

  @Post(':id/end')
  end(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.service.end(userId, id);
  }
}
