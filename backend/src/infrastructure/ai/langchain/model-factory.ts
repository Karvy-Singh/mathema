/**
 * LangChain Chat 모델 팩토리 — provider 스위치.
 *
 *   LLM_PROVIDER=anthropic    → ChatAnthropic (기본; ANTHROPIC_API_KEY 사용)
 *   LLM_PROVIDER=azure-openai → AzureChatOpenAI (Azure 배포 시; AZURE_OPENAI_* 사용)
 *
 * 기존 `LlmProvider` (infrastructure/ai/providers/llm.provider.ts) 는 단순 호출용으로 유지.
 * 다단 chain / structured output 이 필요한 곳에서는 이 팩토리를 사용.
 */

import { ChatAnthropic } from '@langchain/anthropic';
import { AzureChatOpenAI, ChatOpenAI } from '@langchain/openai';
import type { BaseChatModel } from '@langchain/core/language_models/chat_models';

export type LlmProviderType = 'anthropic' | 'azure-openai' | 'openai';

export interface ChatModelOptions {
  /** 응답 다양성. 0 = 결정론적, 1 = 매우 다양. (기본 0.4) */
  temperature?: number;
  /** max output tokens. provider 가 지원하지 않으면 무시됨. */
  maxTokens?: number;
  /** 명시적 provider 강제 (env 무시). 테스트/A-B 용. */
  forceProvider?: LlmProviderType;
}

export function getLlmProvider(): LlmProviderType {
  const v = (process.env.LLM_PROVIDER ?? 'anthropic').toLowerCase();
  if (v === 'azure-openai') return 'azure-openai';
  if (v === 'openai') return 'openai';
  return 'anthropic';
}

export function buildChatModel(opts: ChatModelOptions = {}): BaseChatModel {
  const provider = opts.forceProvider ?? getLlmProvider();
  const temperature = opts.temperature ?? 0.4;
  const maxTokens = opts.maxTokens ?? 2048;

  if (provider === 'azure-openai') {
    return new AzureChatOpenAI({
      azureOpenAIApiKey: process.env.AZURE_OPENAI_API_KEY,
      azureOpenAIApiInstanceName: process.env.AZURE_OPENAI_INSTANCE,
      azureOpenAIApiDeploymentName: process.env.AZURE_OPENAI_DEPLOYMENT ?? 'gpt-4o',
      azureOpenAIApiVersion: process.env.AZURE_OPENAI_API_VERSION ?? '2024-08-01-preview',
      temperature,
      maxTokens,
    }) as unknown as BaseChatModel;
  }

  if (provider === 'openai') {
    return new ChatOpenAI({
      apiKey: process.env.OPENAI_API_KEY ?? process.env.AI_LLM_API_KEY,
      model: process.env.AI_LLM_MODEL ?? 'gpt-4o',
      temperature,
      maxTokens,
    }) as unknown as BaseChatModel;
  }

  return new ChatAnthropic({
    apiKey: process.env.ANTHROPIC_API_KEY ?? process.env.AI_LLM_API_KEY,
    model: process.env.AI_LLM_MODEL ?? 'claude-opus-4-5',
    temperature,
    maxTokens,
  }) as unknown as BaseChatModel;
}
