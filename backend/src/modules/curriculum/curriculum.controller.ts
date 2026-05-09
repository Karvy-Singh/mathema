import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { CurriculumService } from './curriculum.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CurrentLang, Lang } from '../../common/i18n/current-lang.decorator';

@UseGuards(JwtAuthGuard)
@Controller('curriculum')
export class CurriculumController {
  constructor(private readonly service: CurriculumService) {}

  @Get()
  tree(@CurrentLang() lang: Lang, @Query('grade') grade?: string) {
    return this.service.tree(lang, grade);
  }

  /** 가입한 학년에 맞는 단원만 — UnitPicker 용 */
  @Get('units')
  units(
    @CurrentUser('id') userId: string,
    @CurrentLang() lang: Lang,
    @Query('grade') grade?: string,
  ) {
    return this.service.unitsForUser(userId, lang, grade);
  }
}
