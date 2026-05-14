from pydantic import BaseModel, Field
from typing import Optional, List


class SolveRequest(BaseModel):
    userId: Optional[str] = None
    classLevel: Optional[int] = Field(default=None, ge=7, le=12)
    question: str = Field(min_length=3, max_length=4000)
    studentAnswer: Optional[str] = None


class Detected(BaseModel):
    classLevel: int
    chapter: str
    topic: str
    chapterCode: Optional[str] = None
    topicCode: Optional[str] = None
    concepts: List[str] = []
    conceptCodes: List[str] = []


class Verification(BaseModel):
    isVerified: bool
    method: str
    issues: List[str] = []
    confidence: float
    verifiedAnswer: Optional[str] = None
    attempts: int = 1
    caution: Optional[str] = None


class SolveResponse(BaseModel):
    detected: Detected
    answer: str
    isStudentCorrect: Optional[bool] = None
    explanation: str
    personalizedLearning: Optional[str] = None
    mistakeDiagnosis: Optional[str] = None
    hints: List[str]
    nextPractice: List[str]
    verification: Verification
