import { LlmRequest } from '../providers/llm.provider';

export function patternPrompt(ctx: { userId: string }): LlmRequest {
  return {
    system: '너는 학습 데이터 분석가이다. 오답 패턴을 정확한 단원/세부단계 단위로 짚는다.',
    prompt: `사용자 ${ctx.userId} 의 오답노트를 종합해 가장 자주 나타나는 3가지 패턴을 추출한다.
각 패턴은 {num, title(짧음), desc(2~3문장), count(발견 횟수)} 형태의 JSON 배열로 반환.`,
    maxTokens: 600,
  };
}
