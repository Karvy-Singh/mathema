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

    // 시간대 — 클라이언트가 timeOfDay 직접 전달하지 않으면 서버 시각 hour 사용 (UTC 기준,
    // 인도 PoC 는 IST 보정용 frontend 측에서 user-local hour 를 보내는 게 권장).
    const timeOfDay = typeof dto.timeOfDay === 'number'
      ? Math.max(0, Math.min(23, Math.floor(dto.timeOfDay)))
      : new Date().getHours();
    const deviceType = typeof dto.deviceType === 'string'
      && ['android', 'ios', 'web'].includes(dto.deviceType) ? dto.deviceType : null;

    const attempt = await this.prisma.attempt.create({
      data: {
        userId, problemId: dto.problemId,
        context: dto.context ?? 'STUDY',
        answer: answerText, isCorrect,
        durationSec: dto.durationSec ?? 0,
        responseTimeMs: typeof dto.responseTimeMs === 'number'
          ? Math.max(0, Math.floor(dto.responseTimeMs)) : null,
        confidence: typeof dto.confidence === 'number'
          ? Math.max(0, Math.min(100, Math.round(dto.confidence))) : null,
        hintUsed: dto.hintUsed === true,
        deviceType,
        timeOfDay,
        stepIndex: typeof dto.stepIndex === 'number' ? dto.stepIndex : null,
        choiceId: dto.choiceId ?? null,
        studySessionId: dto.studySessionId ?? null,
        mockExamResultId: dto.mockExamResultId ?? null,
      },
    });

    // 오답 + 첫 시도일 때만 WrongNote 누적. errorType 은 hintUsed/confidence 도 고려.
    let errorTypeForSnapshot: ErrorType | undefined;
    if (!isCorrect && !isRetry) {
      errorTypeForSnapshot = mapDistractorToErrorType(
        distractorType,
        dto.durationSec ?? 0,
        { hintUsed: dto.hintUsed === true, confidence: typeof dto.confidence === 'number' ? dto.confidence : undefined },
      );
      await this.prisma.wrongNote.upsert({
        where: { userId_problemId: { userId, problemId: dto.problemId } },
        update: { occurrences: { increment: 1 } },
        create: {
          userId, problemId: dto.problemId,
          errorType: errorTypeForSnapshot as any,
          // insight 는 백그라운드 LLM 분석으로 채워짐. 그 전까지는 status=PENDING 으로만 표현.
          insight: '',
          status: 'PENDING',
        },
      });
    }

    // 이벤트 페이로드: isRetry (mastery BKT skip) + errorTypeForSnapshot (분포 갱신용)
    return Object.assign(attempt, { isRetry, errorTypeForSnapshot });
  }
}

/**
 * distractorType (4종) → ErrorType (4종) 매핑.
 * 보조 신호: hintUsed (힌트 본 후에도 틀림 → 개념 부재), confidence (확신 높은데 틀림 → 개념 오해)
 */
function mapDistractorToErrorType(
  distractorType: string | null,
  durationSec: number,
  signals: { hintUsed: boolean; confidence?: number } = { hintUsed: false },
): ErrorType {
  // 1순위: 명시적 distractor 분류
  switch (distractorType) {
    case 'CONCEPT_CONFUSION': return ErrorType.CONCEPT_MISUNDERSTANDING;
    case 'CALC_ERROR': return ErrorType.CALCULATION_MISTAKE;
    case 'PROCESS_SKIP': return ErrorType.CONCEPT_MISUNDERSTANDING;
    case 'TIME_PRESSURE_GUESS': return ErrorType.TIME_SHORTAGE;
  }
  // 2순위: 휴리스틱
  // 힌트를 보고도 틀렸으면 개념 부재 — 단순 계산 실수가 아님
  if (signals.hintUsed) return ErrorType.CONCEPT_MISUNDERSTANDING;
  // 확신은 높았는데 틀렸으면 개념 오해 (overconfident)
  if (typeof signals.confidence === 'number' && signals.confidence >= 70) {
    return ErrorType.CONCEPT_MISUNDERSTANDING;
  }
  return durationSec > 240 ? ErrorType.TIME_SHORTAGE : ErrorType.CALCULATION_MISTAKE;
}
