import { Injectable } from '@nestjs/common';
import { ErrorCode, ErrorType } from '@prisma/client';

/**
 * GradingService — 규칙 기반 1차 채점 + errorCode 추정.
 *
 *   Attempt 제출 시 LLM 호출 전에 휴리스틱으로 1~2 개의 errorCode 를 추정한다.
 *   LLM 분석이 끝나면 LLMAnalysisService 가 더 정확한 errorCode 로 덮어쓴다 (validationStatus=VALIDATED).
 *
 *   입력 시그널:
 *     - choice.distractorType (객관식 — 출제자가 분류한 매력적 오답)
 *     - durationSec (시간 압박)
 *     - hintUsed (개념 부재)
 *     - confidence (overconfidence)
 *     - stepByStepInput 길이 (풀이 단계 누락)
 *     - 정답이면 errorCodes = []
 *
 *   출력:
 *     { errorCodes: ErrorCode[],     // 신규 enum (SIGN/ALG/CON/FORMULA/...)
 *       legacyErrorType: ErrorType }  // 기존 WrongNote.errorType 호환용 (CONCEPT_MISUNDERSTANDING 등)
 *
 *   원칙:
 *     - 자신 있게 잡을 수 없으면 빈 배열 또는 OTHER 만 반환 (환각 X).
 *     - 한 개라도 자신 있는 시그널이 있으면 그것만 반환.
 */

export interface GradingSignals {
  isCorrect: boolean;
  distractorType?: string | null;
  durationSec: number;
  expectedTimeSec?: number | null;
  hintUsed: boolean;
  hintCount?: number;
  confidence?: number | null;          // 0~100
  stepByStepInput?: unknown;           // Json (string[] 가정)
  problemHasSteps: boolean;            // expectedSolutionSteps 가 있는지
}

export interface GradingResult {
  errorCodes: ErrorCode[];
  legacyErrorType: ErrorType;
}

@Injectable()
export class GradingService {
  analyze(signals: GradingSignals): GradingResult {
    if (signals.isCorrect) {
      return { errorCodes: [], legacyErrorType: ErrorType.OTHER };
    }

    const codes = new Set<ErrorCode>();

    // 1) DistractorType → ErrorCode 매핑 (객관식 시 가장 강한 시그널)
    switch (signals.distractorType) {
      case 'CONCEPT_CONFUSION':
        codes.add(ErrorCode.CON);
        break;
      case 'CALC_ERROR':
        codes.add(ErrorCode.CALC);
        break;
      case 'PROCESS_SKIP':
        codes.add(ErrorCode.LOGIC);
        break;
      case 'TIME_PRESSURE_GUESS':
        // 시간 압박은 별도 시그널로 처리 — 시간 초과 시 LOGIC/CALC 둘 다 가능.
        break;
    }

    // 2) Step-by-step 입력이 비어있거나 너무 짧음 → 풀이 단계 누락 (LOGIC).
    if (signals.problemHasSteps) {
      const steps = Array.isArray(signals.stepByStepInput) ? signals.stepByStepInput : [];
      if (steps.length === 0) codes.add(ErrorCode.LOGIC);
    }

    // 3) 힌트 봤는데 틀림 → 개념 부재 (CON).
    if (signals.hintUsed) codes.add(ErrorCode.CON);

    // 4) 자신감 70+ 인데 틀림 → 개념 오해 (CON, overconfidence).
    if (typeof signals.confidence === 'number' && signals.confidence >= 70) {
      codes.add(ErrorCode.CON);
    }

    // 5) 시간 초과 — expectedTime 의 1.5배 초과 시.
    if (signals.expectedTimeSec && signals.durationSec > signals.expectedTimeSec * 1.5) {
      // 시간 초과 자체는 errorCode 가 아니라 컨텍스트. LOGIC 가 이미 잡혀 있으면 그대로.
      if (codes.size === 0) codes.add(ErrorCode.LOGIC);
    }

    // 결과가 비어있으면 LLM 분석이 끝날 때까지 errorCodes 는 비워둔다 (휴리스틱 자신감 부족).
    const errorCodes = Array.from(codes);

    // legacyErrorType 매핑 (WrongNote 호환).
    let legacyErrorType: ErrorType = ErrorType.OTHER;
    if (codes.has(ErrorCode.CON))   legacyErrorType = ErrorType.CONCEPT_MISUNDERSTANDING;
    else if (codes.has(ErrorCode.CALC)) legacyErrorType = ErrorType.CALCULATION_MISTAKE;
    else if (codes.has(ErrorCode.LOGIC)) legacyErrorType = ErrorType.CONCEPT_MISUNDERSTANDING;
    else if (signals.expectedTimeSec && signals.durationSec > signals.expectedTimeSec * 1.5) {
      legacyErrorType = ErrorType.TIME_SHORTAGE;
    } else if (signals.durationSec > 240) {
      legacyErrorType = ErrorType.TIME_SHORTAGE;
    } else {
      legacyErrorType = ErrorType.CALCULATION_MISTAKE;
    }

    return { errorCodes, legacyErrorType };
  }
}
