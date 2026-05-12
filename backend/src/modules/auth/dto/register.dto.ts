import { IsBoolean, IsDateString, IsEmail, IsIn, IsInt, IsOptional, IsString, Max, Min, MinLength } from 'class-validator';
import { GRADE_LEVELS, GradeLevel } from '../../../common/enums/unit.enum';

export class RegisterDto {
  @IsEmail() email!: string;
  @IsString() @MinLength(8) password!: string;
  @IsString() name!: string;
  @IsDateString() examDate!: string;
  @IsInt() @Min(1) @Max(9) targetGrade!: number;
  @IsOptional() @IsString() @IsIn(GRADE_LEVELS as unknown as string[])
  gradeLevel?: GradeLevel;

  // DPDP/GDPR 선택 동의 (필수 동의 DATA_PROCESSING 는 가입 자체로 간주 — 별도 필드 X)
  @IsOptional() @IsBoolean() consentAnalytics?: boolean;
  @IsOptional() @IsBoolean() consentMarketing?: boolean;
  @IsOptional() @IsBoolean() consentAiTraining?: boolean;
}
