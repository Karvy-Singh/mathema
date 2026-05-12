import { Body, Controller, Delete, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ConsentKind } from '@prisma/client';
import { PrivacyService, CURRENT_POLICY_VERSION } from './privacy.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CurrentLang, Lang } from '../../common/i18n/current-lang.decorator';

const POLICY_SUMMARY: Record<Lang, { title: string; sections: Array<{ heading: string; body: string }> }> = {
  ko: {
    title: '개인정보 처리방침 v' + CURRENT_POLICY_VERSION,
    sections: [
      { heading: '수집 정보', body: '이메일, 이름, 시험 일정, 학습 활동(문제 풀이·정답률·소요 시간·디바이스 종류)' },
      { heading: '이용 목적', body: '학습 진단·맞춤 추천 제공, 서비스 개선, 안내 알림(선택 동의 시)' },
      { heading: '보관 기간', body: '계정 활성 기간 + 삭제 요청 후 30일' },
      { heading: '귀하의 권리', body: '열람·정정·삭제 요청, 동의 철회 (DATA_PROCESSING 철회는 계정 삭제로 처리됨)' },
    ],
  },
  en: {
    title: 'Privacy Policy v' + CURRENT_POLICY_VERSION,
    sections: [
      { heading: 'Data we collect', body: 'Email, name, exam date, study activity (attempts, accuracy, duration, device type)' },
      { heading: 'How we use it', body: 'Diagnostics, personalised recommendations, service improvement, notifications (with consent)' },
      { heading: 'Retention', body: 'Active account period + 30 days after deletion request' },
      { heading: 'Your rights', body: 'Access, rectify, erase data; withdraw consent. Withdrawing DATA_PROCESSING triggers account deletion.' },
    ],
  },
  hi: {
    title: 'गोपनीयता नीति v' + CURRENT_POLICY_VERSION,
    sections: [
      { heading: 'एकत्रित जानकारी', body: 'ईमेल, नाम, परीक्षा तिथि, अध्ययन गतिविधि (प्रयास, सटीकता, समय, डिवाइस प्रकार)' },
      { heading: 'उपयोग का उद्देश्य', body: 'निदान, व्यक्तिगत सिफारिशें, सेवा सुधार, सूचनाएँ (सहमति पर)' },
      { heading: 'संरक्षण अवधि', body: 'सक्रिय खाता अवधि + विलोपन अनुरोध के 30 दिन बाद तक' },
      { heading: 'आपके अधिकार', body: 'देखना, सुधारना, मिटाना; सहमति वापस लेना। DATA_PROCESSING वापस लेने पर खाता हटा दिया जाता है।' },
    ],
  },
};

@UseGuards(JwtAuthGuard)
@Controller('privacy')
export class PrivacyController {
  constructor(private readonly service: PrivacyService) {}

  /** 현재 정책 문서 — 가입/설정 화면에서 표시. */
  @Get('policy')
  policy(@CurrentLang() lang: Lang) {
    return {
      version: CURRENT_POLICY_VERSION,
      effectiveDate: CURRENT_POLICY_VERSION,
      ...POLICY_SUMMARY[lang],
    };
  }

  /** 내 동의 현재 상태 (모든 kind). */
  @Get('consents')
  status(@CurrentUser('id') userId: string) {
    return this.service.status(userId);
  }

  /** 내 동의 이력 — DPDP/GDPR access right. */
  @Get('consents/history')
  history(@CurrentUser('id') userId: string) {
    return this.service.history(userId);
  }

  /** 동의 부여 (선택 동의 활성화). */
  @Post('consents/:kind')
  grant(
    @CurrentUser('id') userId: string,
    @Param('kind') kind: string,
    @Req() req: any,
  ) {
    const k = this.toKind(kind);
    const ip = req?.ip ?? req?.headers?.['x-forwarded-for'] ?? null;
    const ua = req?.headers?.['user-agent'] ?? null;
    return this.service.grant(userId, k, { ip, ua });
  }

  /** 동의 철회 — DATA_PROCESSING 은 계정 삭제 흐름으로 분기됨. */
  @Delete('consents/:kind')
  revoke(@CurrentUser('id') userId: string, @Param('kind') kind: string) {
    return this.service.revoke(userId, this.toKind(kind));
  }

  private toKind(raw: string): ConsentKind {
    const upper = raw.toUpperCase().replace(/-/g, '_');
    if (!(upper in ConsentKind)) {
      throw new Error(`Unknown consent kind: ${raw}`);
    }
    return upper as ConsentKind;
  }
}
