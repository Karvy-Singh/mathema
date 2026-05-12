import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConceptStepKind } from '@prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { NCERT_CHAPTERS } from '../../common/curriculum/ncert-chapters';
import { CHAPTER_CONTENT, ConceptChapterContent } from '../../common/curriculum/concept-content';
import { pickSequence } from '../../common/learning/concept-framework';

/**
 * 부팅 시 ConceptLesson + ConceptStep 을 NCERT_CHAPTERS / CHAPTER_CONTENT 와 자동 동기화.
 *
 * 정책 (idempotent):
 *   - 각 NCERT 챕터에 대해 upsert (chapterCode 가 unique key) → 새 챕터 추가 시 자동 반영.
 *   - ConceptStep 은 매 부팅 시 deleteMany + create — 콘텐츠 파일을 수정하면 즉시 반영.
 *   - ConceptProgress (사용자 진행) 는 lessonId 만 참조하므로 ConceptStep 재시드 영향 없음.
 *
 * 단, 부하 회피를 위해 콘텐츠 해시가 같으면 step 재시드를 건너뛴다.
 * (해시는 CHAPTER_CONTENT + NCERT_EXCERPTS 의 stable JSON 직렬화 길이 + chapter version)
 *
 * 이 서비스로 인해 사용자는 npm run start:dev 만 실행하면 됨:
 *   prisma generate → migrate deploy → nest start → 자동 ConceptLesson 동기화.
 */

// PDF 발췌 (선택). require 로 가져와 build 단계의 path 문제 회피.
type Excerpt = { ncertClass: string; chapterNumber: number; sourceLine: number; excerpt: string };
const NCERT_EXCERPTS: Record<string, Excerpt> = (() => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires, global-require
    return require('../../common/curriculum/concept-content/ncert-excerpts.json');
  } catch {
    return {};
  }
})();
/** NCERT 힌디어 교과서 본문 발췌 (인도 PoC). 사용자가 PDF 입수 후 추출. */
const NCERT_EXCERPTS_HI: Record<string, Excerpt> = (() => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires, global-require
    return require('../../common/curriculum/concept-content/ncert-excerpts-hi.json');
  } catch {
    return {};
  }
})();

@Injectable()
export class ConceptLessonsBootstrap implements OnModuleInit {
  private readonly logger = new Logger(ConceptLessonsBootstrap.name);

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit(): Promise<void> {
    // 부팅 차단 방지 — sync 는 79 챕터 × 7~9 step 으로 1100+ query 직렬 실행.
    // NestJS app 은 즉시 listen 하고, sync 는 백그라운드 진행. API 호출은 sync 완료 전에도 가능
    // (lesson 카운트 0 또는 부분 채움 상태일 수 있으나 사용자 진행 데이터는 보존).
    setImmediate(() => {
      this.sync().catch((err) => {
        this.logger.error(`ConceptLesson auto-sync failed: ${(err as Error).message}`);
      });
    });
  }

