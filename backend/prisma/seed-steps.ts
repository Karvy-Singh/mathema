import { PrismaClient } from '@prisma/client';

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

export async function seedSteps(prisma: PrismaClient, problemIdsBySource: Record<string, string>) {
  // 기존 단계/선택지 삭제 (재시드 시 깨끗하게)
  for (const spec of SPEC) {
    const pid = problemIdsBySource[spec.source];
    if (!pid) continue;
    // ProblemStep onDelete cascade로 ProblemChoice도 삭제됨
    await prisma.problemStep.deleteMany({ where: { problemId: pid } });
  }

  let stepCount = 0;
  let choiceCount = 0;
  for (const spec of SPEC) {
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
      for (let i = 0; i < s.choices.length; i++) {
        const c = s.choices[i];
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
  console.log(`  · ${stepCount} steps · ${choiceCount} choices seeded`);
}
