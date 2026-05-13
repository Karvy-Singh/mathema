# these are handwritten functions for the maths algos as LLMs make mistake
# they will not contain the whole syllabus but rather some core concepts, as many as we can put as checks

import re


def normalize(value: str | None) -> str:
    return str(value or "").strip().lower().replace(" ", "").replace(".0", "")


def check_remainder_theorem(question: str):
    q = question.replace("−", "-")

    match = re.search(
        r"(.+?)\s+is\s+divided\s+by\s+x\s*([+-])\s*(\d+)",
        q,
        re.IGNORECASE,
    )
    if not match:
        return None

    poly = re.sub(
        r"^find\s+the\s+remainder\s+when\s+",
        "",
        match.group(1).strip(),
        flags=re.IGNORECASE,
    )

    sign = match.group(2)
    n = int(match.group(3))
    x = n if sign == "-" else -n

    value = eval_poly(poly, x)
    if value is None:
        return None

    return {
        "method": "deterministic",
        "answer": str(int(value)) if value == int(value) else str(value),
        "confidence": 1.0,
    }


def eval_poly(poly: str, x: int):
    poly = poly.replace(" ", "").replace("^", "**")
    poly = re.sub(r"(\d)(x)", r"\1*\2", poly)
    poly = poly.replace("x", f"({x})")

    if not re.fullmatch(r"[0-9+\-*/().* ]+", poly):
        return None

    try:
        return eval(poly, {"__builtins__": {}})
    except Exception:
        return None


def deterministic_check(question: str):
    return check_remainder_theorem(question)
