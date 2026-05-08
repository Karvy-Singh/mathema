import { IsArray, IsInt, IsOptional } from 'class-validator';
export class SubmitExamDto {
  @IsArray() answers!: Array<{
    problemId: string;
    answer: string;
    durationSec: number;
    confidence?: number;
    /// 객관식 모드: 단계별로 선택한 choiceId 배열 (1단계, 2단계, 3단계 순)
    choiceIds?: string[];
  }>;
  @IsOptional() @IsInt() totalScore?: number;
}