  /**
   * NCERT_CHAPTERS 와 DB 의 ConceptLesson 을 동기화.
   * 누락된 챕터: 새로 시드.  존재하는 챕터: lesson 메타 upsert + step 재시드.
   */
  async sync(): Promise<void> {
    // Unit 매핑 (lesson.unit 연결) — DB 에서 직접 조회.
    const units = await this.prisma.unit.findMany({ select: { id: true, name: true } });
    const unitByName: Record<string, string> = Object.fromEntries(
      units.map((u) => [u.name, u.id]),
    );

    // 챕터 수가 일치하면 skip — 매 부팅 1100+ query 회피.
    // 콘텐츠 변경을 즉시 반영하려면 환경 변수 FORCE_CONCEPT_SYNC=1 또는 `npm run db:seed`.
    const contentVersion = `v${NCERT_CHAPTERS.length}.${Object.keys(CHAPTER_CONTENT).length}.${Object.keys(NCERT_EXCERPTS).length}`;
    const existingCount = await this.prisma.conceptLesson.count();
    const force = process.env.FORCE_CONCEPT_SYNC === '1';
    if (!force && existingCount >= NCERT_CHAPTERS.length) {
      this.logger.log(`ConceptLessons already in sync (${existingCount}/${NCERT_CHAPTERS.length}, ${contentVersion}) — skipping. Set FORCE_CONCEPT_SYNC=1 to force.`);
      return;
    }
    this.logger.log(`Syncing ConceptLessons: ${existingCount} → ${NCERT_CHAPTERS.length} (${contentVersion})`);

    let lessons = 0;
    let steps = 0;
    for (const ch of NCERT_CHAPTERS) {
      const content = CHAPTER_CONTENT[ch.chapterCode];
      const unitKey = unitByName[ch.titleKo] ? ch.titleKo : ch.koUnit ?? ch.titleKo;
      const unitId = unitByName[unitKey] ?? null;

      const lessonData = {
        ncertClass: ch.ncertClass,
        chapterNumber: ch.chapterNumber,
        titleKo: ch.titleKo,
        titleEn: ch.titleEn,
        titleHi: ch.titleHi ?? null,
        bigIdeaKo: ch.bigIdeaKo,
        bigIdeaEn: ch.bigIdeaEn,
        bigIdeaHi: ch.bigIdeaHi ?? null,
        estimatedMin: ch.estimatedMin,
        cognitiveLoad: ch.cognitiveLoad,
        prerequisiteCodes: ch.prerequisites,
        unitId,
      };
      const lesson = await this.prisma.conceptLesson.upsert({
        where: { chapterCode: ch.chapterCode },
        update: lessonData,
        create: { ...lessonData, chapterCode: ch.chapterCode },
      });
      lessons++;

      await this.prisma.conceptStep.deleteMany({ where: { lessonId: lesson.id } });
      const records = buildSteps(content, ch.cognitiveLoad, ch.chapterCode);
      for (let i = 0; i < records.length; i++) {
        const s = records[i];
        await this.prisma.conceptStep.create({
          data: {
            lessonId: lesson.id,
            stepIndex: i + 1,
            kind: s.kind,
            titleKo: s.titleKo,
            titleEn: s.titleEn,
            titleHi: s.titleHi ?? null,
            bodyKo: s.bodyKo,
            bodyEn: s.bodyEn,
            bodyHi: s.bodyHi ?? null,
            visualType: s.visualType ?? null,
            visualUrl: s.visualUrl ?? null,
            visualData: s.visualData ?? null,
            misconception: s.misconception ?? null,
            workedSteps: s.workedSteps ?? null,
            retrievalCheck: s.retrievalCheck ?? null,
            reflectPrompts: s.reflectPrompts ?? null,
          },
        });
        steps++;
      }
    }

    this.logger.log(`ConceptLesson bootstrap complete: ${lessons} lessons, ${steps} steps.`);
  }
}

// ---------- buildSteps (prisma/seed-concepts.ts 와 동일 로직 — production 동기화용) ----------

interface StepRecord {
  kind: ConceptStepKind;
  titleKo: string;
  titleEn: string;
  titleHi?: string;
  bodyKo: string;
  bodyEn: string;
  bodyHi?: string;
  visualType?: string;
  visualUrl?: string;
  visualData?: any;
  misconception?: any;
  workedSteps?: any;
  retrievalCheck?: any;
  reflectPrompts?: any;
}

