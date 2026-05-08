import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { ErrorType } from '../../common/enums/error-type.enum';

@Injectable()
export class AttemptsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: any) {
    const problem = await this.prisma.problem.findUniqueOrThrow({ where: { id: dto.problemId } });

    // 두 모드 지원:
    //   (A) 객관식: choiceId 제공 → ProblemChoice.isCorrect 기준
    //   (B) 단일답안: answer 문자열 → problem.answer와 비교
    let isCorrect: boolean;
    let answerText: string;
    let distractorType: string | null = null;

    if (dto.choiceId) {
      const choice = await this.prisma.problemChoice.findUnique({
        where: { id: dto.choiceId },
        select: { id: true, text: true, isCorrect: true, distractorType: true, stepId: true },
      });
      if (!choice) throw new Error(`Invalid choiceId: ${dto.choiceId}`);
      isCorrect = choice.isCorrect;
      answerText = choice.text;
      distractorType = choice.distractorType ?? null;
    } else {
      isCorrect = problem.answer.trim() === String(dto.answer ?? '').trim();
      answerText = String(dto.answer ?? '');
    }

    // 재시도 판정 — 학습 모드에서 같은 (session, problem, stepIndex)의 이전 attempt가 있으면 retry.
    // 이 경우 mastery BKT 갱신과 WrongNote 누적을 건너뛰어 학생이 부담 없이 정답 맞힐 때까지 시도 가능.
    const isRetry = !!(dto.studySessionId && typeof dto.stepIndex === 'number'
      && (await this.prisma.attempt.count({
        where: {
          userId, problemId: dto.problemId,
          studySessionId: dto.studySessionId,
          stepIndex: dto.stepIndex,
        },
      })) > 0);

    const attempt = await this.prisma.attempt.create({
      data: {
        userId, problemId: dto.problemId,
        context: dto.context ?? 'STUDY',
        answer: answerText, isCorrect,
        durationSec: dto.durationSec ?? 0,
        confidence: typeof dto.confidence === 'number' ? Math.max(0, Math.min(100, Math.round(dto.confidence))) : null,
        stepIndex: typeof dto.stepIndex === 'number' ? dto.stepIndex : null,
        choiceId: dto.choiceId ?? null,
        studySessionId: dto.studySessionId ?? null,
        mockExamResultId: dto.mockExamResultId ?? null,
      },
    });

    // 오답 + 첫 시도일 때만 WrongNote 누적
    if (!isCorrect && !isRetry) {
      const errorType = mapDistractorToErrorType(distractorType, dto.durationSec ?? 0);
      await this.prisma.wrongNote.upsert({
        where: { userId_problemId: { userId, problemId: dto.problemId } },
        update: { occurrences: { increment: 1 } },
        create: {
          userId, problemId: dto.problemId,
          errorType: errorType as any,
          insight: 'AI 분석 대기 중',
          status: 'PENDING',
        },
      });
    }

    // 이벤트 페이로드에 isRetry 플래그 포함 (mastery listener가 retry 시 BKT skip)
    return Object.assign(attempt, { isRetry });
  }
}

/** distractorType (4종) → ErrorType (4종) 매핑 */
function mapDistractorToErrorType(distractorType: string | null, durationSec: number): ErrorType {
  switch (distractorType) {
    case 'CONCEPT_CONFUSION': return ErrorType.CONCEPT_MISUNDERSTANDING;
    case 'CALC_ERROR': return ErrorType.CALCULATION_MISTAKE;
    case 'PROCESS_SKIP': return ErrorType.CONCEPT_MISUNDERSTANDING; // 단계 누락 ≈ 개념 불완전
    case 'TIME_PRESSURE_GUESS': return ErrorType.TIME_SHORTAGE;
    default:
      return durationSec > 240 ? ErrorType.TIME_SHORTAGE : ErrorType.CALCULATION_MISTAKE;
  }
}
