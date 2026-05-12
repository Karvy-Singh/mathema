/**
 * Class 12 (NCERT XII) — 챕터별 개념학습 콘텐츠 (production grade).
 * JEE / CBSE Board 핵심. 모든 13 챕터에 HOOK/CONCRETE/PICTORIAL/ABSTRACT/WORKED/MISCONCEPTION/RETRIEVAL 완비.
 */

import { ChapterContentMap } from './types';

export const CLASS_12_CONTENT: ChapterContentMap = {
  'C12-CH01-RELATIONS-FUNCTIONS-II': {
    hook: {
      ko: '함수 f 의 역함수 f⁻¹ 이 존재하려면? "1대1, 위로의" 두 조건.',
      en: 'When does f⁻¹ exist? f must be both one-to-one and onto.',
    },
    concrete: {
      ko: 'f(x) = 2x+1 은 모든 실수에서 1대1, 위로의 → f⁻¹(y) = (y−1)/2. f(x) = x² 는 1대1 아님(±x 같은 출력) → 역함수 X (단, 정의역 제한 시 가능).',
      en: 'f(x)=2x+1 on ℝ is bijective ⇒ f⁻¹(y)=(y−1)/2. f(x)=x² is not injective (both ±x give same output) ⇒ no inverse (unless domain restricted).',
    },
    pictorial: {
      ko: '함수 그래프를 y=x 직선에 대해 대칭이동하면 역함수 그래프. 1대1이 아니면 거울 반사가 함수 조건을 깨짐.',
      en: 'Reflect a function\'s graph across y=x to get its inverse. If not injective, the reflection fails the vertical-line test.',
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
    misconception: {
      wrongKo: 'f⁻¹(x) = 1/f(x)',
      wrongEn: 'f⁻¹(x) = 1/f(x)',
      whyKo: '역함수 표기와 역수 표기를 혼동.',
      whyEn: 'Confused inverse-function notation with reciprocal.',
      correctKo: 'f⁻¹ 는 역함수 (입력↔출력 뒤집기), 1/f 는 역수. 완전히 다른 것.',
      correctEn: 'f⁻¹ undoes f (swap input/output); 1/f is the reciprocal — entirely different.',
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
    concrete: {
      ko: 'sin x = ½ 의 해는 30°, 150°, 390°, 510°, … 무한히 많음. arcsin(½) 라고 쓰면 그 중 [−90°, 90°] 안에 있는 30° 하나만.',
      en: 'sin x = ½ has solutions 30°, 150°, 390°, 510°… infinitely many. arcsin(½) picks just the one in [−90°, 90°]: 30°.',
    },
    pictorial: {
      ko: '단위원 y = ½ 수평선은 두 점에서 교차. 주값 범위 [−π/2, π/2] 안에 들어가는 점만 채택.',
      en: 'y = ½ horizontal line on the unit circle crosses at two points. Pick only the one in [−π/2, π/2].',
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
    concrete: {
      ko: '회전 행렬 R90 (90° 반시계) 과 반사 행렬 Sx (x축 대칭). R90·Sx 와 Sx·R90 는 결과 다름 — 회전 후 반사 vs 반사 후 회전.',
      en: 'Rotation matrix R90 vs reflection Sx. R90·Sx ≠ Sx·R90 — rotate-then-reflect differs from reflect-then-rotate.',
    },
    pictorial: {
      ko: '행렬을 "선형변환" 으로 시각화: 단위정사각형 → 평행사변형. 행은 변환된 i, j 단위 벡터.',
      en: 'Visualise matrix as a linear transform: unit square → parallelogram. Rows are where i, j unit vectors land.',
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
    misconception: {
      wrongKo: '(A + B)² = A² + 2AB + B²',
      wrongEn: '(A + B)² = A² + 2AB + B²',
      whyKo: '실수처럼 곱셈 교환을 가정.',
      whyEn: 'Assumed commutativity like with real numbers.',
      correctKo: '(A+B)² = A² + AB + BA + B² ≠ A² + 2AB + B² (AB ≠ BA 일반적).',
      correctEn: '(A+B)² = A² + AB + BA + B². The 2AB shortcut fails because AB ≠ BA generally.',
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
    concrete: {
      ko: '[[2,0],[0,3]] 은 x 방향 2배, y 방향 3배 확대. det = 6 = 단위정사각형 → 6배 면적. [[1,2],[2,4]] 는 두 행 비례 → 평행사변형이 직선으로 찌부 → det = 0.',
      en: '[[2,0],[0,3]] scales x×2, y×3. det = 6 = area factor of unit square. [[1,2],[2,4]]: rows proportional → squashed to a line → det = 0.',
    },
    pictorial: {
      ko: '|A| = 행렬이 만드는 평행사변형/평행육면체의 부호 있는 면적/부피. 0 = 차원 붕괴.',
      en: '|A| = signed area/volume of the parallelogram/parallelepiped spanned by the rows. Zero = dimension collapse.',
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
    misconception: {
      wrongKo: '|A + B| = |A| + |B|',
      wrongEn: '|A + B| = |A| + |B|',
      whyKo: '행렬식은 선형이 아닌데 + 분배 가정.',
      whyEn: 'Determinant isn\'t linear in the matrix — wrongly distributed over +.',
      correctKo: '|AB| = |A|·|B| 은 성립. + 에 대해선 단순 관계 없음.',
      correctEn: '|AB| = |A|·|B| holds, but no simple rule for sums.',
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
    concrete: {
      ko: 'f(x) = |x| 는 모든 곳 연속. 그러나 0에서 좌극한 기울기 −1, 우극한 +1 — 일치 X. 미분 불가능.',
      en: 'f(x) = |x| is continuous everywhere. But at 0: left slope −1, right slope +1 — mismatch ⇒ not differentiable.',
    },
    pictorial: {
      ko: '연속 = 곡선에 구멍·점프 없음. 미분가능 = 곡선이 매끄럽고 꺾임 없음. |x| 의 V 꼭짓점이 꺾임.',
      en: 'Continuous = no holes/jumps. Differentiable = smooth with no corners. The V tip of |x| is a corner.',
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
    concrete: {
      ko: 'f(x) = x³ 는 f\'(0) = 0 이지만 극값 X (변곡점). f(x) = x² 는 f\'(0)=0, f\'\'(0)=2>0 → 극소.',
      en: 'f(x) = x³ has f\'(0)=0 but no extremum (inflection). f(x) = x²: f\'(0)=0, f\'\'(0)=2>0 ⇒ minimum.',
    },
    pictorial: {
      ko: 'f\' 부호 변화: + → 0 → − 는 극대, − → 0 → + 는 극소, +/− 안 바뀌면 평탄점(변곡 또는 안장).',
      en: 'Sign of f\' changes: +→0→− gives max, −→0→+ gives min, no change = saddle/inflection.',
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
    misconception: {
      wrongKo: 'f\'(c) = 0 이면 항상 극값.',
      wrongEn: 'f\'(c) = 0 always gives an extremum.',
      whyKo: '변곡점(예: x³ at 0)을 극값으로 잘못 분류.',
      whyEn: 'Misclassifies inflection points (e.g. x³ at 0).',
      correctKo: '임계점은 후보일 뿐. f\' 부호 변화 또는 f\'\' 부호로 확인 필요.',
      correctEn: 'Critical points are only candidates. Confirm via sign change of f\' or f\'\'.',
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
    concrete: {
      ko: '속도 v(t) = 2t 인 차의 0~3초 사이 이동거리 = ∫₀³ 2t dt = [t²]₀³ = 9 m. 즉 속도의 누적 = 거리.',
      en: 'Car with velocity v(t) = 2t. Distance in 0~3 s = ∫₀³ 2t dt = [t²]₀³ = 9 m. Accumulated velocity = distance.',
    },
    pictorial: {
      ko: '곡선 y = f(x) 와 x 축 사이 면적을 무한히 얇은 직사각형들의 합으로 본 것이 ∫f dx.',
      en: 'The area under y = f(x) above the x-axis, built as a limit of infinitely thin rectangles.',
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
    concrete: {
      ko: 'y = x² 와 x 축, x=0, x=2 로 둘러싸인 면적 = ∫₀² x² dx = 8/3 ≈ 2.67. 회전체(x축 기준) 부피 = π∫(x²)² dx = 32π/5.',
      en: 'Area bounded by y = x², x-axis, x=0, x=2: ∫₀² x² dx = 8/3 ≈ 2.67. Volume of revolution (about x-axis) = π∫(x²)² dx = 32π/5.',
    },
    pictorial: {
      ko: '회전체 부피: 곡선을 x 축 둘레로 회전 시켜 만든 입체. 단면(원) 넓이 π[f(x)]² 를 x로 누적.',
      en: 'Volume of revolution: rotate the curve around the x-axis. Each cross-section is a disk of area π[f(x)]²; sum along x.',
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
    misconception: {
      wrongKo: '회전체 부피 = π ∫ f(x) dx (제곱 없이).',
      wrongEn: 'Volume of revolution = π ∫ f(x) dx (no square).',
      whyKo: '단면이 원(반지름 f(x))이므로 넓이 π[f(x)]² 인 것을 놓침.',
      whyEn: 'Forgot that each disk has area π·r² where r = f(x).',
      correctKo: 'V = π ∫ [f(x)]² dx — 반드시 제곱.',
      correctEn: 'V = π ∫ [f(x)]² dx — always square.',
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
    concrete: {
      ko: '뉴턴의 냉각 법칙: dT/dt = −k(T − T_env). 풀면 T(t) = T_env + (T₀ − T_env)e^(−kt). 시간 ↑ 일 때 T 가 환경 온도로 수렴.',
      en: 'Newton\'s cooling: dT/dt = −k(T − T_env). Solution T(t) = T_env + (T₀ − T_env)e^(−kt). As t→∞, T approaches ambient.',
    },
    pictorial: {
      ko: '방향장 (slope field): 평면 각 점에 미분방정식이 지시하는 짧은 화살표 그리기 → 해 곡선이 화살표를 따라가는 흐름.',
      en: 'Slope field: draw short arrows at each point given by dy/dx. Solutions are curves that flow along the arrows.',
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
    misconception: {
      wrongKo: '미분방정식의 일반해에 +C 를 잊는다.',
      wrongEn: 'Forgets the +C in the general solution.',
      whyKo: '부정적분 결과에 적분상수 미포함.',
      whyEn: 'Skipped the constant of integration.',
      correctKo: '일반해는 항상 +C 포함. 초기조건이 주어지면 그제야 C 결정.',
      correctEn: 'General solution always carries +C; an initial condition pins it down.',
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
    concrete: {
      ko: '바람이 동쪽 5 m/s, 비행기가 북동 30° 방향 비행. 바람 성분 = 비행 방향으로의 내적. 두 변(3, 4) 평행사변형 면적 = |a × b| = 12.',
      en: 'Wind 5 m/s east; plane flies 30° NE. Headwind component = dot product. Parallelogram with sides 3, 4 has area |a × b| = 12.',
    },
    pictorial: {
      ko: '내적 a·b: b 방향으로 a 의 그림자 길이 × |b|. 외적 a × b: a, b 가 만드는 평행사변형 면적, 방향은 오른손법칙.',
      en: 'Dot a·b: length of a\'s shadow on b times |b|. Cross a × b: area of parallelogram; direction by right-hand rule.',
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
    concrete: {
      ko: '점 (1,2,3) 을 지나고 방향 (1,0,0) 인 직선: r = (1,2,3) + t(1,0,0) = (1+t, 2, 3). 평면 2x+3y−z=5 는 법선 (2,3,−1).',
      en: 'Line through (1,2,3) with direction (1,0,0): r = (1,2,3) + t(1,0,0) = (1+t, 2, 3). Plane 2x+3y−z=5 has normal (2,3,−1).',
    },
    pictorial: {
      ko: '직선 = 점에서 방향벡터를 따라 ± 늘인 자취. 평면 = 한 점에서 법선과 직각인 모든 점.',
      en: 'Line = trace of point ± direction vector. Plane = all points perpendicular to a normal from one point.',
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
    misconception: {
      wrongKo: '평면 ax+by+cz=d 의 법선은 (a, b, c, d).',
      wrongEn: 'Normal of ax+by+cz=d is (a, b, c, d).',
      whyKo: 'd 까지 포함시키는 흔한 실수.',
      whyEn: 'Includes the constant d in the normal.',
      correctKo: '법선은 (a, b, c). d 는 평면이 원점에서 떨어진 정도(상수항).',
      correctEn: 'Normal is (a, b, c); d is the offset from origin.',
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
    concrete: {
      ko: '공장: 의자 x, 책상 y 만들 때 목재 2x+3y ≤ 12, 시간 x+y ≤ 5. 이익 Z = 4x + 5y 최대화. 꼭짓점 시험 → (3, 2) 에서 Z=22.',
      en: 'Factory: chairs x, desks y. Wood 2x+3y ≤ 12, time x+y ≤ 5. Maximise Z = 4x + 5y. Test vertices → max at (3,2), Z=22.',
    },
    pictorial: {
      ko: '평면에 제약 부등식들을 그리면 가능영역 = 다각형. 목적함수 Z = c·x + c·y 의 등치선이 다각형 위로 평행이동하면 최댓점은 꼭짓점에서.',
      en: 'Draw constraints on the plane → feasible region is a polygon. Sliding the objective level line, max touches a vertex.',
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
    misconception: {
      wrongKo: 'LP 최적해는 가능영역 내부에서 발생할 수 있다.',
      wrongEn: 'LP optimum can occur inside the feasible region.',
      whyKo: '선형 목적함수는 내부 임계점이 없음.',
      whyEn: 'A linear objective has no interior critical point.',
      correctKo: '선형 함수는 평면 위 기울어진 면 → 최적은 항상 꼭짓점(또는 변 전체) 에서.',
      correctEn: 'Linear = tilted plane; extrema land on vertices (or entire edges).',
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
    concrete: {
      ko: '질병 유병률 1%. 검사 정확도 99%. 양성 결과 1건이 진짜 환자일 확률? 직관 99%인데 베이즈로 계산하면 약 50%. 사전확률이 결정적.',
      en: 'Disease prevalence 1%. Test 99% accurate. P(sick | positive)? Intuition says 99%; Bayes gives ~50%. Prior dominates.',
    },
    pictorial: {
      ko: '트리 다이어그램: 첫 가지 = 질병 유무 (1% / 99%), 둘째 가지 = 검사 결과. 양성 경로 비율로 베이즈 계산.',
      en: 'Tree diagram: first branch = sick/well (1%/99%), second = test outcome. Compare positive branches.',
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
