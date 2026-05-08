/**
 * Attempt 가 발생한 컨텍스트.
 * 통계/숙련도 계산 시 가중치를 다르게 부여한다.
 *  - STUDY      : 학습 세션 내 풀이 (가장 일반적)
 *  - EXAM       : 모의고사 응시 중 풀이
 *  - PRACTICE   : 자유 연습
 *  - DIAGNOSTIC : AI 추천 진단 모의고사
 */
export enum SessionContext {
  STUDY = 'STUDY',
  EXAM = 'EXAM',
  PRACTICE = 'PRACTICE',
  DIAGNOSTIC = 'DIAGNOSTIC',
}
