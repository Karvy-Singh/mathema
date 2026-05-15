from pydantic import BaseModel, Field
from typing import Any, Optional

from curriculum_data import load_ncert_data, _score
from llm import structured
from schemas import ChapterTestRequest, WeeklyAssessmentRequest
from student_store import get_student_profile


class GeneratedQuestion(BaseModel):
    body: str
    answer: str
    difficultyLevel: int = Field(ge=1, le=5)
    estimatedTimeSec: int = 60
    conceptCodes: list[str] = []
    hints: list[str] = []
    solution: dict[str, Any]


class GeneratedQuestions(BaseModel):
    questions: list[GeneratedQuestion]


def _blueprint(code: str) -> dict[str, Any]:
    for blueprint in load_ncert_data()["blueprints"].get("blueprints", []):
        if blueprint.get("blueprintCode") == code:
            return blueprint
    raise ValueError(f"Missing assessment blueprint: {code}")


def _chapter_by_request(req: ChapterTestRequest) -> dict[str, Any] | None:
    data = load_ncert_data()
    chapters = data["chapterByCode"].values()
    if req.chapterCode:
        return data["chapterByCode"].get(req.chapterCode)
    if req.chapter:
        ranked = [
            (_score(req.chapter, f"{chapter.get('titleEn', '')} {chapter.get('unitName', '')}"), chapter)
            for chapter in chapters
            if chapter.get("classLevel") == req.classLevel
        ]
        ranked.sort(key=lambda item: item[0], reverse=True)
        if ranked and ranked[0][0] > 0:
            return ranked[0][1]
    return None


def _concept_name(code: str) -> str:
    concept = load_ncert_data()["conceptByCode"].get(code)
    return concept.get("name") if concept else code


def _problem_to_question(problem: dict[str, Any], reason: str) -> dict[str, Any]:
    return {
        "questionId": problem.get("problemKey"),
        "source": problem.get("source", "NCERT"),
        "classLevel": problem.get("classLevel"),
        "chapterCode": problem.get("chapterCode"),
        "topicCode": problem.get("topicCode"),
        "conceptCodes": problem.get("conceptCodes", []),
        "difficultyLevel": problem.get("difficultyLevel", 2),
        "estimatedTimeSec": problem.get("estimatedTimeSec", 60),
        "questionType": problem.get("questionType", "FREE_RESPONSE"),
        "body": problem.get("body"),
        "answer": problem.get("answer"),
        "hints": problem.get("hints", []),
        "solution": problem.get("solution"),
        "adaptiveReason": reason,
    }


def _target_difficulties(distribution: dict[str, int], count: int) -> list[int]:
    targets: list[int] = []
    for level, level_count in distribution.items():
        targets.extend([int(level)] * int(level_count))
    while len(targets) < count:
        targets.append(3)
    return targets[:count]


def _student_sets(profile: dict[str, Any]) -> tuple[set[str], set[str], set[str]]:
    weak = {c.get("conceptCode") for c in profile.get("weakConcepts", []) if c.get("conceptCode")}
    frequent_units = {u.get("unit") for u in profile.get("frequentUnits", []) if u.get("unit")}
    recent_wrong = set()
    for note in profile.get("recentWrongNotes", []):
        recent_wrong.update(code for code in note.get("conceptCodes", []) if code)
    return weak, frequent_units, recent_wrong


def _rank_problem(problem: dict[str, Any], target_difficulty: int, profile: dict[str, Any], chapter_code: Optional[str] = None) -> tuple[float, str]:
    weak, frequent_units, recent_wrong = _student_sets(profile)
    concepts = set(problem.get("conceptCodes", []))
    score = 1.0 - min(abs(problem.get("difficultyLevel", 3) - target_difficulty), 4) * 0.12
    reasons = []

    if concepts & weak:
        score += 0.55
        reasons.append("targets weak concepts")
    if concepts & recent_wrong:
        score += 0.35
        reasons.append("revisits recent mistakes")
    if problem.get("chapterCode") in frequent_units:
        score += 0.2
        reasons.append("balances frequently studied units")
    if chapter_code and problem.get("chapterCode") == chapter_code:
        score += 0.25
        reasons.append("matches selected chapter")

    return score, ", ".join(reasons) or "matches blueprint difficulty"


