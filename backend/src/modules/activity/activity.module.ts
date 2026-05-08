import { Module } from '@nestjs/common';
import { ActivityController } from './activity.controller';
import { ActivityService } from './activity.service';
import { ActivityRepository } from './activity.repository';
import { ActivityAttemptListener } from './listeners/attempt-completed.listener';

@Module({
  controllers: [ActivityController],
  providers: [ActivityService, ActivityRepository, ActivityAttemptListener],
  exports: [ActivityService],
})
export class ActivityModule {}