function buildSteps(
  content: ConceptChapterContent | undefined,
  cognitiveLoad: 0 | 1 | 2 | 3,
  chapterCode: string,
): StepRecord[] {
  const seq = pickSequence(cognitiveLoad);
  const steps: StepRecord[] = [];
  const ncert = NCERT_EXCERPTS[chapterCode];

  for (const bp of seq) {
    const labelKo = bp.labelKo;
    const labelEn = bp.labelEn;

    switch (bp.kind) {
      case 'HOOK': {
        const h = content?.hook;
        if (h) steps.push(stepText(bp, h.ko, h.en, h.hi));
        else  steps.push(stepText(bp, '이 단원을 왜 배우는지 곧 채워질 예정입니다.', 'Motivation will be added soon.', undefined));
        break;
      }
      case 'CONCRETE': {
        const c = content?.concrete;
        if (c) {
          steps.push(stepText(bp, c.ko, c.en, c.hi, c.visual, c.visualData));
        } else if (content?.worked) {
          const first = content.worked.steps[0];
          steps.push(stepText(bp,
            `예: ${content.worked.ko}\n→ ${first?.math ?? ''} ${first?.narrationKo ?? ''}`,
            `Example: ${content.worked.en}\n→ ${first?.math ?? ''} ${first?.narrationEn ?? ''}`,
            content.worked.hi
              ? `उदाहरण: ${content.worked.hi}\n→ ${first?.math ?? ''} ${first?.narrationHi ?? ''}`
              : undefined,
          ));
        } else {
          steps.push(stepText(bp,
            '구체 예시는 곧 추가됩니다.',
            'A concrete example will be added soon.',
            'ठोस उदाहरण जल्द जोड़ा जाएगा।',
          ));
        }
        break;
      }
      case 'PICTORIAL': {
        const p = content?.pictorial;
        if (p) {
          steps.push(stepText(bp, p.ko, p.en, p.hi, p.visual, p.visualData));
        } else {
          steps.push(stepText(bp,
            '머릿속에 이 개념의 그림(다이어그램·수직선·그래프)을 떠올려보세요. 손으로 한 번 그려보면 abstract 단계가 더 단단해집니다.',
            'Picture this in your head — a diagram, number line, or graph. Sketching it makes the abstract step stick.',
            'इस अवधारणा का चित्र (आरेख·संख्या रेखा·ग्राफ़) मन में बनाएँ। एक बार हाथ से बनाने से अमूर्त चरण और मज़बूत होता है।',
          ));
        }
        break;
      }
      case 'ABSTRACT': {
        const a = content?.abstract;
        const ncertHi = NCERT_EXCERPTS_HI[chapterCode];
        const ncertEnBlock = ncert?.excerpt
          ? `\n\n📖 NCERT textbook · Class ${ncert.ncertClass.replace('CLASS_', '')} · §${ncert.chapterNumber}.1 Introduction\n${ncert.excerpt}`
          : '';
        const ncertKoBlock = ncert?.excerpt
          ? `\n\n📖 NCERT 교과서 §${ncert.chapterNumber}.1 (원문)\n${ncert.excerpt}`
          : '';
        // HI 발췌가 있으면 사용, 없으면 EN 발췌 그대로 (hi 콘텐츠 부재 시 fallback).
        const ncertHiBlock = ncertHi?.excerpt
          ? `\n\n📖 NCERT पाठ्यपुस्तक · कक्षा ${ncertHi.ncertClass.replace('CLASS_', '')} · §${ncertHi.chapterNumber}.1 परिचय\n${ncertHi.excerpt}`
          : ncertEnBlock;
        if (a) {
          steps.push(stepText(bp,
            a.ko + ncertKoBlock,
            a.en + ncertEnBlock,
            a.hi ? a.hi + ncertHiBlock : undefined,
          ));
        } else {
          steps.push(stepText(bp,
            '기호·정의 정리 예정.' + ncertKoBlock,
            'Formal definitions coming soon.' + ncertEnBlock,
            'प्रतीक और परिभाषाएँ जल्द।' + ncertHiBlock,
          ));
        }
        break;
      }
      case 'WORKED_EXAMPLE': {
        const w = content?.worked;
        if (w) {
          steps.push({
            kind: 'WORKED_EXAMPLE',
            titleKo: labelKo,
            titleEn: labelEn,
            titleHi: bp.labelHi,
            bodyKo: w.ko,
            bodyEn: w.en,
            bodyHi: w.hi,
            workedSteps: w.steps,
          });
        }
        break;
      }
      case 'MISCONCEPTION': {
        const m = content?.misconception;
        if (m) {
          steps.push({
            kind: 'MISCONCEPTION',
            titleKo: labelKo,
            titleEn: labelEn,
            titleHi: bp.labelHi,
            bodyKo: `❌ ${m.wrongKo}\n\n💡 ${m.whyKo}\n\n✅ ${m.correctKo}`,
            bodyEn: `❌ ${m.wrongEn}\n\n💡 ${m.whyEn}\n\n✅ ${m.correctEn}`,
            bodyHi: (m.wrongHi || m.whyHi || m.correctHi)
              ? `❌ ${m.wrongHi ?? m.wrongEn}\n\n💡 ${m.whyHi ?? m.whyEn}\n\n✅ ${m.correctHi ?? m.correctEn}`
              : undefined,
            misconception: m,
          });
        } else {
          steps.push({
            kind: 'MISCONCEPTION',
            titleKo: labelKo,
            titleEn: labelEn,
            titleHi: bp.labelHi,
            bodyKo:
              '🔍 이 단원의 흔한 함정\n\n' +
              '학생들이 이 개념을 처음 만났을 때 가장 자주 빠지는 실수는 두 가지:\n' +
              '① 기호·정의를 외워 적용하지만 *왜* 그렇게 되는지 묻지 않는 것.\n' +
              '② 비슷한 모양의 공식을 적용 조건과 무관하게 가져다 쓰는 것.\n\n' +
              '💡 풀이 전 30초만 "이 공식이 정말 이 상황에 맞는가?" 자문하세요.',
            bodyEn:
              '🔍 Common pitfalls in this chapter\n\n' +
              'Two failure modes show up the most:\n' +
              '① memorising symbols without asking *why* they work,\n' +
              '② grabbing the nearest-looking formula without checking its preconditions.\n\n' +
              '💡 Take 30 seconds before solving: "Does this formula actually apply here?"',
            bodyHi:
              '🔍 इस अध्याय की सामान्य भूलें\n\n' +
              'दो प्रकार की गलतियाँ सबसे अधिक होती हैं:\n' +
              '① प्रतीक/परिभाषाएँ रटना पर *क्यों* काम करती हैं यह न पूछना,\n' +
              '② मिलते-जुलते रूप के सूत्र को बिना शर्तें जाँचे लागू कर देना।\n\n' +
              '💡 हल करने से पहले 30 सेकंड: "क्या यह सूत्र वास्तव में यहाँ लागू होता है?"',
            misconception: null,
          });
        }
        break;
      }
      case 'RETRIEVAL': {
        const r = content?.retrieval;
        if (r) {
          // 5지선다 객관식 — 정답 1 + 매력적 오답 4. distractors 가 정의되어 있으면 사용,
          // 없으면 자동 generic 오답 생성 (정답에서 부호 반전·근소한 변형 등).
          const correctText = { ko: r.accept[0] ?? r.promptKo, en: r.accept[0] ?? r.promptEn };
          const distractors = r.distractors && r.distractors.length >= 4
            ? r.distractors.slice(0, 4)
            : autoDistractors(correctText.en, r.accept);

          // 정답 위치를 chapterCode + stepIndex 기반 deterministic shuffle.
          const all = [
            { textKo: correctText.ko, textEn: correctText.en, isCorrect: true, rationaleKo: null, rationaleEn: null },
            ...distractors.map((d) => ({
              textKo: d.textKo, textEn: d.textEn, isCorrect: false,
              rationaleKo: d.rationaleKo ?? null, rationaleEn: d.rationaleEn ?? null,
            })),
          ];
          const shuffled = deterministicShuffle(all, `${chapterCode}::retrieval`);
          const choices = shuffled.map((c, i) => ({
            choiceIndex: i + 1,
            textKo: c.textKo,
            textEn: c.textEn,
            isCorrect: c.isCorrect,
            rationaleKo: c.rationaleKo,
            rationaleEn: c.rationaleEn,
          }));

          steps.push({
            kind: 'RETRIEVAL',
            titleKo: labelKo,
            titleEn: labelEn,
            titleHi: bp.labelHi,
            bodyKo: r.promptKo,
            bodyEn: r.promptEn,
            bodyHi: r.promptHi,
            retrievalCheck: {
              prompt: { ko: r.promptKo, en: r.promptEn, hi: r.promptHi ?? r.promptEn },
              accept: r.accept,
              choices,
              hint: r.hintKo ? { ko: r.hintKo, en: r.hintEn ?? r.hintKo, hi: r.hintHi ?? r.hintEn ?? r.hintKo } : null,
              explain: r.explainKo
                ? { ko: r.explainKo, en: r.explainEn ?? r.explainKo, hi: r.explainHi ?? r.explainEn ?? r.explainKo }
                : null,
            },
          });
        } else {
          steps.push({
            kind: 'RETRIEVAL',
            titleKo: labelKo,
            titleEn: labelEn,
            titleHi: bp.labelHi,
            bodyKo: '이 단원의 핵심 한 줄을 자기 말로 적어보세요.',
            bodyEn: 'Write the core idea of this chapter in your own words.',
            bodyHi: 'इस अध्याय का मुख्य विचार अपने शब्दों में एक पंक्ति में लिखें।',
            retrievalCheck: { prompt: { ko: '', en: '', hi: '' }, accept: [], choices: [], explain: null },
          });
        }
        break;
      }
      case 'GUIDED_PRACTICE': {
        const w = content?.worked;
        if (w) {
          steps.push({
            kind: 'GUIDED_PRACTICE',
            titleKo: labelKo,
            titleEn: labelEn,
            titleHi: bp.labelHi,
            bodyKo: '아래 풀이의 빈칸을 채워보세요. (한 단계 가려져 있습니다)',
            bodyEn: 'Fill the missing step below.',
            bodyHi: 'नीचे दिए गए हल में रिक्त चरण को भरें। (एक चरण छिपा है)',
            workedSteps: w.steps,
          });
        }
        break;
      }
      case 'REFLECT': {
        const r = content?.reflect;
        steps.push({
          kind: 'REFLECT',
          titleKo: labelKo,
          titleEn: labelEn,
          titleHi: bp.labelHi,
          bodyKo: '오늘 배운 빅 아이디어를 한 문장으로 적어보세요.',
          bodyEn: 'Summarise today\'s big idea in one sentence.',
          bodyHi: 'आज सीखा बड़ा विचार एक वाक्य में लिखें।',
          reflectPrompts: r ?? {
            promptsKo: ['이 개념을 친구에게 설명한다면 어떻게 말할까?'],
            promptsEn: ['How would you explain this to a friend?'],
            promptsHi: ['यह अवधारणा किसी मित्र को कैसे समझाएँगे?'],
          },
        });
        break;
      }
    }
  }

  return steps;
}

