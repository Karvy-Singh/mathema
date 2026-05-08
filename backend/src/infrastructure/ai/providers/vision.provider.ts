import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface VisionParseResult {
  body: string;        // 인식된 문제 본문 (LaTeX 변환 포함)
  answer?: string;     // 정답이 보이면 추출
  source?: string;     // "2024 9월 모의평가 30번"
  confidence: number;  // 0~1
}

/**
 * 사진 → 수학 문제 파싱.
 * 오답노트 페이지의 "사진으로 등록" 흐름에서 사용.
 *
 * ⚑ api입력칸 ⚑ — Vision 모델 호출부
 *  - OpenAI:  client.chat.completions.create({ model: 'gpt-4o', messages: [{ role:'user', content:[{type:'image_url',...}] }] })
 *  - Google:  Cloud Vision DOCUMENT_TEXT_DETECTION
 */
@Injectable()
export class VisionProvider {
  private readonly logger = new Logger(VisionProvider.name);
  private readonly apiKey: string;
  private readonly provider: string;
  private readonly model: string;

  constructor(private readonly config: ConfigService) {
    this.apiKey = this.config.get<string>('ai.vision.apiKey')!;
    this.provider = this.config.get<string>('ai.vision.provider')!;
    this.model = this.config.get<string>('ai.vision.model')!;
  }

  async parseProblemImage(imageBuffer: Buffer): Promise<VisionParseResult> {
    if (!this.apiKey || this.apiKey === 'api입력칸') {
      this.logger.warn('AI_VISION_API_KEY 가 설정되지 않았습니다 (api입력칸).');
    }
    // ⚑ api입력칸 ⚑
    throw new Error(
      `VisionProvider.parseProblemImage not implemented — provider=${this.provider}. 실제 SDK 호출부를 채워 넣으세요.`,
    );
  }
}
