import { IsIn, IsOptional } from 'class-validator';
export class StartExamDto {
  @IsOptional() @IsIn(['mini', 'wrong-redo', 'real'])
  kind?: 'mini' | 'wrong-redo' | 'real';
}
