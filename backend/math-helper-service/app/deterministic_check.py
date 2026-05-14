# these are handwritten functions for the maths algos as LLMs make mistake
# they will not contain the whole syllabus but rather some core concepts, as many as we can put as checks
import ast
import math
import re
from dataclasses import asdict, dataclass
from fractions import Fraction
from typing import Any, Callable


@dataclass
class DeterministicResult:
    method: str
    answer: str
    confidence: float
    checker: str
    concepts: list[str]
    steps: list[str]
    is_student_correct: bool | None = None
    mistake_diagnosis: str | None = None


def clean_question(question: str) -> str:
    return (
        question.replace("−", "-")
        .replace("–", "-")
        .replace("—", "-")
        .replace("×", "*")
        .replace("÷", "/")
        .replace("²", "^2")
        .replace("³", "^3")
        .strip()
    )


def normalize(value: str | None) -> str:
    return (
        str(value or "")
        .strip()
        .lower()
        .replace(" ", "")
        .replace(",", "")
        .replace("%", "")
        .replace(".0", "")
    )


def format_fraction(value: Fraction) -> str:
    if value.denominator == 1:
        return str(value.numerator)
    return f"{value.numerator}/{value.denominator}"


def format_value(value: Fraction) -> str:
    return format_fraction(value)


def parse_number(value: str) -> Fraction | None:
    value = clean_question(value).strip().replace(" ", "").rstrip(".")
    try:
        if "/" in value:
            n, d = value.split("/", 1)
            return Fraction(int(n), int(d))
        return Fraction(value)
    except Exception:
        return None


def compare_answers(expected: str, actual: str | None) -> bool | None:
    if actual is None:
        return None

    if normalize(expected) == normalize(actual):
        return True

    expected_values = [x.strip() for x in re.split(r"[,;]", expected) if x.strip()]
    actual_values = [x.strip() for x in re.split(r"[,;]", actual) if x.strip()]

    if len(expected_values) > 1 or len(actual_values) > 1:
        e_nums = [parse_number(x) for x in expected_values]
        a_nums = [parse_number(x) for x in actual_values]

        if all(x is not None for x in e_nums + a_nums) and len(e_nums) == len(a_nums):
            return sorted(e_nums) == sorted(a_nums)

        return sorted(normalize(x) for x in expected_values) == sorted(
            normalize(x) for x in actual_values
        )

    e_num = parse_number(expected)
    a_num = parse_number(actual)

    if e_num is not None and a_num is not None:
        return e_num == a_num

    return False


def with_student_check(
    result: DeterministicResult,
    student_answer: str | None,
) -> dict[str, Any]:
    result.is_student_correct = compare_answers(result.answer, student_answer)

    if result.is_student_correct is False:
        result.mistake_diagnosis = (
            "The final value does not match the deterministic recomputation. "
            "Recheck signs, substitution, and arithmetic."
        )

    return asdict(result)


class SafeArithmeticEvaluator(ast.NodeVisitor):
    binary_ops = {
        ast.Add: lambda a, b: a + b,
        ast.Sub: lambda a, b: a - b,
        ast.Mult: lambda a, b: a * b,
        ast.Div: lambda a, b: a / b,
        ast.Pow: lambda a, b: a**b,
    }

    unary_ops = {
        ast.UAdd: lambda a: a,
        ast.USub: lambda a: -a,
    }

    def visit_Expression(self, node: ast.Expression) -> Fraction:
        return self.visit(node.body)

    def visit_Constant(self, node: ast.Constant) -> Fraction:
        if isinstance(node.value, int):
            return Fraction(node.value)
        if isinstance(node.value, float):
            return Fraction(str(node.value))
        raise ValueError("Unsupported constant")

    def visit_UnaryOp(self, node: ast.UnaryOp) -> Fraction:
        op_type = type(node.op)
        if op_type not in self.unary_ops:
            raise ValueError("Unsupported unary operator")
        return self.unary_ops[op_type](self.visit(node.operand))

    def visit_BinOp(self, node: ast.BinOp) -> Fraction:
        op_type = type(node.op)
        if op_type not in self.binary_ops:
            raise ValueError("Unsupported binary operator")

        left = self.visit(node.left)
        right = self.visit(node.right)

        if op_type is ast.Pow:
            if right.denominator != 1:
                raise ValueError("Fractional powers are not supported")
            exponent = int(right)
            if abs(exponent) > 12:
                raise ValueError("Exponent too large")
            return left**exponent

        return self.binary_ops[op_type](left, right)

    def generic_visit(self, node: ast.AST) -> Fraction:
        raise ValueError(f"Unsupported expression: {type(node).__name__}")


