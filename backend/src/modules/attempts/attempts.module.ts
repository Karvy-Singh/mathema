import { Module } from '@nestjs/common';
import { AttemptsController } from './attempts.controller';
import { AttemptsService } from './attempts.service';
import { AttemptsRepository } from './attempts.repository';
import { GradingService } from './grading.service';

@Module({
  controllers: [AttemptsController],
  providers: [AttemptsService, AttemptsRepository, GradingService],
  exports: [AttemptsService, GradingService],
})
export class AttemptsModule {}
