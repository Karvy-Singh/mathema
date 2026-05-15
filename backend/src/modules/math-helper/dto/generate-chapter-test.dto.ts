import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class GenerateChapterTestDto {
  @IsInt()
  @Min(7)
  @Max(12)
  classLevel!: number;

  @IsOptional()
  @IsString()
  chapterCode?: string;

  @IsOptional()
  @IsString()
  chapter?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(30)
  questionCount?: number;
}