def _select_questions(candidates: list[dict[str, Any]], count: int, difficulties: list[int], profile: dict[str, Any], chapter_code: Optional[str] = None) -> list[dict[str, Any]]:
    selected: list[dict[str, Any]] = []
    used: set[str] = set()

    for target in difficulties:
        ranked = []
        for problem in candidates:
            key = problem.get("problemKey")
            if key in used:
                continue
            score, reason = _rank_problem(problem, target, profile, chapter_code)
            ranked.append((score, reason, problem))
        ranked.sort(key=lambda item: item[0], reverse=True)
        if not ranked:
            break
        _, reason, problem = ranked[0]
        used.add(problem.get("problemKey"))
        selected.append(_problem_to_question(problem, reason))
        if len(selected) == count:
            break

    return selected


async def _generate_fill_questions(
    assessment_type: str,
    class_level: int,
    count: int,
    concept_codes: list[str],
    chapter: Optional[dict[str, Any]],
    profile: dict[str, Any],
) -> list[dict[str, Any]]:
    if count <= 0:
        return []

    concept_names = [f"{code}: {_concept_name(code)}" for code in concept_codes]
    prompt = f"""
Generate {count} original NCERT/CBSE-style maths questions for a Class {class_level} student.

Return JSON only:
{{
  "questions": [
    {{
      "body": "question text",
      "answer": "final answer",
      "difficultyLevel": 2,
      "estimatedTimeSec": 90,
      "conceptCodes": ["concept code"],
      "hints": ["hint 1"],
      "solution": {{"finalAnswer": "answer", "steps": ["step 1"], "explanation": "short explanation"}}
    }}
  ]
}}

Assessment type: {assessment_type}
Chapter: {chapter}
Allowed concept codes and names: {concept_names}
Student profile for adaptation: {profile}

Use only the provided concept codes. Keep answers concise and include a clear solution object.
"""
    generated = await structured(prompt, GeneratedQuestions)
    questions = []
    for index, question in enumerate(generated.questions[:count], start=1):
        data = question.model_dump()
        questions.append({
            "questionId": f"AI-{assessment_type}-{index}",
            "source": "AI_GENERATED",
            "classLevel": class_level,
            "chapterCode": chapter.get("chapterCode") if chapter else None,
            "topicCode": None,
            "conceptCodes": data.get("conceptCodes", []),
            "difficultyLevel": data.get("difficultyLevel", 3),
            "estimatedTimeSec": data.get("estimatedTimeSec", 60),
            "questionType": "FREE_RESPONSE",
            "body": data.get("body"),
            "answer": data.get("answer"),
            "hints": data.get("hints", []),
            "solution": data.get("solution"),
            "adaptiveReason": "generated to complete the adaptive blueprint",
        })
    return questions


def _revision_focus(questions: list[dict[str, Any]], profile: dict[str, Any]) -> list[str]:
    weak, _, recent_wrong = _student_sets(profile)
    ordered: list[str] = []
    for code in [*weak, *recent_wrong]:
        if code and code not in ordered:
            ordered.append(code)
    for question in questions:
        for code in question.get("conceptCodes", []):
            if code and code not in ordered:
                ordered.append(code)
    return ordered[:6]


