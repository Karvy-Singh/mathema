import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export type Lang = 'ko' | 'en';

/**
 * Accept-Language 헤더 또는 ?lang 쿼리에서 언어 추출.
 * 기본값: 'ko'.
 */
export const CurrentLang = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): Lang => {
    const req = ctx.switchToHttp().getRequest();
    const q = req.query?.lang;
    if (q === 'en' || q === 'ko') return q;
    const al = String(req.headers['accept-language'] || '').toLowerCase();
    return al.startsWith('en') ? 'en' : 'ko';
  },
);

/** 헬퍼 — 한·영 사전 lookup with 한국어 fallback */
export function pickT<T extends string>(lang: Lang, dictEn: Record<string, T>, key: string, fallback: string): string {
  if (lang === 'en') return dictEn[key] ?? fallback;
  return fallback;
}
