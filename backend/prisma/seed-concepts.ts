/**
 * Concept Lessons seed — NCERT 7~12 의 모든 챕터를 ConceptLesson + ConceptStep 으로 시딩.
 *
 * prisma/seed.ts 의 main() 끝에서 호출된다.
 *   await seedConceptLessons(prisma, unitByName);
 *
 * 콘텐츠 출처:
 *   - 챕터 메타: src/common/curriculum/ncert-chapters.ts
 *   - 단계 콘텐츠: src/common/curriculum/concept-content/*.ts
 *   - 시퀀스 정책: src/common/learning/concept-framework.ts (pickSequence)
 *
 * 챕터에 대응 콘텐츠가 없으면 stub (HOOK + ABSTRACT + RETRIEVAL) 만 생성하여
 * 사용자가 lesson 트리를 모두 탐색 가능하도록 보장한다.
 */

import { PrismaClient, ConceptStepKind } from '@prisma/client';
import { NCERT_CHAPTERS } from '../src/common/curriculum/ncert-chapters';
import { CHAPTER_CONTENT, ConceptChapterContent } from '../src/common/curriculum/concept-content';
import { pickSequence } from '../src/common/learning/concept-framework';

// NCERT 교과서 본문 발췌 — scripts/extract-ncert-excerpts.py 가 PDF 에서 자동 추출.
// 챕터별 introduction (10~18 줄) 가 chapterCode → { excerpt, sourceLine, ... } 로 저장됨.
// abstract step bodyEn 끝에 통합해 학생이 NCERT 원문도 함께 학습.
// 79 챕터 중 54 챕터에 발췌 존재 (Class 9 12 챕터는 PDF 누락, 그 외 일부 패턴 불일치).
// 누락 챕터는 그대로 자체 작성 콘텐츠만 표시.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const NCERT_EXCERPTS: Record<
  string,
  { ncertClass: string; chapterNumber: number; sourceLine: number; excerpt: string }
> = require('../src/common/curriculum/concept-content/ncert-excerpts.json');

export async function seedConceptLessons(
  prisma: PrismaClient,
  unitByName: Record<string, { id: string; subs: Record<string, string> }>,
): Promise<void> {
  let lessons = 0;
  let steps = 0;

  for (const ch of NCERT_CHAPTERS) {
    const content = CHAPTER_CONTENT[ch.chapterCode];
    // 단원 = NCERT 챕터 1:1 매핑. unitByName 은 GRADE_TO_UNITS (NCERT 챕터 한국어명) 으로 시드됨.
    // ch.koUnit 은 deprecated — titleKo 가 unitByName 에 있으면 그것, 없으면 ch.koUnit fallback.
    const unitKey = unitByName[ch.titleKo] ? ch.titleKo : (ch.koUnit ?? ch.titleKo);
    const unitId = unitByName[unitKey]?.id ?? null;
    const subUnitId = null; // 1차 출시: sub-unit 비활성 (단원 = 챕터)

    const lesson = await prisma.conceptLesson.upsert({
      where: { chapterCode: ch.chapterCode },
      update: {
        ncertClass: ch.ncertClass,
        chapterNumber: ch.chapterNumber,
        titleKo: ch.titleKo, titleEn: ch.titleEn,
        bigIdeaKo: ch.bigIdeaKo, bigIdeaEn: ch.bigIdeaEn,
        estimatedMin: ch.estimatedMin,
        cognitiveLoad: ch.cognitiveLoad,
        prerequisiteCodes: ch.prerequisites,
        unitId, subUnitId,
      },
      create: {
        ncertClass: ch.ncertClass,
        chapterNumber: ch.chapterNumber,
        chapterCode: ch.chapterCode,
        titleKo: ch.titleKo, titleEn: ch.titleEn,
        bigIdeaKo: ch.bigIdeaKo, bigIdeaEn: ch.bigIdeaEn,
        estimatedMin: ch.estimatedMin,
        cognitiveLoad: ch.cognitiveLoad,
        prerequisiteCodes: ch.prerequisites,
        unitId, subUnitId,
      },
    });
    lessons++;

    await prisma.conceptStep.deleteMany({ where: { lessonId: lesson.id } });

    const stepRecords = buildSteps(content, ch.cognitiveLoad, ch.chapterCode);
    for (let i = 0; i < stepRecords.length; i++) {
      const s = stepRecords[i];
      await prisma.conceptStep.create({
        data: {
          lessonId: lesson.id,
          stepIndex: i + 1,
          kind: s.kind,
          titleKo: s.titleKo,
          titleEn: s.titleEn,
          bodyKo: s.bodyKo,
          bodyEn: s.bodyEn,
          visualType: s.visualType ?? null,
          visualUrl: s.visualUrl ?? null,
          misconception: s.misconception ?? null,
          workedSteps: s.workedSteps ?? null,
          retrievalCheck: s.retrievalCheck ?? null,
          reflectPrompts: s.reflectPrompts ?? null,
        },
      });
      steps++;
    }
  }

  console.log(`📚 ConceptLessons: ${lessons} lessons, ${steps} steps seeded.`);
}

