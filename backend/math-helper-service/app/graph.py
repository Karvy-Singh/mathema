from typing import TypedDict, Optional, Dict, Any
from langgraph.graph import StateGraph, START, END
from schemas import SolveRequest
from nodes import (
    classify,
    retrieve_curriculum,
    retrieve_student_profile,
    should_personalize,
    personalize_learning,
    solve,
    retry_solve,
    verify,
    should_retry_or_format,
    format_response,
    record_learning,
)


class MathState(TypedDict, total=False):
    classLevel: Optional[int]
    userId: Optional[str]
    question: str
    studentAnswer: Optional[str]
    detected: Dict[str, Any]
    curriculumContext: Dict[str, Any]
    studentProfile: Dict[str, Any]
    personalizedContext: Dict[str, Any]
    solutionDraft: Dict[str, Any]
    verification: Dict[str, Any]
    retryCount: int
    finalResponse: Dict[str, Any]


builder = StateGraph(MathState)

builder.add_node("classify", classify)
builder.add_node("retrieve_curriculum", retrieve_curriculum)
builder.add_node("retrieve_student_profile", retrieve_student_profile)
builder.add_node("personalize_learning", personalize_learning)
builder.add_node("solve", solve)
builder.add_node("retry_solve", retry_solve)
builder.add_node("verify", verify)
builder.add_node("format_response", format_response)
builder.add_node("record_learning", record_learning)

builder.add_edge(START, "classify")
builder.add_edge("classify", "retrieve_curriculum")
builder.add_edge("retrieve_curriculum", "retrieve_student_profile")
builder.add_conditional_edges("retrieve_student_profile", should_personalize)
builder.add_edge("personalize_learning", "solve")
builder.add_edge("solve", "verify")
builder.add_conditional_edges("verify", should_retry_or_format)
builder.add_edge("retry_solve", "verify")
builder.add_edge("format_response", "record_learning")
builder.add_edge("record_learning", END)

graph = builder.compile()


async def solve_math_problem(req: SolveRequest):
    result = await graph.ainvoke(req.model_dump())
    return result["finalResponse"]
