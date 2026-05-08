/**
 * 오답 유형 — Error DNA 카드(대시보드) 와 오답노트 카드 라벨에 사용.
 */
export enum ErrorType {
  CONCEPT_MISUNDERSTANDING = 'CONCEPT_MISUNDERSTANDING', // 개념 오해
  CALCULATION_MISTAKE = 'CALCULATION_MISTAKE',           // 계산 실수
  TIME_SHORTAGE = 'TIME_SHORTAGE',                       // 시간 부족
  OTHER = 'OTHER',                                       // 기타
}

export const ERROR_TYPE_LABEL_KO: Record<ErrorType, string> = {
  [ErrorType.CONCEPT_MISUNDERSTANDING]: '개념 오해',
  [ErrorType.CALCULATION_MISTAKE]: '계산 실수',
  [ErrorType.TIME_SHORTAGE]: '시간 부족',
  [ErrorType.OTHER]: '기타',
};

export const ERROR_TYPE_COLOR: Record<ErrorType, string> = {
  [ErrorType.CONCEPT_MISUNDERSTANDING]: '#8B3A1F',
  [ErrorType.CALCULATION_MISTAKE]: '#B5552B',
  [ErrorType.TIME_SHORTAGE]: '#C97B4A',
  [ErrorType.OTHER]: '#A89684',
};
