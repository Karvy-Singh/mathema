/**
 * 백엔드 콘텐츠 EN 번역 사전.
 *
 * 데모용으로 한국 수능 수학 콘텐츠를 영문 SAT/AP-style 표현으로 옮긴 것.
 * 실제 운영 시에는 DB에 `*_en` 컬럼을 두는 것이 정석이지만, 본 POC는 in-memory 매핑으로 충분.
 *
 * 키:
 *   - PROBLEM_EN: source(예: "2024 9월 모의평가 30번") → { body, answer, hint }
 *   - STEP_PROMPT_EN: source + ":" + stepIndex → prompt EN
 *   - CHOICE_EN: source + ":" + stepIndex + ":" + choiceIndex → { text, rationale? }
 *   - UNIT_NAME_EN / SUB_UNIT_NAME_EN: 한글명 → 영문명
 *   - DIFFICULTY_EN / ERROR_TYPE_EN: enum → 영문 라벨
 *   - DASHBOARD_TAG_EN, RECOMMENDATION_EN: 추천 카드 라벨
 */

// NCERT 7~12 챕터 한국어명 → 영어명 매핑 (79 챕터, 1:1).
// 1차 출시 표준은 EN. KO 는 개발자 보조용 번역본.
// 키는 unit.enum.ts GRADE_TO_UNITS 의 단원명과 정확히 일치한다.
//
// + Legacy 한국 교육과정 단원명 (옛 시드 DB 호환). seed 재실행 전이거나
//   기존 사용자가 옛 mastery snapshot 을 들고 있을 때 fallback 으로 한국어가
//   영어 UI 에 노출되는 것을 방지.
export const UNIT_NAME_EN: Record<string, string> = {
  // ----- Legacy (옛 한국 교육과정 단원명) -----
  '수와 식':             'Numbers & Expressions',
  '함수':                'Relations and Functions',
  '정수와 유리수':       'Integers & Rationals',
  '문자와 식':           'Algebraic Expressions',
  '일차방정식':          'Simple Equations',
  '유리수와 순환소수':   'Rational Numbers',
  '좌표평면과 그래프':   'Coordinate Plane',
  '식의 계산':           'Algebraic Identities',
  '일차함수':            'Linear Functions',
  '제곱근과 실수':       'Real Numbers (Surds)',
  '인수분해':            'Factorisation',
  '이차함수':            'Quadratic Functions',
  '방정식과 부등식':     'Equations & Inequalities',
  '도형의 방정식':       'Equations of Figures',
  '함수와 그래프':       'Functions & Graphs',
  '미적분 I':            'Calculus I',
  '미적분 II':           'Calculus II',
  '확률·통계':           'Probability & Statistics',
  '기하·벡터':           'Geometry & Vectors',
  '지수와 로그':         'Exponential & Logarithmic',
  '삼각함수':            'Trigonometric Functions (Legacy)',
  '수열':                'Sequences',
  '함수의 극한':         'Limits of Functions',
  // (참고: '일차부등식', '다항식', '이차방정식' 등은 NCERT 단원명과 동일하므로 아래 NCERT 블록에서 처리)

  // ----- NCERT Class 7 -----
  // Class 7
  '정수':                     'Integers',
  '분수와 소수':              'Fractions and Decimals',
  '자료의 정리':              'Data Handling',
  '간단한 방정식':            'Simple Equations',
  '직선과 각':                'Lines and Angles',
  '삼각형의 성질':            'The Triangle and its Properties',
  '비교하기 (비·백분율)':     'Comparing Quantities',
  '유리수':                   'Rational Numbers',
  '둘레와 넓이':              'Perimeter and Area',
  '대수식':                   'Algebraic Expressions',
  '지수와 거듭제곱':          'Exponents and Powers',
  '대칭':                     'Symmetry',
  '입체도형의 시각화':        'Visualising Solid Shapes',
  // Class 8
  '유리수의 성질':                  'Rational Numbers',
  '일변수 일차방정식':              'Linear Equations in One Variable',
  '사각형의 이해':                  'Understanding Quadrilaterals',
  '자료의 정리 II':                 'Data Handling',
  '제곱과 제곱근':                  'Squares and Square Roots',
  '세제곱과 세제곱근':              'Cubes and Cube Roots',
  '비교하기 II (이자·할인)':        'Comparing Quantities',
  '대수식과 항등식':                'Algebraic Expressions and Identities',
  '도형의 양 (둘레·넓이·부피)':     'Mensuration',
  '지수의 확장':                    'Exponents and Powers',
  '정비례·반비례':                  'Direct and Inverse Proportions',
  '인수분해 (입문)':                'Factorisation',
  '그래프 입문':                    'Introduction to Graphs',
  // Class 9
  '수의 체계 (실수)':               'Number Systems',
  '다항식':                         'Polynomials',
  '좌표기하 입문':                  'Coordinate Geometry',
  '두 변수 일차방정식':             'Linear Equations in Two Variables',
  '유클리드 기하의 공준':           "Introduction to Euclid's Geometry",
  '직선과 각 II':                   'Lines and Angles',
  '삼각형 (합동)':                  'Triangles',
  '사각형 (성질·증명)':             'Quadrilaterals',
  '원':                             'Circles',
  '헤론의 공식':                    "Heron's Formula",
  '겉넓이와 부피':                  'Surface Areas and Volumes',
  '통계 입문':                      'Statistics',
  // Class 10
  '실수 II (산술의 기본정리)':      'Real Numbers',
  '다항식 II (영점·계수 관계)':     'Polynomials',
  '두 변수 일차연립방정식':         'Pair of Linear Equations in Two Variables',
  '이차방정식':                     'Quadratic Equations',
  '등차수열 (A.P.)':                'Arithmetic Progressions',
  '삼각형의 닮음':                  'Triangles (Similarity)',
  '좌표기하 II (분점·넓이)':        'Coordinate Geometry',
  '삼각비 입문':                    'Introduction to Trigonometry',
  '삼각비의 활용':                  'Some Applications of Trigonometry',
  '원 II (접선)':                   'Circles',
  '원과 관련된 넓이':               'Areas Related to Circles',
  '겉넓이·부피 (합성도형)':         'Surface Areas and Volumes',
  '통계 II (평균·중앙값·최빈값)':   'Statistics',
  '확률 입문':                      'Probability',
  // Class 11
  '집합':                           'Sets',
  '관계와 함수':                    'Relations and Functions',
  '삼각함수 (일반각)':              'Trigonometric Functions',
  '복소수와 이차방정식':            'Complex Numbers and Quadratic Equations',
  '일차부등식':                     'Linear Inequalities',
  '순열과 조합':                    'Permutations and Combinations',
  '이항정리':                       'Binomial Theorem',
  '수열과 급수':                    'Sequences and Series',
  '직선의 방정식':                  'Straight Lines',
  '원뿔곡선':                       'Conic Sections',
  '공간기하 입문':                  'Introduction to Three Dimensional Geometry',
  '극한과 미분 입문':               'Limits and Derivatives',
  '통계 III (분산·표준편차)':       'Statistics',
  '확률 II (사건의 대수)':          'Probability',
  // Class 12
  '관계와 함수 II':                 'Relations and Functions',
  '역삼각함수':                     'Inverse Trigonometric Functions',
  '행렬':                           'Matrices',
  '행렬식':                         'Determinants',
  '연속과 미분가능성':              'Continuity and Differentiability',
  '미분의 활용':                    'Application of Derivatives',
  '적분':                           'Integrals',
  '적분의 활용':                    'Application of Integrals',
  '미분방정식':                     'Differential Equations',
  '벡터대수':                       'Vector Algebra',
  '공간기하 II':                    'Three Dimensional Geometry',
  '선형계획법':                     'Linear Programming',
  '확률 III (조건부·베이즈)':       'Probability',
};

// 서브유닛도 NCERT 표현으로 통일 (A.P., G.P., Vieta's, surd, mensuration, identities, etc.)
export const SUB_UNIT_NAME_EN: Record<string, string> = {
  // 옛 sub-unit 호환 (legacy 시드 DB)
  '실수와 식':           'Real Numbers & Expressions',
  '복소수':              'Complex Numbers',
  '다항식':              'Polynomials',
  '삼각함수':            'Trigonometric Functions',
  '함수의 극한과 연속':  'Limits and Continuity of Functions',
  // Class 12 legacy
  '정적분의 활용':       'Applications of Integrals',
  '부분적분':            'Integration by Parts',
  '치환적분':            'Integration by Substitution',
  '조건부확률':          'Conditional Probability',
  '공간벡터':            'Vectors in 3D',
  '정적분':              'Definite Integral',
  '지수·로그함수':       'Exponential & Logarithmic Functions',
  '핵심 영역':           'Core area',
  '핵심 개념':           'Core concepts',
  '실전 응용':           'Applied practice',
  // Class 7 (중1)
  '정수의 사칙연산':     'Operations on Integers',
  '유리수와 절댓값':     'Rational Numbers & Modulus',
  '소수와 분수의 변환':  'Decimal–Fraction Conversion',
  '문자식 표현':         'Forming Algebraic Expressions',
  '동류항 정리':         'Combining Like Terms',
  '식의 값 계산':        'Evaluating Expressions',
  '일차방정식 풀이':     'Solving Simple Equations',
  '비례식과 활용':       'Ratio and Proportion',
  '일차방정식의 활용':   'Word Problems on Equations',
  '순서쌍과 좌표':       'Ordered Pairs & Coordinates',
  '정비례·반비례':       'Direct & Inverse Variation',
  '그래프 해석':         'Reading Graphs',
  // Class 8 (중2)
  '순환소수와 분수':     'Repeating Decimals & Fractions',
  '유한·무한소수':       'Terminating & Non-Terminating Decimals',
  '지수법칙':            'Laws of Exponents',
  '다항식의 곱셈':       'Multiplication of Polynomials',
  '곱셈공식':            'Algebraic Identities',
  '일차부등식 풀이':     'Solving Linear Inequalities',
  '연립일차부등식':      'System of Linear Inequalities',
  '일차함수의 그래프':   'Linear Graphs',
  '기울기와 절편':       'Slope & Intercept Form',
  '연립방정식과 그래프': 'Graphical Method for Systems',
  // Class 9 (중3)
  '제곱근의 계산':       'Operations on Surds',
  '무리수와 실수':       'Irrational & Real Numbers',
  '근호의 사칙연산':     'Operations with Radicals',
  '공통인수':            'Common Factors',
  '완전제곱식':          'Perfect-Square Identity',
  '인수분해 공식':       'Factorisation by Identities',
  '인수분해로 풀이':     'Solving by Factorisation',
  '근의 공식':           'Quadratic Formula',
  '판별식':              'Discriminant (b² − 4ac)',
  '근과 계수의 관계':    "Vieta's Formulas (Sum & Product of Roots)",
  '이차함수의 그래프':   'Graphs of Quadratic Polynomials',
  '꼭짓점·축':           'Vertex & Axis of Symmetry',
  '최댓값·최솟값':       'Maximum & Minimum Values',
  // Class 10 (고1)
  '다항식의 사칙연산':   'Operations on Polynomials',
  '나머지정리':          'Remainder Theorem',
  '인수정리':            'Factor Theorem',
  '이차방정식의 활용':   'Word Problems on Quadratics',
  '연립이차방정식':      'Systems Involving Quadratics',
  '이차부등식':          'Quadratic Inequalities',
  '절댓값 부등식':       'Modulus Inequalities',
  '직선의 방정식':       'Equation of a Line',
  '원의 방정식':         'Equation of a Circle',
  '도형의 이동':         'Translations & Reflections',
  '함수의 정의':         'Definition of a Function',
  '합성함수':            'Composition of Functions',
  '역함수':              'Inverse Functions',
  '유리·무리함수':       'Rational & Surd Functions',
  // Class 11 (고2)
  '지수의 확장':         'Generalised Exponents',
  '로그의 정의':         'Definition of Logarithm',
  '지수·로그함수의 그래프': 'Graphs of Exp/Log Functions',
  '일반각과 호도법':     'Angle Measure & Radian System',
  '삼각함수의 정의':     'Trigonometric Ratios & Identities',
  '삼각함수의 그래프':   'Graphs of Trig Functions',
  '삼각함수의 활용':     'Applications of Trigonometry',
  '등차수열':            'Arithmetic Progression (A.P.)',
  '등비수열':            'Geometric Progression (G.P.)',
  '수열의 합 (Σ)':       'Sigma Notation & Series',
  '수학적 귀납법':       'Principle of Mathematical Induction',
  '함수의 극한':         'Limits',
  '함수의 연속':         'Continuity',
  '미분계수의 정의':     'First-Principle Derivative',
  // Class 12 (고3)
  '도함수':              'Derivatives',
  '미분의 활용':         'Applications of Derivatives',
  '적분의 기초':         'Indefinite Integrals',
  '경우의 수':           'Permutations & Combinations',
  '정규분포':            'Normal Distribution',
  '통계적 추정':         'Estimation in Statistics',
  '공간도형':            'Three-Dimensional Geometry',
  '공간좌표':            '3D Coordinate System',
};

// 난이도 EN 라벨 — 한국 수능 "킬러" 표현을 NCERT/JEE 컨텍스트에 맞춘 일반 라벨로 통일.
// (enum 값 자체는 DB 호환을 위해 SEMI_KILLER/KILLER 유지)
export const DIFFICULTY_EN: Record<string, string> = {
  MIDDLE:       'Easy',
  UPPER_MIDDLE: 'Medium',
  SEMI_KILLER:  'Hard',
  KILLER:       'Challenging',
};

