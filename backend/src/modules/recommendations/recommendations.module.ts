import { Module } from '@nestjs/common';
import { RecommendationsController } from './recommendations.controller';
import { RecommendationsService } from './recommendations.service';
import { FocusOnMistakesStrategy } from './strategies/focus-on-mistakes.strategy';
import { ReinforceWeaknessStrategy } from './strategies/reinforce-weakness.strategy';
import { MaintainStrengthStrategy } from './strategies/maintain-strength.strategy';

@Module({
  controllers: [RecommendationsController],
  providers: [
    RecommendationsService,
    FocusOnMistakesStrategy,
    ReinforceWeaknessStrategy,
    MaintainStrengthStrategy,
  ],
  exports: [RecommendationsService],
})
export class RecommendationsModule {}
