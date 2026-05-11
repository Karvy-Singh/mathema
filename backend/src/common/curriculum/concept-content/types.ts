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

export interface ConceptChapterContent {
  hook?: { ko: string; en: string };
  concrete?: { ko: string; en: string; visual?: string };
  pictorial?: { ko: string; en: string; visual?: string };
  abstract: { ko: string; en: string };
  worked: {
    ko: string;
    en: string;
    /** 단계별 풀이 (math + narration) */
    steps: Array<{ math: string; narrationKo: string; narrationEn: string }>;
  };
  misconception?: {
    wrongKo: string;   wrongEn: string;
    whyKo: string;     whyEn: string;
    correctKo: string; correctEn: string;
  };
  retrieval: {
    promptKo: string;
    promptEn: string;
    accept: string[];          // 정답으로 수용할 표기들
    hintKo?: string;
    hintEn?: string;
    explainKo?: string;
    explainEn?: string;
  };
  reflect?: { promptsKo: string[]; promptsEn: string[] };
}

export type ChapterContentMap = Record<string, ConceptChapterContent>;
