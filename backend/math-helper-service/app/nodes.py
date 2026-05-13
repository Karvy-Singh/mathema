from pydantic import BaseModel
from typing import List
from llm import structured
from deterministic_check import deterministic_check, normalize


class Classification(BaseModel):
    classLevel: int
    chapter: str
    topic: str
    concepts: List[str]


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
{{
  "classLevel": 9,
  "chapter": "Polynomials",
  "topic": "Remainder Theorem",
  "concepts": ["Polynomial substitution", "Remainder theorem"]
}}

Given classLevel: {state.get("classLevel")}
Question: {state["question"]}
"""
    result = await structured(prompt, Classification)

    if state.get("classLevel"):
        result.classLevel = state["classLevel"]

    return {"detected": result.model_dump()}


async def retrieve_curriculum(state):
    # First version: no DB. Use detected concepts as context.
    detected = state["detected"]
    return {
        "curriculumContext": [
            {
                "classLevel": detected["classLevel"],
                "chapter": detected["chapter"],
                "topic": detected["topic"],
                "concept": c,
            }
            for c in detected.get("concepts", [])
        ]
    }


async def solve(state):
    detected = state["detected"]

    prompt = f"""
Solve this maths problem for a Class {detected["classLevel"]} student.

Return JSON only:
{{
  "answer": "-3",
  "steps": ["step 1", "step 2"],
  "explanation": "student-friendly explanation"
}}

Chapter: {detected["chapter"]}
Topic: {detected["topic"]}
Concepts: {detected["concepts"]}

Question:
{state["question"]}
"""
    result = await structured(prompt, SolutionDraft)
    return {"solutionDraft": result.model_dump()}


async def verify(state):
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
            }
        }

    prompt = f"""
Verify this solution independently.

Return JSON only:
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
        }
    }


async def format_response(state):
    detected = state["detected"]
    draft = state["solutionDraft"]
    verification = state["verification"]

    answer = verification.get("verifiedAnswer") or draft["answer"]

    student_answer = state.get("studentAnswer")
    is_correct = None
    if student_answer:
        is_correct = normalize(student_answer) == normalize(answer)

    mistake = None
    if student_answer and not is_correct:
        mistake = "Your answer does not match the verified answer. Recheck the substitution or simplification step."
    elif student_answer and is_correct:
        mistake = "Your answer matches the verified answer."

    return {
        "finalResponse": {
            "detected": detected,
            "answer": answer,
            "isStudentCorrect": is_correct,
            "explanation": draft["explanation"],
            "mistakeDiagnosis": mistake,
            "hints": [
                f"Identify the topic: {detected['topic']}.",
                (
                    draft["steps"][0]
                    if draft["steps"]
                    else "Start by writing the known values."
                ),
            ],
            "nextPractice": detected.get("concepts", [])[:3],
            "verification": verification,
        }
    }