export const ERROR_TYPE_EN: Record<string, string> = {
  CONCEPT_MISUNDERSTANDING: 'Concept misunderstanding',
  CALCULATION_MISTAKE:       'Calculation mistake',
  TIME_SHORTAGE:             'Time shortage',
  OTHER:                     'Other',
};

/** Problem.source EN — 시험명·문항번호 표시 */
export const SOURCE_EN: Record<string, string> = {
  // 고3 legacy
  '2024 9월 모의평가 30번':   'NCERT 12 · Integrals · Q30',
  '수능특강 미적분 III-2-15': 'NCERT 12 · Integrals · Practice 15',
  '2024 6월 모의평가 28번':   'NCERT 12 · Probability · Q28',
  '2024 9월 모의평가 21번':   'NCERT 12 · Vector Algebra · Q21',
  '교육청 학평 18번':         'NCERT 12 · Integrals · Practice 18',
  '수능기출 2023 22번':       'NCERT 12 · Integrals (Riemann) · Q22',
  '2024 6월 모의평가 21번':   'NCERT 11 · Logarithms · Q21',
  // 신규 — 중1 데모 (20문제 × 3단계)
  '중1 · 정수와 유리수 1': 'Grade 7 · Integers · Q1',
  '중1 · 정수와 유리수 2': 'Grade 7 · Integers · Q2',
  '중1 · 정수와 유리수 3': 'Grade 7 · Integers · Q3',
  '중1 · 정수와 유리수 4': 'Grade 7 · Integers · Q4',
  '중1 · 정수와 유리수 5': 'Grade 7 · Integers · Q5',
  '중1 · 문자와 식 1':     'Grade 7 · Algebraic Expressions · Q1',
  '중1 · 문자와 식 2':     'Grade 7 · Algebraic Expressions · Q2',
  '중1 · 문자와 식 3':     'Grade 7 · Algebraic Expressions · Q3',
  '중1 · 문자와 식 4':     'Grade 7 · Algebraic Expressions · Q4',
  '중1 · 일차방정식 1':    'Grade 7 · Simple Equations · Q1',
  '중1 · 일차방정식 2':    'Grade 7 · Simple Equations · Q2',
  '중1 · 일차방정식 3':    'Grade 7 · Simple Equations · Q3',
  '중1 · 일차방정식 4':    'Grade 7 · Simple Equations · Q4',
  '중1 · 일차방정식 5':    'Grade 7 · Simple Equations · Q5',
  '중1 · 일차방정식 6':    'Grade 7 · Simple Equations · Q6',
  '중1 · 일차방정식 7':    'Grade 7 · Simple Equations · Q7',
  '중1 · 좌표와 그래프 1': 'Grade 7 · Coordinate Plane · Q1',
  '중1 · 좌표와 그래프 2': 'Grade 7 · Coordinate Plane · Q2',
  '중1 · 좌표와 그래프 3': 'Grade 7 · Coordinate Plane · Q3',
  '중1 · 좌표와 그래프 4': 'Grade 7 · Coordinate Plane · Q4',
};

/** WrongNote.insight EN — 시드된 한국어 insight 영문 매핑 */
export const INSIGHT_EN: Record<string, string> = {
  '회전체 부피 공식에서 회전축에 따른 적분구간 설정을 혼동':
    'Confused integration bounds when applying the volume-of-revolution formula about the wrong axis.',
  '부분적분 공식 적용 후 부호 오류 반복 (3회)':
    'Repeated sign errors after applying integration-by-parts (3×).',
  '조건부확률에서 표본공간 재정의를 놓침':
    'Missed redefining the sample space in the conditional-probability step.',
  '공간좌표 설정에서 좌표축 회전 시각화 부족':
    'Insufficient visualization of coordinate-axis rotation in the spatial setup.',
  '구분구적법과 정적분의 정의 사이 직관적 연결 부족':
    'Missing intuitive link between Riemann sums and the definition of the integral.',
  'du 변환 시 dx와의 관계식에서 상수항 누락 반복':
    'Repeatedly drops the constant when relating du and dx during substitution.',
  // 중1 데모 wrong notes
  '괄호를 풀고 동류항 정리 후 이항 단계를 자주 빠뜨림':
    'Frequently skips the move-to-the-other-side step after expanding parentheses and combining like terms.',
  '음수 곱셈 부호 결정 시 음수 개수 카운팅 실수 반복':
    'Repeatedly miscounts negative factors when determining the sign of a product.',
  '사분면 번호와 좌표 부호의 대응을 혼동':
    'Confuses the mapping between quadrant numbers and coordinate signs.',
  '도형 둘레식 세우기 단계에서 변의 개수 혼동':
    'Confuses the number of sides when setting up the perimeter equation.',
  '식의 값 계산 시 음수 제곱의 부호 처리에서 시간 소모':
    'Spends extra time handling the sign of (negative)² when evaluating expressions.',
  '분수 계수 방정식에서 양변에 분모를 곱하는 단계 누락':
    'Skips multiplying both sides by the denominator in equations with fractional coefficients.',
};

/** Problem.hint EN — 시드의 일반 안내문 매핑 */
export const HINT_EN: Record<string, string> = {
  '단계별 가이드는 학습 페이지의 AI 가이드 패널에서 확인하세요.':
    'Step-by-step guidance is available in the AI Guide panel on the Study page.',
};

/** Problem.formula EN — 공식 영문 매핑 (개념 박스의 공식 라인) */
export const FORMULA_EN: Record<string, string> = {
  '2024 9월 모의평가 30번': 'V = π ∫ₐᵇ [f(x)]² dx (revolution about x-axis)',
  '수능특강 미적분 III-2-15': '∫ u dv = uv − ∫ v du',
  '2024 6월 모의평가 28번': 'P(A | B) = P(A ∩ B) / P(B)',
  '2024 9월 모의평가 21번': 'cos θ = |u·v| / (|u| · |v|)',
  '교육청 학평 18번': 't = g(x) ⇒ dt = g\'(x) dx',
  '수능기출 2023 22번': '∫ₐᵇ f(x) dx = lim Σ f(xₖ*) · Δx ; Σ k² = n(n+1)(2n+1)/6',
  '2024 6월 모의평가 21번': 'log_a A ≥ b ⇔ A ≥ aᵇ (a > 1, A > 0)',
  '중1 · 정수와 유리수 1': '(opposite-sign sum) = sign(larger |·|) × (larger |·| − smaller |·|)',
  '중1 · 정수와 유리수 2': 'a − (−b) = a + b',
  '중1 · 정수와 유리수 3': 'sign of product = (−1)^(count of negatives)',
  '중1 · 정수와 유리수 4': '|x| = x (x ≥ 0), |x| = −x (x < 0)',
  '중1 · 정수와 유리수 5': '0.abc = abc / 1000 → reduce',
  '중1 · 문자와 식 1': 'a × x = ax (number before variable)',
  '중1 · 문자와 식 2': 'mx + nx = (m + n)x (combine like terms)',
  '중1 · 문자와 식 3': '(−a)² = a² ≠ −a²',
  '중1 · 문자와 식 4': 'a(b + c) = ab + ac;  −a(b − c) = −ab + ac',
  '중1 · 일차방정식 1': 'ax + b = c ⇒ x = (c − b) / a',
  '중1 · 일차방정식 2': 'a(x + b) = c ⇒ ax + ab = c (distribute then transpose)',
  '중1 · 일차방정식 3': '−ax + b = c ⇒ x = (b − c) / a',
  '중1 · 일차방정식 4': 'x/n + b = c ⇒ x + nb = nc (multiply both sides by n)',
  '중1 · 일차방정식 5': 'square perimeter = 4 × side',
  '중1 · 일차방정식 6': 'sum of 3 consecutive naturals = 3 × (middle) = 3x + 3',
  '중1 · 일차방정식 7': 'a : b = c : d ⇔ ad = bc',
  '중1 · 좌표와 그래프 1': 'I(+,+), II(−,+), III(−,−), IV(+,−)',
  '중1 · 좌표와 그래프 2': '(x, y) → x-axis: (x, −y), y-axis: (−x, y), origin: (−x, −y)',
  '중1 · 좌표와 그래프 3': 'y = ax (direct proportion) ⇒ a = y/x',
  '중1 · 좌표와 그래프 4': 'y = ax (a ≠ 0) passes the origin; a > 0: I·III, a < 0: II·IV',
  // Class 8/9/10 NCERT seed (formulas in EN — KO seed text had Korean fragments)
  'Class 8 · Rational Numbers · Q1':     'x = 0.\\overline{abc…n}  ⇒  10ⁿx − x = (integer part)  ⇒  x = (integer part) / (10ⁿ − 1)',
  'Class 8 · Algebraic Identities · Q1': '(a + b)² = a² + 2ab + b²',
  'Class 8 · Linear Equations · Q1':     'ax + b = cx + d  ⇒  (a − c)x = d − b  ⇒  x = (d − b)/(a − c)',
  'Class 8 · Graphs · Q1':               'slope m = (y₂ − y₁)/(x₂ − x₁)',
  'Class 9 · Number Systems · Q1':       '√(a²·b) = a√b ;  √m + √n can be combined only if they share the same surd',
  'Class 9 · Polynomials · Q1':          'x² + (p+q)x + pq = (x + p)(x + q)',
  'Class 9 · Coordinate Geometry · Q1':  'd = √[(x₂ − x₁)² + (y₂ − y₁)²]',
  'Class 9 · Polynomials · Q2':          'p(c) = substitute c for the variable in p(x) (function evaluation)',
  'Class 10 · Polynomials · Q1':         'remainder when divided by (x − c) equals p(c) (Remainder Theorem)',
  'Class 10 · Quadratic Equations · Q1': 'x² − (sum)x + (product) = 0  ⇒  factor as (x − r₁)(x − r₂) = 0',
  'Class 10 · Coordinate Geometry · Q1': 'midpoint M = ((x₁ + x₂)/2, (y₁ + y₂)/2)',
  'Class 10 · Trigonometry · Q1':        'sin²θ + cos²θ = 1  ⇒  cos θ = √(1 − sin²θ) (acute angle)',
};

/** Problem.concept EN — 핵심 개념 영문 매핑 (학습 피드백·오답노트 상세) */
export const CONCEPT_EN: Record<string, string> = {
  // 고3 featured
  '2024 9월 모의평가 30번': 'Volume of revolution about the x-axis: V = π ∫ [f(x)]² dx. Distinguish from a plain definite integral (area) or the shell method (2π ∫ x f(x) dx, used for y-axis revolution).',
  '수능특강 미적분 III-2-15': 'Integration by parts: ∫ u dv = uv − ∫ v du. Common when integrating products of polynomials with exp/trig/log. Pick u and dv carefully, compute du, v, and track signs.',
  '2024 6월 모의평가 28번': 'Conditional probability: P(A|B) = P(A ∩ B) / P(B). Once B is known, the sample space shrinks to B. Don’t confuse with the multiplication rule or Bayes’ theorem.',
  '2024 9월 모의평가 21번': 'Angle between two lines in space: cos θ = |u·v| / (|u|·|v|). The absolute value forces an acute angle; compute direction vectors as coordinate differences, then dot product and magnitudes.',
  '교육청 학평 18번': 'Substitution: when t = g(x), also change dt = g\'(x) dx. After integrating, substitute back to the original variable x.',
  '수능기출 2023 22번': 'Riemann definition: ∫ f(x) dx = lim Σ f(xₖ*) · Δx. Take xₖ = k/n with width 1/n, then use sums like Σ k² = n(n+1)(2n+1)/6.',
  '2024 6월 모의평가 21번': 'Logarithmic inequality log_a A ≥ b (a > 1) ⇔ A ≥ aᵇ together with A > 0 (domain). Final answer = intersection of solution and domain.',
  // 중1 — 정수와 유리수
  '중1 · 정수와 유리수 1': 'Sum of opposite-sign numbers = (sign of larger absolute value) × (larger |·| − smaller |·|). Distinguish from the same-sign rule (add absolute values).',
  '중1 · 정수와 유리수 2': 'Subtracting a negative flips its sign: a − (−b) = a + b. Only the subtrahend changes sign — the leading number stays.',
  '중1 · 정수와 유리수 3': 'Sign of a product: even count of negatives → +, odd → −. Multiply absolute values for the magnitude.',
  '중1 · 정수와 유리수 4': '|x| is the distance from 0 (≥ 0). Negative numbers flip; positives and 0 stay. Don’t confuse with squaring.',
  '중1 · 정수와 유리수 5': 'Decimal → fraction: use 10ⁿ as the denominator (n = decimal places), then reduce. 0.4 = 4/10 = 2/5.',
  // 중1 — 문자와 식
  '중1 · 문자와 식 1': '"a times x" is written ax (multiplication). The number comes before the variable, with the × sign omitted. Don’t mix × with +.',
  '중1 · 문자와 식 2': 'Like terms = same variable AND same degree. Add or subtract only the coefficients; keep the variable part unchanged.',
  '중1 · 문자와 식 3': 'Evaluate by substituting numbers for variables. Be careful: (−2)² = 4 but −2² = −4 (parentheses matter).',
  '중1 · 문자와 식 4': 'A negative outside parentheses distributes a sign flip to every term: −2(3x − 5) = −6x + 10. Then combine like terms.',
  // 중1 — 일차방정식
  '중1 · 일차방정식 1': 'Solving a linear equation: (1) move constants to the other side (sign flips), (2) divide both sides by the coefficient. Sign change on transposition is the key.',
  '중1 · 일차방정식 2': 'With parentheses: distribute → combine like terms → transpose → divide both sides.',
  '중1 · 일차방정식 3': 'With a negative coefficient: transpose constants first, then divide both sides by the negative number. No need to multiply by −1 first.',
  '중1 · 일차방정식 4': 'With fractional coefficients: multiply both sides by the LCM of the denominators to clear fractions, then solve normally.',
  '중1 · 일차방정식 5': 'Word problem → equation: define a variable, then apply the relevant formula (e.g., perimeter of a square = 4 × side).',
  '중1 · 일차방정식 6': 'Three consecutive natural numbers: x, x+1, x+2. Their sum is 3x + 3 (or 3 × the middle value).',
  '중1 · 일차방정식 7': 'Proportion a : b = c : d ⇔ b · c = a · d (product of inner terms = product of outer terms). Set unknown as one term and solve.',
  // 중1 — 좌표와 그래프
  '중1 · 좌표와 그래프 1': 'Quadrants: I (+,+), II (−,+), III (−,−), IV (+,−), counter-clockwise.',
  '중1 · 좌표와 그래프 2': 'Reflect across the x-axis: only the y-coordinate flips sign. y-axis reflection flips x; origin reflection flips both.',
  '중1 · 좌표와 그래프 3': 'Direct proportion y = ax. The constant a = y/x. One point (x, y) determines a, hence the equation.',
  '중1 · 좌표와 그래프 4': 'y = ax with a < 0: passes through the origin and goes upper-left → lower-right (Quadrants II and IV).',
};

