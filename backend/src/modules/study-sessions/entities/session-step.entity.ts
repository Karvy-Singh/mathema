/** 5단계 진행 상태 — UI 의 progress bar 와 1:1 */
export interface SessionStep {
  num: 1 | 2 | 3 | 4 | 5;
  title: string;
  desc: string;
  done: boolean;
  current: boolean;
}
