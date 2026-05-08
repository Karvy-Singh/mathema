import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { ErrorType } from '../../../common/enums/error-type.enum';
import { NoteStatus } from '../../../common/enums/note-status.enum';

export class QueryWrongNotesDto {
  @IsOptional() @IsString() unitName?: string;        // "미적분 II" 등 한글 단원명 (UI 칩 라벨 그대로)
  @IsOptional() @IsUUID() unitId?: string;
  @IsOptional() @IsEnum(ErrorType) errorType?: ErrorType;
  @IsOptional() @IsEnum(NoteStatus) status?: NoteStatus;
  @IsOptional() @IsString() sort?: 'newest' | 'oldest';
  @IsOptional() page?: number;
}