/** 7 problems EN content — body·answer·hint per source */
export const PROBLEM_EN: Record<string, { body: string; answer: string; hint?: string }> = {
  '2024 9월 모의평가 30번': {
    body: 'Find the volume of the solid formed by rotating the region bounded by f(x) = √x, the x-axis, and the line x = 4 around the x-axis.',
    answer: '8π',
  },
  '수능특강 미적분 III-2-15': {
    body: 'Evaluate ∫ x · e^x dx.',
    answer: '(x − 1) e^x + C',
  },
  '2024 6월 모의평가 28번': {
    body: 'In a ball-drawing experiment, find P(A | B) under the given conditions.',
    answer: '7/15',
  },
  '2024 9월 모의평가 21번': {
    body: 'In space coordinates, find the cosine of the angle between the two given lines.',
    answer: '√3 / 3',
  },
  '교육청 학평 18번': {
    body: 'Evaluate ∫ 2x · √(x² + 1) dx.',
    answer: '(2/3)(x² + 1)^(3/2) + C',
  },
  '수능기출 2023 22번': {
    body: 'Use the Riemann-sum definition to evaluate ∫₀¹ x² dx.',
    answer: '1/3',
  },
  '2024 6월 모의평가 21번': {
    body: 'Solve the inequality log₂(x² − x − 6) ≥ 0.',
    answer: 'x ≤ −2 or x ≥ 4',
  },
  // ----- 중1 demo problems (used for the demo mock — body/answer EN parallel) -----
  '중1 · 정수와 유리수 1': { body: 'Compute: (-3) + 7', answer: '4' },
  '중1 · 정수와 유리수 2': { body: 'Compute: (-5) - (-8)', answer: '3' },
  '중1 · 정수와 유리수 3': { body: 'Compute: (-2) × (+3) × (-4)', answer: '24' },
  '중1 · 정수와 유리수 4': { body: 'Find the value of |−7| + |+5|.', answer: '12' },
  '중1 · 정수와 유리수 5': { body: 'Express 0.4 as a reduced fraction.', answer: '2/5' },
  '중1 · 문자와 식 1':     { body: 'Write an expression for "5 times x, plus 3".', answer: '5x + 3' },
  '중1 · 문자와 식 2':     { body: 'Simplify: 3a + 2b - a + 5b', answer: '2a + 7b' },
  '중1 · 문자와 식 3':     { body: 'For x = -2, evaluate 3x² - 5.', answer: '7' },
  '중1 · 문자와 식 4':     { body: 'Simplify: -2(3x - 5) + 4x', answer: '-2x + 10' },
  '중1 · 일차방정식 1':    { body: 'Solve for x: 3x − 7 = 11', answer: 'x = 6' },
  '중1 · 일차방정식 2':    { body: 'Solve for x: 2(x + 4) = 5x − 1', answer: 'x = 3' },
  '중1 · 일차방정식 3':    { body: 'Solve for x: -3x + 5 = 14', answer: 'x = -3' },
  '중1 · 일차방정식 4':    { body: 'Solve for x: x/2 + 3 = 7', answer: 'x = 8' },
  '중1 · 일차방정식 5':    { body: 'A square has side x and perimeter 24cm. Find x.', answer: '6' },
  '중1 · 일차방정식 6':    { body: 'Three consecutive natural numbers sum to 39. Find the smallest.', answer: '12' },
  '중1 · 일차방정식 7':    { body: 'In the proportion 3 : 5 = x : 20, find x.', answer: '12' },
  '중1 · 좌표와 그래프 1': { body: 'In which quadrant does the point (-3, 2) lie?', answer: 'Quadrant II' },
  '중1 · 좌표와 그래프 2': { body: 'Reflect the point (4, -1) across the x-axis. New coordinates?', answer: '(4, 1)' },
  '중1 · 좌표와 그래프 3': { body: 'y is directly proportional to x; when x = 4, y = 12. Express y in terms of x.', answer: 'y = 3x' },
  '중1 · 좌표와 그래프 4': { body: 'List all quadrants the graph y = -2x passes through.', answer: 'Quadrants II and IV' },
};

const k = (source: string, step: number, choice?: number) =>
  choice !== undefined ? `${source}:${step}:${choice}` : `${source}:${step}`;

export const STEP_PROMPT_EN: Record<string, string> = {
  // Problem 1: 회전체 부피
  [k('2024 9월 모의평가 30번', 1)]: 'Which formula gives the volume of revolution about the x-axis?',
  [k('2024 9월 모의평가 30번', 2)]: 'Substituting f(x) = √x and [0, 4] into the formula gives:',
  [k('2024 9월 모의평가 30번', 3)]: 'The value of the integral (volume) is:',
  // Problem 2: 부분적분 ∫xe^x dx
  [k('수능특강 미적분 III-2-15', 1)]: 'Which technique should you use for ∫ x · e^x dx?',
  [k('수능특강 미적분 III-2-15', 2)]: 'Setting u = x and dv = e^x dx, the result of integration by parts is:',
  [k('수능특강 미적분 III-2-15', 3)]: 'Simplifying gives the antiderivative:',
  // Problem 3: 조건부확률
  [k('2024 6월 모의평가 28번', 1)]: 'What is the definition of conditional probability P(A | B)?',
  [k('2024 6월 모의평가 28번', 2)]: 'Given that B has occurred, the new sample space is:',
  [k('2024 6월 모의평가 28번', 3)]: 'After computing, the conditional probability equals:',
  // Problem 4: 두 직선의 사잇각
  [k('2024 9월 모의평가 21번', 1)]: 'Which formula gives cos θ for the angle between two lines in space?',
  [k('2024 9월 모의평가 21번', 2)]: 'The standard procedure to compute |u|, |v| and u · v is:',
  [k('2024 9월 모의평가 21번', 3)]: 'After computing, the cosine value is:',
  // Problem 5: 치환적분 ∫2x√(x²+1) dx
  [k('교육청 학평 18번', 1)]: 'Which technique should you use for ∫ 2x · √(x² + 1) dx?',
  [k('교육청 학평 18번', 2)]: 'After substituting t = x² + 1, dt and the new integral become:',
  [k('교육청 학평 18번', 3)]: 'Computing ∫ √t dt and back-substituting gives:',
  // Problem 6: 구분구적법 ∫₀¹ x² dx
  [k('수능기출 2023 22번', 1)]: 'What is the core idea of the Riemann-sum definition for ∫₀¹ x² dx?',
  [k('수능기출 2023 22번', 2)]: 'Using k/n as a representative value, the sum becomes:',
  [k('수능기출 2023 22번', 3)]: 'Applying Σk² = n(n+1)(2n+1)/6 and taking the limit:',
  // Problem 7: log_2(x²-x-6) ≥ 0
  [k('2024 6월 모의평가 21번', 1)]: 'For log₂ A ≥ 0 (with A in the domain), what is the equivalent condition?',
  [k('2024 6월 모의평가 21번', 2)]: 'Combining x² − x − 6 ≥ 1 with x² − x − 6 > 0 simplifies to:',
  [k('2024 6월 모의평가 21번', 3)]: 'The solution (intersected with the domain) is:',

  // ===== 중1 데모 (20문제 × 3단계) =====
  // 정수와 유리수
  [k('중1 · 정수와 유리수 1', 1)]: 'Rule for adding two numbers with different signs?',
  [k('중1 · 정수와 유리수 1', 2)]: 'Given |−3| = 3, |+7| = 7, the sign and magnitude of the result are:',
  [k('중1 · 정수와 유리수 1', 3)]: 'The final value is:',
  [k('중1 · 정수와 유리수 2', 1)]: 'How do you handle subtracting a negative number?',
  [k('중1 · 정수와 유리수 2', 2)]: 'Rewrite −5 − (−8) using the sign rule:',
  [k('중1 · 정수와 유리수 2', 3)]: 'The result is:',
  [k('중1 · 정수와 유리수 3', 1)]: 'Rule for the sign of a product of several numbers?',
  [k('중1 · 정수와 유리수 3', 2)]: 'For (−2) × (+3) × (−4), the sign and magnitude are:',
  [k('중1 · 정수와 유리수 3', 3)]: 'The final value is:',
  [k('중1 · 정수와 유리수 4', 1)]: 'Definition of |x| (absolute value)?',
  [k('중1 · 정수와 유리수 4', 2)]: 'Compute |−7| and |+5| separately:',
  [k('중1 · 정수와 유리수 4', 3)]: '7 + 5 = ?',
  [k('중1 · 정수와 유리수 5', 1)]: 'How do you convert a decimal to a fraction?',
  [k('중1 · 정수와 유리수 5', 2)]: 'Write 0.4 as a fraction:',
  [k('중1 · 정수와 유리수 5', 3)]: 'After reducing to lowest terms:',

  // 문자와 식
  [k('중1 · 문자와 식 1', 1)]: 'Express "5 times x" as a formula:',
  [k('중1 · 문자와 식 1', 2)]: 'Now add 3 to that:',
  [k('중1 · 문자와 식 1', 3)]: 'Final expression:',
  [k('중1 · 문자와 식 2', 1)]: 'What does "combining like terms" mean?',
  [k('중1 · 문자와 식 2', 2)]: 'Group the a-terms and b-terms in 3a + 2b − a + 5b:',
  [k('중1 · 문자와 식 2', 3)]: 'Simplified result:',
  [k('중1 · 문자와 식 3', 1)]: 'First step in evaluating an expression?',
  [k('중1 · 문자와 식 3', 2)]: 'In 3 · (−2)² − 5, evaluate the exponent step:',
  [k('중1 · 문자와 식 3', 3)]: 'Final value:',
  [k('중1 · 문자와 식 4', 1)]: 'How does a negative sign in front of parentheses behave?',
  [k('중1 · 문자와 식 4', 2)]: 'Apply the distributive rule to −2(3x − 5) + 4x:',
  [k('중1 · 문자와 식 4', 3)]: 'After combining like terms:',

  // 일차방정식
  [k('중1 · 일차방정식 1', 1)]: 'First principle for solving a linear equation?',
  [k('중1 · 일차방정식 1', 2)]: 'Move −7 to the other side of 3x − 7 = 11:',
  [k('중1 · 일차방정식 1', 3)]: 'Value of x:',
  [k('중1 · 일차방정식 2', 1)]: 'First step when an equation contains parentheses?',
  [k('중1 · 일차방정식 2', 2)]: 'Apply distribution and rearrange 2(x + 4) = 5x − 1:',
  [k('중1 · 일차방정식 2', 3)]: 'Value of x:',
  [k('중1 · 일차방정식 3', 1)]: 'Cleanest way to handle a negative coefficient on x?',
  [k('중1 · 일차방정식 3', 2)]: 'Move 5 in −3x + 5 = 14 to the other side:',
  [k('중1 · 일차방정식 3', 3)]: 'Value of x:',
  [k('중1 · 일차방정식 4', 1)]: 'Most efficient first step for an equation with fractional coefficients?',
  [k('중1 · 일차방정식 4', 2)]: 'Multiply both sides of x/2 + 3 = 7 by 2:',
  [k('중1 · 일차방정식 4', 3)]: 'Value of x:',
  [k('중1 · 일차방정식 5', 1)]: 'First step for a word problem?',
  [k('중1 · 일차방정식 5', 2)]: 'Equation form for "perimeter of a square = side × ?":',
  [k('중1 · 일차방정식 5', 3)]: 'Value of x (side length):',
  [k('중1 · 일차방정식 6', 1)]: 'How do you express three consecutive natural numbers?',
  [k('중1 · 일차방정식 6', 2)]: 'If their sum is 39, the equation is:',
  [k('중1 · 일차방정식 6', 3)]: 'The smallest natural number (= x) is:',
  [k('중1 · 일차방정식 7', 1)]: 'Property of a proportion a : b = c : d?',
  [k('중1 · 일차방정식 7', 2)]: 'Cross-multiply 3 : 5 = x : 20:',
  [k('중1 · 일차방정식 7', 3)]: 'Value of x:',

  // 좌표와 그래프
  [k('중1 · 좌표와 그래프 1', 1)]: 'Quadrant numbers vs. coordinate signs — which is correct?',
  [k('중1 · 좌표와 그래프 1', 2)]: 'Sign profile of (−3, 2):',
  [k('중1 · 좌표와 그래프 1', 3)]: 'The point lies in:',
  [k('중1 · 좌표와 그래프 2', 1)]: 'Effect of reflecting across the x-axis?',
  [k('중1 · 좌표와 그래프 2', 2)]: 'Reflect (4, −1) by flipping only the y-sign:',
  [k('중1 · 좌표와 그래프 2', 3)]: 'The reflected point is:',
  [k('중1 · 좌표와 그래프 3', 1)]: 'In direct proportion y = ax, how do you find a?',
  [k('중1 · 좌표와 그래프 3', 2)]: 'Plug in x = 4, y = 12 to find a:',
  [k('중1 · 좌표와 그래프 3', 3)]: 'Express y in terms of x:',
  [k('중1 · 좌표와 그래프 4', 1)]: 'Characteristics of y = ax (a < 0)?',
  [k('중1 · 좌표와 그래프 4', 2)]: 'For y = −2x, plug in x = 1 and x = −1:',
  [k('중1 · 좌표와 그래프 4', 3)]: 'The graph passes through which quadrants?',
};

