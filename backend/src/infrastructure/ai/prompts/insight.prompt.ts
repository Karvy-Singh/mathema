import { LlmRequest } from '../providers/llm.provider';

export function insightPrompt(ctx: { userId: string }): LlmRequest {
  return {
    system: '너는 NCERT (CBSE) 수학 코치이다. 과장 없이 데이터에 기반해 짧고 정확하게 조언한다.',
    prompt: `사용자 ${ctx.userId} 의 최근 학습 데이터를 바탕으로,
대시보드 상단에 표시할 한 문장 진단 메시지를 한국어로 작성한다.
형식: "오늘 N분만 더 투자하면 ..." 처럼 행동 가능하고 수치가 포함된 조언.`,
    maxTokens: 200,
  };
}
