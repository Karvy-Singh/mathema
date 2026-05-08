import { Module } from '@nestjs/common';
import { StudySessionsController } from './study-sessions.controller';
import { StudySessionsService } from './study-sessions.service';
import { StudySessionsRepository } from './study-sessions.repository';
import { AiGuideService } from './services/ai-guide.service';
import { AttemptsModule } from '../attempts/attempts.module';

/**
 * 학습 세션 — 학습 페이지 (Session 03/05, 5단계 progress, 14:32 타이머).
 * AI 가이드는 4가지 관점(공식 중심 / 단계별 / 시각화 / 실생활) × 5단계 step.
 */
@Module({
  imports: [AttemptsModule],
  controllers: [StudySessionsController],
  providers: [StudySessionsService, StudySessionsRepository, AiGuideService],
  exports: [StudySessionsService],
})
export class StudySessionsModule {}