/**
 * 정답에서 generic 매력적 오답 4개 자동 생성.
 * heuristics:
 *   - 숫자(정수/소수/분수): 부호 반전, ±1, ÷2, ×2
 *   - 대수식: 부호 일부 반전, 지수/계수 변형
 *   - 그 외: 일반적 함정 표현 ('Cannot be determined', 'None', 인접 개념 등)
 */
function autoDistractors(answer: string, accept: string[]): Array<{
  textKo: string; textEn: string; rationaleKo?: string; rationaleEn?: string;
}> {
  const a = (answer ?? '').trim();
  // 분수 a/b
  const fracMatch = a.match(/^(-?\d+)\s*\/\s*(-?\d+)$/);
  if (fracMatch) {
    const num = parseInt(fracMatch[1], 10);
    const den = parseInt(fracMatch[2], 10);
    return [
      { textKo: `${den}/${num}`, textEn: `${den}/${num}`, rationaleKo: '역수로 잘못 계산.', rationaleEn: 'Took the reciprocal.' },
      { textKo: `${-num}/${den}`, textEn: `${-num}/${den}`, rationaleKo: '부호 반전.', rationaleEn: 'Sign flipped.' },
      { textKo: `${num}/${den + 1}`, textEn: `${num}/${den + 1}`, rationaleKo: '분모 ± 1 실수.', rationaleEn: 'Off-by-one in denominator.' },
      { textKo: `${num + 1}/${den}`, textEn: `${num + 1}/${den}`, rationaleKo: '분자 ± 1 실수.', rationaleEn: 'Off-by-one in numerator.' },
    ];
  }
  // 정수 또는 소수
  const num = Number(a);
  if (Number.isFinite(num) && a.replace(/[-+.\d]/g, '') === '') {
    const variations = [
      { v: -num, why: '부호 반전.', en: 'Sign flipped.' },
      { v: num + 1, why: '+1 실수.', en: 'Off-by-one (+).' },
      { v: num * 2, why: '두 배로 잘못 계산.', en: 'Doubled.' },
      { v: Math.round(num / 2), why: '절반으로 잘못 계산.', en: 'Halved.' },
    ];
    // 정답과 동일한 값 중복 제거
    const seen = new Set([num]);
    const result: Array<{ textKo: string; textEn: string; rationaleKo: string; rationaleEn: string }> = [];
    for (const x of variations) {
      if (seen.has(x.v)) continue;
      seen.add(x.v);
      const s = Number.isInteger(num) ? String(x.v) : x.v.toString();
      result.push({ textKo: s, textEn: s, rationaleKo: x.why, rationaleEn: x.en });
      if (result.length === 4) break;
    }
    // 4개 미만이면 채우기
    while (result.length < 4) {
      const fill = num + result.length + 2;
      result.push({ textKo: String(fill), textEn: String(fill), rationaleKo: '추측.', rationaleEn: 'Guess.' });
    }
    return result;
  }
  // 그 외 (대수식·기호·단어) — generic
  return [
    { textKo: '0', textEn: '0', rationaleKo: '계산 누락.', rationaleEn: 'Skipped a step.' },
    { textKo: '1', textEn: '1', rationaleKo: '근거 없는 추측.', rationaleEn: 'Guess without reasoning.' },
    { textKo: `−(${a})`, textEn: `−(${a})`, rationaleKo: '부호 반전 오답.', rationaleEn: 'Sign-flipped variant.' },
    { textKo: '정의되지 않음', textEn: 'Undefined', rationaleKo: '조건 미확인.', rationaleEn: 'Did not check conditions.' },
  ];
}

/** Deterministic shuffle (SHA-256 (key) → LCG seed) — same key → same order, no Math.random */
function deterministicShuffle<T>(arr: T[], key: string): T[] {
  // 단순 string hash (FNV-1a 32-bit) — Node crypto 안 쓰고 가벼움
  let h = 0x811c9dc5;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  let s = h || 1;
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    const j = s % (i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function stepText(
  bp: { kind: ConceptStepKind; labelKo: string; labelEn: string; labelHi?: string },
  ko: string,
  en: string,
  hi: string | undefined,
  visual?: string,
  visualData?: any,
): StepRecord {
  // visualData 가 있으면 visualType='graph' (프론트가 GraphRenderer 로 렌더).
  const visualType = visualData ? 'graph' : visual ? 'svg' : undefined;
  return {
    kind: bp.kind,
    titleKo: bp.labelKo,
    titleEn: bp.labelEn,
    titleHi: bp.labelHi,
    bodyKo: ko,
    bodyEn: en,
    bodyHi: hi,
    visualType,
    visualUrl: visualData ? undefined : visual,
    visualData: visualData ?? undefined,
  };
}
