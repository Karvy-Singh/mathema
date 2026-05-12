import { Injectable, Logger } from '@nestjs/common';
import { createHash } from 'crypto';
import { ConfigService } from '@nestjs/config';
import { LLMValidationStatus, MasteryUpdateSource } from '@prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { AiService } from '../../infrastructure/ai/ai.service';
import {
  AttemptAnalysis,
  AttemptAnalysisInput,
  AttemptAnalysisSchema,
  PROMPT_VERSION,
  buildAttemptAnalysisPrompt,
} from '../../infrastructure/ai/prompts/attempt-analyze.prompt';
import { MasteryTrajectoryService } from '../mastery/mastery-trajectory.service';
import { ErrorPatternService } from '../mastery/error-pattern.service';

/**
 * LLMAnalysisService — 명세서 Flow 3 (LLM 분석) 의 핵심 구현.
 *
 *   1. Attempt + Problem + Concept 정보 수집
 *   2. buildAttemptAnalysisPrompt 로 prompt 생성
 *   3. inputHash 계산 (canonical JSON SHA-256)
 *   4. AiService.generateText 호출 (Redis 캐시 + retry + circuit breaker)
 *   5. rawOutput parse → AttemptAnalysisSchema 검증
 *   6. LLMAnalysisLog 저장 (rawOutput / parsedOutput / validationStatus)
 *   7. validationStatus = VALIDATED 인 경우에만:
 *        - Attempt.errorCodes 를 LLM 결과로 덮어쓰기
 *        - ErrorPatternProfile / MasteryTrajectory 를 LLM 결과로 재계산
 *      (updatedBy = LLM 또는 HYBRID)
 *
 *   주의:
 *     - rawOutput 을 그대로 비즈니스 로직에 쓰지 않음.
 *     - confidenceScore < 0.5 → NEEDS_REVIEW (인간 검수 대기).
 *     - JSON parse 실패 / schema mismatch → REJECTED (반영 없음).
 *     - 모든 호출은 LLMAnalysisLog 1 row 생성 — 누락 X.
 *     - promptVersion + inputHash 저장으로 회귀 분석 가능.
 *
 *   호출 시점: LlmAnalysisListener (attempt.completed 이벤트, 비동기).
 */
@Injectable()
export class LLMAnalysisService {
  private readonly logger = new Logger(LLMAnalysisService.name);
  private static readonly MIN_CONFIDENCE = 0.5;

  constructor(
    private readonly prisma: PrismaService,
    private readonly ai: AiService,
    private readonly config: ConfigService,
    private readonly trajectory: MasteryTrajectoryService,
    private readonly errorPattern: ErrorPatternService,
  ) {}

