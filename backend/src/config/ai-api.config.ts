import { registerAs } from '@nestjs/config';

/**
 * AI 외부 API 설정 — 모든 키는 환경변수에서 주입.
 * 실제 키 값은 .env 의 `api입력칸` 자리에 넣는다.
 *
 *  ┌──────────── api입력칸 ────────────┐
 *  │  AI_LLM_API_KEY        = ...      │  텍스트 생성 (Claude / GPT)
 *  │  AI_VISION_API_KEY     = ...      │  사진 OCR / 문제 파싱
 *  │  AI_EMBEDDING_API_KEY  = ...      │  유사 문제 검색
 *  └───────────────────────────────────┘
 */
export default registerAs('ai', () => ({
  llm: {
    provider: process.env.AI_LLM_PROVIDER ?? 'anthropic',
    apiKey: process.env.AI_LLM_API_KEY ?? 'api입력칸',
    model: process.env.AI_LLM_MODEL ?? 'claude-opus-4-6',
  },
  vision: {
    provider: process.env.AI_VISION_PROVIDER ?? 'openai',
    apiKey: process.env.AI_VISION_API_KEY ?? 'api입력칸',
    model: process.env.AI_VISION_MODEL ?? 'gpt-4o',
  },
  embedding: {
    provider: process.env.AI_EMBEDDING_PROVIDER ?? 'openai',
    apiKey: process.env.AI_EMBEDDING_API_KEY ?? 'api입력칸',
    model: process.env.AI_EMBEDDING_MODEL ?? 'text-embedding-3-large',
  },
}));
