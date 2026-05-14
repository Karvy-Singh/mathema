import { BadGatewayException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SolveMathHelperDto } from './dto/solve-math-helper.dto';

@Injectable()
export class MathHelperService {
  private readonly serviceUrl: string;

  constructor(config: ConfigService) {
    this.serviceUrl = config.get<string>('MATH_HELPER_SERVICE_URL') ?? 'http://localhost:8001';
  }

  async solve(userId: string, dto: SolveMathHelperDto) {
    const response = await fetch(`${this.serviceUrl}/solve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...dto, userId }),
    }).catch((error: unknown) => {
      throw new BadGatewayException(`Math helper service unavailable: ${String(error)}`);
    });

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new BadGatewayException(`Math helper service failed with ${response.status}: ${body}`);
    }

    return response.json();
  }
}