  /**
   * 한 attempt 를 분석. 처음부터 끝까지 — prompt → LLM → 검증 → 저장 → 반영.
   * 실패해도 throw 하지 않고 LLMAnalysisLog 만 남기고 끝낸다 (학생 흐름 차단 X).
   */
  async analyzeAttempt(attemptId: string): Promise<void> {
    const attempt = await this.prisma.attempt.findUnique({
      where: { id: attemptId },
      include: {
        problem: {
          include: {
            concepts: { include: { concept: { select: { id: true, code: true } } } },
          },
        },
      },
    });
    if (!attempt) {
      this.logger.warn(`analyzeAttempt: attempt ${attemptId} not found`);
      return;
    }

    const input: AttemptAnalysisInput = {
      problemBody: attempt.problem.body,
      problemAnswer: attempt.problem.answer,
      problemExplanation: attempt.problem.concept,
      expectedSolutionSteps: attempt.problem.expectedSolutionSteps as unknown,
      commonErrorCodes: attempt.problem.commonErrorCodes,
      studentAnswer: attempt.answer,
      isCorrect: attempt.isCorrect,
      stepByStepInput: attempt.stepByStepInput as unknown,
      responseTimeSec: attempt.durationSec,
      selfConfidenceScore: attempt.selfConfidenceScore,
      hintUsed: attempt.hintUsed,
      hintCount: attempt.hintCount,
      conceptTags: attempt.problem.concepts.map((pc) => pc.concept.code),
      lang: 'ko',   // i18n 확장 시 user.locale 로 전환
    };
    const prompt = buildAttemptAnalysisPrompt(input);
    const inputHash = this.hashInput(input);
    const modelName = this.config.get<string>('ai.llm.model') ?? 'gpt-4o';

    let raw: string;
    let parsed: AttemptAnalysis | null = null;
    let validationStatus: LLMValidationStatus = LLMValidationStatus.PENDING;
    let confidenceScore = 0;
    let parseErrorMessage: string | null = null;

    try {
      const res = await this.ai.generateText(
        {
          prompt,
          system: 'You are a math learning diagnostician. Output strictly the JSON requested. No prose, no code fences.',
          maxTokens: 800,
          temperature: 0.2,
        },
        { userId: attempt.userId },
      );
      raw = res.text;

      // JSON 파싱 — 코드펜스/주변 텍스트 제거 후 파싱.
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? jsonMatch[0] : raw;
      const parsedJson = JSON.parse(jsonStr);
      const validated = AttemptAnalysisSchema.safeParse(parsedJson);
      if (!validated.success) {
        validationStatus = LLMValidationStatus.REJECTED;
        parseErrorMessage = validated.error.message.slice(0, 500);
      } else {
        parsed = validated.data;
        confidenceScore = parsed.confidenceScore;
        validationStatus = confidenceScore < LLMAnalysisService.MIN_CONFIDENCE
          ? LLMValidationStatus.NEEDS_REVIEW
          : LLMValidationStatus.VALIDATED;
      }
    } catch (err) {
      raw = JSON.stringify({ error: (err as Error).message });
      validationStatus = LLMValidationStatus.REJECTED;
      parseErrorMessage = (err as Error).message;
      this.logger.warn(`LLM analyzeAttempt error for ${attemptId}: ${parseErrorMessage}`);
    }

    // LLMAnalysisLog 무조건 1 row 저장.
    await this.prisma.lLMAnalysisLog.create({
      data: {
        userId: attempt.userId,
        attemptId: attempt.id,
        problemId: attempt.problemId,
        tenantId: attempt.tenantId,
        modelName,
        promptVersion: PROMPT_VERSION,
        inputHash,
        rawOutput: { raw, parseError: parseErrorMessage },
        parsedOutput: (parsed as unknown as object) ?? { rejected: true },
        confidenceScore,
        validationStatus,
      },
    });

    // VALIDATED 인 경우에만 비즈니스 로직 반영.
    if (validationStatus !== LLMValidationStatus.VALIDATED || !parsed) {
      this.logger.log(`Attempt ${attemptId} LLM analysis status=${validationStatus} — no DB mutation`);
      return;
    }

    // 1) Attempt.errorCodes 를 LLM 결과로 덮어쓰기 (rule-based 1차 추정 → LLM 검증된 값).
    await this.prisma.attempt.update({
      where: { id: attempt.id },
      data: { errorCodes: parsed.errorCodes },
    });

    // 2) ErrorPatternProfile 갱신 — LLM errorCodes 로 재계산.
    const conceptIds = attempt.problem.concepts.map((pc) => pc.conceptId);
    const trajectories = await this.prisma.masteryTrajectory.findMany({
      where: { userId: attempt.userId, conceptId: { in: conceptIds } },
      select: { conceptId: true, masteryScore: true },
    });
    const masteryByConcept = new Map(trajectories.map((t) => [t.conceptId, t.masteryScore]));
    await this.errorPattern.updateAfterAttempt({
      userId: attempt.userId,
      tenantId: attempt.tenantId,
      attemptId: attempt.id,
      conceptIds,
      errorCodes: parsed.errorCodes,
      isCorrect: attempt.isCorrect,
      masteryScoreByConcept: masteryByConcept,
    });

    // 3) MasteryTrajectory 재계산 — updatedBy=LLM 으로 source 변경.
    //    delta 는 1차 RULE_BASED 가 이미 반영했으므로 여기서는 source/trend 갱신만.
    for (const cid of conceptIds) {
      const t = await this.prisma.masteryTrajectory.findUnique({
        where: { userId_conceptId: { userId: attempt.userId, conceptId: cid } },
      });
      if (t) {
        await this.prisma.masteryTrajectory.update({
          where: { id: t.id },
          data: { updatedBy: MasteryUpdateSource.HYBRID },
        });
      }
    }

    // 4) WrongNote.insight 갱신 (LLM reasoningSummary 로).
    await this.prisma.wrongNote.updateMany({
      where: { userId: attempt.userId, problemId: attempt.problemId },
      data: { insight: parsed.reasoningSummary, status: 'ANALYZING' },
    });

    this.logger.log(`Attempt ${attemptId} LLM analysis VALIDATED — errorCodes=${parsed.errorCodes.join(',')} conf=${confidenceScore.toFixed(2)}`);
  }

  /** Canonical JSON SHA-256 — 같은 입력 반복 호출 시 inputHash 일치. */
  private hashInput(input: AttemptAnalysisInput): string {
    const canonical = JSON.stringify(input, Object.keys(input).sort());
    return createHash('sha256').update(canonical).digest('hex');
  }
}
