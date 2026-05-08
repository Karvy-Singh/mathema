import { LlmRequest } from '../providers/llm.provider';

export function stepwiseGuidePrompt(ctx: {
  sessionId: string;
  userId: string;
  perspective: '공식 중심' | '단계별' | '시각화' | '실생활 예시';
}): LlmRequest {
  return {
    system: '너는 한국 수능 수학 1대1 과외 교사이다. 학생의 수준에 맞춰 난이도를 자동 조절한다.',
    prompt: `세션 ${ctx.sessionId}, 사용자 ${ctx.userId}.
관점: ${ctx.perspective}.
회전체 부피와 같은 현재 문제에 대해 5단계 가이드를 한국어로 생성.
각 step 은 {num, title, desc, done(boolean), current(boolean)} 객체이며 동일 문제에서 관점만 바꿔 톤을 바꾼다.`,
    maxTokens: 800,
  };
}
