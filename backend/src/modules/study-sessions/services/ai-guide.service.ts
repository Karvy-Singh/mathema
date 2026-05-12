import { Injectable, Logger } from '@nestjs/common';
import { ErrorPatternStatus } from '@prisma/client';
import { AiService } from '../../../infrastructure/ai/ai.service';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import {
  StepwiseGuide, StepwiseGuideSchema, stepwiseGuidePrompt,
} from '../../../infrastructure/ai/prompts/stepwise-guide.prompt';
import { Lang } from '../../../common/i18n/current-lang.decorator';

export type Perspective = '공식 중심' | '단계별' | '시각화' | '실생활 예시';

/**
 * AI 단계별 가이드 (학습 페이지 우측 패널).
 *
 *   명세서 §3-1 정합:
 *     - 실제 문제 본문 / 정답 / 해설 / expectedSolutionSteps 를 LLM 에 전달.
 *     - 학생의 MasteryTrajectory / ACTIVE ErrorPattern 만 보냄 (추측 없음).
 *     - 응답은 JSON 5단계 객체 배열로 강제 + Zod 검증.
 *     - 파싱 실패 시 'fallback' 모드 — current step 표시만.
 *
 *   결과 캐시: AiService 의 Redis 7d 캐시 (입력 동일 시 비용 절감).
 */
@Injectable()
export class AiGuideService {
  private readonly logger = new Logger(AiGuideService.name);

  constructor(
    private readonly ai: AiService,
    private readonly prisma: PrismaService,
  ) {}

  async generate(userId: string, sessionId: string, perspective: string, lang: Lang = 'ko') {
    const persp = this.normalizePerspective(perspective);

    // 1) 세션 → unit → 추천 문제 lookup. 추천이 있으면 그 problemId, 없으면 unit 의 첫 문제.
    const session = await this.prisma.studySession.findFirst({
      where: { id: sessionId, userId },
      select: { id: true, unitId: true, currentStep: true },
    });
    if (!session) {
      return this.empty(lang, persp, 'session not found');
    }

    // 최근 RecommendationLog (ADAPTIVE_NEXT) 에서 이 세션의 추천 문제 찾기.
    const recentRec = await this.prisma.recommendationLog.findFirst({
      where: { userId, sessionId, recommendationType: 'ADAPTIVE_NEXT' },
      orderBy: { createdAt: 'desc' },
    });

    let problemId = recentRec?.recommendedProblemId ?? null;
    if (!problemId) {
      // 추천 없으면 unit 의 첫 문제 (난이도 낮은 순).
      const fallbackProblem = await this.prisma.problem.findFirst({
        where: { unitId: session.unitId },
        orderBy: { difficultyLevel: 'asc' },
        select: { id: true },
      });
      problemId = fallbackProblem?.id ?? null;
    }
    if (!problemId) {
      return this.empty(lang, persp, 'no problem for this unit');
    }

    // 2) Problem + Concept lookup.
    const problem = await this.prisma.problem.findUnique({
      where: { id: problemId },
      include: { concepts: { include: { concept: { select: { id: true, code: true } } } } },
    });
    if (!problem) return this.empty(lang, persp, 'problem not found');

    const conceptIds = problem.concepts.map((pc) => pc.conceptId);
    const conceptTags = problem.concepts.map((pc) => pc.concept.code);

    // 3) 학생 mastery + active error 패턴.
    const trajectory = conceptIds.length > 0
      ? await this.prisma.masteryTrajectory.findFirst({
          where: { userId, conceptId: { in: conceptIds } },
          orderBy: { masteryScore: 'asc' },
        })
      : null;
    const activeErrors = conceptIds.length > 0
      ? await this.prisma.errorPatternProfile.findMany({
          where: { userId, conceptId: { in: conceptIds }, status: ErrorPatternStatus.ACTIVE },
          select: { errorCode: true },
        })
      : [];

    // 4) Prompt 생성 + LLM 호출 + JSON 검증.
    const req = stepwiseGuidePrompt({
      perspective: persp,
      lang,
      problem: {
        source: problem.source,
        body: problem.body,
        answer: problem.answer,
        concept: problem.concept,
        formula: problem.formula,
        difficultyLevel: problem.difficultyLevel,
        conceptTags,
        expectedSolutionSteps: problem.expectedSolutionSteps as unknown,
      },
      student: {
        masteryScore: trajectory?.masteryScore ?? null,
        evidenceCount: trajectory?.evidenceCount ?? 0,
        recentAccuracy: trajectory?.recentAccuracy ?? null,
        activeErrorCodes: activeErrors.map((e) => e.errorCode),
        currentStep: session.currentStep,
      },
    });

    let raw: string;
    let parsed: StepwiseGuide | null = null;
    let parseError: string | null = null;
    let inputTokens = 0, outputTokens = 0;
    try {
      const res = await this.ai.generateText(req, { userId });
      raw = res.text;
      inputTokens = res.inputTokens;
      outputTokens = res.outputTokens;
      const json = raw.match(/\{[\s\S]*\}/)?.[0] ?? raw;
      const safe = StepwiseGuideSchema.safeParse(JSON.parse(json));
      if (safe.success) parsed = safe.data;
      else parseError = safe.error.message.slice(0, 300);
    } catch (err) {
      parseError = (err as Error).message;
      raw = '';
    }

    return {
      perspective: persp,
      problemId,
      steps: parsed?.steps ?? this.deriveFallbackSteps(session.currentStep, lang),
      validationStatus: parsed ? 'validated' : 'fallback',
      parseError,
      // 호환 — 옛 frontend 가 text 만 보던 경로용. 객체 받아도 동작.
      text: parsed
        ? parsed.steps.map((s) => `${s.num}. ${s.title}\n${s.desc}`).join('\n\n')
        : (raw || this.fallbackText(lang)),
      inputTokens, outputTokens,
    };
  }

  private normalizePerspective(p: string): Perspective {
    const ok: Perspective[] = ['공식 중심', '단계별', '시각화', '실생활 예시'];
    return (ok as string[]).includes(p) ? (p as Perspective) : '단계별';
  }

  private deriveFallbackSteps(current: number, lang: Lang): StepwiseGuide['steps'] {
    const titles = lang === 'en'
      ? ['Read the problem', 'Identify the concept', 'Plan the steps', 'Compute', 'Verify the answer']
      : ['문제 읽기', '핵심 개념 파악', '풀이 단계 설계', '계산 수행', '답 검증'];
    return titles.map((title, i) => ({
      num: i + 1,
      title,
      desc: lang === 'en'
        ? 'AI guide unavailable right now — proceed with this generic step.'
        : 'AI 가이드를 일시적으로 불러올 수 없어 기본 단계를 보여드립니다.',
      current: i + 1 === current,
      done: i + 1 < current,
    }));
  }

  private fallbackText(lang: Lang): string {
    return lang === 'en'
      ? 'AI guide unavailable for this problem right now.'
      : '이 문제에 대한 AI 가이드를 일시적으로 불러올 수 없습니다.';
  }

  private empty(lang: Lang, persp: Perspective, reason: string) {
    this.logger.warn(`AiGuide empty: ${reason}`);
    return {
      perspective: persp,
      problemId: null,
      steps: this.deriveFallbackSteps(1, lang),
      validationStatus: 'empty',
      parseError: null,
      text: this.fallbackText(lang),
      inputTokens: 0, outputTokens: 0,
    };
  }
}
