import { get } from './api';

export type DashboardSummary = {
  todayMinutes: number; todayGoalMinutes: number;
  streakDays: number; weeklyAccuracy: number; weeklyAccuracyDelta: number;
  expectedGrade: number; expectedGradeFrom: number;
};
export type Mastery = { subject: string; value: number; unitId: string };
export type RecommendCard = {
  tag: string; tagColor: string; unit: string; title: string;
  reason: string; time: string; type: string; icon: string;
  unitId: string | null;
};
export type WrongNoteCard = {
  id: string; problemId: string;
  problem: string; unit: string; subUnit: string;
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
export type Diagnosis = { headline: string; weakUnit: string | null; weakScore: number; version: string; updatedAgo: string };
export type MentorMessage = { week: string; generatedAt: string; message: string; strength: string; nextGoal: string };
export type Heatmap = Array<{ day: number; intensity: number }>;
export type ActivityStats = { avgMinutesPerDay: number; totalProblems: number; avgAccuracy: number };
export type Trajectory = Array<{ name: string; score: number; grade: number; target: number }>;
export type ExamResult = { id: string; name: string; date: string; score: number; grade: number; percentile: number; time: string };
export type MockSummary = { lastScore: number; expectedGrade: number; reliability: number; pointsToNextGrade: number; percentile: number };
export type ReportCurrent = {
  totalHours: number; hoursDelta: number;
  problemsSolved: number; problemsPerDay: number;
  accuracyPct: number; accuracyDelta: number;
  aiScore: number; topPercentile: number;
};
export type TimeVsAccuracy = Array<{ week: string; time: number; accuracy: number }>;
export type FocusItem = { unit: string; area: string; priority: string; color: string; impact: string };
export type Achievement = { icon: string; title: string; sub: string; color: string };
export type Me = { id: string; name: string; email: string; examDate: string; targetGrade: number; dDay: number };

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
  // answer 필드는 응시 중 클라이언트로 노출되지 않음
  imageUrl: string | null; hint: string | null;
  steps?: ProblemStep[];
};
export type Hint = { hint: string | null };
export type StudySession = {
  id: string; unitId: string; sessionNumber: number; totalSessions: number;
  currentStep: number; startedAt: string; endedAt: string | null;
};
export type SessionGuide = { text: string; inputTokens: number; outputTokens: number };
export type Unit = { id: string; name: string; order: number; subUnits: Array<{ id: string; name: string; order: number }> };

export const fetchWrongNote = (id: string) => get<WrongNoteDetail>(`/wrong-notes/${id}`);
export const fetchDueWrongNotes = (limit?: number) =>
  get<WrongNoteCard[]>('/wrong-notes/due', limit ? { limit } : undefined);
export const fetchProblem = (id: string) => get<Problem>(`/problems/${id}`);
export const fetchProblemHint = (id: string) => get<Hint>(`/problems/${id}/hint`);
export const fetchStudySession = (id: string) => get<StudySession>(`/study-sessions/${id}`);
export const fetchSessionGuide = (id: string, perspective: string) =>
  get<SessionGuide>(`/study-sessions/${id}/guide`, { perspective });
export const fetchCurriculum = () => get<Unit[]>('/curriculum');
