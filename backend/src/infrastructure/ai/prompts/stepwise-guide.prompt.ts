import { LlmRequest } from '../providers/llm.provider';

const PERSPECTIVE_EN: Record<string, string> = {
  '공식 중심': 'formula-centric',
  '단계별': 'step-by-step',
  '시각화': 'visual',
  '실생활 예시': 'real-world example',
};

export function stepwiseGuidePrompt(ctx: {
  sessionId: string;
  userId: string;
  perspective: '공식 중심' | '단계별' | '시각화' | '실생활 예시';
  lang?: 'ko' | 'en';
}): LlmRequest {
  if (ctx.lang === 'en') {
    return {
      system: 'You are a 1-on-1 SAT/college-prep math tutor. Adjust difficulty to the learner.',
      prompt: `Session ${ctx.sessionId}, user ${ctx.userId}.
Perspective: ${PERSPECTIVE_EN[ctx.perspective] ?? ctx.perspective}.
Generate a 5-step English guide for the current problem (e.g. volume of revolution).
Each step is an object {num, title, desc, done(boolean), current(boolean)}; only the explanatory tone changes per perspective.`,
      maxTokens: 800,
    };
  }
  return {
    system: '너는 한국 수능 수학 1대1 과외 교사이다. 학생의 수준에 맞춰 난이도를 자동 조절한다.',
    prompt: `세션 ${ctx.sessionId}, 사용자 ${ctx.userId}.
관점: ${ctx.perspective}.
회전체 부피와 같은 현재 문제에 대해 5단계 가이드를 한국어로 생성.
각 step 은 {num, title, desc, done(boolean), current(boolean)} 객체이며 동일 문제에서 관점만 바꿔 톤을 바꾼다.`,
    maxTokens: 800,
  };
}
