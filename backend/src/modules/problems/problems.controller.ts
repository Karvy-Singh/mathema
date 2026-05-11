import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ProblemsService } from './problems.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CurrentLang, Lang } from '../../common/i18n/current-lang.decorator';
import { QueryProblemsDto } from './dto/query-problems.dto';

@UseGuards(JwtAuthGuard)
@Controller('problems')
export class ProblemsController {
  constructor(private readonly service: ProblemsService) {}
  @Get() list(@Query() q: QueryProblemsDto, @CurrentLang() lang: Lang) { return this.service.list(q, lang); }

  @Get('recommended')
  recommended(@CurrentUser('id') userId: string, @CurrentLang() lang: Lang, @Query('unitId') unitId: string) {
    return this.service.recommendedFor(userId, unitId, lang);
  }

  @Get(':id') one(@Param('id') id: string, @CurrentLang() lang: Lang) { return this.service.one(id, lang); }
  @Get(':id/hint') hint(@Param('id') id: string) { return this.service.hint(id); }

  /** 풀이 공개 (오답노트/복습용) — body + concept + formula + 단계별 풀이 + 정답 */
  @Get(':id/solution')
  solution(@Param('id') id: string, @CurrentLang() lang: Lang) { return this.service.solution(id, lang); }
}
