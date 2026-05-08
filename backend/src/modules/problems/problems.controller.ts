import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ProblemsService } from './problems.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { QueryProblemsDto } from './dto/query-problems.dto';

@UseGuards(JwtAuthGuard)
@Controller('problems')
export class ProblemsController {
  constructor(private readonly service: ProblemsService) {}
  @Get() list(@Query() q: QueryProblemsDto) { return this.service.list(q); }

  // 사용자 숙련도에 맞춘 권장 난이도 문제 (학습 페이지 문제 표시용)
  @Get('recommended')
  recommended(@CurrentUser('id') userId: string, @Query('unitId') unitId: string) {
    return this.service.recommendedFor(userId, unitId);
  }

  @Get(':id') one(@Param('id') id: string) { return this.service.one(id); }
  @Get(':id/hint') hint(@Param('id') id: string) { return this.service.hint(id); }
}
