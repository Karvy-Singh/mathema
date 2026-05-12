/**
 * 챕터별 개념학습 콘텐츠 — 시드 입력 타입.
 *
 * NCERT 79 챕터 각각에 대해 다음 5 단계 콘텐츠가 정의된다.
 * (CONCRETE / PICTORIAL / GUIDED_PRACTICE / REFLECT 는 시드 단계에서
 *  optional, 후속 작업에서 ConceptLesson 별로 추가될 수 있다.)
 *
 *   1. HOOK            - 호기심 자극, 사전지식 연결
 *   2. ABSTRACT        - 기호·공식·정의
 *   3. WORKED_EXAMPLE  - 풀이 시연 (단계 분해)
 *   4. MISCONCEPTION   - 흔한 오개념 (wrong / why / correct)
 *   5. RETRIEVAL       - 자가 점검 1문항 (서술식 단답)
 */

/**
 * 동적 그래프 데이터 (프론트의 <GraphRenderer/> 가 SVG 로 렌더).
 * 학년·챕터 무관 — 그래프 종류는 type 으로 구분, 나머지 파라미터로 인스턴스화.
 */
export type VisualData =
  | { type: 'unit-circle'; angle: number; label?: string }
  | { type: 'parabola'; a: number; b: number; c: number; range?: [number, number] }
  | { type: 'number-line'; marks: number[]; highlight?: number; range?: [number, number] }
  | { type: 'venn-2set'; a: number; b: number; both: number; labelA: string; labelB: string; total?: number }
  | { type: 'sine-wave'; amplitude?: number; period?: number; marked?: Array<{ x: number; y: number; label?: string }>; range?: [number, number] }
  | { type: 'complex-plane'; points: Array<{ re: number; im: number; label?: string }> }
  | { type: 'right-triangle'; opp: number; adj: number; angleLabel?: string }
  | { type: 'function-line'; m: number; c: number; range?: [number, number]; markedPoints?: Array<{ x: number; y: number }> };

export interface ConceptChapterContent {
  hook?: { ko: string; en: string; hi?: string };
  concrete?: { ko: string; en: string; hi?: string; visual?: string; visualData?: VisualData };
  pictorial?: { ko: string; en: string; hi?: string; visual?: string; visualData?: VisualData };
  abstract: { ko: string; en: string; hi?: string };
  worked: {
    ko: string;
    en: string;
    hi?: string;
    /** 단계별 풀이 (math + narration) */
    steps: Array<{ math: string; narrationKo: string; narrationEn: string; narrationHi?: string }>;
  };
  misconception?: {
    wrongKo: string;   wrongEn: string;   wrongHi?: string;
    whyKo: string;     whyEn: string;     whyHi?: string;
    correctKo: string; correctEn: string; correctHi?: string;
  };
  retrieval: {
    promptKo: string;
    promptEn: string;
    promptHi?: string;
    accept: string[];          // 정답으로 수용할 표기들 (텍스트 대조용; 5지선다에서는 정답 라벨에도 사용)
    hintKo?: string;
    hintEn?: string;
    hintHi?: string;
    explainKo?: string;
    explainEn?: string;
    explainHi?: string;
    // 5지선다 객관식 - 매력적 오답 4개. 없으면 부팅 시 generic distractor 자동 생성.
    distractors?: Array<{
      textKo: string;
      textEn: string;
      textHi?: string;
      rationaleKo?: string;
      rationaleEn?: string;
      rationaleHi?: string;
    }>;
  };
  reflect?: { promptsKo: string[]; promptsEn: string[]; promptsHi?: string[] };
}

export type ChapterContentMap = Record<string, ConceptChapterContent>;
