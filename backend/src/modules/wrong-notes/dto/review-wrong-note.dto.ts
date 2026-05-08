import { IsIn } from 'class-validator';

export class ReviewWrongNoteDto {
  @IsIn(['AGAIN', 'HARD', 'GOOD', 'EASY'])
  quality!: 'AGAIN' | 'HARD' | 'GOOD' | 'EASY';
}
