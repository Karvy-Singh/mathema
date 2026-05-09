import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { Lang } from '../../common/i18n/current-lang.decorator';
import { PROBLEM_EN, STEP_PROMPT_EN, CHOICE_EN, SOURCE_EN, HINT_EN } from '../../common/i18n/content-en';

/**
 * 학습/응시 시 클라이언트로 전달할 때는 isCorrect/distractorType/rationale은 숨겨야 함.
 * Problem 객체에는 정답 답안 문자열도 포함되므로 fetch 시점에 sanitize.
 *
 * EN 모드 시 body/prompt/choice text를 영문 사전으로 치환.
 *
 * 매 요청마다 보기 순서를 무작위로 섞어 정답이 항상 1번에 오는 패턴을 방지.
 * choiceIndex(DB 식별자)는 그대로 두고 배열 순서만 셔플 — 클라이언트는 배열 순으로 1~5 번호 표시.
 */
const shuffle = <T>(arr: T[]): T[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const sanitizeForClient = (p: any, lang: Lang = 'ko') => {
  if (!p) return p;
  const { answer, ...rest } = p;
  if (lang === 'en') {
    const en = PROBLEM_EN[p.source];
    if (en) rest.body = en.body;
    if (SOURCE_EN[p.source]) rest.source = SOURCE_EN[p.source];
    if (rest.hint && HINT_EN[rest.hint]) rest.hint = HINT_EN[rest.hint];
  }
  if (Array.isArray(rest.steps)) {
    rest.steps = rest.steps.map((s: any) => {
      const promptKey = `${p.source}:${s.stepIndex}`;
      const promptEn = STEP_PROMPT_EN[promptKey];
      const choices = (s.choices ?? []).map((c: any) => {
        const choiceKey = `${p.source}:${s.stepIndex}:${c.choiceIndex}`;
        const choiceEn = CHOICE_EN[choiceKey];
        return {
          id: c.id, choiceIndex: c.choiceIndex,
          text: lang === 'en' && choiceEn ? choiceEn.text : c.text,
        };
      });
      return {
        id: s.id, stepIndex: s.stepIndex, stepType: s.stepType,
        prompt: lang === 'en' && promptEn ? promptEn : s.prompt,
        choices: shuffle(choices),
      };
    });
  }
  return rest;
};

@Injectable()
export class ProblemsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async list(q: any, lang: Lang = 'ko') {
    const rows = await this.prisma.problem.findMany({
      where: this.buildWhere(q),
      include: { steps: { orderBy: { stepIndex: 'asc' }, include: { choices: { orderBy: { choiceIndex: 'asc' } } } } },
      orderBy: { createdAt: 'asc' },
    });
    return rows.map((p) => sanitizeForClient(p, lang));
  }

  async findById(id: string, lang: Lang = 'ko') {
    const row = await this.prisma.problem.findUnique({
      where: { id },
      include: { steps: { orderBy: { stepIndex: 'asc' }, include: { choices: { orderBy: { choiceIndex: 'asc' } } } } },
    });
    return sanitizeForClient(row, lang);
  }

  async findHint(id: string) {
    const p = await this.prisma.problem.findUnique({ where: { id }, select: { hint: true } });
    return { hint: p?.hint };
  }

  private buildWhere(q: any) {
    const w: any = {};
    if (q?.unitId) w.unitId = q.unitId;
    if (q?.difficulty) w.difficulty = q.difficulty;
    if (q?.source) w.source = { contains: q.source, mode: 'insensitive' };
    return w;
  }
}

export const _sanitizeForClient = sanitizeForClient;
export { sanitizeForClient };
