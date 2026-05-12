import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { GradingService } from './grading.service';

/**
 * AttemptsRepository — Attempt 1 row 저장 + WrongNote upsert + 이벤트 페이로드 구성.
 *
 *   요구사항 명세서 Flow 2 (문제 제출):
 *     1) 채점 (객관식 choiceId 또는 단일답안 answer)
 *     2) GradingService 로 errorCodes 1차 추정
 *     3) Attempt row create — 신규 필드 (stepByStepInput, hintCount,
 *        selfConfidenceScore, errorCodes, tenantId) 포함
 *     4) 오답이면 WrongNote upsert (호환 유지)
 *     5) 이벤트 페이로드에 모든 시그널 포함 → mastery / errorPattern listener 가 사용
 *
 *   LLM 비동기 분석은 별도 worker (LLMAnalysisService — Phase 2 후속) 가
 *   attempt.completed 이벤트를 받아 처리.
 */
@Injectable()
export class AttemptsRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly grading: GradingService,
  ) {}

  async create(userId: string, dto: any) {
    const problem = await this.prisma.problem.findUniqueOrThrow({
      where: { id: dto.problemId },
      include: { concepts: { select: { conceptId: true } } },
    });

    // 두 모드 지원:
    //   (A) 객관식: choiceId 제공 → ProblemChoice.isCorrect 기준
    //   (B) 단일답안: answer 문자열 → problem.answer 와 비교
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

    // 재시도 판정 — 학습 모드에서 같은 (session, problem, stepIndex) 의 이전 attempt 가 있으면 retry.
    const isRetry = !!(dto.studySessionId && typeof dto.stepIndex === 'number'
      && (await this.prisma.attempt.count({
        where: {
          userId, problemId: dto.problemId,
          studySessionId: dto.studySessionId,
          stepIndex: dto.stepIndex,
        },
      })) > 0);

    const timeOfDay = typeof dto.timeOfDay === 'number'
      ? Math.max(0, Math.min(23, Math.floor(dto.timeOfDay)))
      : new Date().getHours();
    const deviceType = typeof dto.deviceType === 'string'
      && ['android', 'ios', 'web'].includes(dto.deviceType) ? dto.deviceType : null;

    // GradingService 로 rule-based errorCodes + legacyErrorType 1차 추정.
    const stepByStepInput = Array.isArray(dto.stepByStepInput) ? dto.stepByStepInput : null;
    const { errorCodes, legacyErrorType } = this.grading.analyze({
      isCorrect,
      distractorType,
      durationSec: dto.durationSec ?? 0,
      expectedTimeSec: problem.expectedTimeSec ?? null,
      hintUsed: dto.hintUsed === true,
      hintCount: dto.hintCount,
      confidence: typeof dto.confidence === 'number' ? dto.confidence : null,
      stepByStepInput,
      problemHasSteps: !!problem.expectedSolutionSteps,
    });

    // tenantId — User 로부터 lookup (denormalize).
    const user = await this.prisma.user.findUnique({
      where: { id: userId }, select: { tenantId: true },
    });
    const tenantId = user?.tenantId ?? null;

    const attempt = await this.prisma.attempt.create({
      data: {
        userId, problemId: dto.problemId, tenantId,
        context: dto.context ?? 'STUDY',
        answer: answerText, isCorrect,
        durationSec: dto.durationSec ?? 0,
        responseTimeMs: typeof dto.responseTimeMs === 'number'
          ? Math.max(0, Math.floor(dto.responseTimeMs)) : null,
        confidence: typeof dto.confidence === 'number'
          ? Math.max(0, Math.min(100, Math.round(dto.confidence))) : null,
        selfConfidenceScore: typeof dto.selfConfidenceScore === 'number'
          ? Math.max(1, Math.min(5, Math.round(dto.selfConfidenceScore))) : null,
        hintUsed: dto.hintUsed === true,
        hintCount: typeof dto.hintCount === 'number' ? Math.max(0, Math.floor(dto.hintCount)) : 0,
        stepByStepInput: stepByStepInput ?? undefined,
        errorCodes,
        deviceType,
        timeOfDay,
        stepIndex: typeof dto.stepIndex === 'number' ? dto.stepIndex : null,
        choiceId: dto.choiceId ?? null,
        studySessionId: dto.studySessionId ?? null,
        mockExamResultId: dto.mockExamResultId ?? null,
      },
    });

    // 오답 + 첫 시도일 때만 WrongNote upsert (호환 유지).
    if (!isCorrect && !isRetry) {
      await this.prisma.wrongNote.upsert({
        where: { userId_problemId: { userId, problemId: dto.problemId } },
        update: { occurrences: { increment: 1 } },
        create: {
          userId, problemId: dto.problemId,
          errorType: legacyErrorType,
          insight: '',
          status: 'PENDING',
        },
      });
    }

    // 이벤트 페이로드 — mastery-trajectory.listener 가 이걸로 갱신 수행.
    //   명세서 §1-2: conceptTags / difficultyLevel 도 API 응답에 명시 노출 (Attempt 자체에는 정규화 안 됨, Problem 참조).
    const conceptIds = problem.concepts.map((c) => c.conceptId);
    const conceptCodes = await this.prisma.concept.findMany({
      where: { id: { in: conceptIds } }, select: { code: true },
    });
    return Object.assign(attempt, {
      isRetry,
      errorTypeForSnapshot: legacyErrorType,
      errorCodes,
      tenantId,
      conceptIds,
      conceptTags: conceptCodes.map((c) => c.code),       // 명세서 §1-2
      difficultyLevel: problem.difficultyLevel,           // 명세서 §1-2
    });
  }
}
