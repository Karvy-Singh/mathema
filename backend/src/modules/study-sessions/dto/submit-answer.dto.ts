import { IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

export class SubmitAnswerDto {
  @IsUUID() problemId!: string;
  /// 객관식이면 빈 문자열도 허용 (choiceId가 정답 판정의 진실 원천)
  @IsString() answer!: string;
  @IsInt() @Min(0) durationSec!: number;
  /// 메타인지 자기평가 (0~100). 학습 페이지/응시 화면에서 슬라이더로 입력
  @IsOptional() @IsInt() @Min(0) @Max(100) confidence?: number;
  /// 3단계 객관식 단계 (1/2/3)
  @IsOptional() @IsInt() @Min(1) @Max(3) stepIndex?: number;
  /// 학생이 고른 ProblemChoice id
  @IsOptional() @IsUUID() choiceId?: string;
}
