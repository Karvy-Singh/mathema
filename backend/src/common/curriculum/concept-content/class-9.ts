/**
 * Class 9 (NCERT IX) — 챕터별 개념학습 콘텐츠.
 * (PDF 누락분 — 표준 NCERT IX 목차 기준)
 */

import { ChapterContentMap } from './types';

export const CLASS_9_CONTENT: ChapterContentMap = {
  'C9-CH01-NUMBER-SYSTEMS': {
    hook: {
      ko: '수직선의 모든 점에 수가 존재할까? √2 는 그 빈 자리를 가리키는 첫 증거다.',
      en: 'Does every point on the number line have a number? √2 is the first witness to the gap.',
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
    retrieval: {
      promptKo: '{2, 5, 9} 평균.',
      promptEn: 'Mean of {2, 5, 9}.',
      accept: ['5.33', '16/3', '5⅓'],
      explainKo: '16/3 ≈ 5.33.',
      explainEn: '16/3 ≈ 5.33.',
    },
  },
};
