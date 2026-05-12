import { Module } from '@nestjs/common';
import { LLMAnalysisService } from './llm-analysis.service';
import { LlmAnalysisListener } from './llm-analysis.listener';
import { MasteryModule } from '../mastery/mastery.module';
import { AiModule } from '../../infrastructure/ai/ai.module';

@Module({
  imports: [MasteryModule, AiModule],
  providers: [LLMAnalysisService, LlmAnalysisListener],
  exports: [LLMAnalysisService],
})
export class LlmAnalysisModule {}
