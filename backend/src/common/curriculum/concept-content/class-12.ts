/**
 * Class 12 (NCERT XII) — 챕터별 개념학습 콘텐츠. JEE / CBSE Board 핵심 단원 집중.
 */

import { ChapterContentMap } from './types';

export const CLASS_12_CONTENT: ChapterContentMap = {
  'C12-CH01-RELATIONS-FUNCTIONS-II': {
    hook: {
      ko: '함수 f 의 역함수 f⁻¹ 이 존재하려면? "1대1, 위로의" 두 조건.',
      en: 'When does f⁻¹ exist? f must be both one-to-one and onto.',
    },
    abstract: {
      ko: '일대일(injective): f(x₁)=f(x₂) ⇒ x₁=x₂. 위로의(surjective): 치역 = 공역. 둘 다 ⇒ 역함수 존재.',
      en: 'Injective: f(x₁)=f(x₂) ⇒ x₁=x₂. Surjective: range = codomain. Both ⇒ invertible.',
    },
    worked: {
      ko: 'f(x) = 3x + 1 의 역함수.',
      en: 'Inverse of f(x) = 3x + 1.',
      steps: [
        { math: 'y = 3x + 1 ⇒ x = (y − 1)/3', narrationKo: 'y 에 대해 x.', narrationEn: 'Solve for x.' },
        { math: 'f⁻¹(y) = (y − 1)/3',          narrationKo: '역함수.',   narrationEn: 'Inverse.' },
      ],
    },
    retrieval: {
      promptKo: 'f(x) = 2x − 4 ⇒ f⁻¹(x) = ?',
      promptEn: 'f(x) = 2x − 4 ⇒ f⁻¹(x) = ?',
      accept: ['(x+4)/2', 'x/2+2', '(x + 4)/2'],
      explainKo: 'y=2x−4 풀이.',
      explainEn: 'Solve y = 2x − 4.',
    },
  },

  'C12-CH02-INV-TRIG': {
    hook: {
      ko: 'arcsin(½) 의 값은 30° 또는 150° 또는 … 한 값을 골라야 함수가 된다.',
      en: 'arcsin(½) = 30° or 150° or… choosing one principal range makes it a function.',
    },
    abstract: {
      ko: 'sin⁻¹: [−1,1] → [−π/2, π/2]. cos⁻¹: [−1,1] → [0, π]. tan⁻¹: ℝ → (−π/2, π/2).',
      en: 'sin⁻¹: [−1,1] → [−π/2, π/2]. cos⁻¹: [−1,1] → [0, π]. tan⁻¹: ℝ → (−π/2, π/2).',
    },
    worked: {
      ko: 'sin⁻¹(½)',
      en: 'sin⁻¹(½)',
      steps: [
        { math: 'sin θ = ½, θ ∈ [−π/2, π/2]', narrationKo: '주값 범위.', narrationEn: 'Principal range.' },
        { math: 'θ = π/6',                    narrationKo: '30°.',   narrationEn: '30°.' },
      ],
    },
    misconception: {
      wrongKo: 'sin⁻¹(sin 150°) = 150°.',
      wrongEn: 'sin⁻¹(sin 150°) = 150°.',
      whyKo: '주값 범위 밖.',
      whyEn: 'Outside principal range.',
      correctKo: 'sin 150° = ½ ⇒ sin⁻¹(½) = 30°. 항상 [−π/2, π/2] 내 값.',
      correctEn: 'sin 150° = ½ ⇒ sin⁻¹(½) = 30°. Stay in principal range.',
    },
    retrieval: {
      promptKo: 'tan⁻¹(1) = ?',
      promptEn: 'tan⁻¹(1) = ?',
      accept: ['π/4', 'pi/4', '45°', '45'],
      explainKo: '주값.',
      explainEn: 'Principal value.',
    },
  },

  'C12-CH03-MATRICES': {
    hook: {
      ko: 'AB ≠ BA (일반적). 곱이 교환되지 않는 첫 만남 — 그래도 강력한 도구.',
      en: 'AB ≠ BA in general — your first non-commutative product, yet a mighty tool.',
    },
    abstract: {
      ko: '(AB)ᵢⱼ = Σₖ aᵢₖ bₖⱼ. 단위행렬 I 에 대해 AI = IA = A.',
      en: '(AB)ᵢⱼ = Σₖ aᵢₖ bₖⱼ. Identity I gives AI = IA = A.',
    },
    worked: {
      ko: '[[1,2],[3,4]] · [[2,0],[1,2]]',
      en: '[[1,2],[3,4]] · [[2,0],[1,2]]',
      steps: [
        { math: '행 1: (1·2+2·1, 1·0+2·2) = (4, 4)', narrationKo: '첫 행.', narrationEn: 'Row 1.' },
        { math: '행 2: (3·2+4·1, 3·0+4·2) = (10, 8)', narrationKo: '둘째 행.', narrationEn: 'Row 2.' },
        { math: '[[4,4],[10,8]]',                       narrationKo: '결과.',  narrationEn: 'Result.' },
      ],
    },
    retrieval: {
      promptKo: '[[1,0],[0,1]] · [[5,7],[3,2]] = ?',
      promptEn: '[[1,0],[0,1]] · [[5,7],[3,2]] = ?',
      accept: ['[[5,7],[3,2]]', '같음', 'same'],
      explainKo: '단위행렬 곱.',
      explainEn: 'Identity matrix.',
    },
  },

  'C12-CH04-DETERMINANTS': {
    hook: {
      ko: '행렬식이 0이면 역행렬이 없다. 즉 변환이 차원을 깎는다는 신호.',
      en: 'Zero determinant ⇒ no inverse — the map collapses a dimension.',
    },
    abstract: {
      ko: '|A| = ad − bc (2×2). |A·B| = |A|·|B|. |A| ≠ 0 ⇔ A 가역.',
      en: '|A| = ad − bc for 2×2. |AB| = |A|·|B|. |A| ≠ 0 ⇔ invertible.',
    },
    worked: {
      ko: '|[[2,3],[1,4]]|.',
      en: '|[[2,3],[1,4]]|.',
      steps: [
        { math: '2·4 − 3·1 = 5', narrationKo: 'ad − bc.', narrationEn: 'ad − bc.' },
      ],
    },
    retrieval: {
      promptKo: '|[[1,2],[2,4]]|.',
      promptEn: '|[[1,2],[2,4]]|.',
      accept: ['0'],
      explainKo: '4 − 4.',
      explainEn: '4 − 4.',
    },
  },

  'C12-CH05-CONTINUITY-DIFF': {
    hook: {
      ko: '|x| 는 0 에서 미분 가능한가? 그래프가 꺾이면 답은 No — 연속이지만 미분 불가능.',
      en: 'Is |x| differentiable at 0? The graph has a corner — continuous, but not differentiable.',
    },
    abstract: {
      ko: 'f 가 a 에서 연속: lim_{x→a} f(x) = f(a). 미분가능: lim_{h→0} (f(a+h)−f(a))/h 존재.',
      en: 'Continuous at a: lim_{x→a} f(x) = f(a). Differentiable at a: that limit defining f\'(a) exists.',
    },
    worked: {
      ko: 'f(x) = |x| 의 0 에서 미분가능성.',
      en: 'Differentiability of f(x) = |x| at 0.',
      steps: [
        { math: '좌극한 (f(0+h)−f(0))/h, h<0 ⇒ −1', narrationKo: '왼쪽 기울기.', narrationEn: 'Left slope.' },
        { math: '우극한, h>0 ⇒ +1',                  narrationKo: '오른쪽.',  narrationEn: 'Right.' },
        { math: '−1 ≠ 1 ⇒ 미분 불가',                narrationKo: '결론.',   narrationEn: 'Conclude.' },
      ],
    },
    misconception: {
      wrongKo: '연속이면 미분 가능.',
      wrongEn: 'Continuous ⇒ differentiable.',
      whyKo: '|x|, x^(1/3) 등 반례 무시.',
      whyEn: 'Ignored counterexamples like |x|, ∛x.',
      correctKo: '한 방향만 성립: 미분 가능 ⇒ 연속.',
      correctEn: 'Only one direction: differentiable ⇒ continuous.',
    },
    retrieval: {
      promptKo: 'd/dx (sin x) = ?',
      promptEn: 'd/dx (sin x) = ?',
      accept: ['cos x', 'cosx'],
      explainKo: '표준 도함수.',
      explainEn: 'Standard derivative.',
    },
  },

  'C12-CH06-APP-DERIVATIVES': {
    hook: {
      ko: '도함수가 0 인 점이 극값일까? 후보일 뿐 — 2계 도함수가 진짜 판정.',
      en: 'Zero derivative ⇒ extremum? Only a candidate — the second derivative confirms.',
    },
    abstract: {
      ko: 'f\'(c) = 0 (임계점). f\'\'(c) > 0 ⇒ 극소, < 0 ⇒ 극대, = 0 ⇒ 추가 검사.',
      en: 'f\'(c) = 0 (critical). f\'\'(c) > 0 ⇒ min, < 0 ⇒ max, = 0 ⇒ further test.',
    },
    worked: {
      ko: 'f(x) = x³ − 3x 의 극값.',
      en: 'Extrema of f(x) = x³ − 3x.',
      steps: [
        { math: 'f\'(x) = 3x² − 3 = 0 ⇒ x = ±1', narrationKo: '임계점.', narrationEn: 'Critical points.' },
        { math: 'f\'\'(x) = 6x', narrationKo: '2계 도함수.', narrationEn: 'Second derivative.' },
        { math: 'f\'\'(1)=6>0 ⇒ 극소. f\'\'(−1)=−6<0 ⇒ 극대', narrationKo: '판정.', narrationEn: 'Classify.' },
      ],
    },
    retrieval: {
      promptKo: 'f(x) = x² 에서 극값을 갖는 x.',
      promptEn: 'Where does f(x) = x² have an extremum?',
      accept: ['0', 'x=0'],
      explainKo: 'f\'(0) = 0.',
      explainEn: 'f\'(0) = 0.',
    },
  },

  'C12-CH07-INTEGRALS': {
    hook: {
      ko: '미분은 "변화율", 적분은 "누적량". 두 연산은 본질적으로 서로의 역 (FTC).',
      en: 'Differentiation = rate, integration = accumulation. They reverse each other (FTC).',
    },
    abstract: {
      ko: '∫ xⁿ dx = x^(n+1)/(n+1) + C (n ≠ −1). ∫ u dv = uv − ∫ v du (부분적분).',
      en: '∫ xⁿ dx = x^(n+1)/(n+1) + C. ∫ u dv = uv − ∫ v du (integration by parts).',
    },
    worked: {
      ko: '∫ x e^x dx (부분적분).',
      en: '∫ x e^x dx (parts).',
      steps: [
        { math: 'u = x, dv = e^x dx', narrationKo: 'LIATE 선택.', narrationEn: 'LIATE choice.' },
        { math: 'du = dx, v = e^x',    narrationKo: '미분·적분.', narrationEn: 'Differentiate/integrate.' },
        { math: '= x·e^x − ∫ e^x dx',  narrationKo: '공식.',    narrationEn: 'Apply formula.' },
        { math: '= (x − 1)e^x + C',    narrationKo: '정리.',    narrationEn: 'Simplify.' },
      ],
    },
    misconception: {
      wrongKo: '∫ xⁿ dx = nx^(n−1).',
      wrongEn: '∫ xⁿ dx = nx^(n−1).',
      whyKo: '미분과 적분 규칙 혼동.',
      whyEn: 'Mixed up differentiation and integration rules.',
      correctKo: '적분은 지수에 1을 더하고 그 새 지수로 나눈다.',
      correctEn: 'Integration adds 1 to the exponent and divides by the new exponent.',
    },
    retrieval: {
      promptKo: '∫ 2x dx = ?',
      promptEn: '∫ 2x dx = ?',
      accept: ['x²+C', 'x^2 + C', 'x²'],
      explainKo: 'x² + C.',
      explainEn: 'x² + C.',
    },
  },

  'C12-CH08-APP-INTEGRALS': {
    hook: {
      ko: '곡선 아래 면적은 무한히 얇은 직사각형들의 합 — 정적분의 시각.',
      en: 'Area under a curve = limit of infinitely thin rectangles — the integral picture.',
    },
    abstract: {
      ko: '면적 A = ∫ₐᵇ f(x) dx. 회전체 부피 (x축) = π ∫ₐᵇ [f(x)]² dx.',
      en: 'Area A = ∫ₐᵇ f(x) dx. Volume of revolution (x-axis) = π ∫ₐᵇ [f(x)]² dx.',
    },
    worked: {
      ko: 'y = x², 0 ≤ x ≤ 2 아래 면적.',
      en: 'Area under y = x², 0 ≤ x ≤ 2.',
      steps: [
        { math: '∫₀² x² dx = [x³/3]₀² = 8/3', narrationKo: '정적분.', narrationEn: 'Definite integral.' },
      ],
    },
    retrieval: {
      promptKo: '∫₀¹ x dx = ?',
      promptEn: '∫₀¹ x dx = ?',
      accept: ['1/2', '0.5'],
      explainKo: '[x²/2] = 1/2.',
      explainEn: '[x²/2] = 1/2.',
    },
  },

  'C12-CH09-DIFF-EQ': {
    hook: {
      ko: '인구는 인구에 비례해 자라고, 식어가는 커피는 온도차에 비례해 식는다 — 모두 미분방정식.',
      en: 'Populations grow proportional to themselves; coffee cools proportional to gap — all differential equations.',
    },
    abstract: {
      ko: '변수분리: dy/dx = f(x)·g(y) ⇒ ∫ dy/g(y) = ∫ f(x) dx.',
      en: 'Separable: dy/dx = f(x)·g(y) ⇒ ∫ dy/g(y) = ∫ f(x) dx.',
    },
    worked: {
      ko: 'dy/dx = y, y(0)=1.',
      en: 'dy/dx = y, y(0)=1.',
      steps: [
        { math: 'dy/y = dx',     narrationKo: '분리.', narrationEn: 'Separate.' },
        { math: 'ln|y| = x + C', narrationKo: '적분.', narrationEn: 'Integrate.' },
        { math: 'y = e^x',        narrationKo: '초기조건.', narrationEn: 'Initial condition.' },
      ],
    },
    retrieval: {
      promptKo: 'dy/dx = 2x 의 일반해.',
      promptEn: 'General solution dy/dx = 2x.',
      accept: ['x²+C', 'x^2 + C'],
      explainKo: '적분.',
      explainEn: 'Integrate.',
    },
  },

  'C12-CH10-VECTORS': {
    hook: {
      ko: '내적은 "한 방향으로의 그림자", 외적은 "두 벡터가 만드는 평행사변형의 면적".',
      en: 'Dot = shadow on one direction. Cross = parallelogram area spanned by two vectors.',
    },
    abstract: {
      ko: 'a·b = |a||b|cos θ. a×b 의 크기 = |a||b|sin θ, 방향 = 오른손법칙.',
      en: 'a·b = |a||b|cos θ. |a×b| = |a||b|sin θ, direction by right-hand rule.',
    },
    worked: {
      ko: 'a = (1, 2, 0), b = (0, 1, 0). a·b 와 |a×b|.',
      en: 'a = (1, 2, 0), b = (0, 1, 0). a·b and |a×b|.',
      steps: [
        { math: 'a·b = 1·0+2·1+0 = 2', narrationKo: '내적.', narrationEn: 'Dot.' },
        { math: 'a×b = (0, 0, 1) ⇒ 크기 1', narrationKo: '외적.', narrationEn: 'Cross.' },
      ],
    },
    misconception: {
      wrongKo: 'a × b = b × a',
      wrongEn: 'a × b = b × a',
      whyKo: '외적은 반교환 (antisymmetric).',
      whyEn: 'Cross is anti-commutative.',
      correctKo: 'a × b = −(b × a). 부호가 뒤집힌다.',
      correctEn: 'a × b = −(b × a). Sign flips.',
    },
    retrieval: {
      promptKo: '(1,0,0) · (0,1,0) = ?',
      promptEn: '(1,0,0) · (0,1,0) = ?',
      accept: ['0'],
      explainKo: '직교.',
      explainEn: 'Perpendicular.',
    },
  },

  'C12-CH11-3D-GEOM': {
    hook: {
      ko: '공간 위 한 직선은 (점 + 방향벡터)로, 평면은 (점 + 법선벡터)로 — 벡터 언어가 모두 통합.',
      en: 'A line is point + direction; a plane is point + normal — vectors unify both.',
    },
    abstract: {
      ko: '직선 r = a + t·d. 평면 n·(r − a) = 0. 두 직선의 각: cos θ = |d₁·d₂|/(|d₁||d₂|).',
      en: 'Line r = a + t·d. Plane n·(r − a) = 0. Angle between lines: cos θ = |d₁·d₂|/(|d₁||d₂|).',
    },
    worked: {
      ko: 'd₁=(1,2,2), d₂=(2,2,1) 두 직선의 사잇각.',
      en: 'd₁=(1,2,2), d₂=(2,2,1) angle.',
      steps: [
        { math: 'd₁·d₂ = 2+4+2 = 8', narrationKo: '내적.', narrationEn: 'Dot.' },
        { math: '|d₁| = |d₂| = 3',   narrationKo: '크기.', narrationEn: 'Magnitudes.' },
        { math: 'cos θ = 8/9',        narrationKo: '각도.', narrationEn: 'Angle.' },
      ],
    },
    retrieval: {
      promptKo: '평면 2x + 3y − z = 5 의 법선벡터.',
      promptEn: 'Normal of plane 2x + 3y − z = 5.',
      accept: ['(2,3,-1)', '(2, 3, -1)', '(2,3,−1)'],
      explainKo: '계수가 법선.',
      explainEn: 'Coefficients form the normal.',
    },
  },

  'C12-CH12-LP': {
    hook: {
      ko: '식량·노동 같은 제약 안에서 최대 이익을 — 답은 항상 다각형의 꼭짓점에 있다.',
      en: 'Maximise profit under constraints — the answer always sits at a vertex of the feasible polygon.',
    },
    abstract: {
      ko: '목적함수 max/min Z = c₁x + c₂y, 제약 부등식들. 최적해는 가능영역(다각형)의 꼭짓점에서.',
      en: 'Maximise Z = c₁x + c₂y under inequalities. Optimum at a vertex of the feasible region.',
    },
    worked: {
      ko: 'max Z = 4x+3y, x≤4, y≤6, x+y≤8.',
      en: 'max Z = 4x+3y, x≤4, y≤6, x+y≤8.',
      steps: [
        { math: '꼭짓점: (0,0),(4,0),(4,4),(2,6),(0,6)', narrationKo: '교점.', narrationEn: 'Intersections.' },
        { math: 'Z 값: 0, 16, 28, 26, 18', narrationKo: '대입.', narrationEn: 'Evaluate.' },
        { math: '최대 = 28 at (4,4)', narrationKo: '최적.', narrationEn: 'Optimal.' },
      ],
    },
    retrieval: {
      promptKo: 'LP 의 최적해 후보는 어디?',
      promptEn: 'Where do LP optima live?',
      accept: ['꼭짓점', 'vertex', 'corner'],
      explainKo: '가능영역의 꼭짓점.',
      explainEn: 'Vertices of feasible region.',
    },
  },

  'C12-CH13-PROBABILITY-III': {
    hook: {
      ko: '"양성 검사 결과 ⇒ 실제 환자" 확률은? 검사 정확도만큼 단순하지 않다 — 베이즈가 알려준다.',
      en: '"Positive test ⇒ truly sick" — not as obvious as test accuracy suggests; Bayes tells the truth.',
    },
    abstract: {
      ko: 'P(A|B) = P(A ∩ B)/P(B). 베이즈: P(A|B) = P(B|A)P(A)/P(B).',
      en: 'P(A|B) = P(A ∩ B)/P(B). Bayes: P(A|B) = P(B|A)P(A)/P(B).',
    },
    worked: {
      ko: '주머니 — 빨강 4, 파랑 6. 빨강 뽑은 조건 하 다시 빨강일 확률 (비복원).',
      en: 'Bag — 4 red, 6 blue. P(2nd red | 1st red), no replacement.',
      steps: [
        { math: 'P(첫 빨강) = 4/10',           narrationKo: '먼저.', narrationEn: 'First.' },
        { math: '남은 빨강 3, 전체 9',         narrationKo: '갱신.', narrationEn: 'Update.' },
        { math: 'P(둘째 빨강 | 첫 빨강) = 3/9 = 1/3', narrationKo: '조건부.', narrationEn: 'Conditional.' },
      ],
    },
    misconception: {
      wrongKo: 'P(A|B) = P(B|A).',
      wrongEn: 'P(A|B) = P(B|A).',
      whyKo: '베이즈의 핵심 — 두 조건부는 일반적으로 다르다.',
      whyEn: 'Bayes\' point — the two are generally unequal.',
      correctKo: '베이즈 공식으로 변환해야 한다.',
      correctEn: 'Use Bayes\' formula to convert.',
    },
    retrieval: {
      promptKo: '주사위 2개 합 7 일 때 첫 주사위가 3 일 확률.',
      promptEn: 'P(1st die = 3 | sum = 7).',
      accept: ['1/6'],
      explainKo: '한 경우 (3,4) / 6 합 7 경우.',
      explainEn: 'One favourable (3,4) / 6 sum-7 cases.',
    },
  },
};
