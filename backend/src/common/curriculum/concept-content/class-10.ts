/**
 * Class 10 (NCERT X) — 챕터별 개념학습 콘텐츠.
 */

import { ChapterContentMap } from './types';

export const CLASS_10_CONTENT: ChapterContentMap = {
  'C10-CH01-REAL-NUMBERS': {
    hook: {
      ko: '모든 자연수는 소수들의 곱으로 단 하나의 방식으로 표현된다 — 그 사실 위에 √2의 비유리성이 증명된다.',
      en: 'Every natural number factors uniquely into primes — this fact proves √2 is irrational.',
    },
    abstract: {
      ko: '산술의 기본정리 (FTA): 합성수 = 소수들의 곱 (순서 무시 시 유일). gcd·lcm 도 이 분해로 계산.',
      en: 'FTA: every composite = unique product of primes (up to order). gcd, lcm follow.',
    },
    worked: {
      ko: 'HCF(60, 84) 와 LCM(60, 84).',
      en: 'HCF(60, 84) and LCM(60, 84).',
      steps: [
        { math: '60 = 2²·3·5, 84 = 2²·3·7', narrationKo: '소인수분해.', narrationEn: 'Factor each.' },
        { math: 'HCF = 2²·3 = 12',           narrationKo: '공통 인수.', narrationEn: 'Common primes.' },
        { math: 'LCM = 2²·3·5·7 = 420',      narrationKo: '모든 인수.', narrationEn: 'All primes.' },
      ],
    },
    retrieval: {
      promptKo: 'HCF(18, 24) = ?',
      promptEn: 'HCF(18, 24) = ?',
      accept: ['6'],
      explainKo: '18=2·3², 24=2³·3 ⇒ 2·3.',
      explainEn: '18=2·3², 24=2³·3 ⇒ 2·3.',
    },
  },

  'C10-CH02-POLYNOMIALS': {
    hook: {
      ko: '이차식의 두 근을 알면 식의 모양도 예측 가능 — 계수와 근 사이의 비밀스러운 다리.',
      en: 'Know the roots, predict the polynomial — Vieta\'s bridge between roots and coefficients.',
    },
    abstract: {
      ko: 'ax² + bx + c 의 두 근 α, β: α + β = −b/a, αβ = c/a (Vieta).',
      en: 'For ax² + bx + c with roots α, β: α + β = −b/a, αβ = c/a.',
    },
    worked: {
      ko: 'x² − 5x + 6 의 근의 합과 곱.',
      en: 'Sum and product of roots of x² − 5x + 6.',
      steps: [
        { math: '합 = −(−5)/1 = 5',  narrationKo: 'Vieta 합.', narrationEn: 'Sum.' },
        { math: '곱 = 6/1 = 6',       narrationKo: 'Vieta 곱.', narrationEn: 'Product.' },
        { math: '확인: 2 + 3 = 5, 2·3 = 6 ✓', narrationKo: '실제 근으로 검증.', narrationEn: 'Verify.' },
      ],
    },
    retrieval: {
      promptKo: 'x² + 3x − 4 = 0 두 근의 합.',
      promptEn: 'Sum of roots of x² + 3x − 4 = 0.',
      accept: ['-3', '−3'],
      explainKo: '−b/a = −3.',
      explainEn: '−b/a = −3.',
    },
  },

  'C10-CH03-LINEAR-EQ-PAIRS': {
    hook: {
      ko: '두 직선이 평행하면 두 식은 해가 없다. 일치하면 무한히 많다. 한 점에서 만나면 단 하나 — 위치가 모든 것을 말한다.',
      en: 'Parallel lines: no solution. Coincident: infinite. Crossing: one. Position decides everything.',
    },
    abstract: {
      ko: '대입·소거·교차곱셈. a₁/a₂ ? b₁/b₂ ? c₁/c₂ 비교로 해의 종류 판단.',
      en: 'Substitution, elimination, cross-multiplication. Compare a₁/a₂, b₁/b₂, c₁/c₂.',
    },
    worked: {
      ko: '2x + y = 7, 3x − y = 8.',
      en: '2x + y = 7, 3x − y = 8.',
      steps: [
        { math: '두 식 합: 5x = 15 ⇒ x = 3', narrationKo: 'y 소거.', narrationEn: 'Eliminate y.' },
        { math: 'y = 7 − 6 = 1',              narrationKo: '대입.',   narrationEn: 'Back-substitute.' },
      ],
    },
    retrieval: {
      promptKo: 'x + y = 10, x − y = 4 ⇒ (x, y).',
      promptEn: 'x + y = 10, x − y = 4 ⇒ (x, y).',
      accept: ['(7,3)', '7,3'],
      explainKo: '2x = 14.',
      explainEn: '2x = 14.',
    },
  },

  'C10-CH04-QUADRATIC-EQ': {
    hook: {
      ko: '이차방정식의 근을 못 풀 일은 없다 — 근의 공식이 항상 답을 준다.',
      en: 'No quadratic resists you — the quadratic formula always delivers.',
    },
    abstract: {
      ko: 'x = (−b ± √D)/(2a), D = b² − 4ac. D>0 두 실근, D=0 중근, D<0 허근.',
      en: 'x = (−b ± √D)/(2a). D > 0: two real. D = 0: repeated. D < 0: complex.',
    },
    worked: {
      ko: 'x² − 4x − 5 = 0.',
      en: 'x² − 4x − 5 = 0.',
      steps: [
        { math: '인수분해: (x − 5)(x + 1) = 0', narrationKo: '곱 = 0.', narrationEn: 'Factor.' },
        { math: 'x = 5 or −1',                   narrationKo: '근.',  narrationEn: 'Roots.' },
      ],
    },
    misconception: {
      wrongKo: 'D < 0 이면 해가 없다.',
      wrongEn: 'D < 0 means "no solution".',
      whyKo: '실수 범위만 가정.',
      whyEn: 'Assumed only real numbers.',
      correctKo: '실근은 없지만 복소근은 존재. (Class 11 에서 복소수)',
      correctEn: 'No real roots, but complex roots exist (Class 11).',
    },
    retrieval: {
      promptKo: 'x² − 3x + 2 = 0 의 근.',
      promptEn: 'Roots of x² − 3x + 2 = 0.',
      accept: ['1,2', '1, 2', 'x=1,x=2'],
      explainKo: '(x−1)(x−2) = 0.',
      explainEn: '(x−1)(x−2) = 0.',
    },
  },

  'C10-CH05-AP': {
    hook: {
      ko: '1부터 100까지의 합을 가우스는 어떻게 5초 만에 풀었을까? 등차수열의 마법.',
      en: 'How did young Gauss sum 1 to 100 in seconds? The trick of arithmetic progressions.',
    },
    abstract: {
      ko: 'aₙ = a + (n−1)d. Sₙ = n/2 (2a + (n−1)d) = n/2 (a + aₙ).',
      en: 'aₙ = a + (n−1)d. Sₙ = n/2 (2a + (n−1)d) = n/2 (a + aₙ).',
    },
    worked: {
      ko: '1+2+…+100.',
      en: 'Sum 1 to 100.',
      steps: [
        { math: 'a=1, d=1, n=100, a₁₀₀=100', narrationKo: '항 파악.', narrationEn: 'Identify terms.' },
        { math: 'S = 100/2 · (1 + 100) = 5050', narrationKo: '공식.', narrationEn: 'Apply formula.' },
      ],
    },
    retrieval: {
      promptKo: 'A.P. 3, 7, 11,… 의 10번째 항.',
      promptEn: '10th term of A.P. 3, 7, 11,…',
      accept: ['39'],
      explainKo: '3 + 9·4 = 39.',
      explainEn: '3 + 9·4 = 39.',
    },
  },

  'C10-CH06-TRIANGLES-III': {
    hook: {
      ko: '같은 모양 다른 크기 — 닮음 삼각형은 변·각의 비율을 보존한다.',
      en: 'Same shape, different size — similar triangles preserve angles and side ratios.',
    },
    abstract: {
      ko: '닮음 판정: AA, SAS-(닮음), SSS-(닮음). 닮음비 k ⇒ 변비 k, 넓이비 k², 부피비 k³.',
      en: 'Similarity: AA, SAS, SSS. Ratio k ⇒ sides k, areas k², volumes k³.',
    },
    worked: {
      ko: '닮음비 2:3, 작은 △ 넓이 12. 큰 △ 넓이?',
      en: 'Similar ratio 2:3, smaller area 12. Larger?',
      steps: [
        { math: '넓이비 = (2/3)² = 4/9', narrationKo: '제곱비.', narrationEn: 'Squared ratio.' },
        { math: '12 / (4/9) = 27',        narrationKo: '큰 넓이.', narrationEn: 'Larger area.' },
      ],
    },
    retrieval: {
      promptKo: '닮음비 1:4 일 때 넓이비?',
      promptEn: 'Similar ratio 1:4 ⇒ area ratio?',
      accept: ['1:16', '1/16'],
      explainKo: '1² : 4².',
      explainEn: '1² : 4².',
    },
  },

  'C10-CH07-COORDINATE-GEOM-II': {
    hook: {
      ko: '한 점이 다른 두 점을 어떤 비율로 나누는지 — 좌표만으로 안다.',
      en: 'How a point divides a segment in a given ratio — coordinates alone tell us.',
    },
    abstract: {
      ko: '내분점: ((m·x₂ + n·x₁)/(m+n), (m·y₂ + n·y₁)/(m+n)). 외분점은 부호만 반전.',
      en: 'Internal section: ((m·x₂ + n·x₁)/(m+n), (m·y₂ + n·y₁)/(m+n)). External flips signs.',
    },
    worked: {
      ko: '(1,2), (7,8) 을 1:2 내분.',
      en: '(1,2), (7,8) internally in 1:2.',
      steps: [
        { math: 'x = (1·7+2·1)/3 = 3', narrationKo: 'x 좌표.', narrationEn: 'x-coordinate.' },
        { math: 'y = (1·8+2·2)/3 = 4', narrationKo: 'y 좌표.', narrationEn: 'y-coordinate.' },
        { math: '점 (3, 4)',           narrationKo: '결과.',  narrationEn: 'Result.' },
      ],
    },
    retrieval: {
      promptKo: '(0,0), (8,8) 의 중점.',
      promptEn: 'Midpoint of (0,0), (8,8).',
      accept: ['(4,4)', '4,4'],
      explainKo: '중점 = 좌표 평균.',
      explainEn: 'Average coordinates.',
    },
  },

  'C10-CH08-TRIG-INTRO': {
    hook: {
      ko: '한 빌딩의 그림자 길이와 태양 고도만으로 높이를 잴 수 있다 — 삼각비의 첫 활용.',
      en: 'Find a building\'s height from its shadow and the sun\'s angle — trig at its first use.',
    },
    abstract: {
      ko: '직각삼각형: sin θ = 대변/빗변. cos θ = 인접변/빗변. tan θ = 대변/인접변.',
      en: 'Right triangle: sin = opp/hyp, cos = adj/hyp, tan = opp/adj.',
    },
    worked: {
      ko: '30°-60°-90° 삼각형에서 sin 30°, cos 30°.',
      en: 'In a 30-60-90 triangle, sin 30°, cos 30°.',
      steps: [
        { math: '변 비율 1 : √3 : 2', narrationKo: '표준 비.', narrationEn: 'Standard ratios.' },
        { math: 'sin 30° = 1/2',       narrationKo: '대변/빗변.', narrationEn: 'opp/hyp.' },
        { math: 'cos 30° = √3/2',     narrationKo: '인접/빗변.', narrationEn: 'adj/hyp.' },
      ],
    },
    misconception: {
      wrongKo: 'sin θ + cos θ = 1.',
      wrongEn: 'sin θ + cos θ = 1.',
      whyKo: '피타고라스 항등식의 변형 오류.',
      whyEn: 'Misremembered the Pythagorean identity.',
      correctKo: 'sin²θ + cos²θ = 1. 합이 아닌 제곱의 합이다.',
      correctEn: 'sin²θ + cos²θ = 1 — squares, not values.',
    },
    retrieval: {
      promptKo: 'sin 45° = ?',
      promptEn: 'sin 45° = ?',
      accept: ['1/√2', '√2/2', '0.707'],
      explainKo: '45-45-90.',
      explainEn: '45-45-90 triangle.',
    },
  },

  'C10-CH09-TRIG-APPLICATIONS': {
    hook: {
      ko: '직접 잴 수 없는 산의 높이 — 발 아래 정해진 위치 두 곳만으로 구할 수 있다.',
      en: 'Mountain too tall to climb? Two ground positions and trig give the height.',
    },
    abstract: {
      ko: '높이 h = (수평거리) × tan(고도각). 두 시점 측정으로 거리 미지일 때도 풀이 가능.',
      en: 'h = horizontal distance × tan(angle of elevation). Two observations resolve unknown distances.',
    },
    worked: {
      ko: '거리 50 m, 고도각 30° 인 탑의 높이.',
      en: 'Tower 50 m away, elevation 30°.',
      steps: [
        { math: 'h = 50 · tan 30° = 50 · (1/√3) ≈ 28.87 m', narrationKo: '공식.', narrationEn: 'Apply.' },
      ],
    },
    retrieval: {
      promptKo: '거리 100, 고도 45° 인 탑 높이.',
      promptEn: '100 away, elevation 45°. Height?',
      accept: ['100'],
      explainKo: 'tan 45° = 1.',
      explainEn: 'tan 45° = 1.',
    },
  },

  'C10-CH10-CIRCLES-II': {
    hook: {
      ko: '원에 그은 접선은 반지름과 수직 — 이 한 사실이 원 문제 절반을 해결한다.',
      en: 'Tangent ⊥ radius at the point of contact — this single fact unlocks half the problems.',
    },
    abstract: {
      ko: '접선 정리: 외부 점에서 원으로 그은 두 접선의 길이는 같다.',
      en: 'Tangents from an external point are equal in length.',
    },
    worked: {
      ko: '외부 점 P 에서 원으로 PA, PB 접선. PA=7. PB=?',
      en: 'External tangents PA, PB; PA=7. Find PB.',
      steps: [
        { math: 'PB = PA = 7', narrationKo: '같은 외부 점에서.', narrationEn: 'Same external point.' },
      ],
    },
    retrieval: {
      promptKo: '반지름 5, 외부거리 13 이면 접선 길이?',
      promptEn: 'r=5, external distance 13 ⇒ tangent length?',
      accept: ['12'],
      explainKo: '√(13² − 5²) = 12.',
      explainEn: '√(13² − 5²) = 12.',
    },
  },

  'C10-CH11-AREAS-CIRCLES': {
    hook: {
      ko: '피자 한 조각의 넓이는 원의 몇 분의 몇? 각도가 모든 것을 결정한다.',
      en: 'How much of a pizza is a slice? Its central angle tells all.',
    },
    abstract: {
      ko: '부채꼴 넓이 = (θ/360°) · πr². 호 길이 = (θ/360°) · 2πr.',
      en: 'Sector area = (θ/360°)·πr². Arc length = (θ/360°)·2πr.',
    },
    worked: {
      ko: 'r=7, θ=60° 부채꼴 넓이.',
      en: 'Sector r=7, θ=60°.',
      steps: [
        { math: '(60/360)·π·49 = 49π/6 ≈ 25.66', narrationKo: '대입.', narrationEn: 'Plug in.' },
      ],
    },
    retrieval: {
      promptKo: 'r=10, θ=90° 부채꼴 호 길이.',
      promptEn: 'Arc length r=10, θ=90°.',
      accept: ['5π', '15.71'],
      explainKo: '(90/360)·20π.',
      explainEn: '(90/360)·20π.',
    },
  },

  'C10-CH12-SURFACE-VOLUME-II': {
    hook: {
      ko: '컵 + 모자 모양의 합성도형은 분해해서 더한다 — 부분의 합으로 전체를 구하라.',
      en: 'Cup + hat shape = decompose, then add — the sum-of-parts principle.',
    },
    abstract: {
      ko: '합성 입체의 부피·겉넓이 = 각 표준 입체의 합 (또는 차). 단면 변화를 추적.',
      en: 'Composite solids: V/S = sum/difference of standard solids; track cross-sections.',
    },
    worked: {
      ko: '반구 + 원기둥 (둘 다 r=3). 원기둥 h=5. 총 부피.',
      en: 'Hemisphere + cylinder (both r=3), h_cyl=5. Total volume.',
      steps: [
        { math: 'V_반구 = (2/3)π·27 = 18π', narrationKo: '반구.', narrationEn: 'Hemisphere.' },
        { math: 'V_원기둥 = π·9·5 = 45π',   narrationKo: '원기둥.', narrationEn: 'Cylinder.' },
        { math: '총 = 63π',                 narrationKo: '합.',   narrationEn: 'Sum.' },
      ],
    },
    retrieval: {
      promptKo: '원기둥 r=2, h=10. 부피.',
      promptEn: 'Cylinder r=2, h=10. Volume.',
      accept: ['40π', '40pi'],
      explainKo: 'πr²h.',
      explainEn: 'πr²h.',
    },
  },

  'C10-CH13-STATISTICS-II': {
    hook: {
      ko: '도수분포표만 있을 때 평균을 구하려면? 각 계급의 대표값을 가중평균하라.',
      en: 'Only frequency table given — weight class midpoints to get the mean.',
    },
    abstract: {
      ko: '평균 (도수분포) = Σ(fᵢxᵢ)/Σfᵢ. 중앙값은 누적도수로 구한다.',
      en: 'Grouped mean = Σ(fᵢxᵢ)/Σfᵢ. Median via cumulative frequency.',
    },
    worked: {
      ko: '계급 x: 5, 15, 25 / 도수 f: 2, 3, 5 평균.',
      en: 'x = 5, 15, 25 with f = 2, 3, 5. Mean.',
      steps: [
        { math: 'Σfx = 10+45+125 = 180', narrationKo: '곱의 합.', narrationEn: 'Sum of products.' },
        { math: 'Σf = 10',                narrationKo: '도수 합.', narrationEn: 'Sum of freq.' },
        { math: '평균 = 18',              narrationKo: '나눔.',   narrationEn: 'Divide.' },
      ],
    },
    retrieval: {
      promptKo: '{2,2,3,5,7,9} 의 중앙값.',
      promptEn: 'Median of {2,2,3,5,7,9}.',
      accept: ['4'],
      explainKo: '중앙 두 값 평균 (3+5)/2.',
      explainEn: 'Average of middle two: (3+5)/2.',
    },
  },

  'C10-CH14-PROBABILITY': {
    hook: {
      ko: '주사위 한 번에 짝수가 나올 확률은? 결과의 절반 — 단, "공정한" 주사위일 때.',
      en: 'Probability of an even number on one die roll? Half — assuming a fair die.',
    },
    abstract: {
      ko: 'P(A) = |A| / |S| (S = 표본공간, 결과가 동일 가능 가정). 0 ≤ P ≤ 1.',
      en: 'P(A) = |A|/|S| (equally likely outcomes). 0 ≤ P ≤ 1.',
    },
    worked: {
      ko: '주사위 ≥4 확률.',
      en: 'Probability die roll ≥ 4.',
      steps: [
        { math: 'A = {4, 5, 6}, S = {1..6}', narrationKo: '집합 적기.', narrationEn: 'List sets.' },
        { math: 'P = 3/6 = 1/2',              narrationKo: '비율.',   narrationEn: 'Ratio.' },
      ],
    },
    misconception: {
      wrongKo: '동전 9회 앞면 후 다음엔 뒷면 확률 ↑.',
      wrongEn: 'After 9 heads, tails is more likely (gambler\'s fallacy).',
      whyKo: '독립 시행을 기억력 있는 듯 잘못 가정.',
      whyEn: 'Treated independent trials as if they remembered history.',
      correctKo: '독립: 매번 1/2. 과거는 다음 결과에 영향 X.',
      correctEn: 'Independent: always 1/2, no memory.',
    },
    retrieval: {
      promptKo: '주사위 7 이 나올 확률.',
      promptEn: 'P(roll a 7 on a die).',
      accept: ['0'],
      explainKo: '불가능 사건.',
      explainEn: 'Impossible event.',
    },
  },
};