def add_implicit_multiplication(expr: str) -> str:
    expr = clean_question(expr).replace("^", "**")
    expr = re.sub(r"(\d)([a-zA-Z(])", r"\1*\2", expr)
    expr = re.sub(r"([a-zA-Z)])(\d)", r"\1*\2", expr)
    expr = re.sub(r"([a-zA-Z)])(\()", r"\1*\2", expr)
    expr = re.sub(r"(\))([a-zA-Z])", r"\1*\2", expr)
    return expr


def safe_eval_arithmetic(expr: str) -> Fraction | None:
    expr = add_implicit_multiplication(expr)

    if re.search(r"[a-zA-Z]", expr):
        return None

    if not re.fullmatch(r"[0-9+\-*/().\s]+", expr):
        return None

    try:
        tree = ast.parse(expr, mode="eval")
        return SafeArithmeticEvaluator().visit(tree)
    except Exception:
        return None


class PolynomialEvaluator(ast.NodeVisitor):
    def __init__(self, variable: str = "x") -> None:
        self.variable = variable

    def visit_Expression(self, node: ast.Expression) -> dict[int, Fraction]:
        return self.visit(node.body)

    def visit_Constant(self, node: ast.Constant) -> dict[int, Fraction]:
        if isinstance(node.value, int):
            return {0: Fraction(node.value)}
        if isinstance(node.value, float):
            return {0: Fraction(str(node.value))}
        raise ValueError("Unsupported constant")

    def visit_Name(self, node: ast.Name) -> dict[int, Fraction]:
        if node.id != self.variable:
            raise ValueError("Unsupported variable")
        return {1: Fraction(1)}

    def visit_UnaryOp(self, node: ast.UnaryOp) -> dict[int, Fraction]:
        poly = self.visit(node.operand)

        if isinstance(node.op, ast.USub):
            return {degree: -coef for degree, coef in poly.items()}

        if isinstance(node.op, ast.UAdd):
            return poly

        raise ValueError("Unsupported unary operator")

    def visit_BinOp(self, node: ast.BinOp) -> dict[int, Fraction]:
        left = self.visit(node.left)
        right = self.visit(node.right)

        if isinstance(node.op, ast.Add):
            return poly_add(left, right)

        if isinstance(node.op, ast.Sub):
            return poly_add(left, {d: -c for d, c in right.items()})

        if isinstance(node.op, ast.Mult):
            return poly_mul(left, right)

        if isinstance(node.op, ast.Div):
            if len(right) != 1 or 0 not in right or right[0] == 0:
                raise ValueError("Can only divide a polynomial by a non-zero constant")
            return {d: c / right[0] for d, c in left.items()}

        if isinstance(node.op, ast.Pow):
            if len(right) != 1 or 0 not in right or right[0].denominator != 1:
                raise ValueError("Polynomial exponent must be an integer constant")

            exponent = int(right[0])
            if exponent < 0 or exponent > 8:
                raise ValueError("Polynomial exponent unsupported")

            return poly_pow(left, exponent)

        raise ValueError("Unsupported operator")

    def generic_visit(self, node: ast.AST) -> dict[int, Fraction]:
        raise ValueError(f"Unsupported expression: {type(node).__name__}")


def poly_add(
    a: dict[int, Fraction],
    b: dict[int, Fraction],
) -> dict[int, Fraction]:
    out = dict(a)

    for degree, coef in b.items():
        out[degree] = out.get(degree, Fraction(0)) + coef

    return {d: c for d, c in out.items() if c != 0}


def poly_mul(
    a: dict[int, Fraction],
    b: dict[int, Fraction],
) -> dict[int, Fraction]:
    out: dict[int, Fraction] = {}

    for da, ca in a.items():
        for db, cb in b.items():
            out[da + db] = out.get(da + db, Fraction(0)) + ca * cb

    return {d: c for d, c in out.items() if c != 0}


