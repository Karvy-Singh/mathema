import { Module } from '@nestjs/common';
import { MasteryController } from './mastery.controller';
import { MasteryService } from './mastery.service';
import { MasteryRepository } from './mastery.repository';
import { MasteryAttemptListener } from './listeners/attempt-completed.listener';

@Module({
  controllers: [MasteryController],
  providers: [MasteryService, MasteryRepository, MasteryAttemptListener],
  exports: [MasteryService],
})
export class MasteryModule {}
