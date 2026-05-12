import { Module } from '@nestjs/common';
import { RecommendationsController } from './recommendations.controller';
import { RecommendationsService } from './recommendations.service';
import { FocusOnMistakesStrategy } from './strategies/focus-on-mistakes.strategy';
import { ReinforceWeaknessStrategy } from './strategies/reinforce-weakness.strategy';
import { MaintainStrengthStrategy } from './strategies/maintain-strength.strategy';
import { StudyBalanceService } from './services/study-balance.service';
import { AdaptiveNextProblemService } from './services/adaptive-next-problem.service';
import { SimilarProblemService } from './services/similar-problem.service';
import { ReviewScheduleService } from './services/review-schedule.service';

@Module({
  controllers: [RecommendationsController],
  providers: [
    RecommendationsService,
    FocusOnMistakesStrategy,
    ReinforceWeaknessStrategy,
    MaintainStrengthStrategy,
    StudyBalanceService,
    AdaptiveNextProblemService,
    SimilarProblemService,
    ReviewScheduleService,
  ],
  exports: [
    RecommendationsService,
    StudyBalanceService,
    AdaptiveNextProblemService,
    SimilarProblemService,
    ReviewScheduleService,
  ],
})
export class RecommendationsModule {}
