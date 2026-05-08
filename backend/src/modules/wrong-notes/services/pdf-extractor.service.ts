import { Injectable } from '@nestjs/common';
import { AiService } from '../../../infrastructure/ai/ai.service';

/**
 * 문제집 PDF 일괄 추출.
 * pdf-parse 로 페이지 텍스트 추출 → 페이지별 LLM(api입력칸) 호출로 문제 파싱.
 */
@Injectable()
export class PdfExtractorService {
  constructor(private readonly ai: AiService) {}

  async extract(buffer: Buffer) {
    // TODO: pdf-parse → 페이지 분할 → ai.generateText 로 문제 정규화
    return [];
  }
}
