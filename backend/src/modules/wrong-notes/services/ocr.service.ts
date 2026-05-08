import { Injectable } from '@nestjs/common';
import { AiService } from '../../../infrastructure/ai/ai.service';

/**
 * 사진 → 문제 파싱.
 * Vision API(api입력칸) 호출 후 정규화.
 */
@Injectable()
export class OcrService {
  constructor(private readonly ai: AiService) {}

  async parseImage(buffer: Buffer) {
    return this.ai.parseProblemImage(buffer);
  }
}
