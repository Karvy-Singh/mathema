/**
 * 개념학습 (Pre-problem Concept Lesson) 프레임워크
 *
 * 인지심리학·수학교육학 원리를 단일 차시 학습으로 압축한 표준 시퀀스.
 * 모든 NCERT 챕터는 이 시퀀스 위에서 콘텐츠가 채워진다.
 *
 * 근거 (Why this sequence):
 *   1. Bruner (1966) — CPA: Concrete → Pictorial → Abstract
 *      구체 조작 → 시각 표상 → 기호 일반화 순으로 추상화가 안착한다.
 *   2. Sweller (1988~) — Cognitive Load Theory
 *      worked-example > problem solving 초기 학습. 외재 부하 최소화가 핵심.
 *   3. Marton & Tsui (2004) — Variation Theory
 *      한 번에 한 차원만 변주해야 학습자가 핵심 차원을 분리·식별할 수 있다.
 *   4. Ausubel (1968) — Advance Organizer (HOOK)
 *      새 정보를 사전 지식 네트워크에 연결해야 의미적 학습이 일어난다.
 *   5. Karpicke & Roediger (2008) — Retrieval Practice / Testing Effect
 *      들어와서 다시 꺼내보는 것이 reread 보다 장기기억 형성에 우월하다.
 *   6. Smith, diSessa, Posner — Conceptual Change
 *      오개념은 무시하면 사라지지 않는다. 명시적으로 노출·대조해야 교체된다.
 *   7. Chi & Bassok — Self-explanation effect
 *      학습 끝 REFLECT 단계로 자기설명 유도 → 더 깊은 부호화.
 */

import { ConceptStepKind } from '@prisma/client';

export interface ConceptStepBlueprint {
  kind: ConceptStepKind;
  /** UI 에 노출되는 라벨 */
  labelKo: string;
  labelEn: string;
  /** 단계 목적 (UX 의 진행도 툴팁용) */
  purposeKo: string;
  purposeEn: string;
  /** 이 단계가 처리하는 인지심리 원칙 */
  principle: string;
  /** 권장 학습 시간 (초) — 인지부하·실제 데이터로 추후 보정 */
  recommendedSec: number;
}

/**
 * 표준 시퀀스 (Standard Sequence) — 7단계.
 * 챕터가 가볍거나 절차적일 때는 SHORT_SEQUENCE 사용 가능.
 */
export const STANDARD_SEQUENCE: ConceptStepBlueprint[] = [
  {
    kind: ConceptStepKind.HOOK,
    labelKo: '왜 배우는가',
    labelEn: 'Why this matters',
    purposeKo: '오늘 배울 개념이 어떤 문제를 해결해주는지 사전 지식과 연결.',
    purposeEn: 'Anchor today\'s idea to a real problem and prior knowledge.',
    principle: 'Ausubel — Advance Organizer',
    recommendedSec: 60,
  },
  {
    kind: ConceptStepKind.CONCRETE,
    labelKo: '구체 예시',
    labelEn: 'Concrete example',
    purposeKo: '손에 잡히는 실물·수치 사례로 개념의 작동을 직접 본다.',
    purposeEn: 'Watch the idea operate on tangible objects or numbers.',
    principle: 'Bruner — Concrete representation',
    recommendedSec: 120,
  },
  {
    kind: ConceptStepKind.PICTORIAL,
    labelKo: '그림·도식',
    labelEn: 'Picture & diagram',
    purposeKo: '같은 구조를 다이어그램·수직선·표로 시각화 (dual coding).',
    purposeEn: 'Re-encode the same structure as a diagram (dual coding).',
    principle: 'Bruner — Pictorial / Dual Coding',
    recommendedSec: 120,
  },
  {
    kind: ConceptStepKind.ABSTRACT,
    labelKo: '기호와 정의',
    labelEn: 'Symbols & definition',
    purposeKo: '기호·수식·일반화된 정의로 압축. 변주 1차원만 노출.',
    purposeEn: 'Compress to symbols, formal definition; vary only one dimension.',
    principle: 'Bruner — Abstract / Marton — Variation',
    recommendedSec: 180,
  },
  {
    kind: ConceptStepKind.WORKED_EXAMPLE,
    labelKo: '풀이 시연',
    labelEn: 'Worked example',
    purposeKo: '전체 풀이를 단계별로 보며 schema 를 형성. 외재 부하 최소.',
    purposeEn: 'See a full solution decomposed step-by-step.',
    principle: 'Sweller — Worked-example effect',
    recommendedSec: 180,
  },
  {
    kind: ConceptStepKind.MISCONCEPTION,
    labelKo: '흔한 함정',
    labelEn: 'Common pitfalls',
    purposeKo: '학생들이 자주 잘못 추론하는 지점을 노출하고 올바른 사고와 대조.',
    purposeEn: 'Expose typical wrong reasoning and contrast with correct.',
    principle: 'Conceptual change theory',
    recommendedSec: 120,
  },
  {
    kind: ConceptStepKind.RETRIEVAL,
    labelKo: '자가 점검',
    labelEn: 'Recall check',
    purposeKo: '입력 없이 회상하여 답한다. 통과해야 문제풀이 단계로 진입.',
    purposeEn: 'Answer from memory; required to unlock problem practice.',
    principle: 'Karpicke — Retrieval Practice',
    recommendedSec: 90,
  },
];

