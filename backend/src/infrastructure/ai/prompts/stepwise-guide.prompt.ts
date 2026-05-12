import { z } from 'zod';
import { LlmRequest } from '../providers/llm.provider';

/**
 * 명세서 §3-1 — LLM 입력에는 반드시 실제 데이터만 전달.
 *   sessionId / userId 만으로 가이드를 생성하면 LLM 이 "예: 회전체 부피" 같은
 *   추측을 하게 됨. → 명세서 위반.
 *
 *   이 prompt 는 호출자(AiGuideService)가 다음을 lookup 해서 직접 넣는다:
 *     - 현재 풀이 중인 Problem(body, answer, explanation, expectedSolutionSteps)
 *     - 학생의 MasteryTrajectory (해당 concept)
 *     - active ErrorPatternProfile
 *
 *   응답은 JSON 5단계 객체 배열로 강제 (Zod 검증).
 */

const PERSPECTIVE_EN: Record<string, string> = {
  '공식 중심': 'formula-centric',
  '단계별': 'step-by-step',
  '시각화': 'visual',
  '실생활 예시': 'real-world example',
};

export const PROMPT_VERSION = 'stepwise-guide@v2';

export const StepwiseGuideStepSchema = z.object({
  num:     z.number().int().min(1).max(5),
  title:   z.string().min(1).max(60),
  desc:    z.string().min(1).max(400),
  current: z.boolean(),
  done:    z.boolean(),
});

export const StepwiseGuideSchema = z.object({
  steps: z.array(StepwiseGuideStepSchema).length(5),
});

export type StepwiseGuide = z.infer<typeof StepwiseGuideSchema>;

export interface StepwiseGuideContext {
  perspective: '공식 중심' | '단계별' | '시각화' | '실생활 예시';
  lang: 'ko' | 'en' | 'hi';

  // 현재 풀이 중인 문제 (필수 — sessionId 의 unit + 추천된 problem 으로 lookup)
  problem: {
    source: string;
    body: string;
    answer: string;
    concept?: string | null;
    formula?: string | null;
    difficultyLevel: number;
    conceptTags: string[];           // Concept.code
    expectedSolutionSteps?: unknown; // Problem.expectedSolutionSteps JSON
  };

  // 학생의 현재 상태 (선택 — 데이터 없으면 그 부분만 LLM 에 'unknown' 으로 전달)
  student: {
    masteryScore?: number | null;    // 0~100
    evidenceCount?: number;
    recentAccuracy?: number | null;
    activeErrorCodes?: string[];     // ACTIVE 패턴의 errorCode
    currentStep: number;             // 1~5
  };
}

const LANG_INSTRUCTION = {
  ko: '한국어로 작성하세요.',
  en: 'Write in English.',
  hi: 'हिंदी में लिखें।',
} as const;

export function stepwiseGuidePrompt(ctx: StepwiseGuideContext): LlmRequest {
  const persp = PERSPECTIVE_EN[ctx.perspective] ?? ctx.perspective;
  const stepsJson = ctx.problem.expectedSolutionSteps
    ? JSON.stringify(ctx.problem.expectedSolutionSteps).slice(0, 600)
    : '(서버에 미등록)';
  const mastery = ctx.student.masteryScore !== undefined && ctx.student.masteryScore !== null
    ? `${ctx.student.masteryScore}/100`
    : 'unknown';
  const activeErr = ctx.student.activeErrorCodes && ctx.student.activeErrorCodes.length > 0
    ? ctx.student.activeErrorCodes.join(', ')
    : 'none';

  return {
    system:
      '너는 NCERT (CBSE) 수학 1대1 과외 교사다. ' +
      '실제 문제와 학생 상태만 보고 5단계 가이드를 작성한다. ' +
      '없는 정보를 추측하거나 다른 문제로 일반화하지 마라. ' +
      '응답은 반드시 JSON: { "steps": [{num,title,desc,current,done}, ...5개] } 형식.',
    prompt: `${LANG_INSTRUCTION[ctx.lang]}

[문제 — 출처: ${ctx.problem.source}]
${ctx.problem.body}

[정답]
${ctx.problem.answer}

[핵심 개념 / 공식]
${ctx.problem.concept ?? '(서버에 미등록)'}
${ctx.problem.formula ? '\n공식: ' + ctx.problem.formula : ''}

[전형적 풀이 단계 (참고)]
${stepsJson}

[학생 상태]
- 이 개념의 mastery: ${mastery}  (evidenceCount: ${ctx.student.evidenceCount ?? 0})
- 최근 정답률: ${ctx.student.recentAccuracy != null ? Math.round(ctx.student.recentAccuracy * 100) + '%' : 'unknown'}
- 현재 ACTIVE 오답 패턴: ${activeErr}
- 학생이 현재 보고 있는 진행 단계: ${ctx.student.currentStep}

[관점] ${persp}
  - formula-centric: 공식 유도와 적용을 중심으로 설명
  - step-by-step:    풀이 단계의 변환을 단계별로 분해
  - visual:          그래프·도형·표 표현 중심 설명
  - real-world example: 일상/공학적 사례에 빗대어 설명

[지침]
1) 단계 5개 모두 이 문제에 직접 관한 것만 작성한다. 다른 예시 X.
2) student.activeErrorCodes 가 있으면 그 오류를 피하는 힌트를 적어도 1개 step 에 녹인다.
3) current = (num == ${ctx.student.currentStep}), done = (num < ${ctx.student.currentStep}).
4) title 은 5~20자, desc 는 2~3문장.

[출력 — JSON only, 다른 텍스트/코드펜스 X]
{
  "steps": [
    { "num": 1, "title": "...", "desc": "...", "current": false, "done": true },
    ...
  ]
}`,
    maxTokens: 1200,
    temperature: 0.3,
  };
}
