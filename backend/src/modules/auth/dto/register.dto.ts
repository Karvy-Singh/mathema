import { IsDateString, IsEmail, IsInt, IsString, Max, Min, MinLength } from 'class-validator';
export class RegisterDto {
  @IsEmail() email!: string;
  @IsString() @MinLength(8) password!: string;
  @IsString() name!: string;
  @IsDateString() examDate!: string;
  @IsInt() @Min(1) @Max(9) targetGrade!: number;
}
