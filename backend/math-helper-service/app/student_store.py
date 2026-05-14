import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


APP_DIR = Path(__file__).resolve().parent
STORAGE_DIR = APP_DIR / "storage"
STORE_PATH = STORAGE_DIR / "student_learning.json"


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _empty_store() -> dict[str, Any]:
    return {"students": {}}


def _read_store() -> dict[str, Any]:
    if not STORE_PATH.exists():
        return _empty_store()
    with STORE_PATH.open("r", encoding="utf-8") as f:
        return json.load(f)


def _write_store(store: dict[str, Any]) -> None:
    STORAGE_DIR.mkdir(parents=True, exist_ok=True)
    tmp_path = STORE_PATH.with_suffix(".tmp")
    with tmp_path.open("w", encoding="utf-8") as f:
        json.dump(store, f, ensure_ascii=False, indent=2)
    tmp_path.replace(STORE_PATH)


def get_student_profile(user_id: str | None) -> dict[str, Any]:
    if not user_id:
        return {"weakConcepts": [], "frequentUnits": [], "recentWrongNotes": []}

    store = _read_store()
    student = store.get("students", {}).get(user_id, {})
    concepts = student.get("conceptMastery", {})
    units = student.get("unitStats", {})

    weak_concepts = sorted(
        [
            {"conceptCode": code, **stats}
            for code, stats in concepts.items()
            if stats.get("attempts", 0) > 0 and stats.get("masteryScore", 0) < 70
        ],
        key=lambda item: (item.get("masteryScore", 0), -item.get("wrong", 0)),
    )[:5]

    frequent_units = sorted(
        [{"unit": unit, **stats} for unit, stats in units.items()],
        key=lambda item: item.get("attempts", 0),
        reverse=True,
    )[:5]

    recent_wrong = student.get("wrongNotes", [])[-5:]

    return {
        "weakConcepts": weak_concepts,
        "frequentUnits": frequent_units,
        "recentWrongNotes": recent_wrong,
    }


def record_attempt(state: dict[str, Any]) -> dict[str, Any]:
    user_id = state.get("userId")
    student_answer = state.get("studentAnswer")
    final_response = state.get("finalResponse", {})
    if not user_id or student_answer is None or final_response.get("isStudentCorrect") is None:
        return {}

    store = _read_store()
    students = store.setdefault("students", {})
    student = students.setdefault(
        user_id,
        {"conceptMastery": {}, "unitStats": {}, "wrongNotes": []},
    )

    is_correct = bool(final_response.get("isStudentCorrect"))
    context = state.get("curriculumContext", {})
    concepts = context.get("concepts", []) or []
    chapter = context.get("chapter") or {}
    chapter_code = chapter.get("chapterCode") or state.get("detected", {}).get("chapter") or "UNKNOWN"
    now = _now()

    unit_stats = student.setdefault("unitStats", {}).setdefault(
        chapter_code,
        {"attempts": 0, "correct": 0, "wrong": 0, "lastStudiedAt": None},
    )
    unit_stats["attempts"] += 1
    unit_stats["correct" if is_correct else "wrong"] += 1
    unit_stats["lastStudiedAt"] = now

    for concept in concepts:
        code = concept.get("conceptCode")
        if not code:
            continue
        stats = student.setdefault("conceptMastery", {}).setdefault(
            code,
            {"attempts": 0, "correct": 0, "wrong": 0, "masteryScore": 50, "lastAttemptAt": None},
        )
        stats["attempts"] += 1
        stats["correct" if is_correct else "wrong"] += 1
        stats["lastAttemptAt"] = now
        stats["masteryScore"] = round((stats["correct"] / stats["attempts"]) * 100, 2)

    if not is_correct:
        student.setdefault("wrongNotes", []).append(
            {
                "createdAt": now,
                "question": state.get("question"),
                "studentAnswer": student_answer,
                "correctAnswer": final_response.get("answer"),
                "mistakeDiagnosis": final_response.get("mistakeDiagnosis"),
                "chapterCode": chapter_code,
                "conceptCodes": [c.get("conceptCode") for c in concepts if c.get("conceptCode")],
            }
        )

    _write_store(store)
    return {"studentProfile": get_student_profile(user_id)}
