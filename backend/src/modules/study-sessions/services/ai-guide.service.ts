import { Injectable } from '@nestjs/common';
import { AiService } from '../../../infrastructure/ai/ai.service';
import { stepwiseGuidePrompt } from '../../../infrastructure/ai/prompts/stepwise-guide.prompt';
import { Lang } from '../../../common/i18n/current-lang.decorator';

export type Perspective = '공식 중심' | '단계별' | '시각화' | '실생활 예시';

/**
 * AI 단계별 가이드 (학습 페이지 우측 패널).
 *  - 5단계(난이도 자동조정)
 *  - 관점 4종 토글 시 동일 단계의 설명 톤만 바꿔 재생성
 *  - 결과는 AiService 의 7일 캐시로 비용 절감
 */
@Injectable()
export class AiGuideService {
  constructor(private readonly ai: AiService) {}

  async generate(userId: string, sessionId: string, perspective: string, lang: Lang = 'ko') {
    const prompt = stepwiseGuidePrompt({ sessionId, userId, perspective: perspective as Perspective, lang });
    return this.ai.generateText(prompt);
  }
}
