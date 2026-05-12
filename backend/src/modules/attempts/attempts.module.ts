import { Module, forwardRef } from '@nestjs/common';
import { AttemptsController } from './attempts.controller';
import { AttemptsService } from './attempts.service';
import { AttemptsRepository } from './attempts.repository';
import { GradingService } from './grading.service';
import { RecommendationsModule } from '../recommendations/recommendations.module';

@Module({
  imports: [forwardRef(() => RecommendationsModule)],
  controllers: [AttemptsController],
  providers: [AttemptsService, AttemptsRepository, GradingService],
  exports: [AttemptsService, GradingService],
})
export class AttemptsModule {}
