import { z } from 'zod';
import { ErrorCode } from '@prisma/client';

/**
 * Attempt 단위 LLM 분석 prompt + 출력 스키마.
 *
 *   명세서 §8 — 입력값:
 *     문제 본문, 정답, 해설, expectedSolutionSteps,
 *     학생 answer, stepByStepInput, responseTimeSec, selfConfidenceScore,
 *     hintUsed, conceptTags, commonErrorCodes
 *
 *   명세서 §8 — 출력 스키마 (JSON only):
 *     { errorCodes, conceptWeakness, reasoningSummary, recommendedAction, confidenceScore }
 *
 *   주의:
 *     - LLM 출력을 바로 비즈니스 로직에 반영 X — validation 단계 거침.
 *     - promptVersion + inputHash 모두 LLMAnalysisLog 에 저장하여
 *       prompt v3 ↔ v4 의 판단 차이를 회귀 분석 가능.
 *     - errorCodes 는 Prisma ErrorCode enum 의 8개 값만 허용 (스키마 강제).
 */

export const PROMPT_VERSION = 'attempt-analyze@v1';

/**
 * Zod 스키마 — LLM 응답을 이 스키마로 검증 후에만 DB 반영.
 *   errorCodes 는 ErrorCode enum 의 8개 값 그대로.
 */
const ErrorCodeSchema = z.enum([
  ErrorCode.SIGN,
  ErrorCode.ALG,
  ErrorCode.CON,
  ErrorCode.FORMULA,
  ErrorCode.GRAPH,
  ErrorCode.UNIT,
  ErrorCode.CALC,
  ErrorCode.LOGIC,
] as [ErrorCode, ...ErrorCode[]]);

export const AttemptAnalysisSchema = z.object({
  errorCodes: z.array(ErrorCodeSchema).max(4),
  /** 약점 개념 — Concept.code 또는 자유 텍스트 키워드 (예: 'chain_rule'). */
  conceptWeakness: z.array(z.string()).max(5),
  /** 학생 풀이 흐름의 어느 지점이 무너졌는지 1~2 문장. */
  reasoningSummary: z.string().min(10).max(500),
  /** 다음 학습 행동 권고 1 문장. */
  recommendedAction: z.string().min(5).max(300),
  /** LLM 자기보고 신뢰도 0~1. */
  confidenceScore: z.number().min(0).max(1),
});

export type AttemptAnalysis = z.infer<typeof AttemptAnalysisSchema>;

export interface AttemptAnalysisInput {
  problemBody: string;
  problemAnswer: string;
  problemExplanation?: string | null;
  expectedSolutionSteps?: unknown;          // Json — 풀이 단계 시퀀스
  commonErrorCodes: ErrorCode[];            // 출제자가 사전 분류한 흔한 오답
  studentAnswer: string;
  isCorrect: boolean;
  stepByStepInput: unknown;                 // string[] (학생 풀이)
  responseTimeSec: number;
  selfConfidenceScore?: number | null;      // 1~5
  hintUsed: boolean;
  hintCount: number;
  conceptTags: string[];                    // Problem 의 Concept 들의 code
  lang: 'ko' | 'en' | 'hi';
}

const LANG_INSTRUCTION = {
  ko: '한국어로 reasoningSummary 와 recommendedAction 을 작성하세요.',
  en: 'Write reasoningSummary and recommendedAction in English.',
  hi: 'reasoningSummary और recommendedAction को हिंदी में लिखें।',
} as const;

const ERROR_CODE_HINT = `
errorCodes 가능 값 (필요한 것만 골라 최대 4개):
  SIGN     — 부호 처리 실수 (예: -(-x) 를 -x 로)
  ALG      — 대수 변형 오류 (전개·인수분해·이항)
  CON      — 개념 오해 (정의를 잘못 적용)
  FORMULA  — 공식 오용 (잘못된 공식 사용)
  GRAPH    — 그래프 해석 오류
  UNIT     — 단위 변환 오류
  CALC     — 단순 계산 실수
  LOGIC    — 풀이 단계 누락 / 케이스 분리 실패
`.trim();

/**
 * Prompt 본문 생성. LLM 에 보낼 user message.
 */
export function buildAttemptAnalysisPrompt(input: AttemptAnalysisInput): string {
  const stepLines = Array.isArray(input.stepByStepInput)
    ? (input.stepByStepInput as unknown[]).map((s, i) => `  ${i + 1}. ${String(s)}`).join('\n')
    : '(학생이 풀이 단계를 입력하지 않음)';

  const expectedLines = input.expectedSolutionSteps
    ? JSON.stringify(input.expectedSolutionSteps).slice(0, 600)
    : '(없음)';

  return `당신은 수학 학습 진단 AI 입니다. 한 학생의 한 문제 풀이 시도를 분석합니다.

${LANG_INSTRUCTION[input.lang]}

[문제]
${input.problemBody}

[정답]
${input.problemAnswer}

[출제자 해설]
${input.problemExplanation ?? '(없음)'}

[전형적 풀이 단계]
${expectedLines}

[흔한 오답 패턴 — 참고]
${input.commonErrorCodes.length > 0 ? input.commonErrorCodes.join(', ') : '(없음)'}

[관련 개념 태그]
${input.conceptTags.join(', ')}

[학생의 응답]
- 답: ${input.studentAnswer}
- 정답 여부: ${input.isCorrect ? '맞음' : '틀림'}
- 풀이 단계 입력:
${stepLines}
- 풀이 시간: ${input.responseTimeSec}초
- 자기 자신감 (1~5): ${input.selfConfidenceScore ?? '미입력'}
- 힌트 사용: ${input.hintUsed ? `예 (${input.hintCount}회)` : '아니오'}

[분석 지침]
1. 학생이 어느 단계에서 무너졌는지 specific 하게 (풀이 입력 기반).
2. 풀이 입력이 비어있으면 '풀이 단계 미입력' 신호 자체를 LOGIC 에 포함.
3. 학생이 답은 맞췄는데 풀이가 비어있거나 시간이 expected 의 1/3 미만이면 '추측' 가능성 — recommendedAction 에 표기.
4. 자신감이 4~5인데 틀렸으면 overconfidence — conceptWeakness 우선 분류.
5. recommendedAction 은 "다음 학습 행동" 1 문장. (예: "치환적분 중간 난이도 3 문제 단계별 풀이로 풀게 한다")

${ERROR_CODE_HINT}

[출력 — JSON only, 다른 텍스트 X]
{
  "errorCodes": ["..."],
  "conceptWeakness": ["..."],
  "reasoningSummary": "...",
  "recommendedAction": "...",
  "confidenceScore": 0.0
}`;
}
