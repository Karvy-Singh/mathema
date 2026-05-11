import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Mail dispatch — 현재는 SMTP/SendGrid 미연결 stub.
 * SMTP_HOST 등 설정되면 nodemailer 활성화 (추후).
 * 미설정 환경: 로그로 토큰/링크 출력 → 개발 + 어드민 수동 운영 가능.
 */
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly config: ConfigService) {}

  private appUrl(): string {
    return this.config.get<string>('app.webOrigin') ?? 'http://localhost:5173';
  }

  async sendPasswordResetEmail(to: string, token: string): Promise<void> {
    const link = `${this.appUrl()}/reset-password?token=${encodeURIComponent(token)}`;
    this.logger.warn(`[MAIL stub] password-reset → ${to}`);
    this.logger.warn(`           link: ${link}`);
    // 추후 SMTP 연결 시:
    // await this.transporter.sendMail({ to, subject, html })
  }

  async sendEmailVerification(to: string, token: string): Promise<void> {
    const link = `${this.appUrl()}/verify-email?token=${encodeURIComponent(token)}`;
    this.logger.warn(`[MAIL stub] verify-email → ${to}`);
    this.logger.warn(`           link: ${link}`);
  }
}
