import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { MasteryService } from './mastery.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('mastery')
export class MasteryController {
  constructor(private readonly service: MasteryService) {}

  @Get()
  all(@CurrentUser('id') userId: string) { return this.service.all(userId); }

  @Get(':unitId')
  byUnit(@CurrentUser('id') userId: string, @Param('unitId') unitId: string) {
    return this.service.byUnit(userId, unitId);
  }
}