// ----- helpers -----

interface StepRecord {
  kind: ConceptStepKind;
  titleKo: string;
  titleEn: string;
  bodyKo: string;
  bodyEn: string;
  visualType?: string;
  visualUrl?: string;
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
  const ncert = NCERT_EXCERPTS[chapterCode];
  const seq = pickSequence(cognitiveLoad);
  const steps: StepRecord[] = [];

  for (const bp of seq) {
    const labelKo = bp.labelKo;
    const labelEn = bp.labelEn;

    switch (bp.kind) {
      case 'HOOK': {
        const h = content?.hook;
        if (h) steps.push(stepText(bp, h.ko, h.en));
        else  steps.push(stepText(bp, '이 단원을 왜 배우는지 곧 채워질 예정입니다.', 'Motivation will be added soon.'));
        break;
      }
      case 'CONCRETE': {
        const c = content?.concrete;
        if (c) {
          steps.push(stepText(bp, c.ko, c.en, c.visual));
        } else if (content?.worked) {
          // fallback: worked example 의 첫 줄을 구체 예시로 재사용 — 모든 챕터가 일관된 단계 수.
          const first = content.worked.steps[0];
          steps.push(
            stepText(bp,
              `예: ${content.worked.ko}\n→ ${first?.math ?? ''} ${first?.narrationKo ?? ''}`,
              `Example: ${content.worked.en}\n→ ${first?.math ?? ''} ${first?.narrationEn ?? ''}`,
            ),
          );
        } else {
          steps.push(stepText(bp,
            '구체 예시는 곧 추가됩니다.',
            'A concrete example will be added soon.',
          ));
        }
        break;
      }
      case 'PICTORIAL': {
        const p = content?.pictorial;
        if (p) {
          steps.push(stepText(bp, p.ko, p.en, p.visual));
        } else {
          // 시각화 fallback — abstract / worked 내용을 시각적으로 다시 음미하도록 유도.
          steps.push(stepText(bp,
            '머릿속에 이 개념의 그림(다이어그램·수직선·그래프)을 떠올려보세요. 손으로 한 번 그려보면 abstract 단계가 더 단단해집니다.',
            'Picture this in your head — a diagram, number line, or graph. Sketching it makes the abstract step stick.',
          ));
        }
        break;
      }
      case 'ABSTRACT': {
        const a = content?.abstract;
        // NCERT 교과서 원문 발췌가 있으면 abstract body 끝에 부착 — 학생이 원문도 함께 본다.
        // 발췌는 영어로만 있으므로 ko 본문 끝에도 동일 영어 발췌를 인용 ("원문" 라벨로 명시).
        const ncertBlock = ncert?.excerpt
          ? `\n\n📖 NCERT textbook · Class ${ncert.chapterNumber > 0 ? ncert.ncertClass.replace('CLASS_', '') : ''} · §${ncert.chapterNumber}.1 Introduction\n${ncert.excerpt}`
          : '';
        const koExtra = ncert?.excerpt
          ? `\n\n📖 NCERT 교과서 §${ncert.chapterNumber}.1 (원문)\n${ncert.excerpt}`
          : '';
        if (a) {
          steps.push(stepText(bp, a.ko + koExtra, a.en + ncertBlock));
        } else {
          steps.push(stepText(bp,
            '기호·정의 정리 예정.' + koExtra,
            'Formal definitions coming soon.' + ncertBlock,
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
            bodyKo: w.ko,
            bodyEn: w.en,
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
            bodyKo: `❌ ${m.wrongKo}\n\n💡 ${m.whyKo}\n\n✅ ${m.correctKo}`,
            bodyEn: `❌ ${m.wrongEn}\n\n💡 ${m.whyEn}\n\n✅ ${m.correctEn}`,
            misconception: m,
          });
        } else {
          // fallback: 일반 메타-주의 카드. 챕터마다 단계 수가 달라지는 모순을 막는다.
          steps.push({
            kind: 'MISCONCEPTION',
            titleKo: labelKo,
            titleEn: labelEn,
            bodyKo:
              '🔍 이 단원의 흔한 함정\n' +
              '\n' +
              '학생들이 이 개념을 처음 만났을 때 가장 자주 빠지는 실수는 두 가지:\n' +
              '① 기호·정의를 외워 적용하지만 *왜* 그렇게 되는지 묻지 않는 것.\n' +
              '② 비슷한 모양의 공식을 적용 조건과 무관하게 가져다 쓰는 것 (예: 회전체 vs 셸).\n' +
              '\n' +
              '💡 풀이 전 30초만 "이 공식이 정말 이 상황에 맞는가?" 자문하세요.',
            bodyEn:
              '🔍 Common pitfalls in this chapter\n' +
              '\n' +
              'Two failure modes show up the most:\n' +
              '① memorising symbols without asking *why* they work,\n' +
              '② grabbing the nearest-looking formula without checking its preconditions.\n' +
              '\n' +
              '💡 Take 30 seconds before solving: "Does this formula actually apply here?"',
            misconception: null,
          });
        }
        break;
      }
      case 'RETRIEVAL': {
        const r = content?.retrieval;
        if (r) {
          steps.push({
            kind: 'RETRIEVAL',
            titleKo: labelKo,
            titleEn: labelEn,
            bodyKo: r.promptKo,
            bodyEn: r.promptEn,
            retrievalCheck: {
              prompt: { ko: r.promptKo, en: r.promptEn },
              accept: r.accept,
              hint: r.hintKo ? { ko: r.hintKo, en: r.hintEn ?? r.hintKo } : null,
              explain: r.explainKo
                ? { ko: r.explainKo, en: r.explainEn ?? r.explainKo }
                : null,
            },
          });
        } else {
          // 모든 lesson 은 RETRIEVAL 이 있어야 unlock 가능 — fallback prompt
          steps.push({
            kind: 'RETRIEVAL',
            titleKo: labelKo,
            titleEn: labelEn,
            bodyKo: '이 단원의 핵심 한 줄을 자기 말로 적어보세요.',
            bodyEn: 'Write the core idea of this chapter in your own words.',
            retrievalCheck: { prompt: { ko: '', en: '' }, accept: [], explain: null },
          });
        }
        break;
      }
      case 'GUIDED_PRACTICE': {
        // DEEP_SEQUENCE 에서만. worked example 의 일부 빈칸 fading 으로 사용.
        const w = content?.worked;
        if (w) {
          steps.push({
            kind: 'GUIDED_PRACTICE',
            titleKo: labelKo,
            titleEn: labelEn,
            bodyKo: '아래 풀이의 빈칸을 채워보세요. (한 단계 가려져 있습니다)',
            bodyEn: 'Fill the missing step below.',
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
          bodyKo: '오늘 배운 빅 아이디어를 한 문장으로 적어보세요.',
          bodyEn: 'Summarise today\'s big idea in one sentence.',
          reflectPrompts: r ?? {
            promptsKo: ['이 개념을 친구에게 설명한다면 어떻게 말할까?'],
            promptsEn: ['How would you explain this to a friend?'],
          },
        });
        break;
      }
    }
  }

  return steps;
}

function stepText(
  bp: { kind: ConceptStepKind; labelKo: string; labelEn: string },
  ko: string,
  en: string,
  visual?: string,
): StepRecord {
  return {
    kind: bp.kind,
    titleKo: bp.labelKo,
    titleEn: bp.labelEn,
    bodyKo: ko,
    bodyEn: en,
    visualType: visual ? 'svg' : undefined,
    visualUrl: visual,
  };
}
