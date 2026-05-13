from fastapi import FastAPI
from dotenv import load_dotenv
from schemas import SolveRequest, SolveResponse
from graph import solve_math_problem

load_dotenv()

app = FastAPI(title="Mathema Math Helper")


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/solve", response_model=SolveResponse)
async def solve(req: SolveRequest):
    return await solve_math_problem(req)
