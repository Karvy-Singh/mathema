import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export type Lang = 'ko' | 'en' | 'hi';

/**
 * Accept-Language 헤더 또는 ?lang 쿼리에서 언어 추출.
 * 1차 출시 시장이 인도이므로 EN/HI 우선 인식. KO 는 명시적일 때만.
 * 기본값: 'en' (인도 PoC).
 */
export const CurrentLang = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): Lang => {
    const req = ctx.switchToHttp().getRequest();
    const q = req.query?.lang;
    if (q === 'en' || q === 'ko' || q === 'hi') return q;
    const al = String(req.headers['accept-language'] || '').toLowerCase();
    if (al.startsWith('hi')) return 'hi';
    if (al.startsWith('ko')) return 'ko';
    return 'en';
  },
);

/** 헬퍼 — 사전 lookup with fallback (lang 별 dict 미존재 시 영어 dict, 영어도 없으면 fallback). */
export function pickT<T extends string>(
  lang: Lang,
  dictEn: Record<string, T>,
  key: string,
  fallback: string,
  dictHi?: Record<string, T>,
): string {
  if (lang === 'hi' && dictHi?.[key]) return dictHi[key];
  if (lang === 'en' || lang === 'hi') return dictEn[key] ?? fallback;
  return fallback;
}