export const CHOICE_EN: Record<string, { text: string; rationale?: string }> = {
  // Problem 1 — Volume of revolution
  [k('2024 9월 모의평가 30번', 1, 1)]: { text: 'V = π ∫[a→b] [f(x)]² dx' },
  [k('2024 9월 모의평가 30번', 1, 2)]: { text: 'V = ∫[a→b] f(x) dx', rationale: 'Confused simple definite integral (area) with volume.' },
  [k('2024 9월 모의평가 30번', 1, 3)]: { text: 'V = 2π ∫[a→b] x · f(x) dx', rationale: 'Shell method — used for y-axis revolution.' },
  [k('2024 9월 모의평가 30번', 1, 4)]: { text: 'V = π ∫[a→b] f(x) dx', rationale: 'Forgot the square (²).' },
  [k('2024 9월 모의평가 30번', 1, 5)]: { text: 'V = π ∫[a→b] [f(x)]² dy', rationale: 'Wrong integration variable — used dy instead of dx.' },

  [k('2024 9월 모의평가 30번', 2, 1)]: { text: 'π ∫[0→4] x dx' },
  [k('2024 9월 모의평가 30번', 2, 2)]: { text: 'π ∫[0→4] √x dx', rationale: 'Forgot to simplify (√x)² = x.' },
  [k('2024 9월 모의평가 30번', 2, 3)]: { text: 'π ∫[0→4] x² dx', rationale: 'Treated √x as x and squared again — exponent confusion.' },
  [k('2024 9월 모의평가 30번', 2, 4)]: { text: '2π ∫[0→4] x dx', rationale: 'Applied shell-method coefficient 2π.' },
  [k('2024 9월 모의평가 30번', 2, 5)]: { text: 'π ∫[1→4] x dx', rationale: 'Misread integration start point as 1.' },

  [k('2024 9월 모의평가 30번', 3, 1)]: { text: '8π' },
  [k('2024 9월 모의평가 30번', 3, 2)]: { text: '4π', rationale: 'Evaluated x²/2 from 0 to 4 as 4 instead of 8.' },
  [k('2024 9월 모의평가 30번', 3, 3)]: { text: '16π', rationale: 'Forgot the ½ — used x² as-is.' },
  [k('2024 9월 모의평가 30번', 3, 4)]: { text: '8', rationale: 'Forgot to multiply by π.' },
  [k('2024 9월 모의평가 30번', 3, 5)]: { text: '32π', rationale: 'Multiplied 4² = 16 by an extra 2 (carelessness).' },

  // Problem 2 — Integration by parts ∫xe^x dx
  [k('수능특강 미적분 III-2-15', 1, 1)]: { text: 'Integration by parts: ∫u dv = uv − ∫v du' },
  [k('수능특강 미적분 III-2-15', 1, 2)]: { text: 'Substitution: t = e^x', rationale: 'Tried substitution — confused with by-parts.' },
  [k('수능특강 미적분 III-2-15', 1, 3)]: { text: 'Integral of a product = product of integrals: (∫x dx)·(∫e^x dx)', rationale: 'Common mistake: ∫(fg) ≠ (∫f)(∫g).' },
  [k('수능특강 미적분 III-2-15', 1, 4)]: { text: 'Reverse differentiation only', rationale: 'No systematic technique chosen — pure intuition.' },
  [k('수능특강 미적분 III-2-15', 1, 5)]: { text: 'Partial-fraction decomposition', rationale: 'Not a fraction — wrong toolbox.' },

  [k('수능특강 미적분 III-2-15', 2, 1)]: { text: 'x · e^x − ∫ e^x dx' },
  [k('수능특강 미적분 III-2-15', 2, 2)]: { text: 'x · e^x − ∫ x · e^x dx', rationale: 'Forgot du = dx — never differentiated u = x.' },
  [k('수능특강 미적분 III-2-15', 2, 3)]: { text: '(1/2) x² · e^x', rationale: 'Mis-identified u and v entirely.' },
  [k('수능특강 미적분 III-2-15', 2, 4)]: { text: 'e^x − ∫ x · e^x dx', rationale: 'Dropped the factor of x in uv.' },
  [k('수능특강 미적분 III-2-15', 2, 5)]: { text: 'x · e^x + ∫ e^x dx', rationale: 'Sign error in by-parts formula.' },

  [k('수능특강 미적분 III-2-15', 3, 1)]: { text: '(x − 1) e^x + C' },
  [k('수능특강 미적분 III-2-15', 3, 2)]: { text: 'x · e^x − e^x', rationale: 'Forgot the constant of integration C.' },
  [k('수능특강 미적분 III-2-15', 3, 3)]: { text: 'x · e^x + e^x + C', rationale: 'Sign error carried through.' },
  [k('수능특강 미적분 III-2-15', 3, 4)]: { text: '(x + 1) e^x + C', rationale: 'Wrong sign on the second term.' },
  [k('수능특강 미적분 III-2-15', 3, 5)]: { text: 'x · e^x − x + C', rationale: 'Integrated e^x as x — incorrect antiderivative.' },

  // Problem 3 — Conditional probability
  [k('2024 6월 모의평가 28번', 1, 1)]: { text: 'P(A ∩ B) / P(B)' },
  [k('2024 6월 모의평가 28번', 1, 2)]: { text: 'P(A) · P(B)', rationale: 'Confused with the multiplication rule for independent events.' },
  [k('2024 6월 모의평가 28번', 1, 3)]: { text: 'P(A ∪ B) / P(B)', rationale: 'Used union instead of intersection.' },
  [k('2024 6월 모의평가 28번', 1, 4)]: { text: 'P(B | A)', rationale: 'Reversed the direction of conditioning.' },
  [k('2024 6월 모의평가 28번', 1, 5)]: { text: 'P(A) + P(B) − P(A ∩ B)', rationale: 'That is the addition rule, not conditional probability.' },

  [k('2024 6월 모의평가 28번', 2, 1)]: { text: 'A reduced sample space restricted to outcomes where B occurred.' },
  [k('2024 6월 모의평가 28번', 2, 2)]: { text: 'The full original sample space.', rationale: 'Missed the core idea — conditioning shrinks the sample space.' },
  [k('2024 6월 모의평가 28번', 2, 3)]: { text: 'Restricted to outcomes of A only.', rationale: 'Mixed up A and B.' },
  [k('2024 6월 모의평가 28번', 2, 4)]: { text: 'Apply Bayes to derive from P(B | A).', rationale: 'Unnecessary detour through Bayes.' },
  [k('2024 6월 모의평가 28번', 2, 5)]: { text: 'Count outcomes by hand without redefining.', rationale: 'Skipped the probability-definition step.' },

  [k('2024 6월 모의평가 28번', 3, 1)]: { text: '7/15' },
  [k('2024 6월 모의평가 28번', 3, 2)]: { text: '7/30', rationale: 'Halved the denominator — missed dividing by P(B).' },
  [k('2024 6월 모의평가 28번', 3, 3)]: { text: '8/15', rationale: 'Took 1 − 7/15 (complement) by mistake.' },
  [k('2024 6월 모의평가 28번', 3, 4)]: { text: '1/3', rationale: 'Combinatorial slip in counting.' },
  [k('2024 6월 모의평가 28번', 3, 5)]: { text: '14/30', rationale: 'Numerically equal but unreduced — form error.' },

  // Problem 4 — Angle between lines in space
  [k('2024 9월 모의평가 21번', 1, 1)]: { text: 'cos θ = |u · v| / (|u| · |v|)' },
  [k('2024 9월 모의평가 21번', 1, 2)]: { text: 'cos θ = (u · v) / (|u| · |v|)', rationale: 'Forgot the absolute value — sign affects acute/obtuse.' },
  [k('2024 9월 모의평가 21번', 1, 3)]: { text: 'cos θ = (u · v)² / (|u|² · |v|²)', rationale: 'Squared the formula incorrectly.' },
  [k('2024 9월 모의평가 21번', 1, 4)]: { text: 'cos θ = (|u| · |v|) / (u · v)', rationale: 'Reciprocal mix-up — numerator/denominator swapped.' },
  [k('2024 9월 모의평가 21번', 1, 5)]: { text: 'sin θ = |u × v| / (|u| · |v|)', rationale: 'That is the sine formula — wrong product.' },

  [k('2024 9월 모의평가 21번', 2, 1)]: { text: 'Compute direction vectors from coordinate diffs → take dot product → magnitude is √(x²+y²+z²).' },
  [k('2024 9월 모의평가 21번', 2, 2)]: { text: 'Use the cross product |u × v| instead.', rationale: 'Used cross instead of dot.' },
  [k('2024 9월 모의평가 21번', 2, 3)]: { text: 'Take |u| as x²+y²+z² without the square root.', rationale: 'Forgot the square root in the magnitude.' },
  [k('2024 9월 모의평가 21번', 2, 4)]: { text: 'Reduce to a 2D plane and apply the law of cosines.', rationale: 'Improperly collapsed 3D to 2D.' },
  [k('2024 9월 모의평가 21번', 2, 5)]: { text: 'Keep u · v with its sign and only compute the denominator.', rationale: 'Skipped the absolute value.' },

  [k('2024 9월 모의평가 21번', 3, 1)]: { text: '√3 / 3' },
  [k('2024 9월 모의평가 21번', 3, 2)]: { text: '1/3', rationale: 'Forgot the square root in the magnitudes.' },
  [k('2024 9월 모의평가 21번', 3, 3)]: { text: '−√3 / 3', rationale: 'Forgot to take the absolute value.' },
  [k('2024 9월 모의평가 21번', 3, 4)]: { text: '√2 / 2', rationale: 'Confused with the special angle 45°.' },
  [k('2024 9월 모의평가 21번', 3, 5)]: { text: '√3', rationale: 'Forgot to divide by |u|·|v|.' },

  // Problem 5 — Substitution ∫2x√(x²+1) dx
  [k('교육청 학평 18번', 1, 1)]: { text: 'Substitution: t = x² + 1' },
  [k('교육청 학평 18번', 1, 2)]: { text: 'Integration by parts', rationale: 'Confused with by-parts.' },
  [k('교육청 학평 18번', 1, 3)]: { text: 'Product of integrals: (∫2x dx)(∫√(x²+1) dx)', rationale: 'Common mistake: ∫(fg) ≠ (∫f)(∫g).' },
  [k('교육청 학평 18번', 1, 4)]: { text: 'Partial-fraction decomposition', rationale: 'Not a fraction — wrong tool.' },
  [k('교육청 학평 18번', 1, 5)]: { text: 'Maclaurin-series expansion', rationale: 'Out-of-scope technique brought in by mistake.' },

  [k('교육청 학평 18번', 2, 1)]: { text: 'dt = 2x dx → ∫ √t dt' },
  [k('교육청 학평 18번', 2, 2)]: { text: 'dt = x dx → ∫ √t dt', rationale: 'Forgot the 2 in d/dx(x²+1) = 2x.' },
  [k('교육청 학평 18번', 2, 3)]: { text: 'dt = (x²+1) dx → ∫ √t / (x²+1) dt', rationale: 'Treated t itself as dt.' },
  [k('교육청 학평 18번', 2, 4)]: { text: 'dt = 2x → ∫ t^(1/2) (no dx)', rationale: 'Dropped the dx — common substitution error.' },
  [k('교육청 학평 18번', 2, 5)]: { text: 'dt = 2 dx → ∫ x · √t dt', rationale: 'Differentiated x² + 1 incorrectly to 2.' },

  [k('교육청 학평 18번', 3, 1)]: { text: '(2/3)(x² + 1)^(3/2) + C' },
  [k('교육청 학평 18번', 3, 2)]: { text: '(2/3) t^(3/2) + C', rationale: 'Did not back-substitute t.' },
  [k('교육청 학평 18번', 3, 3)]: { text: '(1/2)(x² + 1)² + C', rationale: 'Treated √ as raising to 1 — wrong exponent.' },
  [k('교육청 학평 18번', 3, 4)]: { text: '(3/2)(x² + 1)^(3/2) + C', rationale: 'Reciprocal of 2/3 — coefficient mix-up.' },
  [k('교육청 학평 18번', 3, 5)]: { text: '(2/3)(x² + 1)^(1/2) + C', rationale: 'Forgot to add 1 to the exponent ½.' },

  // Problem 6 — Riemann sum ∫₀¹ x² dx
  [k('수능기출 2023 22번', 1, 1)]: { text: 'Partition [0,1] into n pieces → sum the rectangle areas → take n → ∞.' },
  [k('수능기출 2023 22번', 1, 2)]: { text: 'Apply only the FTC result.', rationale: 'Ignored the "by the definition" instruction.' },
  [k('수능기출 2023 22번', 1, 3)]: { text: 'Differentiate x², then integrate (reverse direction).', rationale: 'Confused Riemann definition with the FTC.' },
  [k('수능기출 2023 22번', 1, 4)]: { text: 'Trapezoidal-rule approximation.', rationale: 'Different approximation method, not the definition.' },
  [k('수능기출 2023 22번', 1, 5)]: { text: 'Use x = (0+1)/2 = 0.5 as a single sample.', rationale: 'Crude midpoint shortcut, not the definition.' },

  [k('수능기출 2023 22번', 2, 1)]: { text: 'lim[n → ∞] Σ[k=1→n] (k/n)² · (1/n)' },
  [k('수능기출 2023 22번', 2, 2)]: { text: 'lim Σ (k/n) · (1/n)', rationale: 'Forgot the square — integrand is x².' },
  [k('수능기출 2023 22번', 2, 3)]: { text: 'lim Σ k² · (1/n)', rationale: 'Lost the (k/n) representative value.' },
  [k('수능기출 2023 22번', 2, 4)]: { text: 'lim Σ (k²/n³)', rationale: 'Combined Σ and (1/n) incorrectly.' },
  [k('수능기출 2023 22번', 2, 5)]: { text: 'lim k²/n³', rationale: 'Dropped the Σ entirely.' },

  [k('수능기출 2023 22번', 3, 1)]: { text: '1/3' },
  [k('수능기출 2023 22번', 3, 2)]: { text: '1/2', rationale: 'Used Σk = n(n+1)/2 instead of Σk².' },
  [k('수능기출 2023 22번', 3, 3)]: { text: '1/6', rationale: 'Forgot to take the limit — kept finite-n value.' },
  [k('수능기출 2023 22번', 3, 4)]: { text: '2/3', rationale: 'Computed 2n³/n³ → 2/3 incorrectly.' },
  [k('수능기출 2023 22번', 3, 5)]: { text: '1', rationale: 'Mistook integrand as 1 (unit area).' },

  // Problem 7 — log inequality
  [k('2024 6월 모의평가 21번', 1, 1)]: { text: 'A ≥ 1 (since base 2 > 1, log₂ 1 = 0).' },
  [k('2024 6월 모의평가 21번', 1, 2)]: { text: 'A ≥ 0', rationale: 'Confused the domain condition with the value condition.' },
  [k('2024 6월 모의평가 21번', 1, 3)]: { text: 'A > 0', rationale: 'Only used the domain — missed the inequality on the log value.' },
  [k('2024 6월 모의평가 21번', 1, 4)]: { text: 'A ≤ 1', rationale: 'Inequality direction flipped (would apply only if base < 1).' },
  [k('2024 6월 모의평가 21번', 1, 5)]: { text: 'A = 1', rationale: 'Equality only — ignored the inequality.' },

  [k('2024 6월 모의평가 21번', 2, 1)]: { text: 'x² − x − 7 ≥ 0' },
  [k('2024 6월 모의평가 21번', 2, 2)]: { text: '(x − 3)(x + 2) ≥ 0  (i.e. x² − x − 6 ≥ 0)', rationale: 'Wrote ≥ 0 instead of ≥ 1.' },
  [k('2024 6월 모의평가 21번', 2, 3)]: { text: 'x² − x − 6 ≥ 0 as-is', rationale: 'Did not subtract 1.' },
  [k('2024 6월 모의평가 21번', 2, 4)]: { text: 'x² − x ≥ 7', rationale: 'Sign error when moving terms.' },
  [k('2024 6월 모의평가 21번', 2, 5)]: { text: '(x − 7)(x + 1) ≥ 0', rationale: 'Incorrect factorization.' },

  [k('2024 6월 모의평가 21번', 3, 1)]: { text: 'x ≤ −2 or x ≥ 4' },
  [k('2024 6월 모의평가 21번', 3, 2)]: { text: '−2 ≤ x ≤ 4', rationale: 'Mixed up "outside roots" vs "between roots" for a quadratic.' },
  [k('2024 6월 모의평가 21번', 3, 3)]: { text: 'x ≥ 4 only', rationale: 'Kept only one branch of the solution.' },
  [k('2024 6월 모의평가 21번', 3, 4)]: { text: 'x ≤ −3 or x ≥ 3', rationale: 'Slip while extracting roots after factoring.' },
  [k('2024 6월 모의평가 21번', 3, 5)]: { text: 'all real numbers', rationale: 'Looked only at discriminant — over-generalized.' },

  // ===== 중1 데모 — 5×3×20 = 300 entries =====
  // 정수와 유리수 1
  [k('중1 · 정수와 유리수 1', 1, 1)]: { text: 'Use the larger absolute value\'s sign; magnitude = (larger |·|) − (smaller |·|)' },
  [k('중1 · 정수와 유리수 1', 1, 2)]: { text: 'Add the two absolute values', rationale: 'Confused with the same-sign rule.' },
  [k('중1 · 정수와 유리수 1', 1, 3)]: { text: 'Multiply the two absolute values', rationale: 'Mixed up with the multiplication rule.' },
  [k('중1 · 정수와 유리수 1', 1, 4)]: { text: 'Always take the negative sign', rationale: 'Skipped the larger-magnitude rule.' },
  [k('중1 · 정수와 유리수 1', 1, 5)]: { text: 'Just write both numbers as-is', rationale: 'Guessed without computing.' },
  [k('중1 · 정수와 유리수 1', 2, 1)]: { text: 'sign +, magnitude 7 − 3 = 4' },
  [k('중1 · 정수와 유리수 1', 2, 2)]: { text: 'sign −, magnitude 7 + 3 = 10', rationale: 'Treated as same-sign sum.' },
  [k('중1 · 정수와 유리수 1', 2, 3)]: { text: 'sign +, magnitude 7 + 3 = 10', rationale: 'Skipped the subtraction step.' },
  [k('중1 · 정수와 유리수 1', 2, 4)]: { text: 'sign −, magnitude 7 − 3 = 4', rationale: 'Took the wrong sign.' },
  [k('중1 · 정수와 유리수 1', 2, 5)]: { text: 'sign +, magnitude 3 − 7 = −4', rationale: 'Subtraction order reversed.' },
  [k('중1 · 정수와 유리수 1', 3, 1)]: { text: '4' },
  [k('중1 · 정수와 유리수 1', 3, 2)]: { text: '−4', rationale: 'Sign error.' },
  [k('중1 · 정수와 유리수 1', 3, 3)]: { text: '10', rationale: 'Applied same-sign rule.' },
  [k('중1 · 정수와 유리수 1', 3, 4)]: { text: '−10', rationale: 'Same-sign rule with wrong sign.' },
  [k('중1 · 정수와 유리수 1', 3, 5)]: { text: '−21', rationale: 'Multiplied instead.' },

  // 정수와 유리수 2
  [k('중1 · 정수와 유리수 2', 1, 1)]: { text: 'Flip the sign of the negative being subtracted: a − (−b) = a + b' },
  [k('중1 · 정수와 유리수 2', 1, 2)]: { text: 'Add the two negatives as-is', rationale: 'Missed the sign flip.' },
  [k('중1 · 정수와 유리수 2', 1, 3)]: { text: 'Compare absolute values — take the larger sign', rationale: 'Treated as a sum.' },
  [k('중1 · 정수와 유리수 2', 1, 4)]: { text: 'Always negative', rationale: 'Skipped the actual rule.' },
  [k('중1 · 정수와 유리수 2', 1, 5)]: { text: 'Convert to multiplication', rationale: 'Wrong operation.' },
  [k('중1 · 정수와 유리수 2', 2, 1)]: { text: '−5 + 8' },
  [k('중1 · 정수와 유리수 2', 2, 2)]: { text: '−5 − 8', rationale: 'Did not flip the sign.' },
  [k('중1 · 정수와 유리수 2', 2, 3)]: { text: '5 + 8', rationale: 'Flipped the sign of −5 too.' },
  [k('중1 · 정수와 유리수 2', 2, 4)]: { text: '5 − 8', rationale: 'Flipped both signs.' },
  [k('중1 · 정수와 유리수 2', 2, 5)]: { text: '−5 × 8', rationale: 'Switched to multiplication.' },
  [k('중1 · 정수와 유리수 2', 3, 1)]: { text: '3' },
  [k('중1 · 정수와 유리수 2', 3, 2)]: { text: '−13', rationale: 'Result if sign flip is omitted.' },
  [k('중1 · 정수와 유리수 2', 3, 3)]: { text: '13', rationale: 'Both signs flipped.' },
  [k('중1 · 정수와 유리수 2', 3, 4)]: { text: '−3', rationale: 'Subtraction order reversed.' },
  [k('중1 · 정수와 유리수 2', 3, 5)]: { text: '40', rationale: 'Multiplied instead.' },

  // 정수와 유리수 3
  [k('중1 · 정수와 유리수 3', 1, 1)]: { text: 'Even count of negatives → +, odd count → −' },
  [k('중1 · 정수와 유리수 3', 1, 2)]: { text: 'Any single negative makes the result negative', rationale: 'Generalized two-factor rule incorrectly.' },
  [k('중1 · 정수와 유리수 3', 1, 3)]: { text: 'Always positive', rationale: 'Skipped sign rule entirely.' },
  [k('중1 · 정수와 유리수 3', 1, 4)]: { text: 'Take the sign of the largest |·|', rationale: 'Confused with addition rule.' },
  [k('중1 · 정수와 유리수 3', 1, 5)]: { text: 'Take the sign of the last factor', rationale: 'Unfounded rule.' },
  [k('중1 · 정수와 유리수 3', 2, 1)]: { text: 'sign +, magnitude 2 × 3 × 4 = 24' },
  [k('중1 · 정수와 유리수 3', 2, 2)]: { text: 'sign −, magnitude 2 × 3 × 4 = 24', rationale: 'Miscounted negatives (2 of them → +).' },
  [k('중1 · 정수와 유리수 3', 2, 3)]: { text: 'sign +, magnitude 2 + 3 + 4 = 9', rationale: 'Replaced multiplication with addition.' },
  [k('중1 · 정수와 유리수 3', 2, 4)]: { text: 'sign −, magnitude 2 + 3 + 4 = 9', rationale: 'Operation and sign both wrong.' },
  [k('중1 · 정수와 유리수 3', 2, 5)]: { text: 'sign +, magnitude 2 × 3 − 4 = 2', rationale: 'Mixed operations.' },
  [k('중1 · 정수와 유리수 3', 3, 1)]: { text: '24' },
  [k('중1 · 정수와 유리수 3', 3, 2)]: { text: '−24', rationale: 'Wrong sign on count of negatives.' },
  [k('중1 · 정수와 유리수 3', 3, 3)]: { text: '9', rationale: 'Added instead of multiplied.' },
  [k('중1 · 정수와 유리수 3', 3, 4)]: { text: '−9', rationale: 'Added with wrong sign.' },
  [k('중1 · 정수와 유리수 3', 3, 5)]: { text: '0', rationale: 'Random guess.' },

  // 정수와 유리수 4
  [k('중1 · 정수와 유리수 4', 1, 1)]: { text: 'Distance from 0 on the number line (always ≥ 0)' },
  [k('중1 · 정수와 유리수 4', 1, 2)]: { text: 'Multiply a negative by −1', rationale: 'Only describes negatives — missing positives.' },
  [k('중1 · 정수와 유리수 4', 1, 3)]: { text: 'Always equals the number itself', rationale: 'Ignored sign handling.' },
  [k('중1 · 정수와 유리수 4', 1, 4)]: { text: 'Always means a positive number only', rationale: 'Missed the |0| = 0 case.' },
  [k('중1 · 정수와 유리수 4', 1, 5)]: { text: 'Distance between two numbers', rationale: 'Confused with related concept.' },
  [k('중1 · 정수와 유리수 4', 2, 1)]: { text: '|−7| = 7, |+5| = 5' },
  [k('중1 · 정수와 유리수 4', 2, 2)]: { text: '|−7| = −7, |+5| = 5', rationale: 'Did not flip the negative.' },
  [k('중1 · 정수와 유리수 4', 2, 3)]: { text: '|−7| = 7, |+5| = −5', rationale: 'Wrong handling of the positive.' },
  [k('중1 · 정수와 유리수 4', 2, 4)]: { text: '|−7| = 0, |+5| = 0', rationale: 'Misread |·| as always 0.' },
  [k('중1 · 정수와 유리수 4', 2, 5)]: { text: '|−7| = 49, |+5| = 25', rationale: 'Confused with squaring.' },
  [k('중1 · 정수와 유리수 4', 3, 1)]: { text: '12' },
  [k('중1 · 정수와 유리수 4', 3, 2)]: { text: '−12', rationale: 'Sign error.' },
  [k('중1 · 정수와 유리수 4', 3, 3)]: { text: '2', rationale: 'Subtracted instead of added.' },
  [k('중1 · 정수와 유리수 4', 3, 4)]: { text: '35', rationale: 'Multiplied instead.' },
  [k('중1 · 정수와 유리수 4', 3, 5)]: { text: '0', rationale: 'Random guess.' },

  // 정수와 유리수 5
  [k('중1 · 정수와 유리수 5', 1, 1)]: { text: 'Use 10ⁿ as the denominator (n = number of decimal places), then reduce' },
  [k('중1 · 정수와 유리수 5', 1, 2)]: { text: 'Divide the decimal by 100', rationale: 'Ignored the actual digit count.' },
  [k('중1 · 정수와 유리수 5', 1, 3)]: { text: 'Put the decimal as numerator and 1 as denominator', rationale: 'Missed the decimal-shift step.' },
  [k('중1 · 정수와 유리수 5', 1, 4)]: { text: 'Multiply the decimal by 2 and use as numerator', rationale: 'Unfounded rule.' },
  [k('중1 · 정수와 유리수 5', 1, 5)]: { text: 'Always express as 1/2', rationale: 'Pure guess.' },
  [k('중1 · 정수와 유리수 5', 2, 1)]: { text: '4/10' },
  [k('중1 · 정수와 유리수 5', 2, 2)]: { text: '0.4/1', rationale: 'Did not shift the decimal point.' },
  [k('중1 · 정수와 유리수 5', 2, 3)]: { text: '4/100', rationale: 'Wrong number of decimal places.' },
  [k('중1 · 정수와 유리수 5', 2, 4)]: { text: '40/10', rationale: 'Padded a 0 onto the numerator.' },
  [k('중1 · 정수와 유리수 5', 2, 5)]: { text: '4/1', rationale: 'Over-simplified.' },
  [k('중1 · 정수와 유리수 5', 3, 1)]: { text: '2/5' },
  [k('중1 · 정수와 유리수 5', 3, 2)]: { text: '4/10', rationale: 'Skipped the reduction step.' },
  [k('중1 · 정수와 유리수 5', 3, 3)]: { text: '1/2', rationale: 'Reduction error.' },
  [k('중1 · 정수와 유리수 5', 3, 4)]: { text: '4/5', rationale: 'Doubled only the numerator.' },
  [k('중1 · 정수와 유리수 5', 3, 5)]: { text: '5/2', rationale: 'Numerator and denominator swapped.' },

  // 문자와 식 1
  [k('중1 · 문자와 식 1', 1, 1)]: { text: '5x' },
  [k('중1 · 문자와 식 1', 1, 2)]: { text: 'x + 5', rationale: 'Replaced multiplication with addition.' },
  [k('중1 · 문자와 식 1', 1, 3)]: { text: 'x⁵', rationale: 'Replaced multiplication with exponentiation.' },
  [k('중1 · 문자와 식 1', 1, 4)]: { text: 'x/5', rationale: 'Replaced multiplication with division.' },
  [k('중1 · 문자와 식 1', 1, 5)]: { text: '5 − x', rationale: 'Wrong operation.' },
  [k('중1 · 문자와 식 1', 2, 1)]: { text: '5x + 3' },
  [k('중1 · 문자와 식 1', 2, 2)]: { text: '5(x + 3)', rationale: 'Wrong parenthesis placement.' },
  [k('중1 · 문자와 식 1', 2, 3)]: { text: '5x · 3', rationale: 'Replaced addition with multiplication.' },
  [k('중1 · 문자와 식 1', 2, 4)]: { text: '5x − 3', rationale: 'Wrong sign.' },
  [k('중1 · 문자와 식 1', 2, 5)]: { text: 'x³ + 5', rationale: 'Mixed operations.' },
  [k('중1 · 문자와 식 1', 3, 1)]: { text: '5x + 3' },
  [k('중1 · 문자와 식 1', 3, 2)]: { text: '3x + 5', rationale: 'Coefficient and constant swapped.' },
  [k('중1 · 문자와 식 1', 3, 3)]: { text: '5(x + 3)', rationale: 'Wrong grouping.' },
  [k('중1 · 문자와 식 1', 3, 4)]: { text: '5x − 3', rationale: 'Wrong sign.' },
  [k('중1 · 문자와 식 1', 3, 5)]: { text: '15x', rationale: 'Combined 5 × 3 incorrectly.' },

  // 문자와 식 2
  [k('중1 · 문자와 식 2', 1, 1)]: { text: 'For terms with the same variable (and degree), add or subtract coefficients' },
  [k('중1 · 문자와 식 2', 1, 2)]: { text: 'Combine even terms with different variables', rationale: 'Misunderstood the definition.' },
  [k('중1 · 문자와 식 2', 1, 3)]: { text: 'Always reorganize using multiplication', rationale: 'Wrong operation.' },
  [k('중1 · 문자와 식 2', 1, 4)]: { text: 'Add only the variables, ignore the coefficients', rationale: 'Skipped coefficients.' },
  [k('중1 · 문자와 식 2', 1, 5)]: { text: 'Always becomes 0', rationale: 'No basis.' },
  [k('중1 · 문자와 식 2', 2, 1)]: { text: '(3 − 1)a + (2 + 5)b' },
  [k('중1 · 문자와 식 2', 2, 2)]: { text: '(3 + 1)a + (2 + 5)b', rationale: 'Wrong sign on −a.' },
  [k('중1 · 문자와 식 2', 2, 3)]: { text: '(3 − 1)a + (2 − 5)b', rationale: 'Wrong sign on b-terms.' },
  [k('중1 · 문자와 식 2', 2, 4)]: { text: '(3 × 1)a + (2 × 5)b', rationale: 'Replaced sums with products.' },
  [k('중1 · 문자와 식 2', 2, 5)]: { text: '(3 + 2)ab + (1 + 5)ab', rationale: 'Bad classification.' },
  [k('중1 · 문자와 식 2', 3, 1)]: { text: '2a + 7b' },
  [k('중1 · 문자와 식 2', 3, 2)]: { text: '4a + 7b', rationale: 'Treated −a as +a.' },
  [k('중1 · 문자와 식 2', 3, 3)]: { text: '2a − 3b', rationale: 'Wrong sign on b.' },
  [k('중1 · 문자와 식 2', 3, 4)]: { text: '9ab', rationale: 'Wrong classification.' },
  [k('중1 · 문자와 식 2', 3, 5)]: { text: '5a + 5b', rationale: 'Guessed coefficients.' },

  // 문자와 식 3
  [k('중1 · 문자와 식 3', 1, 1)]: { text: 'Substitute x = −2 directly into the expression' },
  [k('중1 · 문자와 식 3', 1, 2)]: { text: 'Ignore x and compute only the constants', rationale: 'Skipped substitution.' },
  [k('중1 · 문자와 식 3', 1, 3)]: { text: 'Flip every sign in the expression', rationale: 'Unfounded change.' },
  [k('중1 · 문자와 식 3', 1, 4)]: { text: 'Remove the squared term first', rationale: 'Wrong order of operations.' },
  [k('중1 · 문자와 식 3', 1, 5)]: { text: 'Set everything to 0', rationale: 'Pure guess.' },
  [k('중1 · 문자와 식 3', 2, 1)]: { text: '(−2)² = 4 → 3 · 4 − 5' },
  [k('중1 · 문자와 식 3', 2, 2)]: { text: '(−2)² = −4 → 3 · (−4) − 5', rationale: 'Wrong sign on the square.' },
  [k('중1 · 문자와 식 3', 2, 3)]: { text: '(−2)² = 2 → 3 · 2 − 5', rationale: 'Treated squaring as |·|.' },
  [k('중1 · 문자와 식 3', 2, 4)]: { text: '−2² = −4 → 3 · (−4) − 5', rationale: 'Confused (−2)² with −2².' },
  [k('중1 · 문자와 식 3', 2, 5)]: { text: '(−2)² = 0', rationale: 'Random guess.' },
  [k('중1 · 문자와 식 3', 3, 1)]: { text: '7' },
  [k('중1 · 문자와 식 3', 3, 2)]: { text: '−17', rationale: 'Result of wrong-sign square.' },
  [k('중1 · 문자와 식 3', 3, 3)]: { text: '1', rationale: 'Treated square as |−2|.' },
  [k('중1 · 문자와 식 3', 3, 4)]: { text: '−7', rationale: 'Final sign error.' },
  [k('중1 · 문자와 식 3', 3, 5)]: { text: '13', rationale: 'Random guess.' },

  // 문자와 식 4
  [k('중1 · 문자와 식 4', 1, 1)]: { text: 'Distribute the sign over every term inside the parentheses' },
  [k('중1 · 문자와 식 4', 1, 2)]: { text: 'Apply the sign only to the first term inside', rationale: 'Partial distribution.' },
  [k('중1 · 문자와 식 4', 1, 3)]: { text: 'Distribute multiplication only — keep signs as-is', rationale: 'Separated coefficients from signs.' },
  [k('중1 · 문자와 식 4', 1, 4)]: { text: 'Apply only to the very first term', rationale: 'Partial.' },
  [k('중1 · 문자와 식 4', 1, 5)]: { text: 'Leave the parentheses as-is', rationale: 'Skipped distribution.' },
  [k('중1 · 문자와 식 4', 2, 1)]: { text: '−6x + 10 + 4x' },
  [k('중1 · 문자와 식 4', 2, 2)]: { text: '−6x − 10 + 4x', rationale: 'Negative × negative sign error.' },
  [k('중1 · 문자와 식 4', 2, 3)]: { text: '−6x + 5 + 4x', rationale: 'Missed the −2 × −5 = 10 step.' },
  [k('중1 · 문자와 식 4', 2, 4)]: { text: '6x + 10 + 4x', rationale: 'Coefficient sign error.' },
  [k('중1 · 문자와 식 4', 2, 5)]: { text: '−2(3x − 5 + 4x)', rationale: 'Did not distribute.' },
  [k('중1 · 문자와 식 4', 3, 1)]: { text: '−2x + 10' },
  [k('중1 · 문자와 식 4', 3, 2)]: { text: '−10x + 10', rationale: 'Combined −6x + 4x incorrectly.' },
  [k('중1 · 문자와 식 4', 3, 3)]: { text: '−2x − 10', rationale: 'Wrong sign on constant.' },
  [k('중1 · 문자와 식 4', 3, 4)]: { text: '2x + 10', rationale: 'Wrong sign on x-coefficient.' },
  [k('중1 · 문자와 식 4', 3, 5)]: { text: '−6x + 10', rationale: 'Forgot to add 4x.' },

  // 일차방정식 1
  [k('중1 · 일차방정식 1', 1, 1)]: { text: 'Move constants to the other side so only the variable term remains on one side' },
  [k('중1 · 일차방정식 1', 1, 2)]: { text: 'Plug in arbitrary values for x', rationale: 'Tried trial substitution.' },
  [k('중1 · 일차방정식 1', 1, 3)]: { text: 'Convert the whole equation to a product form', rationale: 'Wrong operation.' },
  [k('중1 · 일차방정식 1', 1, 4)]: { text: 'Multiply both sides by a number to clear denominators', rationale: 'No fractions present.' },
  [k('중1 · 일차방정식 1', 1, 5)]: { text: 'Pure guess', rationale: 'No basis.' },
  [k('중1 · 일차방정식 1', 2, 1)]: { text: '3x = 18' },
  [k('중1 · 일차방정식 1', 2, 2)]: { text: '3x = 4', rationale: 'Computed 11 − 7 incorrectly.' },
  [k('중1 · 일차방정식 1', 2, 3)]: { text: '3x = −18', rationale: 'Sign flipped during transposition.' },
  [k('중1 · 일차방정식 1', 2, 4)]: { text: 'x = 4', rationale: 'Skipped dividing by 3.' },
  [k('중1 · 일차방정식 1', 2, 5)]: { text: '3x − 7 = 11 (unchanged)', rationale: 'Did not transpose.' },
  [k('중1 · 일차방정식 1', 3, 1)]: { text: '6' },
  [k('중1 · 일차방정식 1', 3, 2)]: { text: '−6', rationale: 'Sign error.' },
  [k('중1 · 일차방정식 1', 3, 3)]: { text: '18', rationale: 'Skipped dividing by 3.' },
  [k('중1 · 일차방정식 1', 3, 4)]: { text: '3', rationale: 'Divided 18 by 6.' },
  [k('중1 · 일차방정식 1', 3, 5)]: { text: '54', rationale: 'Multiplied instead of dividing.' },

  // 일차방정식 2
  [k('중1 · 일차방정식 2', 1, 1)]: { text: 'Apply the distributive property to remove parentheses' },
  [k('중1 · 일차방정식 2', 1, 2)]: { text: 'Square both sides first', rationale: 'Irrelevant transformation.' },
  [k('중1 · 일차방정식 2', 1, 3)]: { text: 'Transpose without removing parentheses', rationale: 'Skipped distribution.' },
  [k('중1 · 일차방정식 2', 1, 4)]: { text: 'Ignore the coefficient in front of the parentheses', rationale: 'Skipped coefficient.' },
  [k('중1 · 일차방정식 2', 1, 5)]: { text: 'Take the difference of both sides', rationale: 'No basis.' },
  [k('중1 · 일차방정식 2', 2, 1)]: { text: '−3x = −9' },
  [k('중1 · 일차방정식 2', 2, 2)]: { text: '−3x = 9', rationale: 'Sign error on constant after transposing.' },
  [k('중1 · 일차방정식 2', 2, 3)]: { text: '3x = −9', rationale: 'Sign error on the x term.' },
  [k('중1 · 일차방정식 2', 2, 4)]: { text: '7x = 9', rationale: 'Combined like terms incorrectly (2x + 5x).' },
  [k('중1 · 일차방정식 2', 2, 5)]: { text: '2x + 8 = 5x − 1 (unchanged)', rationale: 'Did not transpose.' },
  [k('중1 · 일차방정식 2', 3, 1)]: { text: '3' },
  [k('중1 · 일차방정식 2', 3, 2)]: { text: '−3', rationale: 'Sign error.' },
  [k('중1 · 일차방정식 2', 3, 3)]: { text: '9', rationale: 'Did not divide by −3.' },
  [k('중1 · 일차방정식 2', 3, 4)]: { text: '1/3', rationale: 'Divisor and dividend swapped.' },
  [k('중1 · 일차방정식 2', 3, 5)]: { text: '0', rationale: 'Random guess.' },

  // 일차방정식 3
  [k('중1 · 일차방정식 3', 1, 1)]: { text: 'Move the constant first, then divide both sides by the negative coefficient' },
  [k('중1 · 일차방정식 3', 1, 2)]: { text: 'Ignore the negative sign on the coefficient', rationale: 'Skipped the sign.' },
  [k('중1 · 일차방정식 3', 1, 3)]: { text: 'Always multiply both sides by −1 first', rationale: 'Treated this as required.' },
  [k('중1 · 일차방정식 3', 1, 4)]: { text: 'Square both sides to remove the sign', rationale: 'Bogus transformation.' },
  [k('중1 · 일차방정식 3', 1, 5)]: { text: 'Pure guess', rationale: 'No basis.' },
  [k('중1 · 일차방정식 3', 2, 1)]: { text: '−3x = 9' },
  [k('중1 · 일차방정식 3', 2, 2)]: { text: '−3x = 19', rationale: 'Did not change sign on transposition.' },
  [k('중1 · 일차방정식 3', 2, 3)]: { text: '3x = 9', rationale: 'Flipped sign on −3x as well.' },
  [k('중1 · 일차방정식 3', 2, 4)]: { text: '−3x = −9', rationale: 'Wrong sign on the right side.' },
  [k('중1 · 일차방정식 3', 2, 5)]: { text: '−3x + 5 = 14 (unchanged)', rationale: 'Did not transpose.' },
  [k('중1 · 일차방정식 3', 3, 1)]: { text: '−3' },
  [k('중1 · 일차방정식 3', 3, 2)]: { text: '3', rationale: 'Mishandled the negative coefficient.' },
  [k('중1 · 일차방정식 3', 3, 3)]: { text: '9', rationale: 'Did not divide by −3.' },
  [k('중1 · 일차방정식 3', 3, 4)]: { text: '−9', rationale: 'Sign error during division.' },
  [k('중1 · 일차방정식 3', 3, 5)]: { text: '0', rationale: 'Random guess.' },

  // 일차방정식 4
  [k('중1 · 일차방정식 4', 1, 1)]: { text: 'Multiply both sides by the LCM of the denominators to clear fractions' },
  [k('중1 · 일차방정식 4', 1, 2)]: { text: 'Transpose only — leave fractions in place', rationale: 'Skipped clearing fractions.' },
  [k('중1 · 일차방정식 4', 1, 3)]: { text: 'Ignore the fractional terms', rationale: 'Dropped a term.' },
  [k('중1 · 일차방정식 4', 1, 4)]: { text: 'Try multiplying both sides by each other', rationale: 'No basis.' },
  [k('중1 · 일차방정식 4', 1, 5)]: { text: 'Add only the numerators', rationale: 'Ignored denominators.' },
  [k('중1 · 일차방정식 4', 2, 1)]: { text: 'x + 6 = 14' },
  [k('중1 · 일차방정식 4', 2, 2)]: { text: 'x + 3 = 14', rationale: 'Did not multiply +3 by 2.' },
  [k('중1 · 일차방정식 4', 2, 3)]: { text: '2x + 3 = 14', rationale: 'Wrong handling of x/2.' },
  [k('중1 · 일차방정식 4', 2, 4)]: { text: 'x + 6 = 7', rationale: 'Did not multiply RHS by 2.' },
  [k('중1 · 일차방정식 4', 2, 5)]: { text: '2x + 6 = 14', rationale: 'Multiplied x/2 incorrectly.' },
  [k('중1 · 일차방정식 4', 3, 1)]: { text: '8' },
  [k('중1 · 일차방정식 4', 3, 2)]: { text: '4', rationale: 'Division error after transposing.' },
  [k('중1 · 일차방정식 4', 3, 3)]: { text: '14', rationale: 'Did not transpose 6.' },
  [k('중1 · 일차방정식 4', 3, 4)]: { text: '−8', rationale: 'Sign error.' },
  [k('중1 · 일차방정식 4', 3, 5)]: { text: '20', rationale: 'Mixed transposition and multiplication errors.' },

  // 일차방정식 5
  [k('중1 · 일차방정식 5', 1, 1)]: { text: 'Define a variable and write an equation' },
  [k('중1 · 일차방정식 5', 1, 2)]: { text: 'Guess the answer right away', rationale: 'Skipped equation setup.' },
  [k('중1 · 일차방정식 5', 1, 3)]: { text: 'Convert the whole sentence to a product', rationale: 'Wrong operation.' },
  [k('중1 · 일차방정식 5', 1, 4)]: { text: 'Always set up an inequality', rationale: 'Wrong form.' },
  [k('중1 · 일차방정식 5', 1, 5)]: { text: 'Ignore the sentence', rationale: 'Skipped comprehension.' },
  [k('중1 · 일차방정식 5', 2, 1)]: { text: '4x = 24' },
  [k('중1 · 일차방정식 5', 2, 2)]: { text: '3x = 24', rationale: 'Confused with a triangle.' },
  [k('중1 · 일차방정식 5', 2, 3)]: { text: 'x² = 24', rationale: 'Confused with the area formula.' },
  [k('중1 · 일차방정식 5', 2, 4)]: { text: '2x = 24', rationale: 'Used only two sides.' },
  [k('중1 · 일차방정식 5', 2, 5)]: { text: 'x + 24 = 4', rationale: 'Confused equation structure.' },
  [k('중1 · 일차방정식 5', 3, 1)]: { text: '6' },
  [k('중1 · 일차방정식 5', 3, 2)]: { text: '24', rationale: 'Did not divide by 4.' },
  [k('중1 · 일차방정식 5', 3, 3)]: { text: '8', rationale: '24 ÷ 3 by mistake.' },
  [k('중1 · 일차방정식 5', 3, 4)]: { text: '12', rationale: 'Halved the perimeter only.' },
  [k('중1 · 일차방정식 5', 3, 5)]: { text: '4', rationale: 'Numerator and divisor swapped.' },

  // 일차방정식 6
  [k('중1 · 일차방정식 6', 1, 1)]: { text: 'x, x + 1, x + 2' },
  [k('중1 · 일차방정식 6', 1, 2)]: { text: 'x, 2x, 3x', rationale: 'Confused with multiples.' },
  [k('중1 · 일차방정식 6', 1, 3)]: { text: 'x, x², x³', rationale: 'Confused with powers.' },
  [k('중1 · 일차방정식 6', 1, 4)]: { text: 'Only 1, 2, 3 work', rationale: 'No generalization.' },
  [k('중1 · 일차방정식 6', 1, 5)]: { text: 'x, x + 2, x + 4', rationale: 'Confused with consecutive even numbers.' },
  [k('중1 · 일차방정식 6', 2, 1)]: { text: '3x + 3 = 39' },
  [k('중1 · 일차방정식 6', 2, 2)]: { text: '3x = 39', rationale: 'Forgot the +1, +2 sum.' },
  [k('중1 · 일차방정식 6', 2, 3)]: { text: 'x + 3 = 39', rationale: 'Ignored that x appears three times.' },
  [k('중1 · 일차방정식 6', 2, 4)]: { text: '3x − 3 = 39', rationale: 'Sign error on +1 + 2.' },
  [k('중1 · 일차방정식 6', 2, 5)]: { text: 'x³ + 3 = 39', rationale: 'Confused with powers.' },
  [k('중1 · 일차방정식 6', 3, 1)]: { text: '12' },
  [k('중1 · 일차방정식 6', 3, 2)]: { text: '13', rationale: 'Mishandled the +3 step.' },
  [k('중1 · 일차방정식 6', 3, 3)]: { text: '14', rationale: 'Picked the middle number instead.' },
  [k('중1 · 일차방정식 6', 3, 4)]: { text: '11', rationale: 'Division slip.' },
  [k('중1 · 일차방정식 6', 3, 5)]: { text: '13.5', rationale: 'Division order-of-magnitude error.' },

  // 일차방정식 7
  [k('중1 · 일차방정식 7', 1, 1)]: { text: 'Product of inner terms equals product of outer terms (b · c = a · d)' },
  [k('중1 · 일차방정식 7', 1, 2)]: { text: 'Always a + b = c + d', rationale: 'Misapplied addition.' },
  [k('중1 · 일차방정식 7', 1, 3)]: { text: 'a = c is enough', rationale: 'Used only a special case.' },
  [k('중1 · 일차방정식 7', 1, 4)]: { text: 'A proportion is the same as a regular equation', rationale: 'Ignored structure.' },
  [k('중1 · 일차방정식 7', 1, 5)]: { text: 'Equal numerators are sufficient', rationale: 'Wrong rule.' },
  [k('중1 · 일차방정식 7', 2, 1)]: { text: '5 · x = 3 · 20' },
  [k('중1 · 일차방정식 7', 2, 2)]: { text: '3 · x = 5 · 20', rationale: 'Inner/outer positions swapped.' },
  [k('중1 · 일차방정식 7', 2, 3)]: { text: '3 + x = 5 + 20', rationale: 'Treated as addition.' },
  [k('중1 · 일차방정식 7', 2, 4)]: { text: '3 · 5 = x · 20', rationale: 'Wrong product pairs.' },
  [k('중1 · 일차방정식 7', 2, 5)]: { text: 'x = 3 + 5 + 20', rationale: 'Unfounded equation.' },
  [k('중1 · 일차방정식 7', 3, 1)]: { text: '12' },
  [k('중1 · 일차방정식 7', 3, 2)]: { text: '60', rationale: 'Did not divide by 5.' },
  [k('중1 · 일차방정식 7', 3, 3)]: { text: '4', rationale: 'Division error.' },
  [k('중1 · 일차방정식 7', 3, 4)]: { text: '15', rationale: 'Multiplication error.' },
  [k('중1 · 일차방정식 7', 3, 5)]: { text: '20/3', rationale: 'Inner/outer swapped.' },

  // 좌표와 그래프 1
  [k('중1 · 좌표와 그래프 1', 1, 1)]: { text: 'Q1: (+,+), Q2: (−,+), Q3: (−,−), Q4: (+,−)' },
  [k('중1 · 좌표와 그래프 1', 1, 2)]: { text: 'Q1: (−,−), Q2: (+,−), Q3: (+,+), Q4: (−,+)', rationale: 'Memorized the rotation backwards.' },
  [k('중1 · 좌표와 그래프 1', 1, 3)]: { text: 'Q1: (+,−), Q2: (−,−), Q3: (−,+), Q4: (+,+)', rationale: 'Diagonal-symmetric error.' },
  [k('중1 · 좌표와 그래프 1', 1, 4)]: { text: 'All quadrants are (+,+)', rationale: 'Ignored sign distinction.' },
  [k('중1 · 좌표와 그래프 1', 1, 5)]: { text: 'Any negative → always Q3', rationale: 'Over-simplified.' },
  [k('중1 · 좌표와 그래프 1', 2, 1)]: { text: 'x = − , y = +' },
  [k('중1 · 좌표와 그래프 1', 2, 2)]: { text: 'x = + , y = +', rationale: 'Negative sign error.' },
  [k('중1 · 좌표와 그래프 1', 2, 3)]: { text: 'x = − , y = −', rationale: 'y-sign error.' },
  [k('중1 · 좌표와 그래프 1', 2, 4)]: { text: 'x = + , y = −', rationale: 'Both signs flipped.' },
  [k('중1 · 좌표와 그래프 1', 2, 5)]: { text: 'Both 0', rationale: 'Random guess.' },
  [k('중1 · 좌표와 그래프 1', 3, 1)]: { text: 'Quadrant II' },
  [k('중1 · 좌표와 그래프 1', 3, 2)]: { text: 'Quadrant I', rationale: 'Sign-matching error.' },
  [k('중1 · 좌표와 그래프 1', 3, 3)]: { text: 'Quadrant III', rationale: 'Ignored the y-sign.' },
  [k('중1 · 좌표와 그래프 1', 3, 4)]: { text: 'Quadrant IV', rationale: 'Diagonal confusion.' },
  [k('중1 · 좌표와 그래프 1', 3, 5)]: { text: 'On the x-axis', rationale: 'Assumed y = 0.' },

  // 좌표와 그래프 2
  [k('중1 · 좌표와 그래프 2', 1, 1)]: { text: 'x stays the same; only y flips its sign' },
  [k('중1 · 좌표와 그래프 2', 1, 2)]: { text: 'y stays; only x flips', rationale: 'Confused with y-axis reflection.' },
  [k('중1 · 좌표와 그래프 2', 1, 3)]: { text: 'Both signs flip', rationale: 'Confused with origin reflection.' },
  [k('중1 · 좌표와 그래프 2', 1, 4)]: { text: 'Swap x and y', rationale: 'Confused with y = x reflection.' },
  [k('중1 · 좌표와 그래프 2', 1, 5)]: { text: 'Stays the same', rationale: 'Skipped the operation.' },
  [k('중1 · 좌표와 그래프 2', 2, 1)]: { text: '(4, 1)' },
  [k('중1 · 좌표와 그래프 2', 2, 2)]: { text: '(−4, −1)', rationale: 'Treated as y-axis reflection.' },
  [k('중1 · 좌표와 그래프 2', 2, 3)]: { text: '(−4, 1)', rationale: 'Treated as origin reflection.' },
  [k('중1 · 좌표와 그래프 2', 2, 4)]: { text: '(−1, 4)', rationale: 'Treated as y = x reflection.' },
  [k('중1 · 좌표와 그래프 2', 2, 5)]: { text: '(4, −1)', rationale: 'Did not apply reflection.' },
  [k('중1 · 좌표와 그래프 2', 3, 1)]: { text: '(4, 1)' },
  [k('중1 · 좌표와 그래프 2', 3, 2)]: { text: '(−4, 1)', rationale: 'Treated as origin reflection.' },
  [k('중1 · 좌표와 그래프 2', 3, 3)]: { text: '(−4, −1)', rationale: 'Treated as y-axis reflection.' },
  [k('중1 · 좌표와 그래프 2', 3, 4)]: { text: '(1, 4)', rationale: 'Treated as y = x reflection.' },
  [k('중1 · 좌표와 그래프 2', 3, 5)]: { text: '(4, 0)', rationale: 'Sent y to 0 instead of flipping.' },

  // 좌표와 그래프 3
  [k('중1 · 좌표와 그래프 3', 1, 1)]: { text: 'a = y / x' },
  [k('중1 · 좌표와 그래프 3', 1, 2)]: { text: 'a = y − x', rationale: 'Defined with subtraction.' },
  [k('중1 · 좌표와 그래프 3', 1, 3)]: { text: 'a = y + x', rationale: 'Defined with addition.' },
  [k('중1 · 좌표와 그래프 3', 1, 4)]: { text: 'a = x · y', rationale: 'Confused with inverse proportion.' },
  [k('중1 · 좌표와 그래프 3', 1, 5)]: { text: 'a is always 1', rationale: 'No basis.' },
  [k('중1 · 좌표와 그래프 3', 2, 1)]: { text: 'a = 12 / 4 = 3' },
  [k('중1 · 좌표와 그래프 3', 2, 2)]: { text: 'a = 4 / 12 = 1/3', rationale: 'Numerator/denominator swapped.' },
  [k('중1 · 좌표와 그래프 3', 2, 3)]: { text: 'a = 12 − 4 = 8', rationale: 'Subtraction definition.' },
  [k('중1 · 좌표와 그래프 3', 2, 4)]: { text: 'a = 12 + 4 = 16', rationale: 'Addition definition.' },
  [k('중1 · 좌표와 그래프 3', 2, 5)]: { text: 'a = 12 · 4 = 48', rationale: 'Used inverse-proportion formula.' },
  [k('중1 · 좌표와 그래프 3', 3, 1)]: { text: 'y = 3x' },
  [k('중1 · 좌표와 그래프 3', 3, 2)]: { text: 'y = x/3', rationale: 'Reciprocal a.' },
  [k('중1 · 좌표와 그래프 3', 3, 3)]: { text: 'y = 8x', rationale: 'Used subtraction result.' },
  [k('중1 · 좌표와 그래프 3', 3, 4)]: { text: 'y = 48/x', rationale: 'Wrote it as inverse proportion.' },
  [k('중1 · 좌표와 그래프 3', 3, 5)]: { text: 'y = x + 3', rationale: 'Confused with linear function.' },

  // 좌표와 그래프 4
  [k('중1 · 좌표와 그래프 4', 1, 1)]: { text: 'Passes through the origin; goes from upper-left to lower-right (Q2 & Q4)' },
  [k('중1 · 좌표와 그래프 4', 1, 2)]: { text: 'Origin to lower-left/upper-right (Q1 & Q3)', rationale: 'Confused with positive slope.' },
  [k('중1 · 좌표와 그래프 4', 1, 3)]: { text: 'Always parallel to the x-axis', rationale: 'Confused with constant function.' },
  [k('중1 · 좌표와 그래프 4', 1, 4)]: { text: 'Always parallel to the y-axis', rationale: 'Wrong line direction.' },
  [k('중1 · 좌표와 그래프 4', 1, 5)]: { text: 'Does not pass through the origin', rationale: 'Skipped the through-origin property.' },
  [k('중1 · 좌표와 그래프 4', 2, 1)]: { text: '(1, −2) and (−1, 2)' },
  [k('중1 · 좌표와 그래프 4', 2, 2)]: { text: '(1, 2) and (−1, −2)', rationale: 'Mishandled negative coefficient.' },
  [k('중1 · 좌표와 그래프 4', 2, 3)]: { text: '(2, 1) and (−2, −1)', rationale: 'Swapped x and y.' },
  [k('중1 · 좌표와 그래프 4', 2, 4)]: { text: 'Just (0, 0)', rationale: 'Over-simplified.' },
  [k('중1 · 좌표와 그래프 4', 2, 5)]: { text: '(−1, −1) and (1, 1)', rationale: 'Random guess.' },
  [k('중1 · 좌표와 그래프 4', 3, 1)]: { text: 'Quadrants II and IV' },
  [k('중1 · 좌표와 그래프 4', 3, 2)]: { text: 'Quadrants I and III', rationale: 'Sign-of-slope error.' },
  [k('중1 · 좌표와 그래프 4', 3, 3)]: { text: 'Quadrants I and II', rationale: 'Confused with x-axis reflection.' },
  [k('중1 · 좌표와 그래프 4', 3, 4)]: { text: 'Quadrants III and IV', rationale: 'Assumed graph only goes downward.' },
  [k('중1 · 좌표와 그래프 4', 3, 5)]: { text: 'Quadrant I only', rationale: 'Considered only one direction.' },
};

