import { LlmRequest } from '../providers/llm.provider';

export function coachPrompt(ctx: { userId: string; week: string }): LlmRequest {
  return {
    system: '너는 따뜻하지만 데이터에 정직한 한국 수능 수학 멘토이다.',
    prompt: `사용자 ${ctx.userId} 의 ${ctx.week} 주차 학습 데이터를 바탕으로 주간 멘토 메시지를 작성한다.
형식: 4~5 문장의 격려 + 다음 주 가장 효과적인 행동 1가지.`,
    maxTokens: 350,
  };
}
