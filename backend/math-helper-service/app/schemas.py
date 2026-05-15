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


class ChapterTestRequest(BaseModel):
    userId: Optional[str] = None
    classLevel: int = Field(ge=7, le=12)
    chapterCode: Optional[str] = None
    chapter: Optional[str] = None
    questionCount: Optional[int] = Field(default=None, ge=1, le=30)


class WeeklyAssessmentRequest(BaseModel):
    userId: Optional[str] = None
    classLevel: Optional[int] = Field(default=None, ge=7, le=12)
    questionCount: Optional[int] = Field(default=None, ge=1, le=40)


class AssessmentQuestion(BaseModel):
    questionId: str
    source: str
    classLevel: int
    chapterCode: Optional[str] = None
    topicCode: Optional[str] = None
    conceptCodes: List[str] = []
    difficultyLevel: int = Field(ge=1, le=5)
    estimatedTimeSec: int = 60
    questionType: str = "FREE_RESPONSE"
    body: str
    answer: Optional[str] = None
    hints: List[str] = []
    solution: Optional[dict] = None
    adaptiveReason: Optional[str] = None


class AssessmentResponse(BaseModel):
    assessmentType: str
    title: str
    classLevel: Optional[int] = None
    chapterCode: Optional[str] = None
    durationMinutes: int
    questionCount: int
    adaptiveBasis: dict
    revisionFocus: List[str]
    questions: List[AssessmentQuestion]