/** AI Coach 텍스트 EN 버전 — 한국어 service 출력의 영문 대응 */
export const AI_COACH_EN = {
  diagnosis: {
    headlineNoData: 'Building your learning data — start your first study session.',
    headlineGoalDone: (unit: string, gain: number) =>
      `Today's goal completed. Reinforcing ${unit} can add another +${gain} points.`,
    headlineActive: (remainingMin: number, unit: string, gain: number) =>
      `Just ${remainingMin} more minutes today can recover ${gain} points in ${unit}.`,
    weakUnitText: (unit: string, score: number) =>
      `${unit} mastery ${score}% — needs immediate work`,
    weakUnitDesc: 'Peer average mastery is around 71%.',
  },
  errorDna: {
    insufficient: 'Not enough wrong-note data yet. Try 5+ problems and check back.',
    advice: {
      CONCEPT_MISUNDERSTANDING: {
        advice: 'Concept rebuilding — rewrite the definitions and theorems by hand, then drill 5 similar problems to extend application range.',
        expected: '+12% accuracy in 2 weeks',
      },
      CALCULATION_MISTAKE: {
        advice: 'Step-wise verification — check signs/exponents/substitutions mid-solve, plus accuracy practice in low-pressure conditions.',
        expected: '−40% calc errors in 1 week',
      },
      TIME_SHORTAGE: {
        advice: 'Standard-template memorization + timed practice — internalize 5 standard approaches for "killer-30" problems before applying to past papers.',
        expected: '−25% time on hard problems in 3 weeks',
      },
      OTHER: {
        advice: 'Recommend categorizing once you have 5+ wrong notes.',
        expected: 'Checklist-driven debugging',
      },
    },
    insightTpl: (name: string, value: number, advice: string, expected: string) =>
      `${name} is the highest at ${value}%. Recommended remedy: ${advice}. Expected outcome: ${expected}.`,
  },
  patterns: {
    emptyTitle: 'Building data',
    emptyDesc: 'Once 5+ wrong answers accumulate, the AI auto-detects patterns.',
    distractorTitle: {
      CONCEPT_CONFUSION: 'Confusion with related concept',
      CALC_ERROR: 'Calculation slip',
      PROCESS_SKIP: 'Skipped solution step',
      TIME_PRESSURE_GUESS: 'Time-pressure guess',
    },
    stepLabel: {
      CONCEPT: 'concept selection',
      PROCESS: 'solution process',
      ANSWER: 'final answer',
    },
    stepLabelLong: {
      CONCEPT: 'Step 1 (concept selection)',
      PROCESS: 'Step 2 (solution process)',
      ANSWER: 'Step 3 (final answer)',
    },
    distractorDesc: {
      CONCEPT_CONFUSION: 'You frequently confuse this with an adjacent concept — making a side-by-side comparison table of when each applies is effective.',
      CALC_ERROR: 'You go in the right direction but slip on signs/exponents/substitution — building a "quick check" habit right after each step helps.',
      PROCESS_SKIP: 'You skip a key procedural step — memorize a standard template and use a checklist to catch omissions.',
      TIME_PRESSURE_GUESS: 'Under time pressure you fall back to guesses or other-problem answers — practice time allocation and standard patterns.',
    },
    etypeTitle: {
      CONCEPT_MISUNDERSTANDING: 'Concept-application step missed',
      CALCULATION_MISTAKE: 'Calculation errors accumulating',
      TIME_SHORTAGE: 'Solutions break down under time pressure',
      OTHER: 'Solution flow needs review',
    },
    etypeDesc: {
      CONCEPT_MISUNDERSTANDING: 'You often skip or misapply core definitions/theorems. Refresh the unit fundamentals.',
      CALCULATION_MISTAKE: 'The flow is right but signs/exponents/substitutions slip — build a step-verification habit.',
      TIME_SHORTAGE: 'You run out of time on hard problems. Internalize standard templates to speed up.',
      OTHER: 'Multiple factors combined. Re-walk the entire solution from scratch.',
    },
  },
  mentor: {
    fallbackStrength: 'Steady study habit and active wrong-note review',
    fallbackNextGoal: 'Speed training on hard problems',
    nothingThisWeek: 'No study data this week — pick up with a small step.',
    high: (count: number, acc: number, weak: string) =>
      `You solved ${count} problems this week with ${acc}% accuracy. Accuracy is in a stable zone — investing more time in ${weak} will accelerate grade gains.`,
    mid: (count: number, acc: number, strong: string, weak: string) =>
      `${count} problems this week, ${acc}% accuracy. Maintain consistency in ${strong} while internalizing the solution patterns of ${weak} — next week's accuracy can climb +5%p.`,
    low: (acc: number, weak: string) =>
      `${acc}% accuracy this week — quality matters more than quantity right now. Focus on a single weak unit (${weak}) and review immediately after each solve to make a meaningful change next week.`,
    strengthTpl: (unit: string, score: number) =>
      `${unit} stable (mastery ${score}%)`,
    nextGoalTpl: (unit: string, current: number, target: number) =>
      `${unit} mastery ${current}% → reach ${target}%`,
    nextGoalNoMastery: (avg: number) =>
      `Maintain average mastery ~${avg}%`,
    dataAccumulating: 'Data accumulating',
  },
};