def poly_pow(poly: dict[int, Fraction], exponent: int) -> dict[int, Fraction]:
    out = {0: Fraction(1)}

    for _ in range(exponent):
        out = poly_mul(out, poly)

    return out


def parse_polynomial(expr: str, variable: str = "x") -> dict[int, Fraction] | None:
    expr = add_implicit_multiplication(expr)

    if not re.fullmatch(r"[0-9a-zA-Z+\-*/().\s]+", expr):
        return None

    try:
        tree = ast.parse(expr, mode="eval")
        return PolynomialEvaluator(variable).visit(tree)
    except Exception:
        return None


def eval_polynomial(poly: dict[int, Fraction], x_value: Fraction) -> Fraction:
    return sum(coef * (x_value**degree) for degree, coef in poly.items())


def format_polynomial(poly: dict[int, Fraction], variable: str = "x") -> str:
    if not poly:
        return "0"

    parts: list[str] = []

    for degree in sorted(poly.keys(), reverse=True):
        coef = poly[degree]
        sign = "-" if coef < 0 else "+"
        abs_coef = abs(coef)

        if degree == 0:
            body = format_fraction(abs_coef)
        elif degree == 1:
            body = (
                variable if abs_coef == 1 else f"{format_fraction(abs_coef)}{variable}"
            )
        else:
            body = (
                f"{variable}^{degree}"
                if abs_coef == 1
                else f"{format_fraction(abs_coef)}{variable}^{degree}"
            )

        if not parts:
            parts.append(f"-{body}" if sign == "-" else body)
        else:
            parts.append(f" {sign} {body}")

    return "".join(parts)


def extract_expression_after_keywords(question: str, keywords: list[str]) -> str | None:
    q = clean_question(question)

    for keyword in keywords:
        match = re.search(rf"{keyword}\s*[:\-]?\s*(.+)", q, re.IGNORECASE)
        if match:
            return match.group(1).strip().rstrip("?")

    return None


def check_remainder_theorem(
    question: str,
    student_answer: str | None = None,
) -> dict[str, Any] | None:
    q = clean_question(question)

    match = re.search(
        r"(?:find\s+the\s+remainder\s+when\s+)?(.+?)\s+is\s+divided\s+by\s+x\s*([+-])\s*(\d+(?:/\d+)?|\d+(?:\.\d+)?)",
        q,
        re.IGNORECASE,
    )

    if not match:
        return None

    poly_text = re.sub(
        r"^find\s+the\s+remainder\s+when\s+",
        "",
        match.group(1).strip(),
        flags=re.IGNORECASE,
    )

    sign = match.group(2)
    n = parse_number(match.group(3))

    if n is None:
        return None

    x_value = n if sign == "-" else -n
    poly = parse_polynomial(poly_text)

    if poly is None:
        return None

    value = eval_polynomial(poly, x_value)

    result = DeterministicResult(
        method="deterministic",
        answer=format_value(value),
        confidence=1.0,
        checker="remainder_theorem",
        concepts=["Remainder theorem", "Polynomial substitution"],
        steps=[
            f"For divisor x {sign} {match.group(3)}, use x = {format_fraction(x_value)}.",
            f"Evaluate f({format_fraction(x_value)}) for {format_polynomial(poly)}.",
            f"The remainder is {format_value(value)}.",
        ],
    )

    return with_student_check(result, student_answer)


