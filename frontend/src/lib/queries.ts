import { get } from './api';

export type DashboardSummary = {
  todayMinutes: number; todayGoalMinutes: number;
  streakDays: number; weeklyAccuracy: number; weeklyAccuracyDelta: number;
  /** 모의고사 응시 없으면 null — UI 가 "—" 로 표시. */
  expectedGrade: number | null; expectedGradeFrom: number | null;
};
export type Mastery = { subject: string; value: number; unitId: string };
export type RecommendCard = {
  tag: string; tagColor: string; unit: string; title: string;
  reason: string; time: string; type: string; icon: string;
  unitId: string | null;
};
export type WrongNoteCard = {
  id: string; problemId: string;
  problem: string;
  /** 실제 문제 본문 — 어떤 문제였는지 카드/모달에서 즉시 확인 */
  problemBody?: string;
  /** 정답 — 상세 모달에서 노출 */
  problemAnswer?: string;
  /** 핵심 개념 — 상세 모달의 정답 ↔ AI 분석 사이에 표시 */
  problemConcept?: string | null;
  /** 관련 공식 — 개념 박스의 공식 라인 */
  problemFormula?: string | null;
  unit: string; subUnit: string;
  errorType: string; errorTypeRaw: string; insight: string;
  diff: string; date: string; similarCount: number; status: string;
  // SM-2
  easinessFactor: number; repetitionCount: number; intervalDays: number;
  nextReviewAt: string | null; dueIn: string | null; isDue: boolean;
  lapseCount: number;
};
export type WrongNotesStats = {
  total: number; analyzed: number; mastered: number;
  masteredPct: number; retryAccuracy: number;
};
export type ErrorDna = {
  distribution: Array<{ key: string; name: string; value: number; color: string }>;
  insight: string;
};
export type Pattern = { num: string; title: string; desc: string; count: number };
export type Diagnosis = {
  headline: string;
  weakUnit: string | null;
  /** 데이터 없으면 null — UI 가 '—' 표시. */
  weakScore: number | null;
  version: string | null;
  /** 데이터 없으면 null. */
  updatedAgo: string | null;
};
export type MentorMessage = { week: string; generatedAt: string; message: string; strength: string; nextGoal: string };
export type Heatmap = Array<{ day: number; intensity: number }>;
export type ActivityStats = { avgMinutesPerDay: number; totalProblems: number; avgAccuracy: number };
export type Trajectory = Array<{ name: string; score: number; grade: number; target: number | null }>;
export type ExamResult = { id: string; name: string; date: string; score: number; grade: number; percentile: number; time: string };
export type MockSummary = {
  lastScore: number | null; expectedGrade: number | null;
  reliability: number | null; pointsToNextGrade: number | null;
  percentile: number | null;
};
export type ReportCurrent = {
  totalHours: number; hoursDelta: number;
  problemsSolved: number; problemsPerDay: number;
  accuracyPct: number; accuracyDelta: number;
  aiScore: number;
  /** 모의고사 응시 없으면 null — UI 가 '—' 로 표시. */
  topPercentile: number | null;
};
export type TimeVsAccuracy = Array<{ week: string; time: number; accuracy: number }>;
export type FocusItem = { unit: string; area: string; priority: string; color: string; impact: string };
export type Achievement = { icon: string; title: string; sub: string; color: string };
export type GradeLevel = 'G_MIDDLE_1' | 'G_MIDDLE_2' | 'G_MIDDLE_3' | 'G_HIGH_1' | 'G_HIGH_2' | 'G_HIGH_3';
export type UserRole = 'STUDENT' | 'PARENT' | 'TEACHER' | 'ADMIN';
export type Me = {
  id: string; name: string; email: string;
  examDate: string; targetGrade: number; dDay: number;
  gradeLevel?: GradeLevel | null;
  role?: UserRole;
  tenantId?: string | null;
};

