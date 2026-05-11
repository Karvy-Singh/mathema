import { api, post, patch } from './api';

// ===== Wrong Notes =====
export const updateWrongNoteStatus = (id: string, status: 'PENDING' | 'ANALYZING' | 'MASTERED') =>
  patch<{ id: string; status: string }>(`/wrong-notes/${id}/status`, { status });

export type ReviewQuality = 'AGAIN' | 'HARD' | 'GOOD' | 'EASY';
export const reviewWrongNote = (id: string, quality: ReviewQuality) =>
  post<{
    id: string; easinessFactor: number; repetitionCount: number;
    intervalDays: number; nextReviewAt: string | null; lapsed: boolean; autoMastered: boolean;
  }>(`/wrong-notes/${id}/review`, { quality });

export const createWrongNote = (body: { problemId: string; errorType: string; insight?: string }) =>
  post<{ id: string }>('/wrong-notes', body);

async function uploadFormFile<T>(url: string, field: 'image' | 'pdf', file: File): Promise<T> {
  const fd = new FormData();
  fd.append(field, file);
  const r = await api.post(url, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
  return r.data.data as T;
}

export const uploadWrongNotePhoto = (file: File) =>
  uploadFormFile<{ ok: boolean; message: string }>('/wrong-notes/upload-photo', 'image', file);

export const uploadWrongNotePdf = (file: File) =>
  uploadFormFile<{ ok: boolean; message: string }>('/wrong-notes/upload-pdf', 'pdf', file);

// ===== Study Sessions =====
export const startStudySession = (body: { unitId: string; sessionNumber?: number; totalSessions?: number }) =>
  post<{ id: string; unitId: string; currentStep: number }>('/study-sessions/start', body);

export const startStudySessionFromProblem = (problemId: string) =>
  post<{ id: string; unitId: string; currentStep: number; focusProblemId: string }>(
    `/study-sessions/start-from-problem/${problemId}`, {},
  );

export type ExamStepAnswerResponse = {
  id: string;
  isCorrect: boolean;
  choice: {
    id: string; choiceIndex: number; text: string; isCorrect: boolean;
    distractorType: string | null; rationale: string | null;
  } | null;
};
export const submitExamStepAnswer = (resultId: string, body: {
  problemId: string; choiceId: string; stepIndex: number; durationSec: number; confidence?: number;
}) => post<ExamStepAnswerResponse>(`/mock-exams/results/${resultId}/answer`, body);

export const finalizeExam = (resultId: string) =>
  post<{ id: string; score: number; grade: number; percentile: number; durationMin: number }>(
    `/mock-exams/results/${resultId}/finalize`, {},
  );

export type StudyAnswerResponse = {
  id: string;
  isCorrect: boolean;
  isRetry?: boolean;
  choice?: {
    id: string;
    text: string;
    isCorrect: boolean;
    distractorType?: 'CONCEPT_CONFUSION' | 'CALC_ERROR' | 'PROCESS_SKIP' | 'TIME_PRESSURE_GUESS' | null;
    rationale?: string | null;
  };
};
export const submitStudyAnswer = (
  sessionId: string,
  body: {
    problemId: string; answer: string; durationSec: number;
    confidence?: number; stepIndex?: number; choiceId?: string;
  },
) => post<StudyAnswerResponse>(`/study-sessions/${sessionId}/answer`, body);

export const advanceStudyStep = (sessionId: string) =>
  post<{ id: string; currentStep: number }>(`/study-sessions/${sessionId}/next`);

export const endStudySession = (sessionId: string) =>
  post<{ id: string; endedAt: string }>(`/study-sessions/${sessionId}/end`);

// ===== Mock Exams =====
export type ExamProblem = {
  id: string; source: string; difficulty: string; body: string;
  formula: string | null; hint: string | null; imageUrl: string | null;
  // 객관식 3단계 (CONCEPT/PROCESS/ANSWER)
  steps?: Array<{
    id: string; stepIndex: number; stepType: 'CONCEPT' | 'PROCESS' | 'ANSWER';
    prompt: string;
    choices: Array<{ id: string; choiceIndex: number; text: string }>;
  }>;
};
export type ExamPackage = {
  resultId: string | null; name: string; totalMinutes: number; problems: ExamProblem[];
};

export const startRecommendedExam = () =>
  post<ExamPackage>('/mock-exams/recommended/start');

export const startTypedExam = (kind: 'mini' | 'wrong-redo' | 'real') =>
  post<ExamPackage>(`/mock-exams/types/${kind}/start`);

// ===== Concept Lessons (사전 개념학습) =====
export const startConceptLesson = (code: string) =>
  post<{ id: string; currentStep: number }>(`/concept-lessons/${code}/start`);

export const completeConceptStep = (code: string, stepIndex: number, durationSec = 0) =>
  post<{ id: string; currentStep: number; completedSteps: number[] }>(
    `/concept-lessons/${code}/step`,
    { stepIndex, durationSec },
  );

export const checkConceptRetrieval = (code: string, stepIndex: number, answer: string) =>
  post<{
    passed: boolean;
    score: number | null;
    explain: { ko: string; en: string } | null;
    hint: { ko: string; en: string } | null;
  }>(`/concept-lessons/${code}/check`, { stepIndex, answer });

export const submitExamResult = (
  resultId: string,
  body: {
    answers: Array<{
      problemId: string; answer: string; durationSec: number;
      confidence?: number; choiceIds?: string[];
    }>;
  },
) => post<{ id: string; score: number; grade: number; percentile: number; durationMin: number }>(
  `/mock-exams/results/${resultId}/submit`, body,
);
