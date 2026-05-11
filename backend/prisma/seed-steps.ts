import { PrismaClient } from '@prisma/client';
import { createHash } from 'crypto';

/**
 * Deterministic shuffle — 시드 데이터에서 정답이 항상 보기 1번 위치로 들어가
 * 단순 "1번 찍기" 전략으로 평가가 무력화되는 문제를 막는다.
 *
 *   key = source + ":" + stepIndex
 *
 * 매 시드 실행마다 같은 결과를 보장 (Math.random 미사용) — 같은 학생이 같은 문제를
 * 다시 풀어도 보기 순서가 동일해 학습/오답노트/통계 일관성을 유지.
 *
 * choiceIndex 는 셔플 후 배열 인덱스 + 1 로 재할당된다.
 */
function deterministicShuffle<T>(arr: T[], key: string): T[] {
  const h = createHash('sha256').update(key).digest();
  let s = h.readUInt32BE(0) || 1;
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    const j = s % (i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * 7문제 × 3단계(개념·풀이·정답) × 5지선다 시드.
 *
 * 각 단계는 1정답 + 4매력적 오답.
 * 매력적 오답은 distractorType + rationale로 분석 가능 데이터화.
 *
 * Distractor 분류:
 *   CONCEPT_CONFUSION   — 다른 개념과 혼동 (셸 vs 회전체, 독립 vs 조건부 등)
 *   CALC_ERROR          — 계산 단계 실수 (부호·지수·대입)
 *   PROCESS_SKIP        — 풀이 단계 누락 (제곱·π·구간 변환·dx 빠뜨림)
 *   TIME_PRESSURE_GUESS — 시간 압박 흔한 오선택 (타 문제 답 혼입·근사값 추측)
 */

type ChoiceSpec = {
  text: string;
  isCorrect?: boolean;
  distractorType?: 'CONCEPT_CONFUSION' | 'CALC_ERROR' | 'PROCESS_SKIP' | 'TIME_PRESSURE_GUESS';
  rationale?: string;
};

type StepSpec = {
  stepIndex: 1 | 2 | 3;
  stepType: 'CONCEPT' | 'PROCESS' | 'ANSWER';
  prompt: string;
  choices: ChoiceSpec[];
};

type ProblemStepsSpec = {
  source: string;
  steps: [StepSpec, StepSpec, StepSpec];
};

const SPEC: ProblemStepsSpec[] = [
  // ------------------------------------------------------------ 1 ------
  {
    source: '2024 9월 모의평가 30번',
    steps: [
      {
        stepIndex: 1, stepType: 'CONCEPT',
        prompt: '이 문제를 풀기 위한 회전체(x축 회전) 부피 공식은?',
        choices: [
          { text: 'V = π ∫[a→b] [f(x)]² dx', isCorrect: true },
          { text: 'V = ∫[a→b] f(x) dx', distractorType: 'CONCEPT_CONFUSION', rationale: '단순 정적분(면적 공식)을 부피로 혼동' },
          { text: 'V = 2π ∫[a→b] x · f(x) dx', distractorType: 'CONCEPT_CONFUSION', rationale: '셸(원통) 방법 — y축 회전체와 혼동' },
          { text: 'V = π ∫[a→b] f(x) dx', distractorType: 'PROCESS_SKIP', rationale: '제곱(²)을 빠뜨림' },
          { text: 'V = π ∫[a→b] [f(x)]² dy', distractorType: 'TIME_PRESSURE_GUESS', rationale: '적분 변수 혼동(y축 회전체)' },
        ],
      },
      {
        stepIndex: 2, stepType: 'PROCESS',
        prompt: '공식에 f(x)=√x, 구간 [0, 4]를 대입해 정리한 식은?',
        choices: [
          { text: 'π ∫[0→4] x dx', isCorrect: true },
          { text: 'π ∫[0→4] √x dx', distractorType: 'PROCESS_SKIP', rationale: '(√x)² = x로 단순화 단계 누락' },
          { text: 'π ∫[0→4] x² dx', distractorType: 'CALC_ERROR', rationale: '√x를 x로 보고 다시 제곱 — 지수 오인' },
          { text: '2π ∫[0→4] x dx', distractorType: 'CONCEPT_CONFUSION', rationale: '셸 방법 계수(2π) 적용' },
          { text: 'π ∫[1→4] x dx', distractorType: 'TIME_PRESSURE_GUESS', rationale: '구간 시작점을 1로 잘못 인식' },
        ],
      },
      {
        stepIndex: 3, stepType: 'ANSWER',
        prompt: '위 식의 값(부피)은?',
        choices: [
          { text: '8π', isCorrect: true },
          { text: '4π', distractorType: 'CALC_ERROR', rationale: '∫x dx = x²/2 적분 후 8 대신 4로 평가' },
          { text: '16π', distractorType: 'CALC_ERROR', rationale: '½ 누락 — x² 그대로 평가' },
          { text: '8', distractorType: 'PROCESS_SKIP', rationale: 'π 곱하기 누락' },
          { text: '32π', distractorType: 'CALC_ERROR', rationale: '4²=16에 다시 ×2(부주의)' },
        ],
      },
    ],
  },

  // ------------------------------------------------------------ 2 ------
  {
    source: '수능특강 미적분 III-2-15',
    steps: [
      {
        stepIndex: 1, stepType: 'CONCEPT',
        prompt: '∫ x e^x dx 의 풀이에 사용할 핵심 기법은?',
        choices: [
          { text: '부분적분: ∫u dv = uv - ∫v du', isCorrect: true },
          { text: '치환적분: t = e^x로 치환', distractorType: 'CONCEPT_CONFUSION', rationale: '치환적분 시도(부분적분과 혼동)' },
          { text: '곱의 적분 = 적분의 곱: (∫x dx)·(∫e^x dx)', distractorType: 'CONCEPT_CONFUSION', rationale: '곱의 적분을 곱으로 단순화하는 흔한 오류' },
          { text: '미분의 역연산만 적용', distractorType: 'PROCESS_SKIP', rationale: '체계적 기법 미선택 — 직관적 시도' },
          { text: '부분분수 분해', distractorType: 'TIME_PRESSURE_GUESS', rationale: '분수가 아닌데 시도 (다른 유형 답 혼입)' },
        ],
      },
      {
        stepIndex: 2, stepType: 'PROCESS',
        prompt: 'u = x, dv = e^x dx로 두면 부분적분 식은?',
        choices: [
          { text: 'x e^x - ∫ e^x dx', isCorrect: true },
          { text: 'x e^x - ∫ x e^x dx', distractorType: 'PROCESS_SKIP', rationale: 'du = dx 대입 단계 누락' },
          { text: '(1/2)x² · e^x', distractorType: 'CONCEPT_CONFUSION', rationale: 'u, v 정의 자체를 혼동' },
          { text: 'e^x - ∫ x e^x dx', distractorType: 'CALC_ERROR', rationale: 'uv 항에서 x 누락' },
          { text: 'x e^x + ∫ e^x dx', distractorType: 'CALC_ERROR', rationale: '부분적분 부호 오류' },
        ],
      },
      {
        stepIndex: 3, stepType: 'ANSWER',
        prompt: '식을 정리하면 부정적분의 값은?',
        choices: [
          { text: '(x - 1) e^x + C', isCorrect: true },
          { text: 'x e^x - e^x', distractorType: 'PROCESS_SKIP', rationale: '적분상수 C 누락' },
          { text: 'x e^x + e^x + C', distractorType: 'CALC_ERROR', rationale: '부분적분 부호 오류 누적' },
          { text: '(x + 1) e^x + C', distractorType: 'CALC_ERROR', rationale: '∫e^x = e^x를 빼는 부호 실수' },
          { text: 'x e^x - x + C', distractorType: 'CALC_ERROR', rationale: '∫e^x dx 를 x로 잘못 적분' },
        ],
      },
    ],
  },

  // ------------------------------------------------------------ 3 ------
  {
    source: '2024 6월 모의평가 28번',
    steps: [
      {
        stepIndex: 1, stepType: 'CONCEPT',
        prompt: '조건부확률 P(A|B)의 정의는?',
        choices: [
          { text: 'P(A∩B) / P(B)', isCorrect: true },
          { text: 'P(A) · P(B)', distractorType: 'CONCEPT_CONFUSION', rationale: '독립사건 곱셈정리와 혼동' },
          { text: 'P(A∪B) / P(B)', distractorType: 'CONCEPT_CONFUSION', rationale: '교집합을 합집합으로 잘못 사용' },
          { text: 'P(B|A)', distractorType: 'PROCESS_SKIP', rationale: '조건과 결과의 방향 혼동' },
          { text: 'P(A) + P(B) - P(A∩B)', distractorType: 'TIME_PRESSURE_GUESS', rationale: '덧셈정리 답 그대로 선택' },
        ],
      },
      {
        stepIndex: 2, stepType: 'PROCESS',
        prompt: 'B가 일어났을 때의 새 표본공간은?',
        choices: [
          { text: 'B에 해당하는 결과만으로 축소된 표본공간 (B 내에서 A 비율 계산)', isCorrect: true },
          { text: '전체 표본공간 그대로 사용', distractorType: 'CONCEPT_CONFUSION', rationale: '조건부의 핵심 — 표본공간 축소를 놓침' },
          { text: 'A에 해당하는 결과만으로 축소', distractorType: 'PROCESS_SKIP', rationale: 'A와 B 역할 혼동' },
          { text: '베이즈 정리로 P(B|A)에서 역산', distractorType: 'TIME_PRESSURE_GUESS', rationale: '필요 없는 베이즈 우회 시도' },
          { text: '시행 횟수만으로 직접 카운팅', distractorType: 'PROCESS_SKIP', rationale: '확률 정의 단계 생략' },
        ],
      },
      {
        stepIndex: 3, stepType: 'ANSWER',
        prompt: '계산을 마치면 조건부확률 값은?',
        choices: [
          { text: '7/15', isCorrect: true },
          { text: '7/30', distractorType: 'PROCESS_SKIP', rationale: '분모 절반 — P(B) 적용 누락' },
          { text: '8/15', distractorType: 'CALC_ERROR', rationale: '여사건(1 - 7/15)을 답으로 오인' },
          { text: '1/3', distractorType: 'CALC_ERROR', rationale: '조합 계산 실수로 단순화' },
          { text: '14/30', distractorType: 'TIME_PRESSURE_GUESS', rationale: '약분 누락 (계산은 맞으나 형식 오류)' },
        ],
      },
    ],
  },

  // ------------------------------------------------------------ 4 ------
  {
    source: '2024 9월 모의평가 21번',
    steps: [
      {
        stepIndex: 1, stepType: 'CONCEPT',
        prompt: '공간에서 두 직선이 이루는 각 θ의 코사인 공식은?',
        choices: [
          { text: 'cosθ = |u·v| / (|u| · |v|)', isCorrect: true },
          { text: 'cosθ = (u·v) / (|u| · |v|)', distractorType: 'PROCESS_SKIP', rationale: '절댓값 누락 — 둔각/예각 구분 실패' },
          { text: 'cosθ = (u·v)² / (|u|² · |v|²)', distractorType: 'CONCEPT_CONFUSION', rationale: '공식을 제곱 형태로 변형' },
          { text: 'cosθ = (|u| · |v|) / (u·v)', distractorType: 'CONCEPT_CONFUSION', rationale: '분자/분모 역수 혼동' },
          { text: 'sinθ = |u × v| / (|u| · |v|)', distractorType: 'CONCEPT_CONFUSION', rationale: '사인 공식 — 외적/내적 혼동' },
        ],
      },
      {
        stepIndex: 2, stepType: 'PROCESS',
        prompt: '두 방향벡터로 |u|, |v|, u·v를 계산하는 표준 절차는?',
        choices: [
          { text: '각 좌표 차이로 방향벡터 → 내적 정의 적용 → 크기는 √(x²+y²+z²)', isCorrect: true },
          { text: '내적 대신 외적 |u × v|를 사용', distractorType: 'CONCEPT_CONFUSION', rationale: '외적으로 코사인을 구함' },
          { text: '|u|에서 제곱근을 빠뜨려 x²+y²+z² 그대로 사용', distractorType: 'PROCESS_SKIP', rationale: '벡터 크기 정의 단계 누락' },
          { text: '평면 도형으로 환원해 cos법칙 적용', distractorType: 'TIME_PRESSURE_GUESS', rationale: '공간을 평면으로 잘못 단순화' },
          { text: 'u·v 부호를 그대로 두고 분모만 계산', distractorType: 'CALC_ERROR', rationale: '절댓값 처리 부호 누락' },
        ],
      },
      {
        stepIndex: 3, stepType: 'ANSWER',
        prompt: '계산하면 코사인 값은?',
        choices: [
          { text: '√3 / 3', isCorrect: true },
          { text: '1/3', distractorType: 'PROCESS_SKIP', rationale: '|u|, |v|에서 √ 처리 누락' },
          { text: '-√3 / 3', distractorType: 'PROCESS_SKIP', rationale: '|u·v| 절댓값 누락 → 부호 잔존' },
          { text: '√2 / 2', distractorType: 'CALC_ERROR', rationale: '특수각 표 혼동(45°)' },
          { text: '√3', distractorType: 'CALC_ERROR', rationale: '분모(|u|·|v|) 누락' },
        ],
      },
    ],
  },

  // ------------------------------------------------------------ 5 ------
  {
    source: '교육청 학평 18번',
    steps: [
      {
        stepIndex: 1, stepType: 'CONCEPT',
        prompt: '∫ 2x √(x²+1) dx 의 핵심 적분 기법은?',
        choices: [
          { text: '치환적분: t = x²+1', isCorrect: true },
          { text: '부분적분', distractorType: 'CONCEPT_CONFUSION', rationale: '치환과 부분적분 혼동' },
          { text: '곱의 적분 = 적분의 곱', distractorType: 'CONCEPT_CONFUSION', rationale: '∫(2x)dx · ∫√(x²+1)dx 분리 시도' },
          { text: '부분분수 분해', distractorType: 'TIME_PRESSURE_GUESS', rationale: '분수가 아닌데 시도' },
          { text: '맥클로린 급수 전개', distractorType: 'TIME_PRESSURE_GUESS', rationale: '범위 외 기법 혼입' },
        ],
      },
      {
        stepIndex: 2, stepType: 'PROCESS',
        prompt: 't = x²+1로 치환하면 dt와 적분식은?',
        choices: [
          { text: 'dt = 2x dx → ∫ √t dt', isCorrect: true },
          { text: 'dt = x dx → ∫ √t dt', distractorType: 'CALC_ERROR', rationale: 't 미분 시 계수 2 누락' },
          { text: 'dt = (x²+1) dx → ∫ √t / (x²+1) dt', distractorType: 'CONCEPT_CONFUSION', rationale: 't 자체를 dt로 혼동' },
          { text: 'dt = 2x → ∫ t^(1/2) (dx 누락)', distractorType: 'PROCESS_SKIP', rationale: 'dx 처리 누락 — 자주 발생' },
          { text: 'dt = 2 dx → ∫ x √t dt', distractorType: 'CALC_ERROR', rationale: 'd/dx(x²+1)을 2로 잘못 미분' },
        ],
      },
      {
        stepIndex: 3, stepType: 'ANSWER',
        prompt: '∫ √t dt 를 계산하고 t를 다시 치환하면?',
        choices: [
          { text: '(2/3)(x²+1)^(3/2) + C', isCorrect: true },
          { text: '(2/3) t^(3/2) + C', distractorType: 'PROCESS_SKIP', rationale: 't를 x로 다시 치환하지 않음' },
          { text: '(1/2)(x²+1)² + C', distractorType: 'CALC_ERROR', rationale: '√를 1제곱으로 잘못 처리' },
          { text: '(3/2)(x²+1)^(3/2) + C', distractorType: 'CALC_ERROR', rationale: '계수 2/3과 3/2 혼동' },
          { text: '(2/3)(x²+1)^(1/2) + C', distractorType: 'CALC_ERROR', rationale: '지수 ½ 처리 — +1 누락' },
        ],
      },
    ],
  },

  // ------------------------------------------------------------ 6 ------
  {
    source: '수능기출 2023 22번',
    steps: [
      {
        stepIndex: 1, stepType: 'CONCEPT',
        prompt: '구분구적법으로 ∫₀¹ x² dx를 정의에 따라 구할 때 핵심 아이디어는?',
        choices: [
          { text: '구간 [0,1]을 n등분 → 직사각형 면적의 합 → n→∞ 극한', isCorrect: true },
          { text: '미분의 역연산만 적용 (FTC 결과만 사용)', distractorType: 'PROCESS_SKIP', rationale: '"정의에 따라" 조건 무시' },
          { text: 'x²의 도함수를 적분 (역방향)', distractorType: 'CONCEPT_CONFUSION', rationale: '구분구적법과 미적분 기본정리 혼동' },
          { text: '사다리꼴 공식 (수치근사)', distractorType: 'CONCEPT_CONFUSION', rationale: '근사법 — 정의 적용과 다름' },
          { text: 'x = (0+1)/2 = 0.5의 함숫값으로 추정', distractorType: 'TIME_PRESSURE_GUESS', rationale: '평균값으로 단순 추정' },
        ],
      },
      {
        stepIndex: 2, stepType: 'PROCESS',
        prompt: 'k번째 구간 대표값을 k/n으로 잡으면 합 식은?',
        choices: [
          { text: 'lim[n→∞] Σ[k=1→n] (k/n)² · (1/n)', isCorrect: true },
          { text: 'lim Σ (k/n) · (1/n)', distractorType: 'PROCESS_SKIP', rationale: '제곱(²) 누락 — 적분 대상이 x²' },
          { text: 'lim Σ k² · (1/n)', distractorType: 'PROCESS_SKIP', rationale: '대표값 분모 n 누락' },
          { text: 'lim Σ (k²/n³)', distractorType: 'CALC_ERROR', rationale: 'Σ 기호와 (1/n) 결합 표기 혼동' },
          { text: 'lim k²/n³', distractorType: 'CONCEPT_CONFUSION', rationale: 'Σ 자체 누락' },
        ],
      },
      {
        stepIndex: 3, stepType: 'ANSWER',
        prompt: 'Σk² = n(n+1)(2n+1)/6 공식을 적용해 극한값을 구하면?',
        choices: [
          { text: '1/3', isCorrect: true },
          { text: '1/2', distractorType: 'CALC_ERROR', rationale: 'Σk = n(n+1)/2를 잘못 사용' },
          { text: '1/6', distractorType: 'PROCESS_SKIP', rationale: 'lim 단계 누락 — n³ 분자만 평가' },
          { text: '2/3', distractorType: 'CALC_ERROR', rationale: '2·n³/n³ → 2/3 잘못 계산' },
          { text: '1', distractorType: 'CONCEPT_CONFUSION', rationale: '피적분함수를 1로 오인 (단위 면적)' },
        ],
      },
    ],
  },

  // ------------------------------------------------------------ 7 ------
  {
    source: '2024 6월 모의평가 21번',
    steps: [
      {
        stepIndex: 1, stepType: 'CONCEPT',
        prompt: 'log_2 A ≥ 0 의 동치 조건은? (A는 로그 정의역 내)',
        choices: [
          { text: 'A ≥ 1 (밑 2 > 1이므로 log_2 1 = 0)', isCorrect: true },
          { text: 'A ≥ 0', distractorType: 'CONCEPT_CONFUSION', rationale: '로그 정의역과 log값 조건을 혼동' },
          { text: 'A > 0', distractorType: 'CONCEPT_CONFUSION', rationale: '정의역만 적용 — log값 조건 누락' },
          { text: 'A ≤ 1', distractorType: 'CONCEPT_CONFUSION', rationale: '부등식 방향 역전 (밑 < 1 경우와 혼동)' },
          { text: 'A = 1', distractorType: 'PROCESS_SKIP', rationale: '등호만 성립 — 부등식 무시' },
        ],
      },
      {
        stepIndex: 2, stepType: 'PROCESS',
        prompt: 'x²-x-6 ≥ 1 (그리고 x²-x-6 > 0)을 정리하면?',
        choices: [
          { text: 'x²-x-7 ≥ 0', isCorrect: true },
          { text: '(x-3)(x+2) ≥ 0  (= x²-x-6 ≥ 0)', distractorType: 'PROCESS_SKIP', rationale: '"≥ 1" 조건을 "≥ 0"으로 잘못 변환' },
          { text: 'x²-x-6 ≥ 0 그대로 사용', distractorType: 'PROCESS_SKIP', rationale: '1을 빼지 않고 진행' },
          { text: 'x² - x ≥ 7', distractorType: 'CALC_ERROR', rationale: '이항 시 부호 처리 실수' },
          { text: '(x-7)(x+1) ≥ 0', distractorType: 'CALC_ERROR', rationale: '잘못된 인수분해' },
        ],
      },
      {
        stepIndex: 3, stepType: 'ANSWER',
        prompt: '부등식의 해 (정의역과 교집합)는?',
        choices: [
          { text: 'x ≤ -2 또는 x ≥ 4 (근사 형태로 정리)', isCorrect: true },
          { text: '-2 ≤ x ≤ 4', distractorType: 'CONCEPT_CONFUSION', rationale: '이차부등식 외부/내부 혼동' },
          { text: 'x ≥ 4 (한쪽만)', distractorType: 'PROCESS_SKIP', rationale: '두 근 중 하나만 답으로 채택' },
          { text: 'x ≤ -3 또는 x ≥ 3', distractorType: 'CALC_ERROR', rationale: '인수분해 후 근 추출 실수' },
          { text: '모든 실수', distractorType: 'TIME_PRESSURE_GUESS', rationale: '판별식만 보고 항상 성립으로 추측' },
        ],
      },
    ],
  },
];

// =============== 중1 과정 — 20문제 × 3단계 객관식 (데모용) ===============
// 각 단계는 1정답 + 4매력적 오답 (실수 패턴 분류 포함).
const SPEC_M1: ProblemStepsSpec[] = [
  // ---- 정수와 유리수 (5) ----
  {
    source: '중1 · 정수와 유리수 1',
    steps: [
      { stepIndex: 1, stepType: 'CONCEPT', prompt: '부호가 다른 두 수의 합을 구하는 규칙은?', choices: [
        { text: '절댓값이 큰 쪽의 부호를 따르고, (큰 절댓값) − (작은 절댓값)', isCorrect: true },
        { text: '두 수의 절댓값을 모두 더한다', distractorType: 'CONCEPT_CONFUSION', rationale: '같은 부호 합 규칙과 혼동' },
        { text: '두 수의 절댓값을 곱한다', distractorType: 'CONCEPT_CONFUSION', rationale: '곱셈 규칙으로 착각' },
        { text: '항상 음수 부호를 따른다', distractorType: 'PROCESS_SKIP', rationale: '큰 절댓값 부호 규칙 누락' },
        { text: '두 수를 그대로 쓴다', distractorType: 'TIME_PRESSURE_GUESS', rationale: '계산 없이 추측' },
      ]},
      { stepIndex: 2, stepType: 'PROCESS', prompt: '|−3| = 3, |+7| = 7 이므로 결과의 부호와 절댓값은?', choices: [
        { text: '부호 +, 절댓값 7 − 3 = 4', isCorrect: true },
        { text: '부호 −, 절댓값 7 + 3 = 10', distractorType: 'CONCEPT_CONFUSION', rationale: '같은 부호 합으로 처리' },
        { text: '부호 +, 절댓값 7 + 3 = 10', distractorType: 'PROCESS_SKIP', rationale: '뺄셈 단계 누락' },
        { text: '부호 −, 절댓값 7 − 3 = 4', distractorType: 'CALC_ERROR', rationale: '큰 절댓값 부호 반대로 적용' },
        { text: '부호 +, 절댓값 3 − 7 = −4', distractorType: 'CALC_ERROR', rationale: '뺄셈 순서 뒤바꿈' },
      ]},
      { stepIndex: 3, stepType: 'ANSWER', prompt: '최종 값은?', choices: [
        { text: '4', isCorrect: true },
        { text: '−4', distractorType: 'CALC_ERROR', rationale: '부호 결정 실수' },
        { text: '10', distractorType: 'CONCEPT_CONFUSION', rationale: '동부호 합 규칙 적용' },
        { text: '−10', distractorType: 'CONCEPT_CONFUSION', rationale: '동부호 합 + 음수 부호' },
        { text: '−21', distractorType: 'TIME_PRESSURE_GUESS', rationale: '곱셈 결과로 추측' },
      ]},
    ],
  },
  {
    source: '중1 · 정수와 유리수 2',
    steps: [
      { stepIndex: 1, stepType: 'CONCEPT', prompt: '음수의 뺄셈을 처리하는 방법은?', choices: [
        { text: '빼는 음수를 양수로 바꿔 더한다 (a − (−b) = a + b)', isCorrect: true },
        { text: '두 음수를 그대로 더한다', distractorType: 'CONCEPT_CONFUSION', rationale: '부호 변환 단계 미인지' },
        { text: '절댓값을 비교해 큰 쪽 부호를 따른다', distractorType: 'CONCEPT_CONFUSION', rationale: '뺄셈을 합으로 잘못 분류' },
        { text: '항상 음수가 된다', distractorType: 'PROCESS_SKIP', rationale: '구체적 변환 규칙 무시' },
        { text: '곱셈으로 변환한다', distractorType: 'TIME_PRESSURE_GUESS', rationale: '연산 종류 혼동' },
      ]},
      { stepIndex: 2, stepType: 'PROCESS', prompt: '−5 − (−8) 을 부호 변환해 정리한 식은?', choices: [
        { text: '−5 + 8', isCorrect: true },
        { text: '−5 − 8', distractorType: 'PROCESS_SKIP', rationale: '부호 변환을 적용하지 않음' },
        { text: '5 + 8', distractorType: 'CALC_ERROR', rationale: '−5 의 부호도 함께 바꿈' },
        { text: '5 − 8', distractorType: 'CALC_ERROR', rationale: '두 항 모두 부호 반전' },
        { text: '−5 × 8', distractorType: 'CONCEPT_CONFUSION', rationale: '연산을 곱셈으로 변경' },
      ]},
      { stepIndex: 3, stepType: 'ANSWER', prompt: '계산 결과는?', choices: [
        { text: '3', isCorrect: true },
        { text: '−13', distractorType: 'PROCESS_SKIP', rationale: '부호 변환 누락 시 결과' },
        { text: '13', distractorType: 'CALC_ERROR', rationale: '−5 의 부호도 함께 바꾼 결과' },
        { text: '−3', distractorType: 'CALC_ERROR', rationale: '뺄셈 순서 반대 처리' },
        { text: '40', distractorType: 'CONCEPT_CONFUSION', rationale: '곱셈으로 처리' },
      ]},
    ],
  },
  {
    source: '중1 · 정수와 유리수 3',
    steps: [
      { stepIndex: 1, stepType: 'CONCEPT', prompt: '여러 수의 곱에서 부호를 결정하는 규칙은?', choices: [
        { text: '음수 인수의 개수가 짝수면 +, 홀수면 −', isCorrect: true },
        { text: '음수 인수가 하나라도 있으면 항상 −', distractorType: 'CONCEPT_CONFUSION', rationale: '두 수 곱 규칙을 일반화 오류' },
        { text: '항상 양수가 된다', distractorType: 'PROCESS_SKIP', rationale: '부호 결정 자체를 생략' },
        { text: '제일 큰 절댓값의 부호를 따른다', distractorType: 'CONCEPT_CONFUSION', rationale: '덧셈 규칙과 혼동' },
        { text: '제일 마지막 수의 부호를 따른다', distractorType: 'TIME_PRESSURE_GUESS', rationale: '근거 없는 가정' },
      ]},
      { stepIndex: 2, stepType: 'PROCESS', prompt: '(−2) × (+3) × (−4) 의 부호와 절댓값은?', choices: [
        { text: '부호 +, 절댓값 2 × 3 × 4 = 24', isCorrect: true },
        { text: '부호 −, 절댓값 2 × 3 × 4 = 24', distractorType: 'CALC_ERROR', rationale: '음수 개수(2) 처리 오류' },
        { text: '부호 +, 절댓값 2 + 3 + 4 = 9', distractorType: 'CONCEPT_CONFUSION', rationale: '곱셈을 덧셈으로' },
        { text: '부호 −, 절댓값 2 + 3 + 4 = 9', distractorType: 'CONCEPT_CONFUSION', rationale: '연산·부호 모두 오류' },
        { text: '부호 +, 절댓값 2 × 3 − 4 = 2', distractorType: 'CALC_ERROR', rationale: '연산 혼합' },
      ]},
      { stepIndex: 3, stepType: 'ANSWER', prompt: '최종 값은?', choices: [
        { text: '24', isCorrect: true },
        { text: '−24', distractorType: 'CALC_ERROR', rationale: '음수 개수 오인' },
        { text: '9', distractorType: 'CONCEPT_CONFUSION', rationale: '덧셈으로 처리' },
        { text: '−9', distractorType: 'CONCEPT_CONFUSION', rationale: '덧셈 + 음수' },
        { text: '0', distractorType: 'TIME_PRESSURE_GUESS', rationale: '추측' },
      ]},
    ],
  },
  {
    source: '중1 · 정수와 유리수 4',
    steps: [
      { stepIndex: 1, stepType: 'CONCEPT', prompt: '|x| (절댓값) 의 정의는?', choices: [
        { text: '수직선 위에서 0 으로부터의 거리 (항상 0 이상)', isCorrect: true },
        { text: '음수에 −1 을 곱한 값', distractorType: 'CONCEPT_CONFUSION', rationale: '음수 한정 정의 - 양수 설명 누락' },
        { text: '항상 그 수 자체', distractorType: 'PROCESS_SKIP', rationale: '부호 처리 무시' },
        { text: '항상 양수만을 의미', distractorType: 'CONCEPT_CONFUSION', rationale: '0 일 때 0 인 점 누락' },
        { text: '두 수 사이의 거리', distractorType: 'TIME_PRESSURE_GUESS', rationale: '관련 개념 혼동' },
      ]},
      { stepIndex: 2, stepType: 'PROCESS', prompt: '|−7| 과 |+5| 를 각각 구하면?', choices: [
        { text: '|−7| = 7, |+5| = 5', isCorrect: true },
        { text: '|−7| = −7, |+5| = 5', distractorType: 'PROCESS_SKIP', rationale: '음수 처리 누락' },
        { text: '|−7| = 7, |+5| = −5', distractorType: 'CALC_ERROR', rationale: '양수 처리 오류' },
        { text: '|−7| = 0, |+5| = 0', distractorType: 'CONCEPT_CONFUSION', rationale: '항상 0 이라고 잘못 이해' },
        { text: '|−7| = 49, |+5| = 25', distractorType: 'CONCEPT_CONFUSION', rationale: '제곱과 혼동' },
      ]},
      { stepIndex: 3, stepType: 'ANSWER', prompt: '7 + 5 = ?', choices: [
        { text: '12', isCorrect: true },
        { text: '−12', distractorType: 'CALC_ERROR', rationale: '부호 처리 실수' },
        { text: '2', distractorType: 'CONCEPT_CONFUSION', rationale: '뺄셈으로 처리' },
        { text: '35', distractorType: 'CONCEPT_CONFUSION', rationale: '곱셈으로 처리' },
        { text: '0', distractorType: 'TIME_PRESSURE_GUESS', rationale: '추측' },
      ]},
    ],
  },
  {
    source: '중1 · 정수와 유리수 5',
    steps: [
      { stepIndex: 1, stepType: 'CONCEPT', prompt: '소수를 분수로 변환하는 방법은?', choices: [
        { text: '소수점 아래 자릿수 만큼 10ⁿ 을 분모로 쓰고 약분', isCorrect: true },
        { text: '소수를 100 으로 나누어 분수로 표현', distractorType: 'CONCEPT_CONFUSION', rationale: '자릿수 무시' },
        { text: '소수 그대로 분자에, 1 을 분모에 둔다', distractorType: 'PROCESS_SKIP', rationale: '소수점 처리 단계 누락' },
        { text: '소수에 2 를 곱한 값을 분자에 둔다', distractorType: 'TIME_PRESSURE_GUESS', rationale: '근거 없는 변환' },
        { text: '항상 1/2 로 표현된다', distractorType: 'TIME_PRESSURE_GUESS', rationale: '추측' },
      ]},
      { stepIndex: 2, stepType: 'PROCESS', prompt: '0.4 를 분수 형태로 쓰면?', choices: [
        { text: '4/10', isCorrect: true },
        { text: '0.4/1', distractorType: 'PROCESS_SKIP', rationale: '소수점 처리 단계 누락' },
        { text: '4/100', distractorType: 'CALC_ERROR', rationale: '자릿수 잘못 적용' },
        { text: '40/10', distractorType: 'CALC_ERROR', rationale: '분자에 0 추가' },
        { text: '4/1', distractorType: 'TIME_PRESSURE_GUESS', rationale: '근거 없는 단순화' },
      ]},
      { stepIndex: 3, stepType: 'ANSWER', prompt: '약분한 기약분수는?', choices: [
        { text: '2/5', isCorrect: true },
        { text: '4/10', distractorType: 'PROCESS_SKIP', rationale: '약분 단계 누락' },
        { text: '1/2', distractorType: 'CALC_ERROR', rationale: '약분 시 분자·분모 모두 2 로 나눠 분자만 1' },
        { text: '4/5', distractorType: 'CALC_ERROR', rationale: '분자만 2배 처리' },
        { text: '5/2', distractorType: 'CALC_ERROR', rationale: '분자·분모 뒤바뀜' },
      ]},
    ],
  },

  // ---- 문자와 식 (4) ----
  {
    source: '중1 · 문자와 식 1',
    steps: [
      { stepIndex: 1, stepType: 'CONCEPT', prompt: '"x 의 5배" 를 식으로 쓰면?', choices: [
        { text: '5x', isCorrect: true },
        { text: 'x + 5', distractorType: 'CONCEPT_CONFUSION', rationale: '곱셈을 덧셈으로' },
        { text: 'x⁵', distractorType: 'CONCEPT_CONFUSION', rationale: '곱셈을 거듭제곱으로' },
        { text: 'x/5', distractorType: 'CONCEPT_CONFUSION', rationale: '곱셈을 나눗셈으로' },
        { text: '5 − x', distractorType: 'TIME_PRESSURE_GUESS', rationale: '연산 자체 혼동' },
      ]},
      { stepIndex: 2, stepType: 'PROCESS', prompt: '거기에 "3을 더한다" 를 반영하면?', choices: [
        { text: '5x + 3', isCorrect: true },
        { text: '5(x + 3)', distractorType: 'CALC_ERROR', rationale: '괄호 위치 오류 (분배 결과 다름)' },
        { text: '5x · 3', distractorType: 'CONCEPT_CONFUSION', rationale: '덧셈을 곱셈으로' },
        { text: '5x − 3', distractorType: 'CALC_ERROR', rationale: '부호 실수' },
        { text: 'x³ + 5', distractorType: 'TIME_PRESSURE_GUESS', rationale: '연산 혼합' },
      ]},
      { stepIndex: 3, stepType: 'ANSWER', prompt: '최종 식은?', choices: [
        { text: '5x + 3', isCorrect: true },
        { text: '3x + 5', distractorType: 'CALC_ERROR', rationale: '계수와 상수항 위치 바꿈' },
        { text: '5(x + 3)', distractorType: 'CALC_ERROR', rationale: '괄호 잘못 묶음' },
        { text: '5x − 3', distractorType: 'CALC_ERROR', rationale: '부호 오류' },
        { text: '15x', distractorType: 'CONCEPT_CONFUSION', rationale: '5 × 3 을 합쳐 곱셈' },
      ]},
    ],
  },
  {
    source: '중1 · 문자와 식 2',
    steps: [
      { stepIndex: 1, stepType: 'CONCEPT', prompt: '동류항을 정리한다는 것은?', choices: [
        { text: '같은 문자(차수)인 항끼리 계수를 더하거나 뺀다', isCorrect: true },
        { text: '문자가 다른 항도 함께 계산한다', distractorType: 'CONCEPT_CONFUSION', rationale: '동류항 정의 오해' },
        { text: '모든 항을 곱셈으로 정리한다', distractorType: 'CONCEPT_CONFUSION', rationale: '곱셈으로 잘못 분류' },
        { text: '계수를 무시하고 문자만 더한다', distractorType: 'PROCESS_SKIP', rationale: '계수 처리 누락' },
        { text: '항상 0 이 된다', distractorType: 'TIME_PRESSURE_GUESS', rationale: '근거 없음' },
      ]},
      { stepIndex: 2, stepType: 'PROCESS', prompt: '3a + 2b − a + 5b 에서 a 항과 b 항을 각각 모은 식은?', choices: [
        { text: '(3 − 1)a + (2 + 5)b', isCorrect: true },
        { text: '(3 + 1)a + (2 + 5)b', distractorType: 'CALC_ERROR', rationale: '−a 부호 처리 실수' },
        { text: '(3 − 1)a + (2 − 5)b', distractorType: 'CALC_ERROR', rationale: 'b 항 부호 오해' },
        { text: '(3 × 1)a + (2 × 5)b', distractorType: 'CONCEPT_CONFUSION', rationale: '계수를 곱으로 처리' },
        { text: '(3 + 2)ab + (1 + 5)ab', distractorType: 'CONCEPT_CONFUSION', rationale: '동류항 분류 자체 오류' },
      ]},
      { stepIndex: 3, stepType: 'ANSWER', prompt: '간단히 한 결과는?', choices: [
        { text: '2a + 7b', isCorrect: true },
        { text: '4a + 7b', distractorType: 'CALC_ERROR', rationale: '−a 를 +a 로 처리' },
        { text: '2a − 3b', distractorType: 'CALC_ERROR', rationale: 'b 항 부호 오류' },
        { text: '9ab', distractorType: 'CONCEPT_CONFUSION', rationale: '동류항 분류 오류' },
        { text: '5a + 5b', distractorType: 'TIME_PRESSURE_GUESS', rationale: '계수 추측' },
      ]},
    ],
  },
  {
    source: '중1 · 문자와 식 3',
    steps: [
      { stepIndex: 1, stepType: 'CONCEPT', prompt: '식의 값을 구할 때 가장 먼저 할 일은?', choices: [
        { text: 'x 자리에 −2 를 그대로 대입', isCorrect: true },
        { text: 'x 를 무시하고 상수만 계산', distractorType: 'PROCESS_SKIP', rationale: '대입 단계 누락' },
        { text: '식의 부호를 모두 반전', distractorType: 'CONCEPT_CONFUSION', rationale: '근거 없는 부호 변환' },
        { text: '제곱부터 제거하고 시작', distractorType: 'PROCESS_SKIP', rationale: '연산 순서 위반' },
        { text: '항상 0 으로 두고 계산', distractorType: 'TIME_PRESSURE_GUESS', rationale: '추측' },
      ]},
      { stepIndex: 2, stepType: 'PROCESS', prompt: '3 · (−2)² − 5 의 거듭제곱 단계 계산은?', choices: [
        { text: '(−2)² = 4 → 3 · 4 − 5', isCorrect: true },
        { text: '(−2)² = −4 → 3 · (−4) − 5', distractorType: 'CALC_ERROR', rationale: '제곱 부호 오류' },
        { text: '(−2)² = 2 → 3 · 2 − 5', distractorType: 'CALC_ERROR', rationale: '제곱을 절댓값으로 처리' },
        { text: '−2² = −4 → 3 · (−4) − 5', distractorType: 'CONCEPT_CONFUSION', rationale: '괄호 없는 −2² 와 혼동' },
        { text: '(−2)² = 0', distractorType: 'TIME_PRESSURE_GUESS', rationale: '추측' },
      ]},
      { stepIndex: 3, stepType: 'ANSWER', prompt: '최종 값은?', choices: [
        { text: '7', isCorrect: true },
        { text: '−17', distractorType: 'CALC_ERROR', rationale: '제곱 부호 오류 결과' },
        { text: '1', distractorType: 'CALC_ERROR', rationale: '제곱을 |−2| 로 처리한 결과' },
        { text: '−7', distractorType: 'CALC_ERROR', rationale: '최종 부호 실수' },
        { text: '13', distractorType: 'TIME_PRESSURE_GUESS', rationale: '근거 없는 추측' },
      ]},
    ],
  },
  {
    source: '중1 · 문자와 식 4',
    steps: [
      { stepIndex: 1, stepType: 'CONCEPT', prompt: '괄호 앞 음수 부호 처리 규칙은?', choices: [
        { text: '괄호 안의 모든 항에 부호를 분배 (분배법칙)', isCorrect: true },
        { text: '괄호 앞의 음수만 적용하고 안의 부호는 그대로', distractorType: 'PROCESS_SKIP', rationale: '분배 누락' },
        { text: '곱셈만 분배하고 부호는 그대로', distractorType: 'CONCEPT_CONFUSION', rationale: '부호와 계수 분리 실수' },
        { text: '괄호 안의 첫 항에만 적용', distractorType: 'PROCESS_SKIP', rationale: '일부만 분배' },
        { text: '괄호를 그대로 둔다', distractorType: 'TIME_PRESSURE_GUESS', rationale: '연산 회피' },
      ]},
      { stepIndex: 2, stepType: 'PROCESS', prompt: '−2(3x − 5) + 4x 에 분배법칙을 적용한 식은?', choices: [
        { text: '−6x + 10 + 4x', isCorrect: true },
        { text: '−6x − 10 + 4x', distractorType: 'CALC_ERROR', rationale: '음수 × 음수 부호 처리 실수' },
        { text: '−6x + 5 + 4x', distractorType: 'CALC_ERROR', rationale: '-2 × -5 = 10 단계 누락' },
        { text: '6x + 10 + 4x', distractorType: 'CALC_ERROR', rationale: '계수 부호 실수' },
        { text: '−2(3x − 5 + 4x)', distractorType: 'PROCESS_SKIP', rationale: '분배 안 함' },
      ]},
      { stepIndex: 3, stepType: 'ANSWER', prompt: '동류항 정리한 결과는?', choices: [
        { text: '−2x + 10', isCorrect: true },
        { text: '−10x + 10', distractorType: 'CALC_ERROR', rationale: '−6x + 4x 동류항 합산 오류' },
        { text: '−2x − 10', distractorType: 'CALC_ERROR', rationale: '상수항 부호 오류' },
        { text: '2x + 10', distractorType: 'CALC_ERROR', rationale: 'x 계수 부호 실수' },
        { text: '−6x + 10', distractorType: 'PROCESS_SKIP', rationale: '4x 추가 안 함' },
      ]},
    ],
  },

  // ---- 일차방정식 (7) ----
  {
    source: '중1 · 일차방정식 1',
    steps: [
      { stepIndex: 1, stepType: 'CONCEPT', prompt: '일차방정식을 풀 때 먼저 사용할 원리는?', choices: [
        { text: '상수항을 우변으로 이항해 미지수 항만 좌변에 둔다', isCorrect: true },
        { text: '미지수에 임의 값을 대입해 본다', distractorType: 'CONCEPT_CONFUSION', rationale: '대입법 시도' },
        { text: '식 전체를 곱셈으로 변환한다', distractorType: 'CONCEPT_CONFUSION', rationale: '연산 종류 오인' },
        { text: '두 변에 같은 수를 곱해 분모를 없앤다', distractorType: 'PROCESS_SKIP', rationale: '분수가 없는데 적용' },
        { text: '결정 없이 추측', distractorType: 'TIME_PRESSURE_GUESS', rationale: '근거 없음' },
      ]},
      { stepIndex: 2, stepType: 'PROCESS', prompt: '3x − 7 = 11 에서 −7 을 이항해 정리한 식은?', choices: [
        { text: '3x = 18', isCorrect: true },
        { text: '3x = 4', distractorType: 'CALC_ERROR', rationale: '11 − 7 로 잘못 계산' },
        { text: '3x = −18', distractorType: 'CALC_ERROR', rationale: '이항 시 부호 처리 실수' },
        { text: 'x = 4', distractorType: 'PROCESS_SKIP', rationale: '계수 3 처리 단계 건너뜀' },
        { text: '3x − 7 = 11 그대로', distractorType: 'TIME_PRESSURE_GUESS', rationale: '이항하지 않음' },
      ]},
      { stepIndex: 3, stepType: 'ANSWER', prompt: 'x 의 값은?', choices: [
        { text: '6', isCorrect: true },
        { text: '−6', distractorType: 'CALC_ERROR', rationale: '부호 실수' },
        { text: '18', distractorType: 'PROCESS_SKIP', rationale: '계수 3 으로 나누기 단계 누락' },
        { text: '3', distractorType: 'CALC_ERROR', rationale: '18 ÷ 6 으로 잘못 나눔' },
        { text: '54', distractorType: 'CONCEPT_CONFUSION', rationale: '나눠야 할 곳에서 곱함' },
      ]},
    ],
  },
  {
    source: '중1 · 일차방정식 2',
    steps: [
      { stepIndex: 1, stepType: 'CONCEPT', prompt: '괄호가 있는 일차방정식 풀이의 첫 단계는?', choices: [
        { text: '분배법칙으로 괄호를 푼다', isCorrect: true },
        { text: '먼저 양변을 제곱한다', distractorType: 'CONCEPT_CONFUSION', rationale: '관련 없는 변환' },
        { text: '괄호를 그대로 두고 이항한다', distractorType: 'PROCESS_SKIP', rationale: '괄호 처리 단계 누락' },
        { text: '괄호 앞 계수를 무시한다', distractorType: 'PROCESS_SKIP', rationale: '계수 처리 누락' },
        { text: '두 변의 차를 구한다', distractorType: 'TIME_PRESSURE_GUESS', rationale: '근거 없음' },
      ]},
      { stepIndex: 2, stepType: 'PROCESS', prompt: '2(x + 4) = 5x − 1 에서 분배법칙 적용 + 이항으로 정리한 식은?', choices: [
        { text: '−3x = −9', isCorrect: true },
        { text: '−3x = 9', distractorType: 'CALC_ERROR', rationale: '상수항 이항 시 부호 오류' },
        { text: '3x = −9', distractorType: 'CALC_ERROR', rationale: 'x 항 이항 시 부호 오류' },
        { text: '7x = 9', distractorType: 'CALC_ERROR', rationale: '동류항 정리 오류 (2x + 5x)' },
        { text: '2x + 8 = 5x − 1 그대로', distractorType: 'PROCESS_SKIP', rationale: '이항 단계 누락' },
      ]},
      { stepIndex: 3, stepType: 'ANSWER', prompt: 'x 의 값은?', choices: [
        { text: '3', isCorrect: true },
        { text: '−3', distractorType: 'CALC_ERROR', rationale: '부호 처리 오류' },
        { text: '9', distractorType: 'PROCESS_SKIP', rationale: '계수 −3 으로 나누지 않음' },
        { text: '1/3', distractorType: 'CALC_ERROR', rationale: '나눗셈 분자·분모 뒤바꿈' },
        { text: '0', distractorType: 'TIME_PRESSURE_GUESS', rationale: '추측' },
      ]},
    ],
  },
  {
    source: '중1 · 일차방정식 3',
    steps: [
      { stepIndex: 1, stepType: 'CONCEPT', prompt: '미지수 계수가 음수일 때 가장 깔끔한 처리는?', choices: [
        { text: '상수항을 우변으로 이항한 뒤, 양변을 음수 계수로 나눈다', isCorrect: true },
        { text: '음수 계수를 무시하고 양수처럼 푼다', distractorType: 'PROCESS_SKIP', rationale: '부호 무시' },
        { text: '항상 양변에 −1 을 곱한 뒤 시작한다', distractorType: 'CONCEPT_CONFUSION', rationale: '필수 단계로 잘못 외움' },
        { text: '양변을 제곱해 부호를 없앤다', distractorType: 'CONCEPT_CONFUSION', rationale: '잘못된 변환' },
        { text: '근거 없이 추측', distractorType: 'TIME_PRESSURE_GUESS', rationale: '추측' },
      ]},
      { stepIndex: 2, stepType: 'PROCESS', prompt: '−3x + 5 = 14 에서 5 를 이항한 식은?', choices: [
        { text: '−3x = 9', isCorrect: true },
        { text: '−3x = 19', distractorType: 'CALC_ERROR', rationale: '이항 시 부호를 그대로 둠' },
        { text: '3x = 9', distractorType: 'CALC_ERROR', rationale: '−3x 의 부호도 함께 바꿈' },
        { text: '−3x = −9', distractorType: 'CALC_ERROR', rationale: '우변 부호 실수' },
        { text: '−3x + 5 = 14 그대로', distractorType: 'PROCESS_SKIP', rationale: '이항 단계 안 함' },
      ]},
      { stepIndex: 3, stepType: 'ANSWER', prompt: 'x 의 값은?', choices: [
        { text: '−3', isCorrect: true },
        { text: '3', distractorType: 'CALC_ERROR', rationale: '음수 계수 처리 실수' },
        { text: '9', distractorType: 'PROCESS_SKIP', rationale: '계수 −3 으로 나누지 않음' },
        { text: '−9', distractorType: 'CALC_ERROR', rationale: '나눗셈 단계 부호' },
        { text: '0', distractorType: 'TIME_PRESSURE_GUESS', rationale: '추측' },
      ]},
    ],
  },
  {
    source: '중1 · 일차방정식 4',
    steps: [
      { stepIndex: 1, stepType: 'CONCEPT', prompt: '분수 계수 일차방정식을 풀 때 효율적인 첫 단계는?', choices: [
        { text: '양변에 분모의 최소공배수를 곱해 분수를 없앤다', isCorrect: true },
        { text: '분수를 그대로 두고 이항만 한다', distractorType: 'PROCESS_SKIP', rationale: '분수 처리 단계 누락' },
        { text: '분수 부분을 무시한다', distractorType: 'PROCESS_SKIP', rationale: '항 누락' },
        { text: '두 변을 곱셈해 본다', distractorType: 'TIME_PRESSURE_GUESS', rationale: '근거 없음' },
        { text: '분자만 더해 정리한다', distractorType: 'CONCEPT_CONFUSION', rationale: '분모 무시' },
      ]},
      { stepIndex: 2, stepType: 'PROCESS', prompt: 'x/2 + 3 = 7 에 양변을 2배 한 식은?', choices: [
        { text: 'x + 6 = 14', isCorrect: true },
        { text: 'x + 3 = 14', distractorType: 'PROCESS_SKIP', rationale: '+3 항에 2배를 곱하지 않음' },
        { text: '2x + 3 = 14', distractorType: 'CALC_ERROR', rationale: 'x/2 처리 실수' },
        { text: 'x + 6 = 7', distractorType: 'PROCESS_SKIP', rationale: '우변에 2배 안 함' },
        { text: '2x + 6 = 14', distractorType: 'CALC_ERROR', rationale: 'x/2 자체에 2 를 곱한 결과' },
      ]},
      { stepIndex: 3, stepType: 'ANSWER', prompt: 'x 의 값은?', choices: [
        { text: '8', isCorrect: true },
        { text: '4', distractorType: 'CALC_ERROR', rationale: '이항 후 나눗셈 단계에서 실수' },
        { text: '14', distractorType: 'PROCESS_SKIP', rationale: '6 이항 안 함' },
        { text: '−8', distractorType: 'CALC_ERROR', rationale: '부호 실수' },
        { text: '20', distractorType: 'CALC_ERROR', rationale: '이항·곱셈 결합 실수' },
      ]},
    ],
  },
  {
    source: '중1 · 일차방정식 5',
    steps: [
      { stepIndex: 1, stepType: 'CONCEPT', prompt: '문장형 문제 풀이의 첫 단계는?', choices: [
        { text: '미지수를 정의하고 등식을 세운다', isCorrect: true },
        { text: '곧바로 답을 추측한다', distractorType: 'TIME_PRESSURE_GUESS', rationale: '식 세우기 누락' },
        { text: '문장 전체를 곱셈식으로 만든다', distractorType: 'CONCEPT_CONFUSION', rationale: '연산 종류 오인' },
        { text: '항상 부등식을 세운다', distractorType: 'CONCEPT_CONFUSION', rationale: '잘못된 식 형태 선택' },
        { text: '문장을 무시한다', distractorType: 'PROCESS_SKIP', rationale: '의미 파악 단계 누락' },
      ]},
      { stepIndex: 2, stepType: 'PROCESS', prompt: '정사각형 둘레 = 변의 길이 × ? 의 식은?', choices: [
        { text: '4x = 24', isCorrect: true },
        { text: '3x = 24', distractorType: 'CONCEPT_CONFUSION', rationale: '삼각형으로 착각' },
        { text: 'x² = 24', distractorType: 'CONCEPT_CONFUSION', rationale: '넓이 공식과 혼동' },
        { text: '2x = 24', distractorType: 'CONCEPT_CONFUSION', rationale: '두 변의 합으로 잘못' },
        { text: 'x + 24 = 4', distractorType: 'TIME_PRESSURE_GUESS', rationale: '식 구조 혼동' },
      ]},
      { stepIndex: 3, stepType: 'ANSWER', prompt: 'x (변의 길이) 의 값은?', choices: [
        { text: '6', isCorrect: true },
        { text: '24', distractorType: 'PROCESS_SKIP', rationale: '4 로 나누는 단계 누락' },
        { text: '8', distractorType: 'CONCEPT_CONFUSION', rationale: '24 ÷ 3 으로 잘못' },
        { text: '12', distractorType: 'CONCEPT_CONFUSION', rationale: '둘레 ÷ 2 = 둘레 절반' },
        { text: '4', distractorType: 'CALC_ERROR', rationale: '나눗셈 분자·분모 뒤바뀜' },
      ]},
    ],
  },
  {
    source: '중1 · 일차방정식 6',
    steps: [
      { stepIndex: 1, stepType: 'CONCEPT', prompt: '연속된 세 자연수를 어떻게 표현하는가?', choices: [
        { text: 'x, x + 1, x + 2', isCorrect: true },
        { text: 'x, 2x, 3x', distractorType: 'CONCEPT_CONFUSION', rationale: '배수와 혼동' },
        { text: 'x, x², x³', distractorType: 'CONCEPT_CONFUSION', rationale: '거듭제곱과 혼동' },
        { text: '1, 2, 3 만 가능', distractorType: 'PROCESS_SKIP', rationale: '일반화 누락' },
        { text: 'x, x + 2, x + 4', distractorType: 'CONCEPT_CONFUSION', rationale: '연속 짝수와 혼동' },
      ]},
      { stepIndex: 2, stepType: 'PROCESS', prompt: '세 수의 합이 39 이므로 식은?', choices: [
        { text: '3x + 3 = 39', isCorrect: true },
        { text: '3x = 39', distractorType: 'PROCESS_SKIP', rationale: '+1, +2 합산 누락' },
        { text: 'x + 3 = 39', distractorType: 'PROCESS_SKIP', rationale: 'x 세 번 등장하는 점 무시' },
        { text: '3x − 3 = 39', distractorType: 'CALC_ERROR', rationale: '+1+2 = +3 부호 오류' },
        { text: 'x³ + 3 = 39', distractorType: 'CONCEPT_CONFUSION', rationale: '거듭제곱과 혼동' },
      ]},
      { stepIndex: 3, stepType: 'ANSWER', prompt: '가장 작은 자연수 (= x) 의 값은?', choices: [
        { text: '12', isCorrect: true },
        { text: '13', distractorType: 'CALC_ERROR', rationale: '식의 +3 처리 실수' },
        { text: '14', distractorType: 'CALC_ERROR', rationale: '중간값을 가장 작은 값으로 착각' },
        { text: '11', distractorType: 'CALC_ERROR', rationale: '나눗셈 실수' },
        { text: '13.5', distractorType: 'CALC_ERROR', rationale: '나눗셈 자릿수 오류' },
      ]},
    ],
  },
  {
    source: '중1 · 일차방정식 7',
    steps: [
      { stepIndex: 1, stepType: 'CONCEPT', prompt: '비례식 a : b = c : d 의 성립 조건은?', choices: [
        { text: '내항의 곱과 외항의 곱이 같다 (b · c = a · d)', isCorrect: true },
        { text: '항상 a + b = c + d', distractorType: 'CONCEPT_CONFUSION', rationale: '덧셈 규칙으로 착각' },
        { text: 'a = c 이면 항상 성립', distractorType: 'PROCESS_SKIP', rationale: '특수 조건만 사용' },
        { text: '비례식은 일반 등식과 같다', distractorType: 'CONCEPT_CONFUSION', rationale: '구조 차이 무시' },
        { text: '두 비의 분자가 같으면 성립', distractorType: 'CONCEPT_CONFUSION', rationale: '잘못된 규칙' },
      ]},
      { stepIndex: 2, stepType: 'PROCESS', prompt: '3 : 5 = x : 20 에서 외항·내항을 곱한 식은?', choices: [
        { text: '5 · x = 3 · 20', isCorrect: true },
        { text: '3 · x = 5 · 20', distractorType: 'CALC_ERROR', rationale: '내항·외항 위치 혼동' },
        { text: '3 + x = 5 + 20', distractorType: 'CONCEPT_CONFUSION', rationale: '덧셈으로 처리' },
        { text: '3 · 5 = x · 20', distractorType: 'CALC_ERROR', rationale: '곱셈 짝 오류' },
        { text: 'x = 3 + 5 + 20', distractorType: 'TIME_PRESSURE_GUESS', rationale: '근거 없는 식' },
      ]},
      { stepIndex: 3, stepType: 'ANSWER', prompt: 'x 의 값은?', choices: [
        { text: '12', isCorrect: true },
        { text: '60', distractorType: 'PROCESS_SKIP', rationale: '5 로 나누지 않음' },
        { text: '4', distractorType: 'CALC_ERROR', rationale: '나눗셈 자릿수 실수' },
        { text: '15', distractorType: 'CALC_ERROR', rationale: '곱셈 결과 잘못' },
        { text: '20/3', distractorType: 'CALC_ERROR', rationale: '내·외항 위치 오류 결과' },
      ]},
    ],
  },

  // ---- 좌표평면과 그래프 (4) ----
  {
    source: '중1 · 좌표와 그래프 1',
    steps: [
      { stepIndex: 1, stepType: 'CONCEPT', prompt: '사분면 번호와 좌표 부호 관계는?', choices: [
        { text: '제1: (+,+), 제2: (−,+), 제3: (−,−), 제4: (+,−)', isCorrect: true },
        { text: '제1: (−,−), 제2: (+,−), 제3: (+,+), 제4: (−,+)', distractorType: 'CONCEPT_CONFUSION', rationale: '회전 방향 반대로 외움' },
        { text: '제1: (+,−), 제2: (−,−), 제3: (−,+), 제4: (+,+)', distractorType: 'CONCEPT_CONFUSION', rationale: '대각 대칭으로 잘못 외움' },
        { text: '모두 (+,+) 로 통일', distractorType: 'PROCESS_SKIP', rationale: '부호 구분 무시' },
        { text: '음수가 있으면 항상 제3 사분면', distractorType: 'CONCEPT_CONFUSION', rationale: '단순화 오류' },
      ]},
      { stepIndex: 2, stepType: 'PROCESS', prompt: '점 (−3, 2) 의 부호 구성은?', choices: [
        { text: 'x = − , y = +', isCorrect: true },
        { text: 'x = + , y = +', distractorType: 'CALC_ERROR', rationale: '음수 부호 처리 실수' },
        { text: 'x = − , y = −', distractorType: 'CALC_ERROR', rationale: 'y 부호 실수' },
        { text: 'x = + , y = −', distractorType: 'CALC_ERROR', rationale: '두 부호 모두 반전' },
        { text: '둘 다 0', distractorType: 'TIME_PRESSURE_GUESS', rationale: '추측' },
      ]},
      { stepIndex: 3, stepType: 'ANSWER', prompt: '해당 사분면은?', choices: [
        { text: '제2사분면', isCorrect: true },
        { text: '제1사분면', distractorType: 'CALC_ERROR', rationale: '부호 매칭 실수' },
        { text: '제3사분면', distractorType: 'CALC_ERROR', rationale: 'y 부호 무시' },
        { text: '제4사분면', distractorType: 'CALC_ERROR', rationale: '대각 사분면 혼동' },
        { text: 'x축 위', distractorType: 'CONCEPT_CONFUSION', rationale: '0 좌표 가정' },
      ]},
    ],
  },
  {
    source: '중1 · 좌표와 그래프 2',
    steps: [
      { stepIndex: 1, stepType: 'CONCEPT', prompt: 'x축에 대한 대칭이동의 효과는?', choices: [
        { text: 'x 좌표는 그대로, y 좌표의 부호만 반전', isCorrect: true },
        { text: 'y 좌표는 그대로, x 좌표의 부호만 반전', distractorType: 'CONCEPT_CONFUSION', rationale: 'y축 대칭과 혼동' },
        { text: '두 좌표 모두 부호 반전', distractorType: 'CONCEPT_CONFUSION', rationale: '원점 대칭과 혼동' },
        { text: '두 좌표를 서로 교환', distractorType: 'CONCEPT_CONFUSION', rationale: 'y = x 대칭과 혼동' },
        { text: '변하지 않는다', distractorType: 'PROCESS_SKIP', rationale: '연산 자체 누락' },
      ]},
      { stepIndex: 2, stepType: 'PROCESS', prompt: '(4, −1) 에서 y 부호만 반전하면?', choices: [
        { text: '(4, 1)', isCorrect: true },
        { text: '(−4, −1)', distractorType: 'CONCEPT_CONFUSION', rationale: 'y축 대칭으로 처리' },
        { text: '(−4, 1)', distractorType: 'CONCEPT_CONFUSION', rationale: '원점 대칭으로 처리' },
        { text: '(−1, 4)', distractorType: 'CONCEPT_CONFUSION', rationale: 'y = x 대칭으로 처리' },
        { text: '(4, −1)', distractorType: 'PROCESS_SKIP', rationale: '대칭 적용 안 함' },
      ]},
      { stepIndex: 3, stepType: 'ANSWER', prompt: '대칭이동된 점은?', choices: [
        { text: '(4, 1)', isCorrect: true },
        { text: '(−4, 1)', distractorType: 'CONCEPT_CONFUSION', rationale: '원점 대칭으로 처리' },
        { text: '(−4, −1)', distractorType: 'CONCEPT_CONFUSION', rationale: 'y축 대칭으로 처리' },
        { text: '(1, 4)', distractorType: 'CONCEPT_CONFUSION', rationale: 'y = x 대칭으로 처리' },
        { text: '(4, 0)', distractorType: 'CALC_ERROR', rationale: '부호 반전이 아닌 0 으로 보냄' },
      ]},
    ],
  },
  {
    source: '중1 · 좌표와 그래프 3',
    steps: [
      { stepIndex: 1, stepType: 'CONCEPT', prompt: '정비례 관계 y = ax 에서 a (비례상수) 를 구하려면?', choices: [
        { text: 'y / x 를 계산하면 비례상수 a', isCorrect: true },
        { text: 'y − x 가 비례상수 a', distractorType: 'CONCEPT_CONFUSION', rationale: '뺄셈으로 정의' },
        { text: 'y + x 가 비례상수 a', distractorType: 'CONCEPT_CONFUSION', rationale: '덧셈으로 정의' },
        { text: 'x · y 가 비례상수 a', distractorType: 'CONCEPT_CONFUSION', rationale: '반비례 식과 혼동' },
        { text: '항상 a = 1', distractorType: 'TIME_PRESSURE_GUESS', rationale: '근거 없음' },
      ]},
      { stepIndex: 2, stepType: 'PROCESS', prompt: 'x = 4, y = 12 을 대입한 비례상수는?', choices: [
        { text: 'a = 12 / 4 = 3', isCorrect: true },
        { text: 'a = 4 / 12 = 1/3', distractorType: 'CALC_ERROR', rationale: '분자·분모 뒤바뀜' },
        { text: 'a = 12 − 4 = 8', distractorType: 'CONCEPT_CONFUSION', rationale: '뺄셈으로 정의 적용' },
        { text: 'a = 12 + 4 = 16', distractorType: 'CONCEPT_CONFUSION', rationale: '덧셈으로 정의 적용' },
        { text: 'a = 12 · 4 = 48', distractorType: 'CONCEPT_CONFUSION', rationale: '반비례 식 적용' },
      ]},
      { stepIndex: 3, stepType: 'ANSWER', prompt: 'y 를 x 의 식으로 나타내면?', choices: [
        { text: 'y = 3x', isCorrect: true },
        { text: 'y = x/3', distractorType: 'CALC_ERROR', rationale: 'a 분자·분모 뒤바뀐 결과' },
        { text: 'y = 8x', distractorType: 'CONCEPT_CONFUSION', rationale: '뺄셈 결과 사용' },
        { text: 'y = 48/x', distractorType: 'CONCEPT_CONFUSION', rationale: '반비례 형태로 잘못' },
        { text: 'y = x + 3', distractorType: 'CONCEPT_CONFUSION', rationale: '일차식과 혼동' },
      ]},
    ],
  },
  {
    source: '중1 · 좌표와 그래프 4',
    steps: [
      { stepIndex: 1, stepType: 'CONCEPT', prompt: 'y = ax (a < 0) 그래프의 특징은?', choices: [
        { text: '원점을 지나며 좌상-우하 방향(제2·제4 사분면 통과)', isCorrect: true },
        { text: '원점을 지나며 좌하-우상 방향(제1·제3 사분면 통과)', distractorType: 'CONCEPT_CONFUSION', rationale: '양수 기울기 그래프와 혼동' },
        { text: '항상 가로축에 평행', distractorType: 'CONCEPT_CONFUSION', rationale: '상수함수와 혼동' },
        { text: '항상 세로축에 평행', distractorType: 'CONCEPT_CONFUSION', rationale: '직선 방향 오해' },
        { text: '원점에서 출발하지 않는다', distractorType: 'PROCESS_SKIP', rationale: '정비례의 원점 통과 성질 누락' },
      ]},
      { stepIndex: 2, stepType: 'PROCESS', prompt: 'y = −2x 에 x = 1, x = −1 을 대입한 점은?', choices: [
        { text: '(1, −2) 와 (−1, 2)', isCorrect: true },
        { text: '(1, 2) 와 (−1, −2)', distractorType: 'CALC_ERROR', rationale: '음수 계수 처리 실수' },
        { text: '(2, 1) 와 (−2, −1)', distractorType: 'CONCEPT_CONFUSION', rationale: 'x, y 좌표 뒤바꿈' },
        { text: '(0, 0) 한 점', distractorType: 'PROCESS_SKIP', rationale: '대입 단계 단순화' },
        { text: '(−1, −1) 와 (1, 1)', distractorType: 'TIME_PRESSURE_GUESS', rationale: '추측' },
      ]},
      { stepIndex: 3, stepType: 'ANSWER', prompt: '그래프가 지나는 사분면은?', choices: [
        { text: '제2사분면, 제4사분면', isCorrect: true },
        { text: '제1사분면, 제3사분면', distractorType: 'CALC_ERROR', rationale: '기울기 부호 처리 실수' },
        { text: '제1사분면, 제2사분면', distractorType: 'CONCEPT_CONFUSION', rationale: 'x 축 대칭 그래프와 혼동' },
        { text: '제3사분면, 제4사분면', distractorType: 'CONCEPT_CONFUSION', rationale: '아래쪽으로만 감 가정' },
        { text: '제1사분면만', distractorType: 'PROCESS_SKIP', rationale: '한 방향만 고려' },
      ]},
    ],
  },
];

// =============== NCERT Class 8/9/10 — 12문제 (India Phase 1 추가 콘텐츠) ===============
const SPEC_NCERT: ProblemStepsSpec[] = [
  // ---- Class 8 ----
  {
    source: 'Class 8 · Rational Numbers · Q1',
    steps: [
      { stepIndex: 1, stepType: 'CONCEPT', prompt: 'How do you convert a repeating decimal to a fraction?', choices: [
        { text: 'Let x equal the decimal, multiply by 10ⁿ where n = repeating block length, then subtract', isCorrect: true },
        { text: 'Multiply numerator and denominator by 10', distractorType: 'CONCEPT_CONFUSION', rationale: 'Confused with terminating decimals.' },
        { text: 'Use long division to find the next 10 digits', distractorType: 'PROCESS_SKIP', rationale: 'Brute force, not algebraic.' },
        { text: 'Round to 2 decimal places', distractorType: 'CONCEPT_CONFUSION', rationale: 'Loses information; result is rational only by approximation.' },
        { text: 'Repeating decimals cannot be expressed as fractions', distractorType: 'TIME_PRESSURE_GUESS', rationale: 'False — every repeating decimal is rational.' },
      ]},
      { stepIndex: 2, stepType: 'PROCESS', prompt: 'For x = 0.333…, what is 10x − x?', choices: [
        { text: '10x − x = 9x = 3', isCorrect: true },
        { text: '10x − x = 9x = 3.333…', distractorType: 'CALC_ERROR', rationale: 'Forgot the subtraction cancels the repeating tail.' },
        { text: '10x − x = 11x = 3', distractorType: 'CALC_ERROR', rationale: 'Sign or coefficient error.' },
        { text: '10x − x = x', distractorType: 'CONCEPT_CONFUSION', rationale: 'Treats x as if 10x = x.' },
        { text: '10x − x = 0', distractorType: 'TIME_PRESSURE_GUESS', rationale: 'Random guess.' },
      ]},
      { stepIndex: 3, stepType: 'ANSWER', prompt: 'So x equals:', choices: [
        { text: '1/3', isCorrect: true },
        { text: '3/10', distractorType: 'PROCESS_SKIP', rationale: 'Did not subtract — just took 0.3 ≈ 3/10.' },
        { text: '1/9', distractorType: 'CALC_ERROR', rationale: '9x = 1 instead of 9x = 3.' },
        { text: '3/9', distractorType: 'PROCESS_SKIP', rationale: 'Did not reduce to lowest terms.' },
        { text: '0.33', distractorType: 'CONCEPT_CONFUSION', rationale: 'Gave a decimal, not a fraction.' },
      ]},
    ],
  },
  {
    source: 'Class 8 · Algebraic Identities · Q1',
    steps: [
      { stepIndex: 1, stepType: 'CONCEPT', prompt: 'Which identity expands (a + b)²?', choices: [
        { text: '(a + b)² = a² + 2ab + b²', isCorrect: true },
        { text: '(a + b)² = a² + b²', distractorType: 'PROCESS_SKIP', rationale: 'Forgets the middle term 2ab — most common error.' },
        { text: '(a + b)² = a² + ab + b²', distractorType: 'CALC_ERROR', rationale: 'Halved the cross-term coefficient.' },
        { text: '(a + b)² = (a + b)(a − b)', distractorType: 'CONCEPT_CONFUSION', rationale: 'Confused with difference of squares.' },
        { text: '(a + b)² = 2a² + 2b²', distractorType: 'CONCEPT_CONFUSION', rationale: 'Misapplied distributive property.' },
      ]},
      { stepIndex: 2, stepType: 'PROCESS', prompt: 'Substitute a = x, b = 5:', choices: [
        { text: 'x² + 2·x·5 + 5²', isCorrect: true },
        { text: 'x² + 5²', distractorType: 'PROCESS_SKIP', rationale: 'Skipped the cross-term.' },
        { text: 'x² + 5x + 5²', distractorType: 'CALC_ERROR', rationale: 'Cross-term coefficient should be 2·5 = 10, not 5.' },
        { text: '2x² + 5²', distractorType: 'CONCEPT_CONFUSION', rationale: 'Doubled the wrong term.' },
        { text: 'x² · 5²', distractorType: 'CONCEPT_CONFUSION', rationale: 'Replaced + with · between terms.' },
      ]},
      { stepIndex: 3, stepType: 'ANSWER', prompt: 'Simplified result:', choices: [
        { text: 'x² + 10x + 25', isCorrect: true },
        { text: 'x² + 25', distractorType: 'PROCESS_SKIP', rationale: 'Dropped middle term.' },
        { text: 'x² + 5x + 25', distractorType: 'CALC_ERROR', rationale: 'Half coefficient on the cross-term.' },
        { text: 'x² + 10x + 10', distractorType: 'CALC_ERROR', rationale: '5² = 10 instead of 25.' },
        { text: 'x² + 10x', distractorType: 'PROCESS_SKIP', rationale: 'Forgot the constant term.' },
      ]},
    ],
  },
  {
    source: 'Class 8 · Linear Equations · Q1',
    steps: [
      { stepIndex: 1, stepType: 'CONCEPT', prompt: 'First step to solve 2x − 3 = 5x + 9?', choices: [
        { text: 'Move x-terms to one side, constants to the other (transposition flips signs)', isCorrect: true },
        { text: 'Divide both sides by x', distractorType: 'CONCEPT_CONFUSION', rationale: 'Cannot divide by an unknown.' },
        { text: 'Square both sides', distractorType: 'CONCEPT_CONFUSION', rationale: 'Squaring is for radical equations, not linear.' },
        { text: 'Try x = 1 and check', distractorType: 'PROCESS_SKIP', rationale: 'Trial-and-error — slow and unreliable.' },
        { text: 'Multiply both sides by 2', distractorType: 'TIME_PRESSURE_GUESS', rationale: 'No reason to multiply at this stage.' },
      ]},
      { stepIndex: 2, stepType: 'PROCESS', prompt: 'After transposing all x-terms to the left and constants to the right:', choices: [
        { text: '2x − 5x = 9 + 3', isCorrect: true },
        { text: '2x + 5x = 9 + 3', distractorType: 'CALC_ERROR', rationale: 'Sign error when moving 5x.' },
        { text: '2x − 5x = 9 − 3', distractorType: 'CALC_ERROR', rationale: 'Sign error when moving −3.' },
        { text: '2x − 5x = −9 − 3', distractorType: 'CALC_ERROR', rationale: 'Both signs flipped wrongly.' },
        { text: '2x − 3 + 5x + 9 = 0', distractorType: 'PROCESS_SKIP', rationale: 'Did not combine like terms.' },
      ]},
      { stepIndex: 3, stepType: 'ANSWER', prompt: 'Combine and divide:', choices: [
        { text: 'x = -4', isCorrect: true },
        { text: 'x = 4', distractorType: 'CALC_ERROR', rationale: 'Sign of result wrong; division by −3 not handled.' },
        { text: 'x = -12', distractorType: 'PROCESS_SKIP', rationale: 'Forgot to divide by the coefficient.' },
        { text: 'x = 12', distractorType: 'CALC_ERROR', rationale: 'Multiplied instead of divided.' },
        { text: 'x = -3', distractorType: 'TIME_PRESSURE_GUESS', rationale: 'Random guess.' },
      ]},
    ],
  },
  {
    source: 'Class 8 · Graphs · Q1',
    steps: [
      { stepIndex: 1, stepType: 'CONCEPT', prompt: 'Slope of a line between two points?', choices: [
        { text: 'm = (y₂ − y₁) / (x₂ − x₁)', isCorrect: true },
        { text: 'm = (x₂ − x₁) / (y₂ − y₁)', distractorType: 'CONCEPT_CONFUSION', rationale: 'Numerator and denominator swapped.' },
        { text: 'm = y₂ + y₁ / x₂ + x₁', distractorType: 'CONCEPT_CONFUSION', rationale: 'Used sum instead of difference.' },
        { text: 'm = y₂ · x₁', distractorType: 'CONCEPT_CONFUSION', rationale: 'Product is unrelated to slope.' },
        { text: 'Slope is always 1', distractorType: 'TIME_PRESSURE_GUESS', rationale: 'Default guess.' },
      ]},
      { stepIndex: 2, stepType: 'PROCESS', prompt: 'Plug in (0, 2) and (3, 8):', choices: [
        { text: 'm = (8 − 2) / (3 − 0)', isCorrect: true },
        { text: 'm = (3 − 0) / (8 − 2)', distractorType: 'CONCEPT_CONFUSION', rationale: 'Swapped numerator and denominator.' },
        { text: 'm = (8 + 2) / (3 + 0)', distractorType: 'CALC_ERROR', rationale: 'Used sums.' },
        { text: 'm = (8 − 2) · (3 − 0)', distractorType: 'CONCEPT_CONFUSION', rationale: 'Multiplied instead of divided.' },
        { text: 'm = 8 / 3', distractorType: 'PROCESS_SKIP', rationale: 'Took the second point only.' },
      ]},
      { stepIndex: 3, stepType: 'ANSWER', prompt: 'Compute:', choices: [
        { text: '2', isCorrect: true },
        { text: '6/3', distractorType: 'PROCESS_SKIP', rationale: 'Did not simplify.' },
        { text: '1/2', distractorType: 'CONCEPT_CONFUSION', rationale: 'Used reciprocal slope.' },
        { text: '6', distractorType: 'PROCESS_SKIP', rationale: 'Forgot to divide by 3.' },
        { text: '3', distractorType: 'CALC_ERROR', rationale: 'Computation error.' },
      ]},
    ],
  },

  // ---- Class 9 ----
  {
    source: 'Class 9 · Number Systems · Q1',
    steps: [
      { stepIndex: 1, stepType: 'CONCEPT', prompt: 'How do you simplify √50?', choices: [
        { text: 'Factor 50 = 25·2 = 5²·2 ⇒ √50 = 5√2', isCorrect: true },
        { text: 'Round to 7.07 and treat as decimal', distractorType: 'PROCESS_SKIP', rationale: 'Loses surd form needed to combine.' },
        { text: '√50 = √25 + √2 = 5 + √2', distractorType: 'CONCEPT_CONFUSION', rationale: 'False: √(a·b) ≠ √a + √b.' },
        { text: '√50 cannot be simplified', distractorType: 'TIME_PRESSURE_GUESS', rationale: '50 has a square factor (25).' },
        { text: '√50 = 50^(1/2) = 25', distractorType: 'CALC_ERROR', rationale: 'Confused exponent rules.' },
      ]},
      { stepIndex: 2, stepType: 'PROCESS', prompt: 'Now √8 = ?', choices: [
        { text: '√8 = √(4·2) = 2√2', isCorrect: true },
        { text: '√8 = 2√4', distractorType: 'CONCEPT_CONFUSION', rationale: 'Wrong factoring (4·2 should leave 2 inside, not 4).' },
        { text: '√8 = 8√2', distractorType: 'CALC_ERROR', rationale: 'Misapplied factoring.' },
        { text: '√8 = √2', distractorType: 'PROCESS_SKIP', rationale: 'Dropped the coefficient.' },
        { text: '√8 = 4√2', distractorType: 'CALC_ERROR', rationale: 'Took √4 wrong.' },
      ]},
      { stepIndex: 3, stepType: 'ANSWER', prompt: 'Add 5√2 + 2√2:', choices: [
        { text: '7√2', isCorrect: true },
        { text: '7√4', distractorType: 'CONCEPT_CONFUSION', rationale: 'Added under the radical too.' },
        { text: '√58', distractorType: 'CONCEPT_CONFUSION', rationale: 'Tried to combine inside the radical.' },
        { text: '10', distractorType: 'CALC_ERROR', rationale: 'Treated √2 as 1.' },
        { text: '5√2 + 2√2', distractorType: 'PROCESS_SKIP', rationale: 'Did not actually add the like surds.' },
      ]},
    ],
  },
  {
    source: 'Class 9 · Polynomials · Q1',
    steps: [
      { stepIndex: 1, stepType: 'CONCEPT', prompt: 'To factorise x² + 7x + 12, what do you look for?', choices: [
        { text: 'Two numbers that add to 7 and multiply to 12', isCorrect: true },
        { text: 'Two numbers that subtract to 7 and divide to 12', distractorType: 'CONCEPT_CONFUSION', rationale: 'Wrong relationship between coefficients.' },
        { text: 'Use the quadratic formula immediately', distractorType: 'PROCESS_SKIP', rationale: 'Possible but unnecessary when factorisation works.' },
        { text: 'Two numbers that add to 12 and multiply to 7', distractorType: 'CONCEPT_CONFUSION', rationale: 'Sum and product confused.' },
        { text: 'Factor out an x first', distractorType: 'PROCESS_SKIP', rationale: 'No common factor — leads nowhere.' },
      ]},
      { stepIndex: 2, stepType: 'PROCESS', prompt: 'Which pair (p, q) satisfies p + q = 7 and pq = 12?', choices: [
        { text: 'p = 3, q = 4', isCorrect: true },
        { text: 'p = 6, q = 2', distractorType: 'CALC_ERROR', rationale: '6 + 2 = 8, not 7.' },
        { text: 'p = 5, q = 2', distractorType: 'CALC_ERROR', rationale: '5·2 = 10, not 12.' },
        { text: 'p = 12, q = 1', distractorType: 'PROCESS_SKIP', rationale: 'Sum 13, not 7.' },
        { text: 'p = -3, q = -4', distractorType: 'CALC_ERROR', rationale: 'Product is +12 but sum is −7.' },
      ]},
      { stepIndex: 3, stepType: 'ANSWER', prompt: 'Factorisation:', choices: [
        { text: '(x + 3)(x + 4)', isCorrect: true },
        { text: '(x − 3)(x − 4)', distractorType: 'CALC_ERROR', rationale: 'Negative roots — product OK but signs wrong.' },
        { text: '(x + 3)(x − 4)', distractorType: 'CALC_ERROR', rationale: 'Mixed signs give product = −12.' },
        { text: '(x + 6)(x + 2)', distractorType: 'CALC_ERROR', rationale: 'Sum = 8, not 7.' },
        { text: '(x + 7)(x + 12)', distractorType: 'CONCEPT_CONFUSION', rationale: 'Used coefficients themselves as roots.' },
      ]},
    ],
  },
  {
    source: 'Class 9 · Coordinate Geometry · Q1',
    steps: [
      { stepIndex: 1, stepType: 'CONCEPT', prompt: 'Distance between two points (x₁, y₁) and (x₂, y₂)?', choices: [
        { text: 'd = √[(x₂ − x₁)² + (y₂ − y₁)²]', isCorrect: true },
        { text: 'd = (x₂ − x₁) + (y₂ − y₁)', distractorType: 'CONCEPT_CONFUSION', rationale: 'Linear sum, not Pythagorean.' },
        { text: 'd = |x₂ − x₁| · |y₂ − y₁|', distractorType: 'CONCEPT_CONFUSION', rationale: 'Product, not sum of squares.' },
        { text: 'd = √(x₂² + y₂²)', distractorType: 'PROCESS_SKIP', rationale: 'Used only the second point.' },
        { text: 'd = (x₂ − x₁)² + (y₂ − y₁)²', distractorType: 'PROCESS_SKIP', rationale: 'Forgot the square root.' },
      ]},
      { stepIndex: 2, stepType: 'PROCESS', prompt: 'Plug A(2, 3), B(5, 7):', choices: [
        { text: '√[(5−2)² + (7−3)²] = √(9 + 16)', isCorrect: true },
        { text: '√[(5+2)² + (7+3)²] = √(49 + 100)', distractorType: 'CALC_ERROR', rationale: 'Used sums instead of differences.' },
        { text: '(5 − 2) + (7 − 3) = 7', distractorType: 'CONCEPT_CONFUSION', rationale: 'Linear sum.' },
        { text: '√[(5−2) + (7−3)] = √7', distractorType: 'PROCESS_SKIP', rationale: 'Skipped the squaring.' },
        { text: '(5 − 2) · (7 − 3) = 12', distractorType: 'CONCEPT_CONFUSION', rationale: 'Product of legs, not hypotenuse.' },
      ]},
      { stepIndex: 3, stepType: 'ANSWER', prompt: 'Compute:', choices: [
        { text: '5', isCorrect: true },
        { text: '√25 = 5 (yes that\'s right)', distractorType: undefined, rationale: undefined as any },
        { text: '7', distractorType: 'CONCEPT_CONFUSION', rationale: 'Linear sum result.' },
        { text: '√25', distractorType: 'PROCESS_SKIP', rationale: 'Did not finish — √25 = 5.' },
        { text: '25', distractorType: 'PROCESS_SKIP', rationale: 'Forgot the square root.' },
      ]},
    ],
  },
  {
    source: 'Class 9 · Polynomials · Q2',
    steps: [
      { stepIndex: 1, stepType: 'CONCEPT', prompt: 'How do you compute p(2) for p(x) = 2x² − 3x − 2?', choices: [
        { text: 'Substitute x = 2 and simplify each term', isCorrect: true },
        { text: 'Divide p(x) by (x − 2)', distractorType: 'CONCEPT_CONFUSION', rationale: 'That gives the quotient, not p(2).' },
        { text: 'Take the coefficient of x²', distractorType: 'PROCESS_SKIP', rationale: 'Ignores other terms.' },
        { text: 'Set p(x) = 0 and solve', distractorType: 'CONCEPT_CONFUSION', rationale: 'Solving — different operation.' },
        { text: 'Multiply all coefficients by 2', distractorType: 'TIME_PRESSURE_GUESS', rationale: 'Random guess.' },
      ]},
      { stepIndex: 2, stepType: 'PROCESS', prompt: 'After substituting x = 2:', choices: [
        { text: '2(2)² − 3(2) − 2 = 8 − 6 − 2', isCorrect: true },
        { text: '2(2) − 3(2) − 2 = 4 − 6 − 2', distractorType: 'CALC_ERROR', rationale: 'Did not square the 2.' },
        { text: '2(2)² − 3(2) − 2 = 8 + 6 − 2', distractorType: 'CALC_ERROR', rationale: 'Sign error on −3·2.' },
        { text: '2(4) − 3(2) − 2 = 6 − 2', distractorType: 'CALC_ERROR', rationale: 'Combined two subtractions wrong.' },
        { text: '2(2)² − 3(2) − 2 = 8 − 6', distractorType: 'PROCESS_SKIP', rationale: 'Forgot the −2 constant.' },
      ]},
      { stepIndex: 3, stepType: 'ANSWER', prompt: 'Therefore p(2) =', choices: [
        { text: '0', isCorrect: true },
        { text: '4', distractorType: 'CALC_ERROR', rationale: 'Subtraction error.' },
        { text: '-4', distractorType: 'CALC_ERROR', rationale: 'Sign error.' },
        { text: '12', distractorType: 'CALC_ERROR', rationale: 'Sum instead of mixed signs.' },
        { text: '6', distractorType: 'PROCESS_SKIP', rationale: 'Did not subtract last term.' },
      ]},
    ],
  },

  // ---- Class 10 ----
  {
    source: 'Class 10 · Polynomials · Q1',
    steps: [
      { stepIndex: 1, stepType: 'CONCEPT', prompt: 'Remainder Theorem says:', choices: [
        { text: 'When p(x) is divided by (x − c), the remainder equals p(c)', isCorrect: true },
        { text: 'When p(x) is divided by (x − c), the remainder equals 0', distractorType: 'CONCEPT_CONFUSION', rationale: 'That is the Factor Theorem (a special case).' },
        { text: 'p(x) divided by x = c', distractorType: 'CONCEPT_CONFUSION', rationale: 'Phrasing confused.' },
        { text: 'Use long division — no shortcut exists', distractorType: 'PROCESS_SKIP', rationale: 'The Remainder Theorem IS the shortcut.' },
        { text: 'Plug x = 0', distractorType: 'CONCEPT_CONFUSION', rationale: 'That gives p(0), not the remainder by (x − c).' },
      ]},
      { stepIndex: 2, stepType: 'PROCESS', prompt: 'For p(x) = x³ − 3x² + 4 divided by (x − 2), compute p(2):', choices: [
        { text: '(2)³ − 3(2)² + 4 = 8 − 12 + 4', isCorrect: true },
        { text: '(2)³ − 3(2)² + 4 = 8 − 6 + 4', distractorType: 'CALC_ERROR', rationale: '3·(2)² should be 12, not 6.' },
        { text: '(2)³ − 3(2) + 4 = 8 − 6 + 4', distractorType: 'CALC_ERROR', rationale: 'Did not square the 2.' },
        { text: '(2)² − 3(2)² + 4', distractorType: 'CALC_ERROR', rationale: 'Wrong exponent on first term.' },
        { text: 'Plugged x = -2 by mistake', distractorType: 'CALC_ERROR', rationale: 'Sign of c flipped.' },
      ]},
      { stepIndex: 3, stepType: 'ANSWER', prompt: 'Therefore the remainder is:', choices: [
        { text: '0', isCorrect: true },
        { text: '4', distractorType: 'CALC_ERROR', rationale: 'Did not finish 8 − 12 + 4.' },
        { text: '8', distractorType: 'PROCESS_SKIP', rationale: 'Took only the first term.' },
        { text: '12', distractorType: 'CALC_ERROR', rationale: 'Sign or arithmetic error.' },
        { text: '-4', distractorType: 'CALC_ERROR', rationale: 'Wrong sign — 8 − 12 + 4 = 0.' },
      ]},
    ],
  },
  {
    source: 'Class 10 · Quadratic Equations · Q1',
    steps: [
      { stepIndex: 1, stepType: 'CONCEPT', prompt: 'To factorise x² − 4x − 5, look for two numbers that:', choices: [
        { text: 'Multiply to −5 and add to −4', isCorrect: true },
        { text: 'Multiply to −4 and add to −5', distractorType: 'CONCEPT_CONFUSION', rationale: 'Sum and product confused.' },
        { text: 'Multiply to 5 and add to −4', distractorType: 'CALC_ERROR', rationale: 'Sign of constant wrong.' },
        { text: 'Multiply to −5 and add to 4', distractorType: 'CALC_ERROR', rationale: 'Sign of linear coefficient wrong.' },
        { text: 'Use only the quadratic formula', distractorType: 'PROCESS_SKIP', rationale: 'Possible but factorisation works here cleanly.' },
      ]},
      { stepIndex: 2, stepType: 'PROCESS', prompt: 'Find p, q with pq = −5 and p + q = −4:', choices: [
        { text: 'p = -5, q = 1', isCorrect: true },
        { text: 'p = 5, q = -1', distractorType: 'CALC_ERROR', rationale: 'Sum is +4, not −4.' },
        { text: 'p = -5, q = -1', distractorType: 'CALC_ERROR', rationale: 'Product is +5, not −5.' },
        { text: 'p = -2, q = 2', distractorType: 'CALC_ERROR', rationale: 'Product is −4 and sum is 0.' },
        { text: 'p = 5, q = 1', distractorType: 'CALC_ERROR', rationale: 'Sum is 6, product +5.' },
      ]},
      { stepIndex: 3, stepType: 'ANSWER', prompt: 'So the solutions are:', choices: [
        { text: 'x = 5 or x = -1', isCorrect: true },
        { text: 'x = -5 or x = 1', distractorType: 'CALC_ERROR', rationale: 'Signs flipped — must use opposite of p, q.' },
        { text: 'x = 5 or x = 1', distractorType: 'CALC_ERROR', rationale: 'Sign error on second root.' },
        { text: 'x = -5 or x = -1', distractorType: 'CALC_ERROR', rationale: 'Both signs wrong.' },
        { text: 'x = ±√5', distractorType: 'CONCEPT_CONFUSION', rationale: 'Confused with x² = 5 case.' },
      ]},
    ],
  },
  {
    source: 'Class 10 · Coordinate Geometry · Q1',
    steps: [
      { stepIndex: 1, stepType: 'CONCEPT', prompt: 'Midpoint formula:', choices: [
        { text: 'M = ((x₁ + x₂)/2, (y₁ + y₂)/2)', isCorrect: true },
        { text: 'M = (x₂ − x₁, y₂ − y₁)', distractorType: 'CONCEPT_CONFUSION', rationale: 'That is the displacement, not midpoint.' },
        { text: 'M = ((x₁ − x₂)/2, (y₁ − y₂)/2)', distractorType: 'CALC_ERROR', rationale: 'Used differences instead of sums.' },
        { text: 'M = (x₁ · x₂, y₁ · y₂)', distractorType: 'CONCEPT_CONFUSION', rationale: 'Products are unrelated to midpoints.' },
        { text: 'Midpoint is always the origin', distractorType: 'TIME_PRESSURE_GUESS', rationale: 'Default guess.' },
      ]},
      { stepIndex: 2, stepType: 'PROCESS', prompt: 'Plug A(-2, 4), B(6, -2):', choices: [
        { text: 'M = ((-2 + 6)/2, (4 + (-2))/2)', isCorrect: true },
        { text: 'M = ((-2 − 6)/2, (4 − 2)/2)', distractorType: 'CALC_ERROR', rationale: 'Used differences.' },
        { text: 'M = ((-2 · 6)/2, (4 · -2)/2)', distractorType: 'CONCEPT_CONFUSION', rationale: 'Multiplied instead of added.' },
        { text: 'M = ((-2 + 6), (4 + -2))', distractorType: 'PROCESS_SKIP', rationale: 'Forgot to divide by 2.' },
        { text: 'M = (4, 2)', distractorType: 'CALC_ERROR', rationale: 'Got numerator OK but skipped division.' },
      ]},
      { stepIndex: 3, stepType: 'ANSWER', prompt: 'Compute:', choices: [
        { text: '(2, 1)', isCorrect: true },
        { text: '(4, 2)', distractorType: 'PROCESS_SKIP', rationale: 'Did not divide by 2.' },
        { text: '(-4, 6)', distractorType: 'CALC_ERROR', rationale: 'Used differences.' },
        { text: '(2, -1)', distractorType: 'CALC_ERROR', rationale: 'Sign error in y-coordinate.' },
        { text: '(8, 2)', distractorType: 'CALC_ERROR', rationale: 'Used wrong arithmetic.' },
      ]},
    ],
  },
  {
    source: 'Class 10 · Trigonometry · Q1',
    steps: [
      { stepIndex: 1, stepType: 'CONCEPT', prompt: 'Pythagorean identity:', choices: [
        { text: 'sin²θ + cos²θ = 1', isCorrect: true },
        { text: 'sin θ + cos θ = 1', distractorType: 'CONCEPT_CONFUSION', rationale: 'Forgot the squares.' },
        { text: 'sin²θ − cos²θ = 1', distractorType: 'CONCEPT_CONFUSION', rationale: 'Wrong sign — that is double-angle related.' },
        { text: 'sin²θ · cos²θ = 1', distractorType: 'CONCEPT_CONFUSION', rationale: 'Product instead of sum.' },
        { text: 'tan²θ = 1', distractorType: 'CONCEPT_CONFUSION', rationale: 'Different identity (tan²θ + 1 = sec²θ).' },
      ]},
      { stepIndex: 2, stepType: 'PROCESS', prompt: 'Given sin θ = 3/5, find cos²θ:', choices: [
        { text: 'cos²θ = 1 − (3/5)² = 1 − 9/25 = 16/25', isCorrect: true },
        { text: 'cos²θ = (3/5)² = 9/25', distractorType: 'CONCEPT_CONFUSION', rationale: 'Used sin²θ value as cos²θ.' },
        { text: 'cos²θ = 1 − 3/5 = 2/5', distractorType: 'PROCESS_SKIP', rationale: 'Did not square the sin value.' },
        { text: 'cos²θ = 1 + 9/25 = 34/25', distractorType: 'CALC_ERROR', rationale: 'Sign error — should subtract.' },
        { text: 'cos²θ = 25/9', distractorType: 'CALC_ERROR', rationale: 'Took reciprocal.' },
      ]},
      { stepIndex: 3, stepType: 'ANSWER', prompt: 'Take positive square root (acute angle):', choices: [
        { text: '4/5', isCorrect: true },
        { text: '√(16/25) = ±4/5 (no info to choose)', distractorType: 'PROCESS_SKIP', rationale: 'For an acute angle, cos θ > 0.' },
        { text: '16/25', distractorType: 'PROCESS_SKIP', rationale: 'Did not take square root.' },
        { text: '3/5', distractorType: 'CONCEPT_CONFUSION', rationale: 'That is sin θ, not cos θ.' },
        { text: '5/4', distractorType: 'CALC_ERROR', rationale: 'Took reciprocal of 4/5.' },
      ]},
    ],
  },
];

export async function seedSteps(prisma: PrismaClient, problemIdsBySource: Record<string, string>) {
  // SPEC_M1 (중1 한국 시드) 는 PoC 페르소나(Class 11)에 맞지 않아 제외.
  // 정의 자체는 보존 — 추후 Class 7 페르소나 데모 시 재활성화 가능.
  const ALL_SPEC = [...SPEC, ...SPEC_NCERT];

  // 기존 단계/선택지 삭제 (재시드 시 깨끗하게)
  for (const spec of ALL_SPEC) {
    const pid = problemIdsBySource[spec.source];
    if (!pid) continue;
    // ProblemStep onDelete cascade로 ProblemChoice도 삭제됨
    await prisma.problemStep.deleteMany({ where: { problemId: pid } });
  }

  let stepCount = 0;
  let choiceCount = 0;
  for (const spec of ALL_SPEC) {
    const pid = problemIdsBySource[spec.source];
    if (!pid) continue;
    for (const s of spec.steps) {
      const step = await prisma.problemStep.create({
        data: {
          problemId: pid,
          stepIndex: s.stepIndex,
          stepType: s.stepType as any,
          prompt: s.prompt,
        },
      });
      stepCount++;
      // 5지선다 보장: 부족한 보기는 안전한 더미로 패딩 (드물게 발생)
      const rawChs = s.choices.slice(0, 5);
      while (rawChs.length < 5) rawChs.push({ text: '—', distractorType: 'TIME_PRESSURE_GUESS', rationale: '— (자리 채움)' });
      // 정답 위치를 source + stepIndex 기반으로 deterministic shuffle.
      // 시드 데이터의 정답이 모두 1번에 작성되어 있어, 셔플 없이 저장하면
      // "항상 1번 찍기" 전략으로 평가가 무력화됨.
      const chs = deterministicShuffle(rawChs, `${spec.source}::${s.stepIndex}`);
      for (let i = 0; i < chs.length; i++) {
        const c = chs[i];
        await prisma.problemChoice.create({
          data: {
            stepId: step.id,
            choiceIndex: i + 1,
            text: c.text,
            isCorrect: c.isCorrect ?? false,
            distractorType: (c.distractorType ?? null) as any,
            rationale: c.rationale ?? null,
          },
        });
        choiceCount++;
      }
    }
  }
  console.log(`  · ${stepCount} steps · ${choiceCount} choices seeded (across ${ALL_SPEC.length} problems)`);
}
