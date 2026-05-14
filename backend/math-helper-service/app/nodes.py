from pydantic import BaseModel
from typing import List
from llm import structured
from deterministic_check import deterministic_check, normalize
from curriculum_data import retrieve_context
from student_store import get_student_profile, record_attempt


class Classification(BaseModel):
    classLevel: int
    chapter: str
    topic: str
    chapterCode: str | None = None
    topicCode: str | None = None
    concepts: List[str]
    conceptCodes: List[str] = []


class SolutionDraft(BaseModel):
    answer: str
    steps: List[str]
    explanation: str


class AiVerification(BaseModel):
    isVerified: bool
    issues: List[str]
    confidence: float
    correctedAnswer: str | None = None


async def classify(state):
    prompt = f"""
Classify this India NCERT/CBSE Class 7-12 maths question.

Return JSON only:
Example format:
{{
  "classLevel": 9,
  "chapter": "Polynomials",
  "topic": "Remainder Theorem",
  "chapterCode": "NCERT-MATH-9-POLYNOMIALS",
  "topicCode": "NCERT-MATH-9-POLYNOMIALS-REMAINDER-THEOREM",
  "concepts": ["Polynomial substitution", "Remainder theorem"],
  "conceptCodes": ["NCERT-MATH-9-POLYNOMIAL-EVALUATION", "NCERT-MATH-9-REMAINDER-THEOREM"]
}}

If you are not confident about a code, return null for that code instead of inventing it.

Given classLevel: {state.get("classLevel")}
Question: {state["question"]}
"""
    result = await structured(prompt, Classification)

    if state.get("classLevel"):
        result.classLevel = state["classLevel"]

    return {"detected": result.model_dump()}


async def retrieve_curriculum(state):
    detected = state["detected"]
    context = retrieve_context(
        question=state["question"],
        class_level=detected.get("classLevel"),
        detected=detected,
    )
    return {"curriculumContext": context}


async def retrieve_student_profile(state):
    return {"studentProfile": get_student_profile(state.get("userId"))}


def should_personalize(state):
    profile = state.get("studentProfile", {})
    if profile.get("weakConcepts") or profile.get("frequentUnits") or profile.get("recentWrongNotes"):
        return "personalize_learning"
    return "solve"


async def personalize_learning(state):
    profile = state.get("studentProfile", {})
    context = state.get("curriculumContext", {})
    current_codes = {c.get("conceptCode") for c in context.get("concepts", []) if c.get("conceptCode")}
    weak_matches = [
        c for c in profile.get("weakConcepts", [])
        if c.get("conceptCode") in current_codes
    ]
    weak_source = weak_matches or profile.get("weakConcepts", [])[:2]
    frequent_units = profile.get("frequentUnits", [])[:2]
    recent_wrong = profile.get("recentWrongNotes", [])[-2:]

    focus_parts = []
    if weak_source:
        labels = [c.get("conceptCode") for c in weak_source if c.get("conceptCode")]
        focus_parts.append(f"Reinforce weak concepts: {', '.join(labels)}")
    if frequent_units:
        labels = [u.get("unit") for u in frequent_units if u.get("unit")]
        focus_parts.append(f"Connect with frequently studied units: {', '.join(labels)}")
    if recent_wrong:
        focus_parts.append("Use extra care around mistakes similar to the student's recent wrong notes.")

    return {
        "personalizedContext": {
            "hasProfile": True,
            "weakConcepts": weak_source,
            "frequentUnits": frequent_units,
            "recentWrongNotes": recent_wrong,
            "teachingFocus": " ".join(focus_parts),
        }
    }


async def solve(state):
    detected = state["detected"]
    context = state.get("curriculumContext", {})
    student_profile = state.get("studentProfile", {})
    personalized_context = state.get("personalizedContext", {})
    matched_problem = context.get("matchedProblem")

    if matched_problem and matched_problem.get("solution") and not personalized_context.get("hasProfile"):
        solution = matched_problem["solution"]
        return {
            "solutionDraft": {
                "answer": solution.get("finalAnswer") or matched_problem.get("answer"),
                "steps": solution.get("steps", []),
                "explanation": solution.get("explanation", ""),
            }
        }

    prompt = f"""
Solve this maths problem for a Class {detected["classLevel"]} student.

Return JSON only:
Example format:
{{
  "answer": "-3",
  "steps": ["step 1", "step 2"],
  "explanation": "student-friendly explanation"
}}

Chapter: {detected["chapter"]}
Topic: {detected["topic"]}
Concepts: {detected["concepts"]}

Curriculum context:
{context}

Student weak/frequent learning context:
{student_profile}

Personalized teaching focus:
{personalized_context}

Adapt the explanation to the personalized teaching focus when present. If the student has weak concepts, rebuild that prerequisite before solving. If the student often studies related units, connect the current method to those units without distracting from the solution.

Question:
{state["question"]}
"""
    result = await structured(prompt, SolutionDraft)
    return {"solutionDraft": result.model_dump()}


async def retry_solve(state):
    detected = state["detected"]
    context = state.get("curriculumContext", {})
    personalized_context = state.get("personalizedContext", {})
    previous = state.get("solutionDraft", {})
    verification = state.get("verification", {})

    prompt = f"""
Re-solve this maths problem for a Class {detected["classLevel"]} student because verification found issues.

Return JSON only:
Example format:
{{
  "answer": "-3",
  "steps": ["step 1", "step 2"],
  "explanation": "student-friendly explanation"
}}

Do not copy the previous answer unless it is actually correct. Recompute from the original question.

Chapter: {detected["chapter"]}
Topic: {detected["topic"]}
Concepts: {detected["concepts"]}

Curriculum context:
{context}

Personalized teaching focus:
{personalized_context}

Previous draft:
{previous}

Verification issues:
{verification.get("issues", [])}

Question:
{state["question"]}
"""
    result = await structured(prompt, SolutionDraft)
    return {"solutionDraft": result.model_dump(), "retryCount": state.get("retryCount", 0) + 1}