export const RECOMMENDATION_EN = {
  tagFocus: 'Focus on Mistakes',
  tagWeak: 'Reinforce Weakness',
  tagStrong: 'Maintain Strength',
  // Focus on mistakes
  focusUnit: (unit: string, sub: string) =>
    sub ? `${unit} · ${sub}` : `${unit} · core area`,
  focusTitleSub: (sub: string) => `${sub} — finish in one session`,
  focusTitleUnit: (unit: string) => `${unit} weakness reinforcement`,
  focusReason: (occ: number, n: number) =>
    `${occ} cumulative wrong attempts (${n} problems) — needs immediate work`,
  // Reinforce weakness
  weakUnit: (unit: string) => `${unit} · core concepts`,
  weakTitle: (unit: string) => `Intuitive understanding of ${unit}`,
  weakReasonGap: (score: number, gap: number) =>
    `Mastery ${score}% — ${gap}%p below peer average`,
  weakReasonStable: (score: number) =>
    `Mastery ${score}% — push to a stable zone`,
  // Maintain strength
  strongUnit: (unit: string) => `${unit} · applied practice`,
  strongTitle: (unit: string) => `${unit} full-mock challenge`,
  strongReason: (score: number) => `Maintain & deepen mastery at ${score}%`,
};

export const STATIC_FALLBACK_EN = {
  llmNotConfigured: 'AI key not configured — showing a sample response. Fill `AI_LLM_API_KEY` in `backend/.env` to switch to real LLM output.',
  uploadPhotoOk: 'Photo registration — automatic recognition activates after Vision API key is set.',
  uploadPdfOk: 'PDF batch extraction — activates after LLM key is set.',
};
