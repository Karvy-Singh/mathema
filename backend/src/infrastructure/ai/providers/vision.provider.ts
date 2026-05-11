import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';

export interface VisionParseResult {
  body: string;        // 인식된 문제 본문 (LaTeX 변환 포함)
  answer?: string;     // 정답이 보이면 추출
  source?: string;     // 식별 가능한 출처 (시험명·페이지)
  confidence: number;  // 0~1
}

/**
 * 사진 → 수학 문제 파싱.
 * 오답노트 페이지의 "사진으로 등록" + 학습 페이지의 "교과서 사진" 흐름에서 사용.
 *
 * 인도 launch 핵심 가치 — NCERT 교과서 / 손풀이 사진을 LaTeX 으로 자동 변환.
 *
 * 동작 모드:
 *   1) AI_VISION_API_KEY 미설정: stub fallback (메시지만 반환)
 *   2) provider='anthropic': Claude vision (claude-sonnet-4-6) — 권장
 *   3) provider='openai': gpt-4o (구현은 추후 — 현재는 anthropic 만)
 */
@Injectable()
export class VisionProvider {
  private readonly logger = new Logger(VisionProvider.name);
  private readonly apiKey: string;
  private readonly provider: string;
  private readonly model: string;
  private anthropic: Anthropic | null = null;

  constructor(private readonly config: ConfigService) {
    this.apiKey = this.config.get<string>('ai.vision.apiKey') ?? '';
    this.provider = this.config.get<string>('ai.vision.provider') ?? 'anthropic';
    this.model = this.config.get<string>('ai.vision.model') ?? 'claude-sonnet-4-6';

    if (this.isConfigured() && this.provider === 'anthropic') {
      this.anthropic = new Anthropic({ apiKey: this.apiKey });
    }
  }

  private isConfigured() {
    return !!this.apiKey && this.apiKey !== 'api입력칸';
  }

  async parseProblemImage(imageBuffer: Buffer): Promise<VisionParseResult> {
    if (!this.isConfigured()) {
      this.logger.warn('Vision API not configured — returning stub response.');
      return {
        body: '[Vision API not configured] AI_VISION_API_KEY 를 설정하면 이미지에서 문제 본문이 자동 추출됩니다.',
        confidence: 0,
      };
    }

    if (this.provider === 'anthropic' && this.anthropic) {
      return this.parseWithAnthropic(imageBuffer);
    }

    throw new Error(`VisionProvider: provider=${this.provider} not implemented`);
  }

  /**
   * Claude Vision — 이미지 → JSON {body, answer?, source?, confidence}
   * 시스템 프롬프트로 LaTeX 기호 정규화 (∫·π·√ 등) 강제.
   */
  private async parseWithAnthropic(imageBuffer: Buffer): Promise<VisionParseResult> {
    const base64 = imageBuffer.toString('base64');
    const mediaType = this.detectMediaType(imageBuffer) as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';

    const res = await this.anthropic!.messages.create({
      model: this.model,
      max_tokens: 1000,
      system:
        'You are a math OCR. Extract the problem text from the image. ' +
        'Output strict JSON: { "body": string, "answer": string|null, "source": string|null, "confidence": number }. ' +
        'Use LaTeX-friendly symbols (∫, π, √, ²). Do not solve the problem — just transcribe.',
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } },
          { type: 'text', text: 'Transcribe this math problem. Return JSON only.' },
        ],
      }],
    });

    const textBlock = res.content.find((b) => b.type === 'text') as { type: 'text'; text: string } | undefined;
    const text = textBlock?.text ?? '{}';
    try {
      // Claude 가 코드펜스로 감싸 줄 수 있음 → 추출
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      const json = JSON.parse(jsonMatch ? jsonMatch[0] : text);
      return {
        body: String(json.body ?? '').trim() || '[empty]',
        answer: json.answer ?? undefined,
        source: json.source ?? undefined,
        confidence: typeof json.confidence === 'number' ? json.confidence : 0.7,
      };
    } catch (e) {
      this.logger.warn(`Vision JSON parse failed; raw="${text.slice(0, 200)}"`);
      return { body: text.slice(0, 500), confidence: 0.4 };
    }
  }

  /** 이미지 첫 바이트로 media type 판별 (JPEG/PNG/GIF/WEBP). */
  private detectMediaType(buf: Buffer): string {
    if (buf[0] === 0xff && buf[1] === 0xd8) return 'image/jpeg';
    if (buf[0] === 0x89 && buf[1] === 0x50) return 'image/png';
    if (buf[0] === 0x47 && buf[1] === 0x49) return 'image/gif';
    if (buf.slice(0, 4).toString() === 'RIFF') return 'image/webp';
    return 'image/jpeg'; // fallback
  }
}
