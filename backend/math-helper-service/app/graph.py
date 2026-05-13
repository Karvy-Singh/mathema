from typing import TypedDict, Optional, List, Dict, Any
from langgraph.graph import StateGraph, START, END
from schemas import SolveRequest
from nodes import classify, retrieve_curriculum, solve, verify, format_response


class MathState(TypedDict, total=False):
    classLevel: Optional[int]
    question: str
    studentAnswer: Optional[str]
    detected: Dict[str, Any]
    curriculumContext: List[Dict[str, Any]]
    solutionDraft: Dict[str, Any]
    verification: Dict[str, Any]
    finalResponse: Dict[str, Any]


builder = StateGraph(MathState)

builder.add_node("classify", classify)
builder.add_node("retrieve_curriculum", retrieve_curriculum)
builder.add_node("solve", solve)
builder.add_node("verify", verify)
builder.add_node("format_response", format_response)

builder.add_edge(START, "classify")
builder.add_edge("classify", "retrieve_curriculum")
builder.add_edge("retrieve_curriculum", "solve")
builder.add_edge("solve", "verify")
builder.add_edge("verify", "format_response")
builder.add_edge("format_response", END)

graph = builder.compile()


async def solve_math_problem(req: SolveRequest):
    result = await graph.ainvoke(req.model_dump())
    return result["finalResponse"]
