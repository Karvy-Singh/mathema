import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * 임베딩 생성 — 유사 문제 검색에 사용.
 * 오답노트 카드 하단 "유사 문제 N개 제안됨" 기능의 근간.
 *
 * ⚑ api입력칸 ⚑
 * 추후 pgvector 도입 시 이 결과를 Problem.embedding 컬럼에 저장하고
 * 코사인 유사도 검색을 수행한다.
 */
@Injectable()
export class EmbeddingProvider {
  private readonly logger = new Logger(EmbeddingProvider.name);
  private readonly apiKey: string;
  private readonly provider: string;
  private readonly model: string;

  constructor(private readonly config: ConfigService) {
    this.apiKey = this.config.get<string>('ai.embedding.apiKey')!;
    this.provider = this.config.get<string>('ai.embedding.provider')!;
    this.model = this.config.get<string>('ai.embedding.model')!;
  }

  async embed(text: string): Promise<number[]> {
    if (!this.apiKey || this.apiKey === 'api입력칸') {
      this.logger.warn('AI_EMBEDDING_API_KEY 가 설정되지 않았습니다 (api입력칸).');
    }
    // ⚑ api입력칸 ⚑
    throw new Error(
      `EmbeddingProvider.embed not implemented — provider=${this.provider}. 실제 SDK 호출부를 채워 넣으세요.`,
    );
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    return Promise.all(texts.map((t) => this.embed(t)));
  }
}