def check_polynomial_substitution(
    question: str,
    student_answer: str | None = None,
) -> dict[str, Any] | None:
    q = clean_question(question)

    patterns = [
        r"(?:find|calculate|evaluate)\s+(?:the\s+value\s+of\s+)?(?:the\s+polynomial\s+)?(.+?)\s+(?:when|at|for)\s+x\s*=\s*([+-]?\d+(?:/\d+)?|[+-]?\d+(?:\.\d+)?)",
        r"f\(x\)\s*=\s*(.+?)\s*,?\s*(?:find|calculate|evaluate)\s+f\(\s*([+-]?\d+(?:/\d+)?|[+-]?\d+(?:\.\d+)?)\s*\)",
    ]

    for pattern in patterns:
        match = re.search(pattern, q, re.IGNORECASE)

        if not match:
            continue

        poly_text = match.group(1).strip()
        x_value = parse_number(match.group(2))

        if x_value is None:
            continue

        poly = parse_polynomial(poly_text)

        if poly is None:
            continue

        value = eval_polynomial(poly, x_value)

        result = DeterministicResult(
            method="deterministic",
            answer=format_value(value),
            confidence=1.0,
            checker="polynomial_substitution",
            concepts=["Polynomial substitution"],
            steps=[
                f"Substitute x = {format_fraction(x_value)} into {format_polynomial(poly)}.",
                f"The value is {format_value(value)}.",
            ],
        )

        return with_student_check(result, student_answer)

    return None


def check_linear_equation(
    question: str,
    student_answer: str | None = None,
) -> dict[str, Any] | None:
    q = clean_question(question).rstrip("?")

    if "=" not in q:
        return None

    if re.search(r"\bx\^?2\b|\*\*2", q):
        return None

    q = re.sub(
        r"^(solve|find\s+x|find\s+the\s+value\s+of\s+x)\s*[:\-]?\s*",
        "",
        q,
        flags=re.IGNORECASE,
    )

    parts = q.split("=", 1)

    if len(parts) != 2:
        return None

    left = parse_polynomial(parts[0])
    right = parse_polynomial(parts[1])

    if left is None or right is None:
        return None

    if max(left.keys() or [0]) > 1 or max(right.keys() or [0]) > 1:
        return None

    a = left.get(1, Fraction(0)) - right.get(1, Fraction(0))
    b = right.get(0, Fraction(0)) - left.get(0, Fraction(0))

    if a == 0:
        return None

    x_value = b / a

    result = DeterministicResult(
        method="deterministic",
        answer=format_value(x_value),
        confidence=0.98,
        checker="linear_equation",
        concepts=["Linear equations"],
        steps=[
            "Collect x terms on one side and constants on the other side.",
            f"Solve {format_fraction(a)}x = {format_fraction(b)}.",
            f"x = {format_value(x_value)}.",
        ],
    )

    return with_student_check(result, student_answer)


def check_quadratic_roots(
    question: str,
    student_answer: str | None = None,
) -> dict[str, Any] | None:
    q = clean_question(question).rstrip("?")

    if not re.search(r"(solve|roots|zeroes|zeros)", q, re.IGNORECASE):
        return None

    if "=" not in q:
        return None

    q = re.sub(
        r"^(solve|find\s+the\s+roots\s+of|find\s+roots\s+of|find\s+the\s+zeroes\s+of|find\s+the\s+zeros\s+of)\s*[:\-]?\s*",
        "",
        q,
        flags=re.IGNORECASE,
    )

    left_text, right_text = q.split("=", 1)
    left = parse_polynomial(left_text)
    right = parse_polynomial(right_text)

    if left is None or right is None:
        return None

    poly = poly_add(left, {d: -c for d, c in right.items()})

    if max(poly.keys() or [0]) != 2:
        return None

    a = poly.get(2, Fraction(0))
    b = poly.get(1, Fraction(0))
    c = poly.get(0, Fraction(0))

    if a == 0:
        return None

    discriminant = b * b - 4 * a * c

    if discriminant < 0:
        answer = "no real roots"
        steps = [
            f"Compare with ax^2 + bx + c = 0: a = {format_fraction(a)}, b = {format_fraction(b)}, c = {format_fraction(c)}.",
            f"Discriminant D = b^2 - 4ac = {format_fraction(discriminant)}.",
            "Since D < 0, there are no real roots.",
        ]
    else:
        sqrt_disc = (
            int(math.isqrt(discriminant.numerator))
            if discriminant.denominator == 1
            else None
        )

        if sqrt_disc is not None and sqrt_disc * sqrt_disc == discriminant.numerator:
            roots = [
                (-b + sqrt_disc) / (2 * a),
                (-b - sqrt_disc) / (2 * a),
            ]
            roots = sorted(roots)
            answer = ", ".join(format_value(root) for root in roots)
            steps = [
                f"Compare with ax^2 + bx + c = 0: a = {format_fraction(a)}, b = {format_fraction(b)}, c = {format_fraction(c)}.",
                f"Discriminant D = {format_fraction(discriminant)}.",
                f"Use x = (-b ± sqrt(D))/(2a), so roots are {answer}.",
            ]
        else:
            answer = (
                f"({format_fraction(-b)} ± sqrt({format_fraction(discriminant)}))"
                f"/{format_fraction(2 * a)}"
            )
            steps = [
                f"Compare with ax^2 + bx + c = 0: a = {format_fraction(a)}, b = {format_fraction(b)}, c = {format_fraction(c)}.",
                f"Discriminant D = {format_fraction(discriminant)}.",
                f"Use x = (-b ± sqrt(D))/(2a), giving {answer}.",
            ]

    result = DeterministicResult(
        method="deterministic",
        answer=answer,
        confidence=0.96,
        checker="quadratic_roots",
        concepts=["Quadratic equations", "Quadratic formula"],
        steps=steps,
    )

    return with_student_check(result, student_answer)


