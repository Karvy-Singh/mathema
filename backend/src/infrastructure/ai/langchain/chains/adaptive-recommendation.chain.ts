/**
 * Adaptive Recommendation Chain — LangChain v1.
 *
 * 입력: 약점 단원 + 단원별 공부 시간 균형 분석
 * 출력: 구조화된 오늘 학습 플랜 (Zod schema)
 *
 * 전략:
 *   - 약점 우선이지만 균형을 무너뜨리지 않음 (편중 단원에서 무한히 더 학습 X)
 *   - 부족학습 단원이 있으면 최소 1개 포함
 *   - 저효율 단원은 학습법 변경 제안 (개념→풀이→오답 전환)
 *   - 60분 이내 실행 가능한 마이크로 플랜
 */

import { z } from 'zod';
import { PromptTemplate } from '@langchain/core/prompts';
import { buildChatModel } from '../model-factory';

const PlanTaskSchema = z.object({
  task: z.string().describe('해야 할 학습 활동 (예: "1차 함수 개념 복습")'),
  unitName: z.string().describe('대상 단원 이름'),
  durationMin: z.number().int().min(5).max(60),
  type: z.enum(['concept', 'practice', 'review', 'mock-exam'])
    .describe('학습 활동 종류'),
  reason: z.string().describe('왜 이 활동을 추천하는지 (1문장)'),
});

export const AdaptivePlanSchema = z.object({
  summary: z.string().describe('오늘 플랜의 한 줄 요약'),
  totalMinutes: z.number().int().min(15).max(120),
  tasks: z.array(PlanTaskSchema).min(2).max(6),
  balanceTip: z.string().describe('학습 균형 관련 한 줄 조언'),
});

export type AdaptivePlan = z.infer<typeof AdaptivePlanSchema>;

export interface AdaptivePlanInput {
  lang: 'ko' | 'en' | 'hi';
  weakUnits: Array<{ name: string; score: number; studyTimeMin: number }>;
  balance: {
    gini: number;
    underStudied: Array<{ unitName: string; score: number; studyTimeMin: number }>;
    lowEfficiency: Array<{ unitName: string; score: number; studyTimeMin: number }>;
  };
  /** 사용자가 오늘 가능한 학습 시간 (분). 기본 45. */
  availableMinutes?: number;
}

const LANG_INSTRUCTION = {
  ko: '한국어로 응답하세요.',
  en: 'Respond in English.',
  hi: 'हिंदी में उत्तर दें।',
} as const;

const PROMPT = PromptTemplate.fromTemplate(`You are an adaptive math learning coach for the NCERT (India) curriculum, helping student prepare for JEE / Board exams.

{langInstruction}

The student has the following profile:

[Weak units (BKT mastery score 0-100)]
{weakUnits}

[Study time balance]
- Gini coefficient: {gini} (0 = perfectly balanced, 1 = entirely skewed)
- Under-studied units (low time AND low mastery): {underStudied}
- Low-efficiency units (much time but mastery still low → method change needed): {lowEfficiency}

[Today's available study time]
{availableMinutes} minutes

Design today's micro-plan respecting these rules:
1. Address the weakest units first, but **do not pour all time into one unit** — keep balance.
2. If under-studied units exist, include at least one of them.
3. For low-efficiency units, recommend a **different activity type** than what they've been doing (e.g., switch from practice → concept review, or → wrong-note redo).
4. Fit within {availableMinutes} minutes (±10%).
5. Each task must be concrete and actionable (not "study more").
6. Mix activity types: concept / practice / review / mock-exam.

Output a JSON plan with 2-6 tasks.`);

/**
 * Chain 실행 — structured output 으로 Zod 스키마 강제 + LangChain Runnable retry.
 */
export async function generateAdaptivePlan(input: AdaptivePlanInput): Promise<AdaptivePlan> {
  const model = buildChatModel({ temperature: 0.4, maxTokens: 1500 });
  const structured = (model as any).withStructuredOutput(AdaptivePlanSchema, {
    name: 'AdaptivePlan',
  });
  // LangChain v1 Runnable retry: 429/5xx/네트워크 transient 에러에 자동 재시도
  const withRetry = typeof structured.withRetry === 'function'
    ? structured.withRetry({ stopAfterAttempt: 3 })
    : structured;

  const formatted = await PROMPT.format({
    langInstruction: LANG_INSTRUCTION[input.lang],
    weakUnits: JSON.stringify(input.weakUnits, null, 2),
    gini: input.balance.gini.toFixed(2),
    underStudied: JSON.stringify(input.balance.underStudied, null, 2),
    lowEfficiency: JSON.stringify(input.balance.lowEfficiency, null, 2),
    availableMinutes: String(input.availableMinutes ?? 45),
  });

  return withRetry.invoke(formatted) as Promise<AdaptivePlan>;
}