async def generate_chapter_test(req: ChapterTestRequest) -> dict[str, Any]:
    data = load_ncert_data()
    blueprint = _blueprint("CHAPTER_TEST_DEFAULT")
    profile = get_student_profile(req.userId)
    chapter = _chapter_by_request(req)
    if not chapter:
        raise ValueError("chapterCode or chapter must match a known NCERT chapter for the selected classLevel")

    question_count = req.questionCount or blueprint.get("questionCount", 10)
    chapter_code = chapter.get("chapterCode")
    candidates = [
        problem for problem in data["problems"].get("problems", [])
        if problem.get("classLevel") == req.classLevel and problem.get("chapterCode") == chapter_code
    ]
    difficulties = _target_difficulties(blueprint.get("difficultyDistribution", {}), question_count)
    selected = _select_questions(candidates, question_count, difficulties, profile, chapter_code)

    concept_codes = []
    for topic in chapter.get("topics", []):
        concept_codes.extend(topic.get("conceptCodes", []))
    selected.extend(await _generate_fill_questions(
        "CHAPTER_TEST",
        req.classLevel,
        question_count - len(selected),
        concept_codes,
        chapter,
        profile,
    ))

    return {
        "assessmentType": "CHAPTER_TEST",
        "title": f"{chapter.get('titleEn', chapter_code)} Adaptive Chapter Test",
        "classLevel": req.classLevel,
        "chapterCode": chapter_code,
        "durationMinutes": blueprint.get("durationMinutes", 20),
        "questionCount": len(selected),
        "adaptiveBasis": {
            "blueprintCode": blueprint.get("blueprintCode"),
            "weakConcepts": profile.get("weakConcepts", []),
            "frequentUnits": profile.get("frequentUnits", []),
            "selectionPolicy": blueprint.get("selectionPolicy", {}),
        },
        "revisionFocus": _revision_focus(selected, profile),
        "questions": selected,
    }


async def generate_weekly_assessment(req: WeeklyAssessmentRequest) -> dict[str, Any]:
    data = load_ncert_data()
    blueprint = _blueprint("WEEKLY_ADAPTIVE_DEFAULT")
    profile = get_student_profile(req.userId)
    question_count = req.questionCount or blueprint.get("questionCount", 15)
    weak, frequent_units, recent_wrong = _student_sets(profile)

    candidates = []
    for problem in data["problems"].get("problems", []):
        if req.classLevel and problem.get("classLevel") != req.classLevel:
            continue
        if weak or frequent_units or recent_wrong:
            concepts = set(problem.get("conceptCodes", []))
            if not (concepts & weak or concepts & recent_wrong or problem.get("chapterCode") in frequent_units):
                continue
        candidates.append(problem)

    if not candidates:
        candidates = [
            problem for problem in data["problems"].get("problems", [])
            if not req.classLevel or problem.get("classLevel") == req.classLevel
        ]

    class_level = req.classLevel or (candidates[0].get("classLevel") if candidates else 7)
    difficulties = _target_difficulties(blueprint.get("difficultyDistribution", {}), question_count)
    selected = _select_questions(candidates, question_count, difficulties, profile)
    concept_codes = list(weak or recent_wrong)
    if not concept_codes:
        for problem in candidates:
            concept_codes.extend(problem.get("conceptCodes", []))
    selected.extend(await _generate_fill_questions(
        "WEEKLY_ADAPTIVE",
        class_level,
        question_count - len(selected),
        list(dict.fromkeys(concept_codes))[:10],
        None,
        profile,
    ))

    return {
        "assessmentType": "WEEKLY_ADAPTIVE",
        "title": "Weekly AI Adaptive Assessment",
        "classLevel": class_level,
        "chapterCode": None,
        "durationMinutes": blueprint.get("durationMinutes", 30),
        "questionCount": len(selected),
        "adaptiveBasis": {
            "blueprintCode": blueprint.get("blueprintCode"),
            "weakConcepts": profile.get("weakConcepts", []),
            "frequentUnits": profile.get("frequentUnits", []),
            "recentWrongNotes": profile.get("recentWrongNotes", []),
            "selectionPolicy": blueprint.get("selectionPolicy", {}),
        },
        "revisionFocus": _revision_focus(selected, profile),
        "questions": selected,
    }
