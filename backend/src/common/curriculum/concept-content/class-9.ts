/**
 * Class 9 (NCERT IX) — 챕터별 개념학습 콘텐츠 (production grade).
 * 모든 12 챕터 7단계 완비.
 */

import { ChapterContentMap } from './types';

export const CLASS_9_CONTENT: ChapterContentMap = {
  'C9-CH01-NUMBER-SYSTEMS': {
    hook: {
      ko: '수직선의 모든 점에 수가 존재할까? √2 는 그 빈 자리를 가리키는 첫 증거다.',
      en: 'Does every point on the number line have a number? √2 is the first witness to the gap.',
    },
    concrete: {
      ko: '√2 = 1.41421356… 끝없이 이어지고 패턴도 없음. 1/3 = 0.3333… 는 반복(순환). π = 3.14159…도 무리수. e 도.',
      en: '√2 = 1.41421356… never ends, never repeats. 1/3 = 0.3333… repeats (rational). π and e also irrational.',
    },
    pictorial: {
      ko: '수직선 위 √2 위치: 한 변 1 인 정사각형의 대각선 길이 = √2. 컴퍼스로 옮겨 정확히 표시 가능.',
      en: 'Locate √2: diagonal of a unit square has length √2; transfer with a compass to the number line.',
    },
    abstract: {
      ko: '실수 ℝ = ℚ ∪ (무리수). 무리수: 순환·종료하지 않는 소수 (예: √2, π).',
      en: 'ℝ = ℚ ∪ irrationals. Irrationals: non-terminating, non-repeating decimals (e.g. √2, π).',
    },
    worked: {
      ko: '√2 가 무리수임을 보이는 핵심 아이디어.',
      en: 'Key idea of √2\'s irrationality proof.',
      steps: [
        { math: '√2 = p/q (서로소) 가정', narrationKo: '귀류법.', narrationEn: 'Proof by contradiction.' },
        { math: '2q² = p² ⇒ p 짝수', narrationKo: 'p² 짝수 ⇒ p 짝수.', narrationEn: 'p² even ⇒ p even.' },
        { math: 'p=2k ⇒ q² = 2k² ⇒ q 짝수', narrationKo: 'q 도 짝수.', narrationEn: 'q also even.' },
        { math: 'p, q 서로소 모순', narrationKo: '귀류 완료.', narrationEn: 'Contradiction.' },
      ],
    },
    misconception: {
      wrongKo: '"π = 22/7" (정확)',
      wrongEn: '"π = 22/7" exactly',
      whyKo: '22/7 은 근사값일 뿐. π 는 무리수.',
      whyEn: '22/7 is an approximation; π is irrational.',
      correctKo: 'π 는 분수로 표기 불가; 22/7 은 0.04% 정확도의 근사.',
      correctEn: 'π has no fractional form; 22/7 is just a 0.04% approximation.',
    },
    retrieval: {
      promptKo: '√(16) 은 유리수인가 무리수인가?',
      promptEn: 'Is √16 rational or irrational?',
      accept: ['유리수', 'rational', '4'],
      explainKo: '√16 = 4, 유리수.',
      explainEn: '√16 = 4 — rational.',
    },
  },

  'C9-CH02-POLYNOMIALS': {
    hook: {
      ko: 'p(x) = x² − 5x + 6 의 두 영점을 알면, p(x) 를 한 줄로 곱셈 표기할 수 있다.',
      en: 'Know the zeros of p(x) = x² − 5x + 6, and you can rewrite p(x) in factored form instantly.',
    },
    concrete: {
      ko: 'x² + 7x + 12: 합 7, 곱 12 ⇒ (3, 4). 인수분해 (x+3)(x+4). 검산 전개: x² + 7x + 12 ✓.',
      en: 'x² + 7x + 12: sum 7, product 12 ⇒ (3, 4). Factored as (x+3)(x+4). Verify by expansion.',
    },
    pictorial: {
      ko: '이차식 그래프는 포물선. 영점 = x 축 교차. 양수 a 면 위로 열린 U, 음수면 ∩ 모양.',
      en: 'Quadratic graph is a parabola. Zeros = x-axis crossings. Positive a opens up, negative opens down.',
    },
    abstract: {
      ko: '인수분해(이차): x² + bx + c 에서 합 b, 곱 c 가 되는 두 수로 분해. 합-곱 트릭.',
      en: 'Factor x² + bx + c by finding two numbers that sum to b and multiply to c.',
    },
    worked: {
      ko: '인수분해: x² + 7x + 12',
      en: 'Factor: x² + 7x + 12',
      steps: [
        { math: '합 7, 곱 12 ⇒ (3, 4)', narrationKo: '두 수 찾기.', narrationEn: 'Find the pair.' },
        { math: '= (x + 3)(x + 4)',     narrationKo: '인수 형태.',  narrationEn: 'Factored form.' },
      ],
    },
    misconception: {
      wrongKo: 'x² + 7x + 12 = (x + 6)(x + 2) (한쪽이 합/한쪽이 곱이 안 됨)',
      wrongEn: 'x² + 7x + 12 = (x + 6)(x + 2) (sum/product mismatch)',
      whyKo: '6+2=8, 6·2=12 — 합이 일치하지 않는다.',
      whyEn: '6+2=8 ≠ 7; sum check failed.',
      correctKo: '둘 다 일치해야 한다: (3,4) ⇒ 합 7, 곱 12 ✓.',
      correctEn: 'Both conditions must hold: (3,4) gives sum 7, product 12 ✓.',
    },
    retrieval: {
      promptKo: '인수분해 x² − 5x + 6.',
      promptEn: 'Factor x² − 5x + 6.',
      accept: ['(x-2)(x-3)', '(x-3)(x-2)', '(x−2)(x−3)'],
      explainKo: '합 −5, 곱 6 ⇒ (−2, −3).',
      explainEn: 'Sum −5, product 6 ⇒ (−2, −3).',
    },
  },

  'C9-CH03-COORDINATE-GEOM': {
    hook: {
      ko: '두 점 사이의 거리를 구하는 데 자가 필요할까? 좌표만 있으면 직각삼각형이 답을 준다.',
      en: 'Need a ruler to find a distance? Coordinates + Pythagoras give the answer.',
    },
    concrete: {
      ko: 'A(2,3), B(5,7): Δx=3, Δy=4. 거리 = √(9+16) = 5. 같은 두 점 중점 = ((2+5)/2, (3+7)/2) = (3.5, 5).',
      en: 'A(2,3), B(5,7): Δx=3, Δy=4. Distance = √(9+16) = 5. Midpoint = (3.5, 5).',
    },
    pictorial: {
      ko: '두 점 사이 직선을 빗변으로 두고 가로(Δx) 세로(Δy) 직각삼각형. 거리 = 빗변 = √(Δx²+Δy²).',
      en: 'Treat the segment as the hypotenuse of a right triangle with legs Δx and Δy. Distance = √(Δx² + Δy²).',
    },
    abstract: {
      ko: '거리 d = √[(x₂−x₁)² + (y₂−y₁)²]. 중점 M = ((x₁+x₂)/2, (y₁+y₂)/2).',
      en: 'Distance d = √[(x₂−x₁)² + (y₂−y₁)²]. Midpoint M = average of coordinates.',
    },
    worked: {
      ko: 'A(2, 3), B(5, 7) 사이 거리.',
      en: 'Distance from A(2, 3) to B(5, 7).',
      steps: [
        { math: 'Δx = 3, Δy = 4', narrationKo: '차 계산.', narrationEn: 'Compute differences.' },
        { math: 'd = √(9 + 16) = √25 = 5', narrationKo: '피타고라스.', narrationEn: 'Pythagoras.' },
      ],
    },
    misconception: {
      wrongKo: '두 점 사이 거리 = |x₂ − x₁| + |y₂ − y₁|',
      wrongEn: 'Distance = |x₂ − x₁| + |y₂ − y₁|',
      whyKo: '맨해튼 거리(택시 거리)와 유클리드 거리 혼동.',
      whyEn: 'Manhattan vs Euclidean confusion.',
      correctKo: 'd = √[(Δx)² + (Δy)²]. 절댓값 합이 아닌 제곱합의 √.',
      correctEn: 'd = √[(Δx)² + (Δy)²]. Square first, then √.',
    },
    retrieval: {
      promptKo: '(0,0), (6, 8) 거리.',
      promptEn: 'Distance from (0,0) to (6, 8).',
      accept: ['10'],
      explainKo: '√(36+64) = 10.',
      explainEn: '√(36+64) = 10.',
    },
  },

  'C9-CH04-LINEAR-EQ-TWO-VAR': {
    hook: {
      ko: 'x + y = 5 를 만족하는 (x, y) 는 한 쌍? 무한히 많다 — 좌표평면 위 한 직선.',
      en: 'How many (x, y) satisfy x + y = 5? Infinitely many — a whole line.',
    },
    concrete: {
      ko: 'x + y = 5 의 해: (0,5), (1,4), (2,3), (3,2), (4,1), (5,0), 그리고 음수·소수까지 무한. 모두 한 직선 위.',
      en: 'x + y = 5 solutions: (0,5), (1,4), (2,3), …, plus negatives and fractions — all on one line.',
    },
    pictorial: {
      ko: '평면에 (x,y) 점을 모두 찍으면 직선. 기울기 = −1 (계수 비), y 절편 = 5.',
      en: 'Plot all solutions → a line. Slope = −1 (from coefficients), y-intercept = 5.',
    },
    abstract: {
      ko: 'ax + by = c 의 해집합은 좌표평면의 한 직선. 두 개의 식이 있으면 교점이 해.',
      en: 'Solutions of ax + by = c form a line. Two equations meet at the intersection.',
    },
    worked: {
      ko: 'x + y = 5, x − y = 1 풀이.',
      en: 'Solve x + y = 5 and x − y = 1.',
      steps: [
        { math: '두 식 합: 2x = 6 ⇒ x = 3', narrationKo: '소거.', narrationEn: 'Eliminate.' },
        { math: 'y = 5 − 3 = 2',             narrationKo: '대입.', narrationEn: 'Back-substitute.' },
      ],
    },
    misconception: {
      wrongKo: 'ax + by = c 의 해는 단 하나의 (x, y).',
      wrongEn: 'ax + by = c has a unique solution (x, y).',
      whyKo: '한 식 + 두 변수 = 무한 해 (직선)인 것을 놓침.',
      whyEn: 'One equation, two unknowns ⇒ infinitely many (a whole line).',
      correctKo: '식이 하나면 해가 무한. 두 변수에 두 식이 있어야 일반적으로 한 해.',
      correctEn: 'Need a second equation (two variables, two equations) to pin down a unique pair.',
    },
    retrieval: {
      promptKo: 'x + y = 7, x − y = 1 ⇒ (x, y) = ?',
      promptEn: 'Solve x + y = 7, x − y = 1 → (x, y)?',
      accept: ['(4,3)', '4,3', 'x=4,y=3'],
      explainKo: '2x = 8.',
      explainEn: '2x = 8.',
    },
  },

  'C9-CH05-EUCLID': {
    hook: {
      ko: '"두 점을 지나는 직선은 단 하나" — 이런 자명해 보이는 사실이 모든 기하학의 출발점.',
      en: '"Through two points, exactly one line." Such "obvious" axioms begin all geometry.',
    },
    concrete: {
      ko: '유클리드의 5 공준 중 하나: "임의의 두 점을 잇는 직선이 존재한다". 마치 게임의 규칙처럼 처음에 가정으로 받음.',
      en: 'Euclid\'s first postulate: "A straight line may be drawn from any point to any point." Like rules of a game accepted upfront.',
    },
    pictorial: {
      ko: '공리 → 정의 → 정리. 트리 구조. 모든 정리는 결국 몇 안 되는 공리에서 유도.',
      en: 'Axioms → definitions → theorems, forming a tree. Every theorem traces back to a few axioms.',
    },
    abstract: {
      ko: '공리(axiom) = 가정으로 받는 명제. 정리(theorem) = 공리에서 논리로 도출된 명제.',
      en: 'Axiom = assumed truth. Theorem = derived from axioms by logic.',
    },
    worked: {
      ko: '"같은 것에 같은 것을 더하면 같다" 라는 공리로 a = b ⇒ a+5 = b+5 도출.',
      en: '"Equals added to equals are equal": a = b ⇒ a + 5 = b + 5.',
      steps: [
        { math: '가정: a = b', narrationKo: '시작.', narrationEn: 'Start.' },
        { math: '5 = 5',       narrationKo: '자기 동등.', narrationEn: 'Trivial.' },
        { math: 'a + 5 = b + 5', narrationKo: '공리 적용.', narrationEn: 'Apply axiom.' },
      ],
    },
    misconception: {
      wrongKo: '공리는 증명할 수 있다.',
      wrongEn: 'Axioms can be proven.',
      whyKo: '공리와 정리를 구분 못 함.',
      whyEn: 'Failed to distinguish axiom from theorem.',
      correctKo: '공리는 출발점 — 증명 대상이 아님. 정리는 공리에서 유도 가능.',
      correctEn: 'Axioms are starting points — not proven. Theorems are derived from them.',
    },
    retrieval: {
      promptKo: '두 점을 지나는 직선의 개수는?',
      promptEn: 'How many lines through two distinct points?',
      accept: ['1', '하나', 'one'],
      explainKo: '유클리드 1번 공리.',
      explainEn: 'Euclid\'s first postulate.',
    },
  },

  'C9-CH06-LINES-ANGLES-II': {
    hook: {
      ko: '평행선과 횡단선이 만드는 8개 각 사이엔 단 한 가지 사실만 알면 모두 풀린다.',
      en: 'Eight angles between parallels & a transversal — one fact unlocks them all.',
    },
    concrete: {
      ko: '평행선 두 개를 횡단선으로 자르면 8개 각. 그 중 4개가 한 종류, 나머지 4개가 보각. 동위각 130° 면 엇각도 130°, 동측내각은 50°.',
      en: 'Two parallels cut by a transversal give 8 angles in two groups (supplementary). If one corresponding angle is 130°, all "same-side" angles are 130°, co-interior 50°.',
    },
    pictorial: {
      ko: 'F, Z, C 모양: 동위각=F, 엇각=Z, 동측내각=C 자세히 보면 평행 패턴 식별.',
      en: 'Spot F, Z, C shapes: F = corresponding, Z = alternate, C = co-interior. Visual memory shortcut.',
    },
    abstract: {
      ko: '평행 ⇒ 동위각·엇각 같다, 동측내각 합 180°. 역도 성립 (각이 그러하면 평행).',
      en: 'Parallel ⇒ corresponding/alternate equal, co-interior sum 180°. Converses also hold.',
    },
    worked: {
      ko: '평행선 사이 동위각 130°. 동측내각은?',
      en: 'Corresponding angle 130° between parallels. Co-interior?',
      steps: [
        { math: '동측내각 = 180° − 130° = 50°', narrationKo: '동측내각은 동위각의 보각.', narrationEn: 'Supplement of corresponding.' },
      ],
    },
    misconception: {
      wrongKo: '두 직선이 같은 각을 만들기만 하면 평행.',
      wrongEn: 'Lines making any equal angles are parallel.',
      whyKo: '어느 종류 각(동위/엇각/동측내각)인지 구분 X.',
      whyEn: 'Didn\'t specify which type of angles must match.',
      correctKo: '동위각 또는 엇각이 같으면 평행. 임의의 각이 같다고 되는 게 아님.',
      correctEn: 'Parallel iff corresponding (or alternate) angles are equal — not any pair.',
    },
    retrieval: {
      promptKo: '평행선 엇각이 60° 이면 동위각은?',
      promptEn: 'Alternate angle 60° between parallels. Corresponding?',
      accept: ['60', '60°'],
      explainKo: '엇각과 동위각은 같다.',
      explainEn: 'Alternate = corresponding.',
    },
  },

  'C9-CH07-TRIANGLES-II': {
    hook: {
      ko: '두 삼각형이 정확히 같은지 어떻게 빠르게 확인할까? 모든 변·각을 안 재도 된다 — 합동 조건.',
      en: 'How to verify two triangles match without measuring all sides? Use congruence tests.',
    },
    concrete: {
      ko: 'SAS: AB=DE=3, ∠B=∠E=60°, BC=EF=4 ⇒ △ABC ≅ △DEF. 모든 6 요소를 잴 필요 없이 3개만으로 충분.',
      en: 'SAS: AB=DE=3, ∠B=∠E=60°, BC=EF=4 ⇒ △ABC ≅ △DEF. 3 pieces of info, not 6.',
    },
    pictorial: {
      ko: '삼각형을 마치 자물쇠처럼 — 어떤 3 정보(SSS/SAS/ASA/AAS/RHS)면 정확히 한 모양으로 고정.',
      en: 'Think of a triangle as a lock — any of the SSS/SAS/ASA/AAS/RHS triples uniquely determines it.',
    },
    abstract: {
      ko: '합동 조건: SSS, SAS, ASA, AAS, RHS. 어떤 조건이든 만족하면 두 삼각형 완전 일치.',
      en: 'Congruence: SSS, SAS, ASA, AAS, RHS. Any one suffices for full match.',
    },
    worked: {
      ko: 'AB=DE, BC=EF, ∠B=∠E ⇒ ?',
      en: 'AB=DE, BC=EF, ∠B=∠E ⇒ ?',
      steps: [
        { math: 'SAS 만족', narrationKo: '두 변과 끼인 각.', narrationEn: 'Two sides + included angle.' },
        { math: '△ABC ≅ △DEF', narrationKo: '합동 결론.', narrationEn: 'Congruent.' },
      ],
    },
    misconception: {
      wrongKo: 'SSA 조건도 합동을 보장한다.',
      wrongEn: 'SSA also forces congruence.',
      whyKo: 'SSA 는 두 가지 다른 삼각형이 가능 (ambiguous case).',
      whyEn: 'SSA admits two triangles (ambiguous case).',
      correctKo: 'SSA 는 일반적으로 합동 보장 X. 직각이 포함되면 RHS 로 가능.',
      correctEn: 'SSA generally fails; only RHS (right angle) version works.',
    },
    retrieval: {
      promptKo: 'AB=DE, ∠A=∠D, ∠B=∠E ⇒ 어느 조건?',
      promptEn: 'AB=DE, ∠A=∠D, ∠B=∠E ⇒ which test?',
      accept: ['ASA'],
      explainKo: '한 변과 양쪽 각.',
      explainEn: 'Side between two angles.',
    },
  },

  'C9-CH08-QUADRILATERALS': {
    hook: {
      ko: '평행사변형의 대각선은 서로를 어떻게 자를까? 중점에서 만난다 — 모든 성질의 뿌리.',
      en: 'How do parallelogram diagonals meet? At their midpoints — the root of all its properties.',
    },
    concrete: {
      ko: '평행사변형 ABCD: AB ∥ CD, AB = CD = 5; AD ∥ BC, AD = BC = 3. ∠A + ∠B = 180°.',
      en: 'Parallelogram ABCD: AB ∥ CD with AB = CD = 5; AD ∥ BC with AD = BC = 3. ∠A + ∠B = 180°.',
    },
    pictorial: {
      ko: '대각선 두 개로 나누면 두 합동 삼각형 × 2 = 평행사변형. 중점 연결 정리: 두 변 중점을 잇는 선분 = 세 번째 변의 절반.',
      en: 'Diagonals split parallelogram into two congruent triangles. Midpoint theorem: segment joining midpoints of two sides = half the third.',
    },
    abstract: {
      ko: '평행사변형: 마주보는 변·각이 같다, 대각선이 서로를 이등분한다.',
      en: 'Parallelogram: opposite sides/angles equal; diagonals bisect each other.',
    },
    worked: {
      ko: '평행사변형 ABCD 에서 ∠A=70°, ∠B=?',
      en: 'In parallelogram ABCD, ∠A=70°. ∠B?',
      steps: [
        { math: '∠A + ∠B = 180° (동측내각)', narrationKo: '한 변에 인접한 두 각.', narrationEn: 'Co-interior angles.' },
        { math: '∠B = 110°',                  narrationKo: '계산.', narrationEn: 'Compute.' },
      ],
    },
    misconception: {
      wrongKo: '평행사변형의 대각선은 같다.',
      wrongEn: 'Parallelogram\'s diagonals are equal.',
      whyKo: '직사각형(평행사변형의 특수)의 성질을 일반화.',
      whyEn: 'Generalised a rectangle-specific property.',
      correctKo: '평행사변형 대각선은 서로 이등분 (같지는 않음). 같으려면 직사각형.',
      correctEn: 'Diagonals bisect each other but aren\'t equal in general. Equal diagonals ⇒ rectangle.',
    },
    retrieval: {
      promptKo: '평행사변형 두 마주보는 각이 각각 x, 60°. x = ?',
      promptEn: 'Opposite angles of a parallelogram: x and 60°. x?',
      accept: ['60', '60°'],
      explainKo: '마주보는 각은 같다.',
      explainEn: 'Opposite angles equal.',
    },
  },

  'C9-CH09-CIRCLES': {
    hook: {
      ko: '원 위 다른 곳에서 같은 호를 봐도 보이는 각은 항상 같다. 마법 같은 사실.',
      en: 'From different points on a circle the same arc spans the same angle — circle magic.',
    },
    concrete: {
      ko: '원 위 호 AB 가 있고, 호 밖 원주 위 어디서 보든 ∠APB = 같은 값. 중심각 ∠AOB 가 100° 면 모든 원주각 50°.',
      en: 'Arc AB on a circle. From any point P on the major arc, ∠APB = constant. If central ∠AOB = 100°, every inscribed angle = 50°.',
    },
    pictorial: {
      ko: '같은 호 → 다른 원주 점 → 같은 각도. 부채꼴 가운데 각의 절반.',
      en: 'Same arc, different vantage points on the circle, same inscribed angle = half the central angle.',
    },
    abstract: {
      ko: '같은 호 위의 원주각은 같다. 중심각 = 2 × 원주각 (같은 호).',
      en: 'Inscribed angles on the same arc are equal. Central angle = 2 × inscribed.',
    },
    worked: {
      ko: '한 호의 중심각이 100°. 원주각은?',
      en: 'Central angle 100° on an arc. Inscribed?',
      steps: [
        { math: '원주각 = 100°/2 = 50°', narrationKo: '중심각 절반.', narrationEn: 'Half the central.' },
      ],
    },
    misconception: {
      wrongKo: '원주각 = 중심각 (같은 호).',
      wrongEn: 'Inscribed angle = central angle (same arc).',
      whyKo: '관계가 단순 등식이라 가정.',
      whyEn: 'Assumed straightforward equality.',
      correctKo: '원주각 = 중심각의 절반. (같은 호 위에서)',
      correctEn: 'Inscribed = half the central — same arc.',
    },
    retrieval: {
      promptKo: '원주각 40° 의 중심각은?',
      promptEn: 'Inscribed angle 40°. Central?',
      accept: ['80', '80°'],
      explainKo: '두 배.',
      explainEn: 'Double.',
    },
  },

  'C9-CH10-HERON': {
    hook: {
      ko: '높이를 모르고 세 변만 알 때 삼각형 넓이를 구할 수 있을까? 헤론의 공식이 답.',
      en: 'Know all three sides but not the height? Heron\'s formula gives the area.',
    },
    concrete: {
      ko: '세 변 13, 14, 15 인 삼각형: s = (13+14+15)/2 = 21, A = √[21·8·7·6] = √7056 = 84.',
      en: 'Triangle with sides 13, 14, 15: s = 21, A = √[21·8·7·6] = √7056 = 84.',
    },
    pictorial: {
      ko: '직각삼각형은 ½·밑·높이 로 간단. 비스듬한 삼각형도 헤론으로 — 높이를 못 구해도 OK.',
      en: 'Right triangles use ½·base·height. Oblique ones use Heron — no height needed.',
    },
    abstract: {
      ko: 's = (a+b+c)/2.  A = √[s(s−a)(s−b)(s−c)].',
      en: 's = (a+b+c)/2.  A = √[s(s−a)(s−b)(s−c)].',
    },
    worked: {
      ko: '변 3, 4, 5 삼각형 넓이.',
      en: 'Triangle with sides 3, 4, 5.',
      steps: [
        { math: 's = 6',                     narrationKo: '반둘레.', narrationEn: 'Semi-perimeter.' },
        { math: 'A = √[6·3·2·1] = √36 = 6', narrationKo: '공식.',   narrationEn: 'Apply formula.' },
      ],
    },
    misconception: {
      wrongKo: 's = a + b + c (전둘레 사용).',
      wrongEn: 's = a + b + c (full perimeter).',
      whyKo: '반둘레가 아닌 전둘레를 사용.',
      whyEn: 'Used full perimeter instead of half.',
      correctKo: 's = (a+b+c)/2 — 반(semi)둘레.',
      correctEn: 's = (a+b+c)/2 — semi-perimeter.',
    },
    retrieval: {
      promptKo: '6,8,10 삼각형 넓이.',
      promptEn: 'Area of 6-8-10 triangle.',
      accept: ['24'],
      explainKo: '직각삼각형 ½·6·8 = 24, 또는 헤론.',
      explainEn: 'Right triangle: ½·6·8 = 24.',
    },
  },

  'C9-CH11-SURFACE-VOLUME': {
    hook: {
      ko: '아이스크림 콘의 부피는 같은 밑면·높이의 원기둥의 정확히 1/3.',
      en: 'An ice-cream cone holds exactly 1/3 of a same-base, same-height cylinder.',
    },
    concrete: {
      ko: '반지름 3, 높이 4 원뿔: V = ⅓π·9·4 = 12π ≈ 37.7. 같은 r, h 원기둥: V = π·9·4 = 36π ≈ 113. 정확히 3배.',
      en: 'Cone r=3, h=4: V = ⅓π·9·4 = 12π ≈ 37.7. Same r,h cylinder: V = 36π ≈ 113 — exactly 3× the cone.',
    },
    pictorial: {
      ko: '같은 r, h 원기둥·원뿔·반구를 비교: 원기둥 부피 = 원뿔 + 반구 + 반구. 세 입체 사이 1 : 2 : 3 비율 발견.',
      en: 'Stack same r,h shapes: cylinder volume = cone + hemisphere + hemisphere — they\'re in 1:2:3 ratio.',
    },
    abstract: {
      ko: '원기둥 V = πr²h. 원뿔 V = ⅓πr²h. 구 V = (4/3)πr³.',
      en: 'Cylinder V = πr²h. Cone V = ⅓πr²h. Sphere V = (4/3)πr³.',
    },
    worked: {
      ko: '반지름 3, 높이 4 원뿔 부피.',
      en: 'Cone, r=3, h=4.',
      steps: [
        { math: 'V = ⅓π·9·4 = 12π', narrationKo: '대입.', narrationEn: 'Plug in.' },
      ],
    },
    misconception: {
      wrongKo: '구의 부피 = 4πr³ (1/3 빠뜨림).',
      wrongEn: 'Sphere volume = 4πr³ (forgot the 1/3).',
      whyKo: '겉넓이 공식 4πr² 와 부피 공식 혼동.',
      whyEn: 'Confused with surface formula 4πr².',
      correctKo: '구 부피 = (4/3)πr³. 겉넓이 = 4πr².',
      correctEn: 'V_sphere = (4/3)πr³. Surface = 4πr².',
    },
    retrieval: {
      promptKo: '반지름 3 구의 부피.',
      promptEn: 'Volume of a sphere, r=3.',
      accept: ['36π', '36pi', '36π '],
      explainKo: '(4/3)π·27 = 36π.',
      explainEn: '(4/3)π·27 = 36π.',
    },
  },

  'C9-CH12-STATISTICS': {
    hook: {
      ko: '100개의 시험 점수를 한 줄로 요약한다면, 어떤 수가 가장 정직한 대표일까?',
      en: 'Summarise 100 test scores with one number — which is the most honest representative?',
    },
    concrete: {
      ko: '{1, 2, 2, 3, 100} 평균 = 21.6 (이상치에 휘둘림). 중앙값 = 2 (이상치 영향 X). 자료 분포에 따라 다른 대푯값 선택.',
      en: '{1, 2, 2, 3, 100}: mean = 21.6 (skewed by outlier), median = 2 (robust). Pick the right summary for the distribution.',
    },
    pictorial: {
      ko: '히스토그램: 평균은 막대들의 무게중심, 중앙값은 면적을 좌·우 같이 나누는 위치.',
      en: 'On a histogram: mean = center of mass of bars; median = position splitting the area equally.',
    },
    abstract: {
      ko: '평균 = Σx/n. 중앙값 = 정렬 후 가운데 (이상치에 강함). 최빈값 = 가장 빈번.',
      en: 'Mean = Σx/n. Median = middle after sort (robust to outliers). Mode = most frequent.',
    },
    worked: {
      ko: '{4, 8, 6, 5, 3} 중앙값.',
      en: 'Median of {4, 8, 6, 5, 3}.',
      steps: [
        { math: '정렬: 3, 4, 5, 6, 8', narrationKo: '정렬 후 가운데.', narrationEn: 'Sort first.' },
        { math: '가운데 = 5',           narrationKo: '5번째 중 3번째.', narrationEn: '3rd of 5.' },
      ],
    },
    misconception: {
      wrongKo: '중앙값 = 자료를 정렬하지 않고 가운데 위치 값.',
      wrongEn: 'Median = value at the middle index without sorting.',
      whyKo: '정렬 단계를 건너뜀.',
      whyEn: 'Skipped the sort step.',
      correctKo: '반드시 정렬 후 가운데 위치 값. 짝수 개면 가운데 두 값의 평균.',
      correctEn: 'Sort first, then take middle. For even n, average the two middle.',
    },
    retrieval: {
      promptKo: '{2, 5, 9} 평균.',
      promptEn: 'Mean of {2, 5, 9}.',
      accept: ['5.33', '16/3', '5⅓'],
      explainKo: '16/3 ≈ 5.33.',
      explainEn: '16/3 ≈ 5.33.',
    },
  },
};