/**
 * 짧은 시퀀스 — 절차적이거나 가벼운 챕터(예: 단위 변환).
 */
export const SHORT_SEQUENCE: ConceptStepBlueprint[] = [
  STANDARD_SEQUENCE[0], // HOOK
  STANDARD_SEQUENCE[2], // PICTORIAL
  STANDARD_SEQUENCE[4], // WORKED_EXAMPLE
  STANDARD_SEQUENCE[6], // RETRIEVAL
];

/**
 * 심화 시퀀스 — Class 11~12 고난도 (예: 적분, 확률, 벡터).
 * GUIDED_PRACTICE 와 REFLECT 단계가 추가됨.
 */
export const DEEP_SEQUENCE: ConceptStepBlueprint[] = [
  ...STANDARD_SEQUENCE.slice(0, 5),  // HOOK..WORKED_EXAMPLE
  {
    kind: ConceptStepKind.GUIDED_PRACTICE,
    labelKo: '함께 풀어보기',
    labelEn: 'Guided practice',
    purposeKo: '풀이 단계 일부를 가린 채 학생이 채워보는 fading scaffolding.',
    purposeEn: 'Fill in faded steps — scaffolded practice.',
    principle: 'Renkl — Fading worked-examples',
    recommendedSec: 180,
  },
  STANDARD_SEQUENCE[5], // MISCONCEPTION
  STANDARD_SEQUENCE[6], // RETRIEVAL
  {
    kind: ConceptStepKind.REFLECT,
    labelKo: '내 말로 정리',
    labelEn: 'My own summary',
    purposeKo: '한 문장으로 개념을 자기 말로 요약 — 자기설명 효과.',
    purposeEn: 'Summarise the concept in your own words.',
    principle: 'Chi — Self-explanation effect',
    recommendedSec: 90,
  },
];

/** 챕터 난이도 별 시퀀스 선택 헬퍼 */
export function pickSequence(cognitiveLoad: 0 | 1 | 2 | 3): ConceptStepBlueprint[] {
  if (cognitiveLoad <= 0) return SHORT_SEQUENCE;
  if (cognitiveLoad >= 3) return DEEP_SEQUENCE;
  return STANDARD_SEQUENCE;
}

/** ConceptStepKind 별 색상/아이콘 토큰 (프론트가 이를 import 해서 일관 UI 구현) */
export const STEP_THEME: Record<ConceptStepKind, { color: string; icon: string }> = {
  HOOK:            { color: '#7c3aed', icon: 'spark' },
  CONCRETE:        { color: '#0ea5e9', icon: 'cube' },
  PICTORIAL:       { color: '#0891b2', icon: 'image' },
  ABSTRACT:        { color: '#4f46e5', icon: 'sigma' },
  WORKED_EXAMPLE:  { color: '#059669', icon: 'list-checks' },
  GUIDED_PRACTICE: { color: '#16a34a', icon: 'hand' },
  MISCONCEPTION:   { color: '#dc2626', icon: 'alert' },
  RETRIEVAL:       { color: '#ea580c', icon: 'target' },
  REFLECT:         { color: '#a16207', icon: 'pen' },
};