def check_percentage(
    question: str,
    student_answer: str | None = None,
) -> dict[str, Any] | None:
    q = clean_question(question).lower().rstrip("?")

    match = re.search(
        r"(?:what\s+is|find|calculate)?\s*([+-]?\d+(?:\.\d+)?)\s*%\s+of\s+([+-]?\d+(?:\.\d+)?)",
        q,
    )

    if match:
        pct = Fraction(match.group(1))
        base = Fraction(match.group(2))
        value = pct * base / 100

        result = DeterministicResult(
            method="deterministic",
            answer=format_value(value),
            confidence=1.0,
            checker="percentage",
            concepts=["Percentages"],
            steps=[
                f"{format_fraction(pct)}% of {format_fraction(base)} = ({format_fraction(pct)}/100) × {format_fraction(base)}.",
                f"Answer = {format_value(value)}.",
            ],
        )

        return with_student_check(result, student_answer)

    match = re.search(
        r"([+-]?\d+(?:\.\d+)?)\s+is\s+what\s+percent\s+of\s+([+-]?\d+(?:\.\d+)?)",
        q,
    )

    if match:
        part = Fraction(match.group(1))
        whole = Fraction(match.group(2))

        if whole == 0:
            return None

        value = part * 100 / whole

        result = DeterministicResult(
            method="deterministic",
            answer=f"{format_value(value)}%",
            confidence=1.0,
            checker="percentage",
            concepts=["Percentages"],
            steps=[
                f"Percent = part/whole × 100 = {format_fraction(part)}/{format_fraction(whole)} × 100.",
                f"Answer = {format_value(value)}%.",
            ],
        )

        return with_student_check(result, student_answer)

    match = re.search(
        r"(increase|decrease)\s+([+-]?\d+(?:\.\d+)?)\s+by\s+([+-]?\d+(?:\.\d+)?)\s*%",
        q,
    )

    if match:
        direction = match.group(1)
        base = Fraction(match.group(2))
        pct = Fraction(match.group(3))
        change = base * pct / 100
        value = base + change if direction == "increase" else base - change

        result = DeterministicResult(
            method="deterministic",
            answer=format_value(value),
            confidence=1.0,
            checker="percentage",
            concepts=["Percentages"],
            steps=[
                f"Change = {format_fraction(pct)}% of {format_fraction(base)} = {format_value(change)}.",
                f"After {direction}, answer = {format_value(value)}.",
            ],
        )

        return with_student_check(result, student_answer)

    return None