// fetchers
export const fetchMe = () => get<Me>('/users/me');
export const fetchDashboardSummary = () => get<DashboardSummary>('/dashboard/summary');
export const fetchMastery = () => get<Mastery[]>('/mastery');
export const fetchToday = () => get<RecommendCard[]>('/recommendations/today');
export const fetchRecentMistakes = (limit = 3) => get<WrongNoteCard[]>('/wrong-notes/recent', { limit });
export const fetchWrongNotes = (params?: { unitName?: string; sort?: string }) => get<WrongNoteCard[]>('/wrong-notes', params);
export const fetchWrongNotesStats = () => get<WrongNotesStats>('/wrong-notes/stats');
export const fetchErrorDna = () => get<ErrorDna>('/ai-coach/error-dna');
export const fetchPatterns = () => get<Pattern[]>('/ai-coach/patterns');
export const fetchDiagnosis = () => get<Diagnosis>('/ai-coach/diagnosis');
export const fetchMentorMessage = () => get<MentorMessage>('/ai-coach/mentor-message', { week: 'current' });
export const fetchHeatmap = (weeks = 12) => get<Heatmap>('/activity/heatmap', { weeks });
export const fetchStreak = () => get<{ days: number }>('/activity/streak');
export const fetchActivityStats = () => get<ActivityStats>('/activity/stats');
export const fetchTrajectory = () => get<Trajectory>('/mock-exams/trajectory');
export const fetchExamResults = () => get<ExamResult[]>('/mock-exams/results');
export const fetchMockSummary = () => get<MockSummary>('/mock-exams/summary');
export const fetchReportCurrent = () => get<ReportCurrent>('/reports/weekly/current');
export const fetchTimeVsAccuracy = () => get<TimeVsAccuracy>('/reports/weekly/time-vs-accuracy');
export const fetchNextFocus = () => get<FocusItem[]>('/reports/weekly/next-focus');
export const fetchAchievements = () => get<Achievement[]>('/reports/weekly/achievements');

export type Calibration = {
  brier: number | null;
  attemptCount: number;
  buckets: Array<{
    bucket: string;
    meanConfidence: number | null;
    meanAccuracy: number | null;
    count: number;
  }>;
  insight: string;
  avgGap?: number;
};
export const fetchCalibration = () => get<Calibration>('/reports/calibration');

// ===== Weakness Dashboard / Adaptive Plan (Phase 2~3) =====
export type UnitBalance = {
  unitId: string;
  unitName: string;
  order: number;
  score: number;
  studyTimeMin: number;
  samples: number;
  efficiency: number | null;
};

export type StudyBalanceResult = {
  gini: number;
  balanced: boolean;
  totalStudyMin: number;
  perUnit: UnitBalance[];
  underStudied: UnitBalance[];
  lowEfficiency: UnitBalance[];
  warnings: string[];
};

export type AdaptivePlanTask = {
  task: string;
  unitName: string;
  durationMin: number;
  type: 'concept' | 'practice' | 'review' | 'mock-exam';
  reason: string;
};

export type AdaptivePlan = {
  summary: string;
  totalMinutes: number;
  tasks: AdaptivePlanTask[];
  balanceTip: string;
};

export type AdaptiveResponse =
  | (AdaptivePlan & { fallback?: false })
  | { fallback: true; cards: RecommendCard[] };

export const fetchBalance = () => get<StudyBalanceResult>('/recommendations/balance');
export const fetchAdaptive = (minutes?: number) =>
  get<AdaptiveResponse>('/recommendations/adaptive', minutes ? { minutes } : undefined);

// ===== AI 처방 시스템 (Phase 2~3) =====
export type ConceptMastery = {
  id: string;
  userId: string;
  conceptId: string;
  masteryScore: number;
  trend: 'UP' | 'DOWN' | 'STABLE';
  evidenceCount: number;
  recentAccuracy: number;
  averageResponseTimeSec: number;
  hintUsageRate: number;
  confidenceGap: number;
  lastAttemptAt: string | null;
  updatedBy: 'RULE_BASED' | 'LLM' | 'HYBRID' | 'TEACHER_OVERRIDE';
  concept: { id: string; code: string; name: string; gradeLevel: string | null };
};

export type MasteryEventRow = {
  id: string;
  masteryScore: number;
  delta: number;
  evidenceCount: number;
  createdAt: string;
};

export type ErrorPatternRow = {
  id: string;
  conceptId: string;
  errorCode: 'SIGN' | 'ALG' | 'CON' | 'FORMULA' | 'GRAPH' | 'UNIT' | 'CALC' | 'LOGIC';
  frequency: number;
  recentFrequency: number;
  severity: 'low' | 'medium' | 'high';
  status: 'ACTIVE' | 'IMPROVING' | 'RESOLVED';
  llmSummary: string | null;
  lastDetectedAt: string;
  concept: { id: string; code: string; name: string };
};

export type ReviewScheduleRow = {
  conceptId: string;
  conceptName: string;
  masteryScore: number;
  daysSinceLast: number | null;
  forgettingRisk: number;
  priority: 'high' | 'medium' | 'low';
};

