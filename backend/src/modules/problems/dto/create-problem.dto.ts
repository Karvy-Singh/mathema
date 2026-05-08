import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { Difficulty } from '../../../common/enums/difficulty.enum';

export class CreateProblemDto {
  @IsString() source!: string;
  @IsUUID() unitId!: string;
  @IsOptional() @IsUUID() subUnitId?: string;
  @IsEnum(Difficulty) difficulty!: Difficulty;
  @IsString() body!: string;
  @IsString() answer!: string;
  @IsOptional() @IsString() hint?: string;
}
