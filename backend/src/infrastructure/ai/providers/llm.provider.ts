import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';

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
 *   AI_LLM_PROVIDER=anthropic | openai
 *
 * 도메인 코드(ai-coach, study-sessions, wrong-notes)는 이 클래스만 의존한다.
 */
@Injectable()
export class LlmProvider {
  private readonly logger = new Logger(LlmProvider.name);
  private readonly apiKey: string;
  private readonly provider: string;
  private readonly model: string;
  private anthropic: Anthropic | null = null;
  private openai: OpenAI | null = null;

  constructor(private readonly config: ConfigService) {
    this.apiKey = this.config.get<string>('ai.llm.apiKey') ?? '';
    this.provider = (this.config.get<string>('ai.llm.provider') ?? 'anthropic').toLowerCase();
    this.model = this.config.get<string>('ai.llm.model') ?? '';

    if (this.isConfigured()) {
      if (this.provider === 'anthropic') {
        this.anthropic = new Anthropic({ apiKey: this.apiKey });
      } else if (this.provider === 'openai') {
        this.openai = new OpenAI({ apiKey: this.apiKey });
      }
    }
  }

  private isConfigured(): boolean {
    return !!this.apiKey && this.apiKey !== 'api입력칸';
  }

  async generate(req: LlmRequest): Promise<LlmResponse> {
    if (!this.isConfigured()) {
      this.logger.error('AI_LLM_API_KEY not configured.');
      throw new Error('LLM_PROVIDER_NOT_CONFIGURED');
    }

    if (this.provider === 'anthropic' && this.anthropic) {
      const res = await this.anthropic.messages.create({
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

    if (this.provider === 'openai' && this.openai) {
      const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];
      if (req.system) messages.push({ role: 'system', content: req.system });
      messages.push({ role: 'user', content: req.prompt });
      const res = await this.openai.chat.completions.create({
        model: this.model || 'gpt-4o',
        max_completion_tokens: req.maxTokens ?? 1024,
        temperature: req.temperature ?? 0.4,
        messages,
      });
      const choice = res.choices?.[0];
      return {
        text: choice?.message?.content ?? '',
        inputTokens: res.usage?.prompt_tokens ?? 0,
        outputTokens: res.usage?.completion_tokens ?? 0,
      };
    }

    throw new Error(`LlmProvider: provider=${this.provider} not wired (configured? ${this.isConfigured()}).`);
  }
}