export type NextProblemRec = {
  problemId: string;
  reason: string;
  targetConceptId: string;
  targetErrorCode: string | null;
  expectedDifficulty: number;
  recommendationLogId: string;
};

export type SimilarProblemRec = {
  problemId: string;
  reason: string;
  recommendationLogId: string;
};

/** 명세서 §7 — 5개 미만일 때 shortfallReason 명시. */
export type SimilarProblemResponse = {
  items: SimilarProblemRec[];
  requested: number;
  returned: number;
  shortfallReason?: string;
};

export type WeeklyReportFull = {
  id: string;
  isoWeek: string;
  weekStart: string;
  weekEnd: string | null;
  totalHours: number; problemsSolved: number; accuracyPct: number; aiScore: number;
  totalSessions: number; totalAttempts: number; averageStudyDurationSec: number;
  studentSummary: string | null;
  parentSummary: string | null;
  teacherSummary: string | null;
  topImprovedConcepts: string[];
  weakConcepts: string[];
  repeatedErrorPatterns: string[];
  recommendedNextGoals: string[];
  generatedAt: string;
};
export type WeeklyReportListItem = Pick<WeeklyReportFull,
  'id' | 'isoWeek' | 'weekStart' | 'weekEnd' | 'totalHours' | 'problemsSolved' |
  'accuracyPct' | 'aiScore' | 'totalSessions' | 'totalAttempts' | 'generatedAt'>;

export const fetchConceptMastery   = () => get<ConceptMastery[]>('/mastery/trajectory');
export const fetchConceptHistory   = (conceptId: string, take = 30) =>
  get<MasteryEventRow[]>(`/mastery/trajectory/${conceptId}/history`, { take });
export const fetchActivePatterns   = () => get<ErrorPatternRow[]>('/mastery/error-patterns/active');
export const fetchReviewSchedule   = () => get<ReviewScheduleRow[]>('/recommendations/review-schedule');
export const fetchNextProblem      = (sessionId?: string) =>
  get<NextProblemRec | null>('/recommendations/next-problem', sessionId ? { sessionId } : undefined);
export const fetchSimilarForAttempt = (attemptId: string) =>
  get<SimilarProblemResponse>(`/recommendations/similar/${attemptId}`);
export const fetchWeeklyList       = () => get<WeeklyReportListItem[]>('/reports/weekly');
export const fetchWeeklyById       = (id: string) => get<WeeklyReportFull>(`/reports/weekly/by-id/${id}`);

// ===== Students (Teacher / Parent 권한) =====
export type StudentRow = {
  id: string; name: string; email: string;
  gradeLevel: string | null; schoolLevel: string | null;
  createdAt: string;
};
export const fetchTeacherStudents = () => get<StudentRow[]>('/students/teacher/list');
export const fetchStudentMastery  = (studentId: string) => get<ConceptMastery[]>(`/students/${studentId}/mastery`);
export const fetchStudentPatterns = (studentId: string) => get<ErrorPatternRow[]>(`/students/${studentId}/error-patterns/active`);
export const fetchStudentWeekly   = (studentId: string) => get<WeeklyReportListItem[]>(`/students/${studentId}/weekly-reports`);

// ===== 단건 조회 =====
export type WrongNoteDetail = WrongNoteCard & { similar: Array<{ id: string; source: string; difficulty: string }> };
export type ProblemChoice = {
  id: string; choiceIndex: number; text: string;
  // isCorrect/distractorType/rationale은 클라이언트에 노출되지 않음
};
export type ProblemStep = {
  id: string; stepIndex: number;
  stepType: 'CONCEPT' | 'PROCESS' | 'ANSWER';
  prompt: string;
  choices: ProblemChoice[];
};
export type Problem = {
  id: string; source: string; unitId: string; subUnitId: string | null;
  difficulty: string; body: string; formula: string | null;
  /** 핵심 개념 — 정답/오답 피드백에 사용 */
  concept: string | null;
  // answer 필드는 응시 중 클라이언트로 노출되지 않음
  imageUrl: string | null; hint: string | null;
  steps?: ProblemStep[];
};
export type Hint = { hint: string | null };
export type StudySession = {
  id: string; unitId: string; sessionNumber: number; totalSessions: number;
  currentStep: number; startedAt: string; endedAt: string | null;
};
/** 명세서 §3-1 정합: 실 문제 + 학생 mastery/error-pattern 기반 5단계 JSON 가이드. */
export type GuideStep = { num: number; title: string; desc: string; current: boolean; done: boolean };
export type SessionGuide = {
  perspective: '공식 중심' | '단계별' | '시각화' | '실생활 예시';
  problemId: string | null;
  steps: GuideStep[];
  validationStatus: 'validated' | 'fallback' | 'empty';
  parseError?: string | null;
  text: string;                  // 호환 — 옛 UI 가 단순 text 만 쓸 때
  inputTokens: number;
  outputTokens: number;
};
export type Unit = {
  id: string; name: string; displayName?: string; order: number;
  gradeLevels?: GradeLevel[];
  subUnits: Array<{ id: string; name: string; displayName?: string; order: number }>;
};

