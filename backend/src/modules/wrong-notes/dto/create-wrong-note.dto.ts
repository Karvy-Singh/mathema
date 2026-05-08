import { IsEnum, IsString, IsUUID, IsOptional } from 'class-validator';
import { ErrorType } from '../../../common/enums/error-type.enum';

export class CreateWrongNoteDto {
  @IsUUID() problemId!: string;
  @IsEnum(ErrorType) errorType!: ErrorType;
  @IsOptional() @IsString() insight?: string;
}
