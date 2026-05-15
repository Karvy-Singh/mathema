import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class GenerateWeeklyAssessmentDto {
  @IsOptional()
  @IsInt()
  @Min(7)
  @Max(12)
  classLevel?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(40)
  questionCount?: number;
}
