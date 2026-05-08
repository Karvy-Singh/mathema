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

export const UNIT_NAME_EN: Record<string, string> = {
  '수와 식':   'Numbers & Expressions',
  '함수':       'Functions',
  '미적분 I':  'Calculus I',
  '미적분 II': 'Calculus II',
  '확률·통계': 'Probability & Statistics',
  '기하·벡터': 'Geometry & Vectors',
};

export const SUB_UNIT_NAME_EN: Record<string, string> = {
  '정적분의 활용': 'Applications of Definite Integrals',
  '부분적분':       'Integration by Parts',
  '치환적분':       'Integration by Substitution',
  '조건부확률':     'Conditional Probability',
  '공간벡터':       'Spatial Vectors',
  '정적분':         'Definite Integral',
  '지수·로그함수': 'Exponential & Logarithmic Functions',
  '핵심 영역':      'Core area',
  '핵심 개념':      'Core concepts',
  '실전 응용':      'Applied practice',
};

export const DIFFICULTY_EN: Record<string, string> = {
  MIDDLE:       'Med',
  UPPER_MIDDLE: 'Med-Hi',
  SEMI_KILLER:  'Hard',
  KILLER:       'Killer',
};

export const ERROR_TYPE_EN: Record<string, string> = {
  CONCEPT_MISUNDERSTANDING: 'Concept misunderstanding',
  CALCULATION_MISTAKE:       'Calculation mistake',
  TIME_SHORTAGE:             'Time shortage',
  OTHER:                     'Other',
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
  // Fallbacks
  fbFocusUnit: 'Accumulating · —',
  fbFocusTitle: 'Solve problems to start collecting wrong notes',
  fbFocusReason: 'AI needs 5+ problems to find weaknesses',
  fbWeakUnit: 'Accumulating · —',
  fbWeakTitle: 'Take a unit-level diagnostic',
  fbWeakReason: 'Diagnostic recommended to measure mastery',
  fbStrongUnit: 'Accumulating · —',
  fbStrongTitle: 'Discover your strong units',
  fbStrongReason: 'Surfaces once a unit reaches 70%+ mastery',
};

export const STATIC_FALLBACK_EN = {
  llmNotConfigured: 'AI key not configured — showing a sample response. Fill `AI_LLM_API_KEY` in `backend/.env` to switch to real LLM output.',
  uploadPhotoOk: 'Photo registration — automatic recognition activates after Vision API key is set.',
  uploadPdfOk: 'PDF batch extraction — activates after LLM key is set.',
};