def check_ratio_proportion(
    question: str,
    student_answer: str | None = None,
) -> dict[str, Any] | None:
    q = clean_question(question).lower().rstrip("?")

    match = re.search(
        r"divide\s+([+-]?\d+(?:\.\d+)?)\s+(?:in|into)\s+(?:the\s+)?ratio\s+(\d+)\s*:\s*(\d+)",
        q,
    )

    if match:
        total = Fraction(match.group(1))
        a = Fraction(match.group(2))
        b = Fraction(match.group(3))

        first = total * a / (a + b)
        second = total * b / (a + b)
        answer = f"{format_value(first)}, {format_value(second)}"

        result = DeterministicResult(
            method="deterministic",
            answer=answer,
            confidence=0.98,
            checker="ratio_proportion",
            concepts=["Ratio and proportion"],
            steps=[
                f"Total ratio parts = {format_fraction(a)} + {format_fraction(b)} = {format_fraction(a + b)}.",
                f"Parts are {answer}.",
            ],
        )

        return with_student_check(result, student_answer)

    match = re.search(
        r"ratio\s+of\s+([+-]?\d+(?:\.\d+)?)\s+(?:and|to)\s+([+-]?\d+(?:\.\d+)?)",
        q,
    )

    if match:
        a = Fraction(match.group(1))
        b = Fraction(match.group(2))

        if b == 0:
            return None

        left_raw = abs(a.numerator * b.denominator)
        right_raw = abs(b.numerator * a.denominator)
        common = math.gcd(left_raw, right_raw)

        answer = f"{left_raw // common}:{right_raw // common}"

        result = DeterministicResult(
            method="deterministic",
            answer=answer,
            confidence=0.95,
            checker="ratio_proportion",
            concepts=["Ratio and proportion"],
            steps=[
                f"Write the ratio as {format_fraction(a)}:{format_fraction(b)}.",
                f"Simplify to {answer}.",
            ],
        )

        return with_student_check(result, student_answer)

    match = re.search(
        r"(\d+(?:\.\d+)?)\s*:\s*(\d+(?:\.\d+)?)\s*=\s*(\d+(?:\.\d+)?)\s*:\s*x",
        q,
    )

    if match:
        a = Fraction(match.group(1))
        b = Fraction(match.group(2))
        c = Fraction(match.group(3))

        if a == 0:
            return None

        x = b * c / a

        result = DeterministicResult(
            method="deterministic",
            answer=format_value(x),
            confidence=0.98,
            checker="ratio_proportion",
            concepts=["Ratio and proportion"],
            steps=[
                f"For {format_fraction(a)}:{format_fraction(b)} = {format_fraction(c)}:x, use a/b = c/x.",
                f"x = b × c / a = {format_value(x)}.",
            ],
        )

        return with_student_check(result, student_answer)

    return None


def parse_point(text: str) -> tuple[Fraction, Fraction] | None:
    match = re.search(
        r"\(\s*([+-]?\d+(?:/\d+)?|[+-]?\d+(?:\.\d+)?)\s*,\s*([+-]?\d+(?:/\d+)?|[+-]?\d+(?:\.\d+)?)\s*\)",
        text,
    )

    if not match:
        return None

    x = parse_number(match.group(1))
    y = parse_number(match.group(2))

    if x is None or y is None:
        return None

    return x, y


def check_coordinate_geometry(
    question: str,
    student_answer: str | None = None,
) -> dict[str, Any] | None:
    q = clean_question(question).lower()

    points = re.findall(
        r"\(\s*[+-]?\d+(?:/\d+)?(?:\.\d+)?\s*,\s*[+-]?\d+(?:/\d+)?(?:\.\d+)?\s*\)",
        q,
    )

    if len(points) < 2:
        return None

    p1 = parse_point(points[0])
    p2 = parse_point(points[1])

    if p1 is None or p2 is None:
        return None

    x1, y1 = p1
    x2, y2 = p2

    if "midpoint" in q or "mid point" in q:
        mx = (x1 + x2) / 2
        my = (y1 + y2) / 2
        answer = f"({format_value(mx)}, {format_value(my)})"

        result = DeterministicResult(
            method="deterministic",
            answer=answer,
            confidence=1.0,
            checker="coordinate_geometry_midpoint",
            concepts=["Coordinate geometry", "Midpoint formula"],
            steps=[
                "Midpoint = ((x1 + x2)/2, (y1 + y2)/2).",
                f"Answer = {answer}.",
            ],
        )

        return with_student_check(result, student_answer)

    if "slope" in q or "gradient" in q:
        dx = x2 - x1
        dy = y2 - y1
        answer = "undefined" if dx == 0 else format_value(dy / dx)

        result = DeterministicResult(
            method="deterministic",
            answer=answer,
            confidence=1.0,
            checker="coordinate_geometry_slope",
            concepts=["Coordinate geometry", "Slope"],
            steps=[
                "Slope = (y2 - y1)/(x2 - x1).",
                f"Answer = {answer}.",
            ],
        )

        return with_student_check(result, student_answer)

    if "distance" in q:
        dx = x2 - x1
        dy = y2 - y1
        square = dx * dx + dy * dy

        if (
            square.denominator == 1
            and math.isqrt(square.numerator) ** 2 == square.numerator
        ):
            answer = str(math.isqrt(square.numerator))
        else:
            answer = f"sqrt({format_fraction(square)})"

        result = DeterministicResult(
            method="deterministic",
            answer=answer,
            confidence=1.0,
            checker="coordinate_geometry_distance",
            concepts=["Coordinate geometry", "Distance formula"],
            steps=[
                "Distance = sqrt((x2 - x1)^2 + (y2 - y1)^2).",
                f"Answer = {answer}.",
            ],
        )

        return with_student_check(result, student_answer)

    return None


