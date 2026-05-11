/**
 * Class 11 (NCERT XI) — 챕터별 개념학습 콘텐츠.
 */

import { ChapterContentMap } from './types';

export const CLASS_11_CONTENT: ChapterContentMap = {
  'C11-CH01-SETS': {
    hook: {
      ko: '"카페에 간 사람" 과 "도서관에 간 사람" 중 둘 다 간 사람만 찾아라 — 교집합.',
      en: 'People who went to BOTH the café and library — that\'s an intersection.',
    },
    abstract: {
      ko: 'A ∪ B = A 또는 B 의 원소. A ∩ B = 둘 다. Aᶜ = U 에서 A 를 뺀 것. |A∪B| = |A|+|B|−|A∩B|.',
      en: 'A ∪ B (or), A ∩ B (and), Aᶜ (complement). |A∪B| = |A|+|B|−|A∩B|.',
    },
    worked: {
      ko: '|A|=30, |B|=20, |A∩B|=10. |A∪B|?',
      en: '|A|=30, |B|=20, |A∩B|=10. |A∪B|?',
      steps: [
        { math: '30 + 20 − 10 = 40', narrationKo: '포함-배제.', narrationEn: 'Inclusion-exclusion.' },
      ],
    },
    retrieval: {
      promptKo: 'A={1,2,3}, B={2,3,4}. A∩B?',
      promptEn: 'A={1,2,3}, B={2,3,4}. A∩B?',
      accept: ['{2,3}', '2,3'],
      explainKo: '공통 원소.',
      explainEn: 'Common elements.',
    },
  },

  'C11-CH02-RELATIONS-FUNCTIONS': {
    hook: {
      ko: '"사람 → 어머니" 는 함수일까? 모든 사람에게 어머니가 단 한 명이라면 — 그렇다.',
      en: '"Person → their mother" — is it a function? Yes: every person has exactly one mother.',
    },
    abstract: {
      ko: 'f: A → B 는 각 a ∈ A 에 단 하나의 b ∈ B 대응. 정의역(A), 공역(B), 치역(f(A) ⊆ B).',
      en: 'f: A → B assigns each a ∈ A exactly one b ∈ B. Domain A, codomain B, range f(A) ⊆ B.',
    },
    worked: {
      ko: 'f(x) = x² 의 ℝ → ℝ 정의에서 치역.',
      en: 'Range of f: ℝ → ℝ, f(x) = x².',
      steps: [
        { math: 'x² ≥ 0',          narrationKo: '제곱은 음수가 아님.', narrationEn: 'Squares are non-negative.' },
        { math: '치역 = [0, ∞)', narrationKo: '모든 음 아닌 수.',     narrationEn: 'All non-negatives.' },
      ],
    },
    misconception: {
      wrongKo: '관계가 모두 함수다.',
      wrongEn: 'Every relation is a function.',
      whyKo: '한 입력에 여러 출력이 있어도 함수라고 잘못 생각.',
      whyEn: 'Allowed one input to map to multiple outputs.',
      correctKo: '함수 = "한 입력에 정확히 한 출력". 그렇지 않으면 단순 관계.',
      correctEn: 'Function = exactly one output per input; else just a relation.',
    },
    retrieval: {
      promptKo: 'f(x) = 2x + 1, f(3) = ?',
      promptEn: 'f(x) = 2x + 1, f(3)?',
      accept: ['7'],
      explainKo: '2·3+1.',
      explainEn: '2·3+1.',
    },
  },

  'C11-CH03-TRIG-FUNCTIONS': {
    hook: {
      ko: '90° 보다 큰 각의 사인은? 직각삼각형으로는 표현 불가 — 단위원이 답.',
      en: 'sin of an angle > 90°? Right triangles fail — the unit circle takes over.',
    },
    abstract: {
      ko: '단위원 위 점 (cos θ, sin θ). 호도법: π = 180°. sin²+cos² = 1.',
      en: 'Point (cos θ, sin θ) on the unit circle. Radians: π = 180°. sin² + cos² = 1.',
    },
    worked: {
      ko: 'sin(120°) 와 cos(120°).',
      en: 'sin(120°), cos(120°).',
      steps: [
        { math: '120° = 180° − 60°', narrationKo: '기준각 60°.', narrationEn: 'Reference 60°.' },
        { math: 'sin = sin 60° = √3/2', narrationKo: '2사분면 sin > 0.', narrationEn: 'Quadrant II, sin > 0.' },
        { math: 'cos = −cos 60° = −1/2', narrationKo: '2사분면 cos < 0.', narrationEn: 'Quadrant II, cos < 0.' },
      ],
    },
    misconception: {
      wrongKo: 'sin(A + B) = sin A + sin B',
      wrongEn: 'sin(A + B) = sin A + sin B',
      whyKo: '함수가 +에 분배된다고 잘못 가정.',
      whyEn: 'Treated sin as if it distributed over +.',
      correctKo: 'sin(A+B) = sin A cos B + cos A sin B (덧셈정리).',
      correctEn: 'sin(A+B) = sin A cos B + cos A sin B.',
    },
    retrieval: {
      promptKo: 'cos 0° = ?',
      promptEn: 'cos 0° = ?',
      accept: ['1'],
      explainKo: '단위원 x 좌표 (1,0).',
      explainEn: 'Unit circle x at (1,0).',
    },
  },

  'C11-CH04-COMPLEX': {
    hook: {
      ko: 'x² + 1 = 0 의 해는? 실수에는 없다 — 새로운 수 i 를 정의하면 풀린다.',
      en: 'No real x solves x² + 1 = 0 — define i = √−1 and it does.',
    },
    abstract: {
      ko: 'i² = −1. z = a + bi (a 실부, b 허부). |z| = √(a²+b²). 켤레 z̄ = a − bi.',
      en: 'i² = −1. z = a + bi (real a, imaginary b). |z| = √(a²+b²). Conjugate z̄ = a − bi.',
    },
    worked: {
      ko: '(2 + 3i)(1 − i).',
      en: '(2 + 3i)(1 − i).',
      steps: [
        { math: '2 − 2i + 3i − 3i²',   narrationKo: '분배.', narrationEn: 'Distribute.' },
        { math: '2 + i − 3(−1)',       narrationKo: 'i² 치환.', narrationEn: 'Substitute i².' },
        { math: '= 5 + i',             narrationKo: '정리.',  narrationEn: 'Simplify.' },
      ],
    },
    retrieval: {
      promptKo: 'i³ = ?',
      promptEn: 'i³ = ?',
      accept: ['-i', '−i'],
      explainKo: 'i·i² = −i.',
      explainEn: 'i·i² = −i.',
    },
  },

  'C11-CH05-LINEAR-INEQ': {
    hook: {
      ko: '−2x < 6 의 풀이는 x < −3? 음수로 나눌 땐 부등호 뒤집힌다 — 한 가지 함정.',
      en: 'Solve −2x < 6: is x < −3? Multiplying by a negative flips the inequality — the one trap.',
    },
    abstract: {
      ko: 'ax + b ≷ c. 양변에 같은 수 더하기·빼기는 부등호 보존. 음수 곱·나눗셈은 뒤집기.',
      en: 'ax + b ≷ c. Add/subtract preserves; multiply/divide by negative flips.',
    },
    worked: {
      ko: '풀이: −2x < 6',
      en: 'Solve: −2x < 6',
      steps: [
        { math: '÷(−2), 부등호 뒤집기', narrationKo: '음수 나눔.', narrationEn: 'Negative division.' },
        { math: 'x > −3',                narrationKo: '결과.',   narrationEn: 'Result.' },
      ],
    },
    misconception: {
      wrongKo: '−2x < 6 ⇒ x < −3.',
      wrongEn: '−2x < 6 ⇒ x < −3.',
      whyKo: '부등호를 뒤집지 않음.',
      whyEn: 'Forgot to flip the inequality.',
      correctKo: '음수로 나눌 때 항상 뒤집기 ⇒ x > −3.',
      correctEn: 'Flip when dividing by negative ⇒ x > −3.',
    },
    retrieval: {
      promptKo: '3x − 1 ≥ 8 풀이.',
      promptEn: 'Solve 3x − 1 ≥ 8.',
      accept: ['x≥3', 'x >= 3', 'x ≥ 3'],
      explainKo: '3x ≥ 9.',
      explainEn: '3x ≥ 9.',
    },
  },

  'C11-CH06-PERMUTATIONS': {
    hook: {
      ko: '5명에서 3명을 뽑아 줄 세우는 방법 vs 단순 선택. 순서 여부가 모든 것을 갈라놓는다.',
      en: 'Pick 3 of 5 — order matters? That decision changes everything.',
    },
    abstract: {
      ko: 'ⁿPᵣ = n!/(n−r)! (순서 O).  ⁿCᵣ = n!/(r!(n−r)!) (순서 X).',
      en: 'ⁿPᵣ = n!/(n−r)! (ordered). ⁿCᵣ = n!/(r!(n−r)!) (unordered).',
    },
    worked: {
      ko: '5명 중 3명 선택 (위원회).',
      en: 'Choose 3 of 5 (committee).',
      steps: [
        { math: '⁵C₃ = 5!/(3!·2!)', narrationKo: '순서 무시.', narrationEn: 'Unordered.' },
        { math: '= 10',              narrationKo: '값.',     narrationEn: 'Evaluate.' },
      ],
    },
    misconception: {
      wrongKo: '순서 있는 선택을 ⁿCᵣ 로 계산.',
      wrongEn: 'Used ⁿCᵣ for an ordered count.',
      whyKo: '"순서 중요" 키워드 미체크.',
      whyEn: 'Missed the "ordered" cue.',
      correctKo: '"줄세우기·자리·1등 2등"이면 ⁿPᵣ.',
      correctEn: 'Words like "arrange, rank, line up" → ⁿPᵣ.',
    },
    retrieval: {
      promptKo: '⁶C₂ = ?',
      promptEn: '⁶C₂ = ?',
      accept: ['15'],
      explainKo: '6!/(2!·4!) = 15.',
      explainEn: '6!/(2!·4!) = 15.',
    },
  },

  'C11-CH07-BINOMIAL': {
    hook: {
      ko: '(x + y)¹⁰ 을 전개하면 항이 11개. 각 항의 계수는? 파스칼 삼각형이 답을 준다.',
      en: 'Expand (x + y)¹⁰ — 11 terms. Their coefficients? Pascal\'s triangle has them.',
    },
    abstract: {
      ko: '(a + b)ⁿ = Σ ⁿCᵣ aⁿ⁻ʳ bʳ. r-번째 항: Tᵣ₊₁ = ⁿCᵣ aⁿ⁻ʳ bʳ.',
      en: '(a + b)ⁿ = Σ ⁿCᵣ aⁿ⁻ʳ bʳ. (r+1)-th term: Tᵣ₊₁ = ⁿCᵣ aⁿ⁻ʳ bʳ.',
    },
    worked: {
      ko: '(x + 2)⁵ 의 x³ 항.',
      en: 'x³ coefficient in (x + 2)⁵.',
      steps: [
        { math: 'T = ⁵C₂ · x³ · 2²', narrationKo: '항 공식.', narrationEn: 'Term formula.' },
        { math: '= 10 · x³ · 4 = 40x³', narrationKo: '계산.', narrationEn: 'Compute.' },
      ],
    },
    retrieval: {
      promptKo: '(1 + x)⁴ 의 x² 계수.',
      promptEn: 'x² coefficient in (1+x)⁴.',
      accept: ['6'],
      explainKo: '⁴C₂.',
      explainEn: '⁴C₂.',
    },
  },

  'C11-CH08-SEQUENCES': {
    hook: {
      ko: '체스판 첫 칸에 쌀 1톨, 다음 칸 2톨, 그 다음 4톨,… 마지막 칸까지 합은 천문학적.',
      en: 'One grain on the first square, two on the next, four on the next… the total is astronomical.',
    },
    abstract: {
      ko: '등비수열 (G.P.) aₙ = a·rⁿ⁻¹. Sₙ = a(rⁿ − 1)/(r − 1) (r ≠ 1).',
      en: 'Geometric: aₙ = a·rⁿ⁻¹. Sₙ = a(rⁿ − 1)/(r − 1) for r ≠ 1.',
    },
    worked: {
      ko: '1+2+4+8+16+32',
      en: '1+2+4+8+16+32',
      steps: [
        { math: 'a=1, r=2, n=6',            narrationKo: '파라미터.', narrationEn: 'Identify.' },
        { math: 'S = 1·(2⁶ − 1)/(2 − 1) = 63', narrationKo: '공식.', narrationEn: 'Apply formula.' },
      ],
    },
    retrieval: {
      promptKo: '등비수열 2, 6, 18, … 의 공비.',
      promptEn: 'Common ratio of 2, 6, 18,…',
      accept: ['3'],
      explainKo: '6/2.',
      explainEn: '6/2.',
    },
  },

  'C11-CH09-STRAIGHT-LINES': {
    hook: {
      ko: '같은 직선을 한 점·기울기, 두 점, x·y 절편 등 여러 방식으로 표현 — 모두 같은 직선.',
      en: 'A line can be described point-slope, two-point, intercept — same line in different clothing.',
    },
    abstract: {
      ko: '기울기-절편: y = mx + c. 점-기울기: y − y₁ = m(x − x₁). 절편형: x/a + y/b = 1.',
      en: 'Slope-intercept y = mx + c. Point-slope y − y₁ = m(x − x₁). Intercept x/a + y/b = 1.',
    },
    worked: {
      ko: '점 (2, 3), 기울기 4 인 직선의 식.',
      en: 'Line through (2,3) with slope 4.',
      steps: [
        { math: 'y − 3 = 4(x − 2)', narrationKo: '점-기울기.', narrationEn: 'Point-slope.' },
        { math: 'y = 4x − 5',        narrationKo: '정리.',   narrationEn: 'Simplify.' },
      ],
    },
    retrieval: {
      promptKo: 'y = 3x − 2 의 y 절편.',
      promptEn: 'y-intercept of y = 3x − 2.',
      accept: ['-2', '−2'],
      explainKo: 'x=0 시 y.',
      explainEn: 'Set x = 0.',
    },
  },

  'C11-CH10-CONIC': {
    hook: {
      ko: '원·타원·포물선·쌍곡선 — 모두 원뿔을 평면으로 자른 단면. 어떻게 자르느냐가 모양을 정한다.',
      en: 'Circle, ellipse, parabola, hyperbola — slices of a cone; the slice angle decides the shape.',
    },
    abstract: {
      ko: '원: x² + y² = r². 타원: x²/a² + y²/b² = 1. 포물선: y² = 4ax. 쌍곡선: x²/a² − y²/b² = 1.',
      en: 'Circle x² + y² = r². Ellipse x²/a² + y²/b² = 1. Parabola y² = 4ax. Hyperbola x²/a² − y²/b² = 1.',
    },
    worked: {
      ko: 'x² + y² = 25 의 반지름.',
      en: 'Radius of x² + y² = 25.',
      steps: [
        { math: 'r² = 25 ⇒ r = 5', narrationKo: '표준형 비교.', narrationEn: 'Standard form.' },
      ],
    },
    retrieval: {
      promptKo: '타원 x²/9 + y²/4 = 1 의 장축 길이.',
      promptEn: 'Major axis of x²/9 + y²/4 = 1.',
      accept: ['6'],
      explainKo: '2a = 2·3.',
      explainEn: '2a = 2·3.',
    },
  },

  'C11-CH11-3D-INTRO': {
    hook: {
      ko: '평면에서 점은 (x, y) — 공간에서는 (x, y, z). z 축이 더해지면 모든 공식이 한 차원 확장된다.',
      en: 'Plane: (x, y). Space: (x, y, z). Add z and every formula grows by one dimension.',
    },
    abstract: {
      ko: '거리 d = √[Δx² + Δy² + Δz²]. 중점도 좌표별 평균.',
      en: 'Distance d = √[Δx² + Δy² + Δz²]. Midpoint = component-wise average.',
    },
    worked: {
      ko: '(1, 2, 3), (4, 6, 3) 거리.',
      en: 'Distance from (1,2,3) to (4,6,3).',
      steps: [
        { math: 'Δ = (3, 4, 0)',     narrationKo: '차.',   narrationEn: 'Differences.' },
        { math: 'd = √(9+16+0) = 5', narrationKo: '계산.', narrationEn: 'Compute.' },
      ],
    },
    retrieval: {
      promptKo: '(0,0,0), (1,2,2) 거리.',
      promptEn: 'Distance (0,0,0) to (1,2,2).',
      accept: ['3'],
      explainKo: '√(1+4+4).',
      explainEn: '√(1+4+4).',
    },
  },

  'C11-CH12-LIMITS-DERIVATIVES': {
    hook: {
      ko: '"가까이 다가갈 때 값" 이라는 한 아이디어가 미적분 전체의 토대다.',
      en: '"The value as you approach" — this single idea founds all of calculus.',
    },
    abstract: {
      ko: 'lim_{x→a} f(x) = L: x 가 a 에 다가갈 때 f(x) 가 L 에 다가감. 미분: f\'(x) = lim h→0 (f(x+h)−f(x))/h.',
      en: 'lim_{x→a} f(x) = L. Derivative f\'(x) = lim h→0 (f(x+h)−f(x))/h.',
    },
    worked: {
      ko: 'f(x) = x² 의 도함수.',
      en: 'Derivative of f(x) = x².',
      steps: [
        { math: '(x+h)² − x² = 2xh + h²',   narrationKo: '전개.',   narrationEn: 'Expand.' },
        { math: '/h ⇒ 2x + h',               narrationKo: 'h 나눔.', narrationEn: 'Divide.' },
        { math: 'h → 0 ⇒ f\'(x) = 2x',       narrationKo: '극한.',  narrationEn: 'Limit.' },
      ],
    },
    misconception: {
      wrongKo: '극한값 = 함수값 (항상).',
      wrongEn: 'limit equals function value (always).',
      whyKo: '연속이 아니면 다를 수 있음을 간과.',
      whyEn: 'Forgot they can differ at discontinuities.',
      correctKo: '연속이어야 lim_{x→a} f(x) = f(a). 그 외엔 다를 수 있다.',
      correctEn: 'They match only if f is continuous at a.',
    },
    retrieval: {
      promptKo: 'd/dx (x³) = ?',
      promptEn: 'd/dx (x³) = ?',
      accept: ['3x²', '3x^2'],
      explainKo: 'n x^(n-1).',
      explainEn: 'n·x^(n-1).',
    },
  },

  'C11-CH13-STATISTICS-III': {
    hook: {
      ko: '두 반의 평균이 같다 — 그래도 한 반이 더 들쭉날쭉할 수 있다. 표준편차가 그 차이를 말한다.',
      en: 'Two classes share a mean — yet one is more scattered. SD reveals the difference.',
    },
    abstract: {
      ko: '분산 σ² = Σ(xᵢ − x̄)²/n. 표준편차 σ = √σ².',
      en: 'Variance σ² = Σ(xᵢ − x̄)²/n. Standard deviation σ = √σ².',
    },
    worked: {
      ko: '{2, 4, 4, 6} 의 표준편차.',
      en: 'SD of {2, 4, 4, 6}.',
      steps: [
        { math: '평균 = 4', narrationKo: '평균.', narrationEn: 'Mean.' },
        { math: '편차² = 4, 0, 0, 4 ⇒ 합 8', narrationKo: '제곱편차 합.', narrationEn: 'Sum sq dev.' },
        { math: 'σ² = 2, σ = √2 ≈ 1.41', narrationKo: '√.', narrationEn: '√.' },
      ],
    },
    retrieval: {
      promptKo: '{5, 5, 5, 5} 의 분산.',
      promptEn: 'Variance of {5, 5, 5, 5}.',
      accept: ['0'],
      explainKo: '모두 평균과 같음.',
      explainEn: 'All equal to mean.',
    },
  },

  'C11-CH14-PROBABILITY-II': {
    hook: {
      ko: '"카드가 빨강이거나 그림 카드일 확률" — 이중 계산을 피하려면 집합 대수로.',
      en: '"Red or face card" — set algebra prevents double-counting.',
    },
    abstract: {
      ko: 'P(A ∪ B) = P(A) + P(B) − P(A ∩ B). 독립 사건: P(A ∩ B) = P(A) · P(B).',
      en: 'P(A ∪ B) = P(A) + P(B) − P(A ∩ B). Independent: P(A ∩ B) = P(A) · P(B).',
    },
    worked: {
      ko: '52장 카드에서 빨강 또는 그림카드 확률.',
      en: 'P(red or face) from 52 cards.',
      steps: [
        { math: 'P(빨강) = 26/52', narrationKo: '빨강 절반.', narrationEn: 'Half are red.' },
        { math: 'P(그림) = 12/52', narrationKo: 'J/Q/K × 4.', narrationEn: 'J/Q/K × 4.' },
        { math: 'P(둘 다) = 6/52', narrationKo: '빨강 J/Q/K.', narrationEn: 'Red J/Q/K.' },
        { math: '합 − 교 = 32/52 = 8/13', narrationKo: '포함-배제.', narrationEn: 'Inclusion-exclusion.' },
      ],
    },
    retrieval: {
      promptKo: '주사위 2개 합이 7 일 확률.',
      promptEn: 'P(sum of two dice = 7).',
      accept: ['1/6', '6/36'],
      explainKo: '(1,6)..(6,1) 6 가지 / 36.',
      explainEn: '6 favourable out of 36.',
    },
  },
};
