import json
import re
from functools import lru_cache
from pathlib import Path
from typing import Any


APP_DIR = Path(__file__).resolve().parent
BACKEND_DIR = APP_DIR.parents[1]
NCERT_DIR = BACKEND_DIR / "data" / "ncert"


def _read_json(name: str) -> dict[str, Any]:
    with (NCERT_DIR / name).open("r", encoding="utf-8") as f:
        return json.load(f)


@lru_cache(maxsize=1)
def load_ncert_data() -> dict[str, Any]:
    curriculum = _read_json("curriculum.ncert-math-7-12.json")
    concepts = _read_json("concepts.ncert-math-7-12.json")
    problems = _read_json("problems.ncert-math-7-12.json")

    concept_by_code = {c["conceptCode"]: c for c in concepts.get("concepts", [])}
    chapter_by_code: dict[str, dict[str, Any]] = {}
    topic_by_code: dict[str, dict[str, Any]] = {}

    for klass in curriculum.get("classes", []):
        for chapter in klass.get("chapters", []):
            chapter_copy = {**chapter, "classLevel": klass.get("classLevel")}
            chapter_by_code[chapter["chapterCode"]] = chapter_copy
            for topic in chapter.get("topics", []):
                topic_by_code[topic["topicCode"]] = {
                    **topic,
                    "chapterCode": chapter["chapterCode"],
                    "classLevel": klass.get("classLevel"),
                }

    return {
        "curriculum": curriculum,
        "concepts": concepts,
        "problems": problems,
        "conceptByCode": concept_by_code,
        "chapterByCode": chapter_by_code,
        "topicByCode": topic_by_code,
    }


def _tokens(value: str) -> set[str]:
    return {
        token
        for token in re.findall(r"[a-zA-Z0-9]+", value.lower())
        if len(token) > 1
    }


def _score(query: str, text: str) -> float:
    query_norm = query.strip().lower()
    text_norm = text.strip().lower()
    if not query_norm or not text_norm:
        return 0
    if query_norm == text_norm:
        return 1.0
    if query_norm in text_norm or text_norm in query_norm:
        return 0.92

    query_tokens = _tokens(query_norm)
    text_tokens = _tokens(text_norm)
    if not query_tokens or not text_tokens:
        return 0

    overlap = len(query_tokens & text_tokens)
    return overlap / max(len(query_tokens), len(text_tokens))


def retrieve_context(
    question: str,
    class_level: int | None = None,
    detected: dict[str, Any] | None = None,
) -> dict[str, Any]:
    data = load_ncert_data()
    problems = data["problems"].get("problems", [])
    concept_by_code = data["conceptByCode"]
    chapter_by_code = data["chapterByCode"]
    topic_by_code = data["topicByCode"]
    detected = detected or {}
    detected_chapter_code = detected.get("chapterCode")
    detected_topic_code = detected.get("topicCode")
    detected_concept_codes = detected.get("conceptCodes", []) or []

    ranked: list[tuple[float, dict[str, Any]]] = []
    for problem in problems:
        if class_level and problem.get("classLevel") != class_level:
            continue

        score = _score(question, problem.get("body", ""))
        if detected_chapter_code and detected_chapter_code == problem.get("chapterCode"):
            score += 0.25
        if detected_topic_code and detected_topic_code == problem.get("topicCode"):
            score += 0.25
        if detected_concept_codes:
            overlap = set(detected_concept_codes) & set(problem.get("conceptCodes", []))
            score += 0.15 * len(overlap)
        if score > 0:
            ranked.append((score, problem))

    ranked.sort(key=lambda item: item[0], reverse=True)
    matched_problem = ranked[0][1] if ranked and ranked[0][0] >= 0.35 else None
    similar_problems = [p for _, p in ranked[:5]]

    concept_codes: list[str] = []
    if matched_problem:
        concept_codes.extend(matched_problem.get("conceptCodes", []))
    for code in detected.get("conceptCodes", []) or []:
        concept_codes.append(code)

    if not concept_codes and detected_topic_code in topic_by_code:
        concept_codes.extend(topic_by_code[detected_topic_code].get("conceptCodes", []))

    if not concept_codes:
        chapter_text = f"{detected.get('chapter', '')} {detected.get('topic', '')}"
        for concept in concept_by_code.values():
            if class_level and concept.get("classLevel") != class_level:
                continue
            if _score(chapter_text, f"{concept.get('name', '')} {concept.get('description', '')}") >= 0.2:
                concept_codes.append(concept["conceptCode"])

    seen: set[str] = set()
    concepts = []
    for code in concept_codes:
        if code in seen or code not in concept_by_code:
            continue
        seen.add(code)
        concepts.append(concept_by_code[code])

    chapter = None
    topic = None
    chapter_code = matched_problem.get("chapterCode") if matched_problem else detected_chapter_code
    topic_code = matched_problem.get("topicCode") if matched_problem else detected_topic_code
    if chapter_code:
        chapter = chapter_by_code.get(chapter_code)
    if topic_code:
        topic = topic_by_code.get(topic_code)

    return {
        "matchedProblem": matched_problem,
        "similarProblems": similar_problems,
        "chapter": chapter,
        "topic": topic,
        "concepts": concepts,
        "source": "ncert-json",
    }