def check_simplification(
    question: str,
    student_answer: str | None = None,
) -> dict[str, Any] | None:
    expr = extract_expression_after_keywords(question, ["simplify", "expand"])

    if not expr or "=" in expr:
        return None

    if re.search(r"[a-zA-Z]", expr):
        poly = parse_polynomial(expr)

        if poly is None:
            return None

        answer = format_polynomial(poly)

        result = DeterministicResult(
            method="deterministic",
            answer=answer,
            confidence=0.92,
            checker="algebraic_simplification",
            concepts=["Simplification", "Algebraic expressions"],
            steps=[
                "Combine like terms and simplify coefficients.",
                f"Answer = {answer}.",
            ],
        )

        return with_student_check(result, student_answer)

    value = safe_eval_arithmetic(expr)

    if value is None:
        return None

    result = DeterministicResult(
        method="deterministic",
        answer=format_value(value),
        confidence=1.0,
        checker="arithmetic_simplification",
        concepts=["Arithmetic", "Simplification"],
        steps=[
            f"Evaluate the expression {expr}.",
            f"Answer = {format_value(value)}.",
        ],
    )

    return with_student_check(result, student_answer)


def check_arithmetic(
    question: str,
    student_answer: str | None = None,
) -> dict[str, Any] | None:
    q = clean_question(question)

    if "=" in q:
        return None

    expr = extract_expression_after_keywords(
        q, ["calculate", "evaluate", "find", "what is"]
    )

    if not expr:
        expr = q

    expr = expr.strip().rstrip("?")

    if re.search(r"[a-zA-Z%]", expr):
        return None

    value = safe_eval_arithmetic(expr)

    if value is None:
        return None

    result = DeterministicResult(
        method="deterministic",
        answer=format_value(value),
        confidence=1.0,
        checker="arithmetic",
        concepts=["Arithmetic", "Fractions"],
        steps=[
            f"Evaluate {expr}.",
            f"Answer = {format_value(value)}.",
        ],
    )

    return with_student_check(result, student_answer)


CHECKERS: list[Callable[[str, str | None], dict[str, Any] | None]] = [
    check_remainder_theorem,
    check_polynomial_substitution,
    check_coordinate_geometry,
    check_quadratic_roots,
    check_linear_equation,
    check_percentage,
    check_ratio_proportion,
    check_simplification,
    check_arithmetic,
]


def deterministic_check(
    question: str,
    student_answer: str | None = None,
) -> dict[str, Any] | None:
    for checker in CHECKERS:
        result = checker(question, student_answer)

        if result is not None:
            return result

    return None


if __name__ == "__main__":
    examples = [
        ("Find the remainder when x^3 - 3x^2 + 4x - 7 is divided by x - 2.", "-2"),
        ("Solve 2x + 3 = 11", "4"),
        ("Solve x^2 - 5x + 6 = 0", "2,3"),
        ("What is 20% of 150?", "30"),
        ("Divide 60 in the ratio 2:3", "24,36"),
        ("Find the distance between (1,2) and (4,6)", "5"),
        ("Simplify: 2x + 3x - 4 + 1", "5x-3"),
        ("Calculate 1/2 + 3/4", "5/4"),
    ]

    for question, student_answer in examples:
        print(question)
        print(deterministic_check(question, student_answer))
        print()
