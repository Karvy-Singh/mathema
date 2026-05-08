/**
 * 오답노트 상태 — 그리드 카드의 'analyzing/mastered/pending' 라벨에 대응.
 * 흐름: PENDING → ANALYZING(AI 분석 중) → MASTERED(재출제 정답)
 */
export enum NoteStatus {
  PENDING = 'PENDING',
  ANALYZING = 'ANALYZING',
  MASTERED = 'MASTERED',
}