async def verify(state):
    attempts = state.get("retryCount", 0) + 1
    matched_problem = state.get("curriculumContext", {}).get("matchedProblem")
    if matched_problem and matched_problem.get("answer"):
        draft_answer = state["solutionDraft"]["answer"]
        verified_answer = matched_problem["answer"]
        same = normalize(draft_answer) == normalize(verified_answer)
        return {
            "verification": {
                "isVerified": same,
                "method": "ncert-json",
                "issues": (
                    []
                    if same
                    else [
                        f"Draft answer {draft_answer} did not match stored answer {verified_answer}"
                    ]
                ),
                "confidence": 1.0,
                "verifiedAnswer": verified_answer,
                "attempts": attempts,
            }
        }

    deterministic = deterministic_check(state["question"])

    if deterministic:
        draft_answer = state["solutionDraft"]["answer"]
        verified_answer = deterministic["answer"]
        same = normalize(draft_answer) == normalize(verified_answer)

        return {
            "verification": {
                "isVerified": same,
                "method": "deterministic",
                "issues": (
                    []
                    if same
                    else [
                        f"Draft answer {draft_answer} did not match verified answer {verified_answer}"
                    ]
                ),
                "confidence": deterministic["confidence"],
                "verifiedAnswer": verified_answer,
                "attempts": attempts,
            }
        }

    prompt = f"""
Verify this solution independently.

Return JSON only:
Example format:
{{
  "isVerified": true,
  "issues": [],
  "confidence": 0.9,
  "correctedAnswer": null
}}

Question:
{state["question"]}

Draft:
{state["solutionDraft"]}
"""
    result = await structured(prompt, AiVerification)

    return {
        "verification": {
            "isVerified": result.isVerified,
            "method": "ai",
            "issues": result.issues,
            "confidence": result.confidence,
            "verifiedAnswer": result.correctedAnswer,
            "attempts": attempts,
        }
    }


def should_retry_or_format(state):
    verification = state.get("verification", {})
    if not verification.get("isVerified") and state.get("retryCount", 0) < 1:
        return "retry_solve"
    return "format_response"


async def format_response(state):
    detected = state["detected"]
    draft = state["solutionDraft"]
    verification = state["verification"]

    answer = verification.get("verifiedAnswer") or draft["answer"]
    if not verification.get("isVerified"):
        verification = {
            **verification,
            "caution": "I could not verify the answer confidently after retrying. Review the method before relying on the final answer.",
        }

    student_answer = state.get("studentAnswer")
    is_correct = None
    if student_answer:
        is_correct = normalize(student_answer) == normalize(answer)

    mistake = None
    if student_answer and not is_correct:
        mistake = _mistake_diagnosis(state)
    elif student_answer and is_correct:
        mistake = "Your answer matches the verified answer."

    context = state.get("curriculumContext", {})
    matched_problem = context.get("matchedProblem") or {}
    stored_hints = matched_problem.get("hints", [])

    return {
        "finalResponse": {
            "detected": detected,
            "answer": answer,
            "isStudentCorrect": is_correct,
            "explanation": draft["explanation"],
            "personalizedLearning": _personalized_learning_summary(state),
            "mistakeDiagnosis": mistake,
            "hints": [
                *stored_hints[:2],
                f"Identify the topic: {detected['topic']}.",
                (
                    draft["steps"][0]
                    if draft["steps"]
                    else "Start by writing the known values."
                ),
            ][:4],
            "nextPractice": _next_practice(state),
            "verification": verification,
        }
    }


def _mistake_diagnosis(state):
    context = state.get("curriculumContext", {})
    matched_problem = context.get("matchedProblem") or {}
    concepts = context.get("concepts", []) or []
    distractors = matched_problem.get("distractors", []) or []
    student_answer = normalize(state.get("studentAnswer"))

    for distractor in distractors:
        if normalize(distractor.get("answer")) == student_answer:
            return f"Likely issue: {distractor.get('reason')}"

    for concept in concepts:
        misconceptions = concept.get("commonMisconceptions", []) or []
        if misconceptions:
            m = misconceptions[0]
            return f"Likely concept gap: {m.get('wrongIdea')} Correction: {m.get('correction')}"

    return "Your answer does not match the verified answer. Recheck the concept and each simplification step."


def _next_practice(state):
    profile = state.get("studentProfile", {})
    weak = [
        c.get("conceptCode")
        for c in profile.get("weakConcepts", [])
        if c.get("conceptCode")
    ]
    context = state.get("curriculumContext", {})
    current = [
        c.get("conceptCode") or c.get("name") for c in context.get("concepts", [])
    ]
    detected = state.get("detected", {})
    fallback = detected.get("concepts", [])

    result = []
    for item in [*weak, *current, *fallback]:
        if item and item not in result:
            result.append(item)
    return result[:5]


def _personalized_learning_summary(state):
    context = state.get("personalizedContext", {})
    if not context.get("hasProfile"):
        return None

    focus = context.get("teachingFocus")
    if focus:
        return focus

    weak = [c.get("conceptCode") for c in context.get("weakConcepts", []) if c.get("conceptCode")]
    frequent = [u.get("unit") for u in context.get("frequentUnits", []) if u.get("unit")]
    parts = []
    if weak:
        parts.append(f"Practice this with weak concepts: {', '.join(weak)}")
    if frequent:
        parts.append(f"Connect it with units you study often: {', '.join(frequent)}")
    return " ".join(parts) if parts else None


async def record_learning(state):
    return record_attempt(state)
