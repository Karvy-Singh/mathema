import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ActivityService } from './activity.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('activity')
export class ActivityController {
  constructor(private readonly service: ActivityService) {}

  @Get('heatmap')
  heatmap(@CurrentUser('id') userId: string, @Query('weeks') weeks = 12) {
    return this.service.heatmap(userId, +weeks);
  }

  @Get('streak')
  streak(@CurrentUser('id') userId: string) { return this.service.streak(userId); }

  @Get('today')
  today(@CurrentUser('id') userId: string) { return this.service.today(userId); }

  @Get('stats')
  stats(@CurrentUser('id') userId: string) { return this.service.aggregateStats(userId); }
}
