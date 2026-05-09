import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { MockExamsService } from './mock-exams.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CurrentLang, Lang } from '../../common/i18n/current-lang.decorator';
import { SubmitExamDto } from './dto/submit-exam.dto';

@UseGuards(JwtAuthGuard)
@Controller('mock-exams')
export class MockExamsController {
  constructor(private readonly service: MockExamsService) {}

  @Get('summary')
  summary(@CurrentUser('id') userId: string) { return this.service.summary(userId); }

  @Get('trajectory')
  trajectory(@CurrentUser('id') userId: string, @CurrentLang() lang: Lang, @Query('count') count = 6) {
    return this.service.trajectory(userId, +count, lang);
  }

  @Get('results')
  results(@CurrentUser('id') userId: string, @CurrentLang() lang: Lang, @Query('recent') recent = 4) {
    return this.service.recentResults(userId, +recent, lang);
  }

  @Post('recommended/start')
  startRecommended(@CurrentUser('id') userId: string, @CurrentLang() lang: Lang) {
    return this.service.startRecommended(userId, lang);
  }

  @Post('types/:kind/start')
  startTyped(@CurrentUser('id') userId: string, @CurrentLang() lang: Lang, @Param('kind') kind: 'mini' | 'wrong-redo' | 'real') {
    return this.service.startTyped(userId, kind, lang);
  }

  @Post('results/:id/submit')
  submit(@CurrentUser('id') userId: string, @Param('id') id: string, @Body() dto: SubmitExamDto) {
    return this.service.submit(userId, id, dto);
  }
}
