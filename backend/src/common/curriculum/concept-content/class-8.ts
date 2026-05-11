/**
 * Class 8 (NCERT VIII) — 챕터별 개념학습 콘텐츠.
 */

import { ChapterContentMap } from './types';

export const CLASS_8_CONTENT: ChapterContentMap = {
  'C8-CH01-RATIONAL-NUMBERS': {
    hook: {
      ko: '−⅔ + ⅗ 를 빠르게 계산하려면? 분수 연산은 단순한 규칙 하나만 알면 모두 풀린다.',
      en: 'How do we compute −2/3 + 3/5 quickly? One rule unifies every fractional operation.',
    },
    abstract: {
      ko: 'a/b ± c/d = (ad ± bc)/bd. ℚ 는 +, −, ×, ÷ 에 대해 닫혀있고 결합·교환·분배법칙 모두 성립.',
      en: 'a/b ± c/d = (ad ± bc)/bd. ℚ closed under +, −, ×, ÷ (≠0); associative, commutative, distributive all hold.',
    },
    worked: {
      ko: '계산: −2/3 + 3/5',
      en: 'Compute: −2/3 + 3/5',
      steps: [
        { math: '공통분모 15', narrationKo: '공통분모로 통분.', narrationEn: 'Find a common denominator.' },
        { math: '−10/15 + 9/15 = −1/15', narrationKo: '분자 합산.', narrationEn: 'Add numerators.' },
      ],
    },
    misconception: {
      wrongKo: 'a/b + c/d = (a+c)/(b+d)',
      wrongEn: 'a/b + c/d = (a+c)/(b+d)',
      whyKo: '분모를 분모끼리 더해버리는 흔한 오류.',
      whyEn: 'Adding denominators directly — classic error.',
      correctKo: '분모를 통분해야 분자 합산이 의미를 갖는다.',
      correctEn: 'Must equate denominators first; only then add numerators.',
    },
    retrieval: {
      promptKo: '1/2 − 1/3 = ?',
      promptEn: '1/2 − 1/3 = ?',
      accept: ['1/6'],
      explainKo: '3/6 − 2/6 = 1/6.',
      explainEn: '3/6 − 2/6 = 1/6.',
    },
  },

  'C8-CH02-LINEAR-EQ-ONE-VAR': {
    hook: {
      ko: '"내 나이의 두 배에서 5를 빼면 31이다." 내 나이는? 일차방정식 한 줄로 즉답.',
      en: '"Twice my age minus 5 is 31." How old am I? One linear equation tells you.',
    },
    abstract: {
      ko: '일변수 일차방정식: ax + b = cx + d ⇒ (a − c)x = d − b ⇒ x = (d − b)/(a − c).',
      en: 'ax + b = cx + d ⇒ (a − c)x = d − b ⇒ x = (d − b)/(a − c).',
    },
    worked: {
      ko: '풀이: 2x − 3 = 5x + 9',
      en: 'Solve: 2x − 3 = 5x + 9',
      steps: [
        { math: '2x − 5x = 9 + 3', narrationKo: 'x 항·상수 이항.', narrationEn: 'Move x-terms and constants.' },
        { math: '−3x = 12',         narrationKo: '동류항 정리.', narrationEn: 'Simplify.' },
        { math: 'x = −4',           narrationKo: '계수로 나눔.', narrationEn: 'Divide by coefficient.' },
      ],
    },
    misconception: {
      wrongKo: '−3x = 12 ⇒ x = 12/3 = 4',
      wrongEn: '−3x = 12 ⇒ x = 12/3 = 4',
      whyKo: '−3 의 음수 부호를 무시.',
      whyEn: 'Ignored the negative sign on −3.',
      correctKo: '양변을 −3 으로 나눠야 x = −4.',
      correctEn: 'Divide by −3 (not 3) ⇒ x = −4.',
    },
    retrieval: {
      promptKo: '3(x − 2) = 9. x = ?',
      promptEn: '3(x − 2) = 9. x = ?',
      accept: ['5', 'x=5'],
      explainKo: '괄호 풀고: 3x − 6 = 9 ⇒ x = 5.',
      explainEn: 'Expand: 3x − 6 = 9 ⇒ x = 5.',
    },
  },

  'C8-CH03-QUADRILATERALS': {
    hook: {
      ko: '"평행사변형 = 직사각형이다" 는 참인가? 사각형들 사이에는 위계가 있다.',
      en: 'Is every parallelogram a rectangle? Quadrilaterals form a hierarchy.',
    },
    abstract: {
      ko: '평행사변형 ⊂ 직사각형 ⊂ 정사각형, 평행사변형 ⊂ 마름모 ⊂ 정사각형. 사각형 내각의 합 = 360°.',
      en: 'Parallelogram ⊂ rectangle ⊂ square; parallelogram ⊂ rhombus ⊂ square. Sum of interior angles = 360°.',
    },
    worked: {
      ko: '평행사변형의 세 내각이 65°, 115°, 65°. 네 번째는?',
      en: 'Three angles of a parallelogram are 65°, 115°, 65°. Find the fourth.',
      steps: [
        { math: '합 65+115+65 = 245', narrationKo: '세 각 합.', narrationEn: 'Sum of three.' },
        { math: '360 − 245 = 115°',    narrationKo: '나머지 각.', narrationEn: 'Remaining angle.' },
      ],
    },
    misconception: {
      wrongKo: '평행사변형의 대각선은 항상 같다.',
      wrongEn: 'Parallelogram diagonals are always equal.',
      whyKo: '직사각형의 성질을 평행사변형 일반에 적용.',
      whyEn: 'Applied a rectangle-only property to all parallelograms.',
      correctKo: '대각선이 같은 것은 직사각형. 평행사변형 일반에서는 단지 서로를 이등분한다.',
      correctEn: 'Equal diagonals are unique to rectangles; in general, they only bisect each other.',
    },
    retrieval: {
      promptKo: '마름모의 대각선 두 개의 관계?',
      promptEn: 'Relationship between the diagonals of a rhombus?',
      accept: ['perpendicular bisect', '서로 수직 이등분', '수직이등분'],
      explainKo: '서로를 수직 이등분한다.',
      explainEn: 'They perpendicularly bisect each other.',
    },
  },

  'C8-CH04-DATA-HANDLING': {
    hook: {
      ko: '도시 인구의 30% 가 어린이라면, 원그래프에서 그 부분은 몇 도일까?',
      en: 'If 30% of a city are children, how many degrees does that slice take in a pie chart?',
    },
    abstract: {
      ko: '원그래프의 한 부분 = (해당 비율) × 360°. 확률 = 유리한 경우 / 전체 경우 (동일 가능 가정).',
      en: 'Pie slice = (proportion) × 360°. Probability = favourable / total (equally likely).',
    },
    worked: {
      ko: '30% 의 인구는 원그래프에서 몇 도?',
      en: 'What angle for 30% in a pie chart?',
      steps: [
        { math: '0.30 × 360°', narrationKo: '비율 × 원의 회전각.', narrationEn: 'Fraction times full turn.' },
        { math: '= 108°',       narrationKo: '계산.', narrationEn: 'Compute.' },
      ],
    },
    retrieval: {
      promptKo: '동전을 던져 앞면이 나올 확률?',
      promptEn: 'Probability a coin shows heads?',
      accept: ['1/2', '0.5', '50%'],
      explainKo: '두 결과가 동일 가능.',
      explainEn: 'Two equally likely outcomes.',
    },
  },

  'C8-CH05-SQUARES-ROOTS': {
    hook: {
      ko: '√144 는 쉽지만 √150 은? 비완전제곱수의 √ 는 끝없는 소수다.',
      en: '√144 is easy; √150 isn\'t — non-perfect-square roots run on forever.',
    },
    abstract: {
      ko: 'n 의 제곱근 √n: x² = n 이 되는 음이 아닌 x. n 이 완전제곱수가 아니면 √n 은 무리수.',
      en: '√n: the non-negative x with x² = n. If n isn\'t a perfect square, √n is irrational.',
    },
    worked: {
      ko: '계산: √196 (소인수분해 사용)',
      en: 'Compute: √196 via prime factorisation',
      steps: [
        { math: '196 = 2² · 7²', narrationKo: '소인수분해.', narrationEn: 'Prime factorise.' },
        { math: '√(2²·7²) = 2·7 = 14', narrationKo: '쌍 지수의 root.', narrationEn: 'Pair the squared factors.' },
      ],
    },
    misconception: {
      wrongKo: '√(a + b) = √a + √b',
      wrongEn: '√(a + b) = √a + √b',
      whyKo: '제곱근을 분배법칙처럼 잘못 사용.',
      whyEn: 'Misused root as if it distributed over sums.',
      correctKo: '제곱근은 곱셈에 분배: √(ab) = √a · √b. 덧셈에는 분배되지 않는다.',
      correctEn: 'Root distributes over multiplication, not addition.',
    },
    retrieval: {
      promptKo: '√81 = ?',
      promptEn: '√81 = ?',
      accept: ['9'],
      explainKo: '9² = 81.',
      explainEn: '9² = 81.',
    },
  },

  'C8-CH06-CUBES-ROOTS': {
    hook: {
      ko: '주사위 부피가 64 cm³. 한 변은? 세제곱근의 직관적 의미.',
      en: 'A cubic die has volume 64 cm³. Its edge length? That\'s the cube root intuition.',
    },
    abstract: {
      ko: '∛n: x³ = n 이 되는 실수 x (단 한 개). 음수의 세제곱근도 실수 (∛−8 = −2).',
      en: '∛n: unique real x with x³ = n. Cube root of negatives is real (∛−8 = −2).',
    },
    worked: {
      ko: '∛216',
      en: '∛216',
      steps: [
        { math: '216 = 2³ · 3³', narrationKo: '소인수분해.', narrationEn: 'Prime factorise.' },
        { math: '∛(2³·3³) = 2·3 = 6', narrationKo: '세제곱 쌍.', narrationEn: 'Triplet root.' },
      ],
    },
    retrieval: {
      promptKo: '∛(−27) = ?',
      promptEn: '∛(−27) = ?',
      accept: ['-3', '−3'],
      explainKo: '(−3)³ = −27.',
      explainEn: '(−3)³ = −27.',
    },
  },

  'C8-CH07-COMPARING-QUANTITIES': {
    hook: {
      ko: '같은 이자율 10%, 단리 vs 복리 — 10년 뒤 차이는?',
      en: 'Same 10% rate, simple vs compound interest — how big is the gap after 10 years?',
    },
    abstract: {
      ko: '단리 SI = P·r·t.  복리 A = P(1 + r/n)^(nt). 복리는 지수 성장.',
      en: 'Simple interest SI = P·r·t.  Compound A = P(1 + r/n)^(nt). Compound is exponential.',
    },
    worked: {
      ko: 'P=₹1000, r=10%, t=2년 복리(연간복리).',
      en: 'P=₹1000, r=10%, t=2 yr, annual compounding.',
      steps: [
        { math: 'A = 1000(1.10)² = 1000·1.21', narrationKo: '복리 공식.', narrationEn: 'Apply formula.' },
        { math: '= ₹1210',                     narrationKo: '값.',       narrationEn: 'Evaluate.' },
      ],
    },
    misconception: {
      wrongKo: '복리는 단리에 비례한다.',
      wrongEn: 'Compound interest is proportional to simple interest.',
      whyKo: '지수와 선형 관계를 혼동.',
      whyEn: 'Confused exponential with linear growth.',
      correctKo: '복리는 단리보다 시간이 갈수록 빠르게 (지수적으로) 성장.',
      correctEn: 'Compound grows faster than simple — exponentially with time.',
    },
    retrieval: {
      promptKo: '₹500 단리, 8%, 3년. 이자?',
      promptEn: '₹500 simple interest, 8%, 3 yr. Interest?',
      accept: ['120', '₹120'],
      explainKo: '500·0.08·3 = 120.',
      explainEn: '500·0.08·3 = 120.',
    },
  },

  'C8-CH08-ALG-IDENTITIES': {
    hook: {
      ko: '(x + 5)² 을 펼치려고 분배법칙으로 한 줄씩 계산할 필요는 없다 — 항등식이 단축한다.',
      en: 'Expanding (x + 5)² doesn\'t need term-by-term FOIL — identities give shortcuts.',
    },
    abstract: {
      ko: '(a ± b)² = a² ± 2ab + b².  (a + b)(a − b) = a² − b².',
      en: '(a ± b)² = a² ± 2ab + b².  (a + b)(a − b) = a² − b².',
    },
    worked: {
      ko: '전개: (x + 5)²',
      en: 'Expand: (x + 5)²',
      steps: [
        { math: 'x² + 2·x·5 + 5²', narrationKo: '항등식 직접 적용.', narrationEn: 'Apply the identity.' },
        { math: '= x² + 10x + 25',  narrationKo: '단순화.',         narrationEn: 'Simplify.' },
      ],
    },
    misconception: {
      wrongKo: '(x + 5)² = x² + 25',
      wrongEn: '(x + 5)² = x² + 25',
      whyKo: '교차항 2ab 를 빠뜨림 (가장 흔한 실수).',
      whyEn: 'Forgot the cross term 2ab (the #1 error).',
      correctKo: '(x + 5)² = x² + 10x + 25. 항상 교차항을 점검.',
      correctEn: 'Always include 2ab → x² + 10x + 25.',
    },
    retrieval: {
      promptKo: '(x − 3)² 전개.',
      promptEn: 'Expand (x − 3)².',
      accept: ['x²-6x+9', 'x^2 - 6x + 9', 'x²−6x+9'],
      explainKo: 'a=x, b=3 ⇒ x² − 6x + 9.',
      explainEn: 'a=x, b=3 ⇒ x² − 6x + 9.',
    },
  },

  'C8-CH09-MENSURATION': {
    hook: {
      ko: '원기둥 음료캔의 라벨이 떨어지면, 그 라벨은 어떤 모양의 종이일까?',
      en: 'Peel the label off a cylindrical can — what shape is that flat sheet?',
    },
    abstract: {
      ko: '직사각형 라벨 = 2πr × h.  원기둥 전체 겉넓이 = 2πr(r + h). 부피 = πr²h.',
      en: 'Lateral surface = 2πr·h. Total surface = 2πr(r + h). Volume = πr²h.',
    },
    worked: {
      ko: 'r=3, h=10 인 원기둥 부피.',
      en: 'Volume of cylinder, r=3, h=10.',
      steps: [
        { math: 'V = π·3²·10 = 90π', narrationKo: '공식.', narrationEn: 'Plug in.' },
        { math: '≈ 282.7',           narrationKo: '값.',  narrationEn: 'Evaluate.' },
      ],
    },
    retrieval: {
      promptKo: '한 변 4 cm 정육면체 부피?',
      promptEn: 'Volume of a 4 cm cube?',
      accept: ['64', '64cm³', '64 cm³'],
      explainKo: '4³ = 64.',
      explainEn: '4³ = 64.',
    },
  },

  'C8-CH10-EXPONENTS': {
    hook: {
      ko: '5⁰ 의 값은? 1 — 그런데 왜? 지수 법칙을 일관되게 확장하면 그렇게 정의된다.',
      en: 'What\'s 5⁰? It\'s 1 — but why? The laws force this definition for consistency.',
    },
    abstract: {
      ko: 'a⁰ = 1 (a ≠ 0).  a⁻ⁿ = 1/aⁿ.  aᵐ/aⁿ = a^(m−n).',
      en: 'a⁰ = 1.  a⁻ⁿ = 1/aⁿ.  aᵐ/aⁿ = a^(m−n).',
    },
    worked: {
      ko: '단순화: 2⁵ / 2⁻²',
      en: 'Simplify: 2⁵ / 2⁻²',
      steps: [
        { math: '2^(5 − (−2)) = 2⁷', narrationKo: '지수 차.', narrationEn: 'Subtract exponents.' },
        { math: '= 128',              narrationKo: '값.',    narrationEn: 'Evaluate.' },
      ],
    },
    retrieval: {
      promptKo: '3⁻² = ?',
      promptEn: '3⁻² = ?',
      accept: ['1/9'],
      explainKo: '1/3² = 1/9.',
      explainEn: '1/3² = 1/9.',
    },
  },

  'C8-CH11-DIRECT-INVERSE': {
    hook: {
      ko: '같은 일을 5명이 6시간 한다면, 10명이서는 몇 시간? 사람 수가 늘면 시간은 줄어든다 — 반비례.',
      en: '5 people finish a job in 6 hours. 10 people? Time shrinks as workforce grows — inverse proportion.',
    },
    abstract: {
      ko: '정비례: y = kx (k 상수). 반비례: y = k/x ⇔ xy = k 일정.',
      en: 'Direct: y = kx. Inverse: y = k/x, equivalently xy = const.',
    },
    worked: {
      ko: '5명 × 6시간 = 30 인시. 10명은? 30/10 = 3시간.',
      en: '5 workers · 6 h = 30 person-hours. 10 workers ⇒ 30/10 = 3 h.',
      steps: [
        { math: 'x · y = 30 (상수)', narrationKo: '곱이 일정 = 반비례.', narrationEn: 'Constant product = inverse.' },
        { math: '10 · y = 30 ⇒ y = 3', narrationKo: '풀이.', narrationEn: 'Solve.' },
      ],
    },
    misconception: {
      wrongKo: '"두 배 사람 ⇒ 두 배 빠름" 을 정비례로 본다.',
      wrongEn: 'Treating "double workers ⇒ double speed" as direct proportion.',
      whyKo: '실제로는 시간이 절반 (반비례).',
      whyEn: 'Time halves — that\'s inverse proportion.',
      correctKo: '곱이 일정한지(반비례) 비율이 일정한지(정비례) 먼저 식별.',
      correctEn: 'Identify whether product or ratio is constant first.',
    },
    retrieval: {
      promptKo: 'y 가 x 에 정비례, x=4 일 때 y=12. y = ?',
      promptEn: 'y ∝ x; x=4 ⇒ y=12. Equation?',
      accept: ['y=3x', 'y = 3x'],
      explainKo: 'k = y/x = 3.',
      explainEn: 'k = y/x = 3.',
    },
  },

  'C8-CH12-FACTORISATION': {
    hook: {
      ko: '한 식을 두 인수의 곱으로 바꾸면 0 이 되는 값을 즉시 알 수 있다 — 인수분해의 힘.',
      en: 'Factor an expression and its zeros pop out — that\'s the power of factorisation.',
    },
    abstract: {
      ko: '공통인수 → 두제곱차 a²−b²=(a+b)(a−b) → 완전제곱 → 그루핑 순으로 시도.',
      en: 'Try in order: common factor → diff. of squares → perfect square → grouping.',
    },
    worked: {
      ko: '인수분해: x² − 9',
      en: 'Factor: x² − 9',
      steps: [
        { math: 'x² − 3² = (x − 3)(x + 3)', narrationKo: '두제곱차 형태.', narrationEn: 'Difference of squares.' },
      ],
    },
    misconception: {
      wrongKo: 'x² + 9 = (x + 3)²',
      wrongEn: 'x² + 9 = (x + 3)²',
      whyKo: '합과 차의 패턴을 혼동.',
      whyEn: 'Confused sum-of-squares with difference-of-squares.',
      correctKo: 'x² + 9 은 실수 범위에서 인수분해 안 됨. 두제곱차만 분해 가능.',
      correctEn: 'x² + 9 has no real factorisation; only differences of squares split.',
    },
    retrieval: {
      promptKo: '인수분해 x² − 16.',
      promptEn: 'Factor x² − 16.',
      accept: ['(x-4)(x+4)', '(x+4)(x-4)', '(x−4)(x+4)'],
      explainKo: '두제곱차.',
      explainEn: 'Difference of squares.',
    },
  },

  'C8-CH13-GRAPHS': {
    hook: {
      ko: '시간이 지남에 따라 변하는 온도, 거리, 점수 — 모두 좌표평면 위 한 점들로 그려진다.',
      en: 'Temperature, distance, scores over time — all become points on a coordinate plane.',
    },
    abstract: {
      ko: '좌표평면: (x, y) — 가로 x, 세로 y. 직선의 기울기 m = (y₂ − y₁)/(x₂ − x₁).',
      en: 'Coordinates (x, y); x horizontal, y vertical. Line slope m = (y₂ − y₁)/(x₂ − x₁).',
    },
    worked: {
      ko: '두 점 (1, 2), (4, 11) 의 기울기.',
      en: 'Slope through (1, 2) and (4, 11).',
      steps: [
        { math: 'm = (11 − 2)/(4 − 1) = 9/3 = 3', narrationKo: '공식 적용.', narrationEn: 'Apply formula.' },
      ],
    },
    misconception: {
      wrongKo: 'm = (x₂ − x₁)/(y₂ − y₁)',
      wrongEn: 'Slope = (x₂ − x₁)/(y₂ − y₁)',
      whyKo: '분모와 분자를 뒤바꿈.',
      whyEn: 'Inverted numerator and denominator.',
      correctKo: '"세로의 변화 ÷ 가로의 변화" — rise/run.',
      correctEn: 'Rise / Run.',
    },
    retrieval: {
      promptKo: '(0, 1), (2, 5) 기울기.',
      promptEn: 'Slope through (0, 1), (2, 5).',
      accept: ['2'],
      explainKo: '(5−1)/(2−0) = 2.',
      explainEn: '(5−1)/(2−0) = 2.',
    },
  },
};