export const fetchWrongNote = (id: string) => get<WrongNoteDetail>(`/wrong-notes/${id}`);
export const fetchDueWrongNotes = (limit?: number) =>
  get<WrongNoteCard[]>('/wrong-notes/due', limit ? { limit } : undefined);
export const fetchProblem = (id: string) => get<Problem>(`/problems/${id}`);
export const fetchProblemHint = (id: string) => get<Hint>(`/problems/${id}/hint`);
export const fetchStudySession = (id: string) => get<StudySession>(`/study-sessions/${id}`);
export const fetchSessionGuide = (id: string, perspective: string) =>
  get<SessionGuide>(`/study-sessions/${id}/guide`, { perspective });
export type ProblemSolution = {
  id: string; source: string;
  unit: string | null; subUnit: string | null;
  difficulty: string;
  body: string; concept: string | null; formula: string | null; answer: string;
  steps: Array<{
    stepIndex: number;
    stepType: 'CONCEPT' | 'PROCESS' | 'ANSWER';
    prompt: string;
    correctChoice: { choiceIndex: number; text: string } | null;
  }>;
};
export const fetchProblemSolution = (id: string) => get<ProblemSolution>(`/problems/${id}/solution`);

export const fetchCurriculum = (grade?: string) =>
  get<Unit[]>('/curriculum', grade ? { grade } : undefined);
export const fetchUnitsForUser = (grade?: string) =>
  get<Unit[]>('/curriculum/units', grade ? { grade } : undefined);

// ===== Concept Lessons (사전 개념학습) =====
export type ConceptStepKind =
  | 'HOOK' | 'CONCRETE' | 'PICTORIAL' | 'ABSTRACT'
  | 'WORKED_EXAMPLE' | 'GUIDED_PRACTICE'
  | 'RETRIEVAL' | 'MISCONCEPTION' | 'REFLECT';

export type NcertClass = 'CLASS_7' | 'CLASS_8' | 'CLASS_9' | 'CLASS_10' | 'CLASS_11' | 'CLASS_12';

export type ConceptLessonSummary = {
  id: string;
  chapterCode: string;
  ncertClass: NcertClass;
  chapterNumber: number;
  title: string;
  bigIdea: string;
  estimatedMin: number;
  cognitiveLoad: number;
  prerequisiteCodes: string[];
  unit: { id: string; name: string } | null;
  mastered: boolean;
  currentStep: number | null;
  retrievalScore: number | null;
};

export type ConceptStep = {
  id: string;
  stepIndex: number;
  kind: ConceptStepKind;
  title: string;
  body: string;
  visualType: string | null;
  visualUrl: string | null;
  visualData: any | null;   // <GraphRenderer/> JSON 파라미터 — VisualData union
  misconception: { wrongKo: string; whyKo: string; correctKo: string; wrongEn: string; whyEn: string; correctEn: string } | null;
  workedSteps: Array<{ math: string; narrationKo: string; narrationEn: string }> | null;
  retrievalCheck: {
    prompt: string;
    hint: string | null;
    choices: Array<{ choiceIndex: number; text: string }>;
  } | null;
  reflectPrompts: { promptsKo: string[]; promptsEn: string[] } | null;
};

export type ConceptLessonDetail = ConceptLessonSummary & {
  steps: ConceptStep[];
  progress: {
    currentStep: number;
    completedSteps: number[];
    masteredAt: string | null;
    retrievalScore: number | null;
  } | null;
};

export const fetchConceptLessons = (ncertClass?: NcertClass) =>
  get<ConceptLessonSummary[]>('/concept-lessons', ncertClass ? { ncertClass } : undefined);

export const fetchConceptLessonsForUnit = (unitId: string) =>
  get<ConceptLessonSummary[]>(`/concept-lessons/by-unit/${unitId}`);

export const fetchConceptLesson = (chapterCode: string) =>
  get<ConceptLessonDetail>(`/concept-lessons/${chapterCode}`);
