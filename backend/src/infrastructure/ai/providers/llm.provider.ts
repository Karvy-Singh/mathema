import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';

export interface LlmRequest {
  prompt: string;
  system?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface LlmResponse {
  text: string;
  inputTokens: number;
  outputTokens: number;
}

/**
 * 외부 LLM 호출 어댑터.
 * 도메인 코드(ai-coach, study-sessions, wrong-notes)는 이 클래스만 의존한다.
 *
 * ⚑ api입력칸 ⚑
 * 실제 SDK 호출부는 환경에 맞게 채워 넣는다.
 *  - Anthropic:  @anthropic-ai/sdk
 *  - OpenAI:     openai
 */
@Injectable()
export class LlmProvider {
  private readonly logger = new Logger(LlmProvider.name);
  private readonly apiKey: string;
  private readonly provider: string;
  private readonly model: string;

  constructor(private readonly config: ConfigService) {
    this.apiKey = this.config.get<string>('ai.llm.apiKey')!;
    this.provider = this.config.get<string>('ai.llm.provider')!;
    this.model = this.config.get<string>('ai.llm.model')!;
  }

  /**
   * 텍스트 생성 호출.
   * @param req prompt + system + 옵션
   * @returns 생성된 텍스트와 토큰 사용량
   *
   * ⚑ api입력칸 ⚑ — 아래 throw 부분을 실제 SDK 호출로 교체
   *
   *   if (this.provider === 'anthropic') {
   *     const client = new Anthropic({ apiKey: this.apiKey });
   *     const res = await client.messages.create({
   *       model: this.model,
   *       system: req.system,
   *       max_tokens: req.maxTokens ?? 1024,
   *       messages: [{ role: 'user', content: req.prompt }],
   *     });
   *     return {
   *       text: res.content[0].type === 'text' ? res.content[0].text : '',
   *       inputTokens: res.usage.input_tokens,
   *       outputTokens: res.usage.output_tokens,
   *     };
   *   }
   */
  async generate(req: LlmRequest): Promise<LlmResponse> {
    if (!this.apiKey || this.apiKey === 'api입력칸') {
      // 운영에서는 이 분기에 들어오면 안 됨. 서비스 측에 명확히 알리고 호출자가 fallback 처리.
      this.logger.error('AI_LLM_API_KEY not configured — refusing to return sample text.');
      throw new Error('LLM_PROVIDER_NOT_CONFIGURED');
    }

    if (this.provider === 'anthropic') {
      const client = new Anthropic({ apiKey: this.apiKey });
      const res = await client.messages.create({
        model: this.model || 'claude-sonnet-4-6',
        max_tokens: req.maxTokens ?? 1024,
        temperature: req.temperature ?? 0.4,
        system: req.system,
        messages: [{ role: 'user', content: req.prompt }],
      });
      const textBlock = res.content.find((b) => b.type === 'text') as { type: 'text'; text: string } | undefined;
      return {
        text: textBlock?.text ?? '',
        inputTokens: res.usage?.input_tokens ?? 0,
        outputTokens: res.usage?.output_tokens ?? 0,
      };
    }

    throw new Error(`LlmProvider: provider=${this.provider} not implemented yet (only 'anthropic' wired).`);
  }
}
