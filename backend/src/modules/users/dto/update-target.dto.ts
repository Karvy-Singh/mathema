import { IsDateString, IsInt, IsOptional, Max, Min } from 'class-validator';
export class UpdateTargetDto {
  @IsOptional() @IsDateString() examDate?: string;
  @IsOptional() @IsInt() @Min(1) @Max(9) targetGrade?: number;
}
