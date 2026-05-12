import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

/**
 * 임베딩 생성 — 유사문제 검색 / Concept 매칭 기반.
 *
 *   AI_EMBEDDING_PROVIDER=openai → text-embedding-3-large (3072 차원).
 *
 *   pgvector 도입 시 Problem.embedding 컬럼에 저장하고 코사인 유사도 검색.
 *   현재는 in-memory 비교 또는 Redis 캐시 활용.
 */
@Injectable()
export class EmbeddingProvider {
  private readonly logger = new Logger(EmbeddingProvider.name);
  private readonly apiKey: string;
  private readonly provider: string;
  private readonly model: string;
  private openai: OpenAI | null = null;

  constructor(private readonly config: ConfigService) {
    this.apiKey = this.config.get<string>('ai.embedding.apiKey') ?? '';
    this.provider = (this.config.get<string>('ai.embedding.provider') ?? 'openai').toLowerCase();
    this.model = this.config.get<string>('ai.embedding.model') ?? 'text-embedding-3-large';

    if (this.isConfigured() && this.provider === 'openai') {
      this.openai = new OpenAI({ apiKey: this.apiKey });
    }
  }

  private isConfigured(): boolean {
    return !!this.apiKey && this.apiKey !== 'api입력칸';
  }

  async embed(text: string): Promise<number[]> {
    if (!this.isConfigured()) {
      this.logger.error('AI_EMBEDDING_API_KEY not configured.');
      throw new Error('EMBEDDING_PROVIDER_NOT_CONFIGURED');
    }
    if (this.provider === 'openai' && this.openai) {
      const res = await this.openai.embeddings.create({
        model: this.model,
        input: text,
      });
      return res.data[0]?.embedding ?? [];
    }
    throw new Error(`EmbeddingProvider: provider=${this.provider} not wired`);
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    if (!this.isConfigured()) throw new Error('EMBEDDING_PROVIDER_NOT_CONFIGURED');
    if (this.provider === 'openai' && this.openai) {
      const res = await this.openai.embeddings.create({
        model: this.model,
        input: texts,
      });
      return res.data.map((d) => d.embedding);
    }
    return Promise.all(texts.map((t) => this.embed(t)));
  }
}
