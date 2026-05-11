import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { StudySessionsService } from './study-sessions.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CurrentLang, Lang } from '../../common/i18n/current-lang.decorator';
import { StartSessionDto } from './dto/start-session.dto';
import { SubmitAnswerDto } from './dto/submit-answer.dto';

@UseGuards(JwtAuthGuard)
@Controller('study-sessions')
export class StudySessionsController {
  constructor(private readonly service: StudySessionsService) {}

  @Post('start')
  start(@CurrentUser('id') userId: string, @CurrentLang() lang: Lang, @Body() dto: StartSessionDto) {
    return this.service.start(userId, dto, lang);
  }

  /** 특정 문제로 학습 시작 — 유사문제 "풀어보기" 동선용 */
  @Post('start-from-problem/:problemId')
  startFromProblem(@CurrentUser('id') userId: string, @Param('problemId') problemId: string) {
    return this.service.startFromProblem(userId, problemId);
  }

  /** 가중치 기반 추천 단원 — 학습 시작 화면용 */
  @Get('recommended-units')
  recommendedUnits(
    @CurrentUser('id') userId: string,
    @CurrentLang() lang: Lang,
    @Query('count') count = 3,
    @Query('grade') grade?: string,
  ) {
    return this.service.recommendedUnits(userId, +count, grade, lang);
  }

  @Get(':id')
  get(@CurrentUser('id') userId: string, @CurrentLang() lang: Lang, @Param('id') id: string) {
    return this.service.get(userId, id, lang);
  }

  // 4가지 관점 변환: '공식 중심' | '단계별' | '시각화' | '실생활 예시'
  @Get(':id/guide')
  guide(
    @CurrentUser('id') userId: string,
    @CurrentLang() lang: Lang,
    @Param('id') id: string,
    @Query('perspective') perspective: string,
  ) {
    return this.service.getAiGuide(userId, id, perspective, lang);
  }

  @Post(':id/answer')
  submit(@CurrentUser('id') userId: string, @CurrentLang() lang: Lang, @Param('id') id: string, @Body() dto: SubmitAnswerDto) {
    return this.service.submitAnswer(userId, id, dto, lang);
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
