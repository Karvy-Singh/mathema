import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { ActivityModule } from '../activity/activity.module';
import { MasteryModule } from '../mastery/mastery.module';
import { UsersModule } from '../users/users.module';
import { AttemptsModule } from '../attempts/attempts.module';

@Module({
  imports: [ActivityModule, MasteryModule, UsersModule, AttemptsModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
