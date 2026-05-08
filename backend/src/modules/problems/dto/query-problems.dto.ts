import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { Difficulty } from '../../../common/enums/difficulty.enum';

export class QueryProblemsDto {
  @IsOptional() @IsUUID() unitId?: string;
  @IsOptional() @IsEnum(Difficulty) difficulty?: Difficulty;
  @IsOptional() @IsString() source?: string;
  @IsOptional() page?: number;
}
