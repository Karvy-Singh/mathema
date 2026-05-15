from fastapi import FastAPI, HTTPException
from dotenv import load_dotenv
from schemas import ChapterTestRequest, WeeklyAssessmentRequest, AssessmentResponse, SolveRequest, SolveResponse
from graph import solve_math_problem
from assessment_generator import generate_chapter_test, generate_weekly_assessment

load_dotenv()

app = FastAPI(title="Mathema Math Helper")


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/solve", response_model=SolveResponse)
async def solve(req: SolveRequest):
    return await solve_math_problem(req)


@app.post("/assessments/chapter-test", response_model=AssessmentResponse)
async def chapter_test(req: ChapterTestRequest):
    try:
        return await generate_chapter_test(req)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@app.post("/assessments/weekly", response_model=AssessmentResponse)
async def weekly_assessment(req: WeeklyAssessmentRequest):
    return await generate_weekly_assessment(req)
