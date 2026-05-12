/**
 * Class 11 (NCERT XI) — 챕터별 개념학습 콘텐츠 (production grade).
 * 모든 14 챕터에 HOOK / CONCRETE / PICTORIAL / ABSTRACT / WORKED / MISCONCEPTION / RETRIEVAL 완비.
 */

import { ChapterContentMap } from './types';

export const CLASS_11_CONTENT: ChapterContentMap = {
  'C11-CH01-SETS': {
    hook: {
      ko: '"카페에 간 사람" 과 "도서관에 간 사람" 중 둘 다 간 사람만 찾아라 — 교집합.',
      en: 'People who went to BOTH the café and library — that\'s an intersection.',
    },
    concrete: {
      ko: '반 30명 중 축구를 좋아하는 학생 18, 농구 14, 둘 다 6. 한 가지라도 좋아하는 학생은 18 + 14 − 6 = 26명.',
      en: 'Of 30 students, 18 like football, 14 like basketball, 6 like both. Liking at least one: 18 + 14 − 6 = 26.',
    },
    pictorial: {
      ko: '두 개의 겹친 원(벤 다이어그램). 왼쪽 원만 = A−B, 오른쪽만 = B−A, 겹친 부분 = A∩B, 전체 = A∪B. 외부 = (A∪B)ᶜ.',
      en: 'Two overlapping circles (Venn diagram). Left only = A−B, right only = B−A, overlap = A∩B, all shaded = A∪B.',
      visualData: { type: 'venn-2set', a: 18, b: 14, both: 6, labelA: 'Football', labelB: 'Basketball', total: 30 },
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
    misconception: {
      wrongKo: '|A ∪ B| = |A| + |B|',
      wrongEn: '|A ∪ B| = |A| + |B|',
      whyKo: '교집합을 두 번 세는 흔한 실수.',
      whyEn: 'Double-counts the intersection.',
      correctKo: '|A∪B| = |A|+|B|−|A∩B| — 겹치는 원소 한 번만 세기.',
      correctEn: '|A∪B| = |A|+|B|−|A∩B| — subtract the overlap once.',
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
    concrete: {
      ko: 'f(1)=3, f(2)=5, f(3)=7 처럼 입력마다 출력이 정확히 하나. {(1,3),(2,5),(3,7)} 은 함수. {(1,3),(1,4)} 는 함수 X (입력 1에 출력 둘).',
      en: 'f(1)=3, f(2)=5, f(3)=7 — one output per input. {(1,3),(2,5),(3,7)} is a function. {(1,3),(1,4)} is NOT (two outputs for 1).',
    },
    pictorial: {
      ko: '화살표 다이어그램: 정의역 A 의 각 점에서 공역 B 로 화살표 하나씩. "함수=각 입력 점에서 정확히 한 화살표".',
      en: 'Arrow diagram: from each point of domain A, exactly one arrow into codomain B.',
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
    concrete: {
      ko: '회전하는 관람차의 한 칸 — 0° 출발 → 90° 꼭대기(높이 1) → 180° 반대편(높이 0) → 270° 바닥(높이 −1) → 360° 복귀. 높이 = sin θ.',
      en: 'Riding a Ferris wheel: 0° start → 90° top (height 1) → 180° opposite (0) → 270° bottom (−1) → 360°. Height = sin θ.',
    },
    pictorial: {
      ko: '단위원에서 각 θ 의 종점 (cos θ, sin θ). x축 양수 방향이 0°, 반시계 방향이 양의 각.',
      en: 'On the unit circle, the terminal point of angle θ is (cos θ, sin θ). Positive x-axis is 0°, counter-clockwise positive.',
      visualData: { type: 'unit-circle', angle: 120 },
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
    concrete: {
      ko: '회전: i 를 곱하면 90° 반시계 회전. 1 → i → −1 → −i → 1. 그래서 i² = −1 은 "두 번 90° 회전 = 180° 뒤집기".',
      en: 'Multiplying by i = 90° rotation. 1 → i → −1 → −i → 1. So i² = −1 means "two 90° turns = a flip".',
    },
    pictorial: {
      ko: '복소평면: 가로축 실부, 세로축 허부. z = a + bi 는 점 (a, b). |z| = 원점에서 거리, arg z = x축과의 각.',
      en: 'Complex plane: x = real, y = imaginary. z = a + bi is point (a, b). |z| = distance to origin, arg z = angle from x-axis.',
      visualData: { type: 'complex-plane', points: [{ re: 2, im: 3, label: '2 + 3i' }, { re: 1, im: -1, label: '1 − i' }, { re: 5, im: 1, label: '5 + i' }] },
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
    misconception: {
      wrongKo: '|z₁ + z₂| = |z₁| + |z₂|',
      wrongEn: '|z₁ + z₂| = |z₁| + |z₂|',
      whyKo: '복소수 크기에 삼각부등식을 등식으로 잘못 적용.',
      whyEn: 'Treats the triangle inequality as equality.',
      correctKo: '|z₁ + z₂| ≤ |z₁| + |z₂| — 같은 방향일 때만 등호.',
      correctEn: '|z₁ + z₂| ≤ |z₁| + |z₂| — equality only when aligned.',
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
    concrete: {
      ko: '저울 양쪽에 같은 무게 더하기/빼기 → 균형 그대로. 양쪽을 음수로 곱하면 가벼움/무거움이 뒤집힘. 그래서 부등호도 뒤집힘.',
      en: 'Add/remove equal weights from both pans — balance preserved. Multiply both by a negative — lighter/heavier swap, so inequality flips.',
    },
    pictorial: {
      ko: '수직선 위 해집합. x > −3 은 −3 오른쪽 (−3은 열린 점 ◦). x ≥ −3 은 −3 포함 닫힌 점 ●.',
      en: 'Solution on a number line. x > −3 = open dot ◦ at −3, shade right. x ≥ −3 = closed dot ●.',
      visualData: { type: 'number-line', marks: [-5, -3, 0, 3, 5], highlight: -3, range: [-6, 6] },
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
    concrete: {
      ko: '5명에서 3명 뽑아 (a) 1등·2등·3등을 정함 → 60가지 (5·4·3=⁵P₃). (b) 단순히 위원 3명 → 10가지 (⁵C₃).',
      en: '5 students pick 3: (a) gold/silver/bronze places ⇒ 60 (5·4·3 = ⁵P₃). (b) just a committee ⇒ 10 (⁵C₃).',
    },
    pictorial: {
      ko: '트리: 첫째 자리 5칸, 둘째 자리 4칸(앞 사람 제외), 셋째 자리 3칸. 가지 수 = 5×4×3. 순서 무시면 같은 사람 셋이 만든 3! = 6 가지를 하나로 묶음.',
      en: 'Tree: 5 choices for slot 1, 4 for slot 2, 3 for slot 3 → 60 paths. Unordered? Each unordered triple appears 3! = 6 times, so divide.',
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
    concrete: {
      ko: '(a+b)³ = a³ + 3a²b + 3ab² + b³. 계수 1, 3, 3, 1 은 파스칼 삼각형의 3번째 줄.',
      en: '(a+b)³ = a³ + 3a²b + 3ab² + b³. Coefficients 1, 3, 3, 1 are Pascal row 3.',
    },
    pictorial: {
      ko: '파스칼 삼각형: 각 행의 양 끝 = 1, 내부 = 위 두 수의 합. n번째 행 r번째 = ⁿCᵣ.',
      en: 'Pascal\'s triangle: edges 1, interior = sum of two above. row-n, position-r = ⁿCᵣ.',
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
    misconception: {
      wrongKo: '(a + b)ⁿ = aⁿ + bⁿ',
      wrongEn: '(a + b)ⁿ = aⁿ + bⁿ',
      whyKo: 'Freshman\'s dream — 가장 흔한 오답 중 하나.',
      whyEn: 'Freshman\'s dream — one of the most common errors.',
      correctKo: '교차항이 빠지면 안 됨. (a+b)² = a² + 2ab + b² 처럼 중간 항 ⁿCᵣ aⁿ⁻ʳ bʳ 가 모두 들어감.',
      correctEn: 'All middle terms ⁿCᵣ aⁿ⁻ʳ bʳ must appear, e.g. (a+b)² has the 2ab term.',
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
    concrete: {
      ko: '등차: 2, 5, 8, 11, … 공차 3. 10번째 항 = 2 + 9·3 = 29. 등비: 3, 6, 12, 24, … 공비 2. 5번째 항 = 3·2⁴ = 48.',
      en: 'AP: 2, 5, 8, 11, … d = 3. 10th term = 2 + 9·3 = 29. GP: 3, 6, 12, 24, … r = 2. 5th term = 3·2⁴ = 48.',
    },
    pictorial: {
      ko: '등차수열을 좌표평면에 (n, aₙ) 으로 찍으면 직선. 등비수열은 지수곡선.',
      en: 'Plotting (n, aₙ): AP gives a line, GP gives an exponential curve.',
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
    misconception: {
      wrongKo: '무한 등비급수 Σ rⁿ 은 |r| 와 관계없이 합이 1/(1−r).',
      wrongEn: 'Infinite GP Σ rⁿ always sums to 1/(1−r) regardless of |r|.',
      whyKo: '|r| ≥ 1 이면 발산한다는 조건을 누락.',
      whyEn: 'Forgot the |r| < 1 convergence condition.',
      correctKo: '|r| < 1 일 때만 합이 a/(1−r) 로 수렴. |r| ≥ 1 이면 무한히 커짐.',
      correctEn: 'Only converges when |r| < 1, giving a/(1−r). Otherwise diverges.',
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
    concrete: {
      ko: '점 (2,3) 을 지나고 기울기 4: y − 3 = 4(x − 2) → y = 4x − 5. x 절편 = 5/4, y 절편 = −5.',
      en: 'Through (2,3), slope 4: y − 3 = 4(x − 2) → y = 4x − 5. x-intercept 5/4, y-intercept −5.',
    },
    pictorial: {
      ko: '좌표평면 위 직선: 기울기 m = rise/run, y 절편 = x=0 일 때 y. 두 직선이 수직 ⇔ 기울기 곱 = −1.',
      en: 'Line on the plane: slope m = rise/run, y-intercept = y at x=0. Two lines perpendicular ⇔ slopes multiply to −1.',
      visualData: { type: 'function-line', m: 4, c: -5, range: [-2, 4], markedPoints: [{ x: 2, y: 3 }] },
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
    misconception: {
      wrongKo: '두 직선이 평행 ⇒ 기울기 곱 = −1.',
      wrongEn: 'Parallel lines ⇒ slopes multiply to −1.',
      whyKo: '평행과 수직 조건을 혼동.',
      whyEn: 'Confused parallel with perpendicular.',
      correctKo: '평행: 기울기 같음. 수직: 기울기 곱 = −1.',
      correctEn: 'Parallel = same slope. Perpendicular = slopes multiply to −1.',
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
    concrete: {
      ko: '위성 안테나는 포물면. 입사하는 평행 광선이 한 초점으로 모인다. 행성 궤도는 타원, 태양이 한 초점.',
      en: 'A satellite dish is a paraboloid — parallel rays focus to one point. Planetary orbits are ellipses with the sun at one focus.',
    },
    pictorial: {
      ko: '원: 한 중심 1개, 반지름 일정. 타원: 두 초점, 두 거리의 합 일정. 포물선: 한 초점·한 준선, 거리 같음. 쌍곡선: 두 초점, 두 거리의 차 일정.',
      en: 'Circle: one center, constant radius. Ellipse: two foci, sum of distances constant. Parabola: focus + directrix, distances equal. Hyperbola: two foci, difference of distances constant.',
      visualData: { type: 'parabola', a: 1, b: 0, c: -3, range: [-3, 3] },
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
    misconception: {
      wrongKo: '타원 x²/9 + y²/4 = 1 의 장축은 y 방향.',
      wrongEn: 'Ellipse x²/9 + y²/4 = 1 has its major axis along y.',
      whyKo: '큰 분모가 어느 축에 붙는지 혼동.',
      whyEn: 'Confused which axis gets the larger denominator.',
      correctKo: '큰 분모(a²=9)가 x² 아래 → 장축은 x 축 방향.',
      correctEn: 'Larger denominator (a²=9) under x² → major axis along x.',
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
    concrete: {
      ko: '교실 모서리 = 원점. 가로 = x, 세로 = y, 천장 방향 = z. 교실 대각선 끝(폭4·길이5·높이3)까지 거리 = √(16+25+9) = √50.',
      en: 'Corner of a room = origin. Width x, depth y, ceiling z. Diagonal to far-top corner (4·5·3) = √(16+25+9) = √50.',
    },
    pictorial: {
      ko: '오른손법칙: 엄지 = x, 검지 = y, 중지 = z. 세 축이 서로 직각.',
      en: 'Right-hand rule: thumb = x, index = y, middle = z. Three mutually perpendicular axes.',
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
    misconception: {
      wrongKo: '공간 거리 = |Δx| + |Δy| + |Δz| (Manhattan).',
      wrongEn: '3-D distance = |Δx| + |Δy| + |Δz| (Manhattan).',
      whyKo: '택시 거리(Manhattan)와 유클리드 거리 혼동.',
      whyEn: 'Confused Manhattan (taxicab) with Euclidean distance.',
      correctKo: '유클리드 거리는 √(Σ Δ²). 직선 거리.',
      correctEn: 'Euclidean = √(Σ Δ²), the straight-line distance.',
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
    concrete: {
      ko: 'f(x) = (x²−1)/(x−1) 은 x=1 에서 정의 안 됨 (0/0). 그러나 x=0.999 → 1.999, x=1.001 → 2.001. lim 값 = 2.',
      en: 'f(x) = (x²−1)/(x−1) is undefined at x=1 (0/0). But x=0.999 → 1.999, x=1.001 → 2.001. The limit is 2.',
    },
    pictorial: {
      ko: '한 곡선 위 두 점을 잇는 할선의 기울기 → 두 점이 가까워질수록 접선의 기울기 = 미분계수.',
      en: 'Slope of a secant between two curve points → as the points approach each other, it becomes the tangent slope = derivative.',
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
    concrete: {
      ko: '반 A 점수 {70, 70, 70}, 반 B {50, 70, 90}. 평균 둘 다 70. 분산 A=0, B=(20² + 0 + 20²)/3 ≈ 267. B 가 훨씬 흩어짐.',
      en: 'Class A {70,70,70}, Class B {50,70,90}. Both mean 70. Variance A=0, B ≈ 267. B is far more spread.',
    },
    pictorial: {
      ko: '히스토그램에서 막대들이 평균 주위에 좁게 몰리면 σ 작음, 넓게 퍼지면 σ 큼. 정규분포의 종모양 폭이 σ.',
      en: 'Histogram bars huddled near the mean = small σ; widely spread = large σ. Bell curve width is σ.',
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
    misconception: {
      wrongKo: '표준편차 = Σ|xᵢ − x̄|/n (평균 절대편차로 계산).',
      wrongEn: 'SD = Σ|xᵢ − x̄|/n (using mean absolute deviation).',
      whyKo: '제곱 대신 절댓값을 씀.',
      whyEn: 'Used absolute value instead of squaring.',
      correctKo: '표준편차는 제곱편차의 평균의 제곱근. 절댓값 평균은 별개의 척도(MAD).',
      correctEn: 'SD uses squared deviations then √. Absolute deviations give a different measure (MAD).',
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
    concrete: {
      ko: '주사위 한 번. P(짝수 또는 ≥4) = P(짝수)+P(≥4)−P(둘 다) = 3/6 + 3/6 − 2/6 = 4/6.',
      en: 'Single die. P(even or ≥4) = P(even)+P(≥4)−P(both) = 3/6 + 3/6 − 2/6 = 4/6.',
    },
    pictorial: {
      ko: '두 사건 A, B 의 벤 다이어그램 위에서 P(A∪B) = (A만 칠한 부분) + (둘 다) + (B만) = P(A)+P(B)−P(A∩B).',
      en: 'Venn diagram of events: P(A∪B) = (A only) + (both) + (B only) = P(A)+P(B)−P(A∩B).',
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
    misconception: {
      wrongKo: '서로 배반(mutually exclusive) ⇒ 독립(independent).',
      wrongEn: 'Mutually exclusive ⇒ independent.',
      whyKo: '두 개념을 같은 의미로 혼동.',
      whyEn: 'Conflates two distinct ideas.',
      correctKo: '배반: 동시 발생 X (P(A∩B)=0). 독립: 한 사건이 다른 사건 확률에 영향 X. 양립 불가능한 사건은 사실상 강한 종속.',
      correctEn: 'Exclusive: cannot co-occur (P(A∩B)=0). Independent: one event doesn\'t affect the other. Exclusive events are actually strongly dependent.',
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
