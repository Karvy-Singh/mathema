import { Injectable } from '@nestjs/common';
import { StudySessionsRepository } from './study-sessions.repository';
import { AiGuideService } from './services/ai-guide.service';
import { AttemptsService } from '../attempts/attempts.service';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { StartSessionDto } from './dto/start-session.dto';
import { SubmitAnswerDto } from './dto/submit-answer.dto';
import { SessionContext } from '../../common/enums/session-context.enum';
import { Lang } from '../../common/i18n/current-lang.decorator';
import { CHOICE_EN } from '../../common/i18n/content-en';

@Injectable()
export class StudySessionsService {
  constructor(
    private readonly repo: StudySessionsRepository,
    private readonly aiGuide: AiGuideService,
    private readonly attempts: AttemptsService,
    private readonly prisma: PrismaService,
  ) {}

  start(userId: string, dto: StartSessionDto) { return this.repo.create(userId, dto); }
  get(userId: string, id: string) { return this.repo.findOne(userId, id); }

  getAiGuide(userId: string, id: string, perspective: string) {
    return this.aiGuide.generate(userId, id, perspective);
  }

  /**
   * 답안 제출 응답을 선택지 메타로 enrich:
   *   - 정답: { isCorrect: true, choice: { text } }
   *   - 오답: { isCorrect: false, choice: { text, distractorType, rationale } } → 학습용 즉시 피드백
   *   - isRetry: 같은 step의 N번째 시도면 true (BKT 무효화됨)
   */
  async submitAnswer(userId: string, id: string, dto: SubmitAnswerDto, lang: Lang = 'ko') {
    const attempt = await this.attempts.create(userId, {
      problemId: dto.problemId,
      answer: dto.answer,
      durationSec: dto.durationSec,
      confidence: dto.confidence,
      stepIndex: dto.stepIndex,
      choiceId: dto.choiceId,
      context: SessionContext.STUDY,
      studySessionId: id,
    });

    if (dto.choiceId) {
      const choice = await this.prisma.problemChoice.findUnique({
        where: { id: dto.choiceId },
        select: {
          id: true, text: true, isCorrect: true, distractorType: true, rationale: true,
          step: { select: { stepIndex: true, problem: { select: { source: true } } } },
        },
      });
      if (choice && lang === 'en' && choice.step) {
        const key = `${choice.step.problem.source}:${choice.step.stepIndex}:${(await this.prisma.problemChoice.findUnique({ where: { id: choice.id }, select: { choiceIndex: true } }))?.choiceIndex}`;
        const en = CHOICE_EN[key];
        if (en) {
          return { ...attempt, choice: { ...choice, text: en.text, rationale: en.rationale ?? null } };
        }
      }
      return { ...attempt, choice };
    }
    return attempt;
  }

  next(userId: string, id: string) { return this.repo.advanceStep(userId, id); }
  end(userId: string, id: string) { return this.repo.endSession(userId, id); }
}
